import { REDUX_STATE_KEY, REDUX_STATE_REVISION_KEY } from '@/constants'
import { indexedDBStorage } from './indexedDBStorage'

/**
 * Stale-snapshot check for the saved Redux state (GH #669).
 *
 * Each save replaces the whole snapshot with this tab's copy, so a tab that
 * missed another tab's save would silently undo it. Every snapshot therefore
 * carries a new random revision token next to it. A tab remembers the token it
 * loaded and the one it wrote last, and a save only goes through while the
 * stored token is still that one; the check and the write are a single
 * IndexedDB transaction (stores/indexedDBStorage.ts), so it holds across tabs
 * and without Web Locks.
 */

/** undefined: the check is off for this page; otherwise the token this page last saw or wrote. */
let knownRevision: string | undefined

export class StaleSnapshotError extends Error {
    constructor() {
        super('The saved state was changed by another tab or window since this page loaded.')
        this.name = 'StaleSnapshotError'
    }
}

const newRevision = (): string =>
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
        byte.toString(16).padStart(2, '0'),
    ).join('')

/**
 * Remembers the stored revision. Call it before the snapshot is read: if another
 * tab saves in between, this tab holds an older token than the snapshot it
 * loaded, and its first save is refused, which is the safe way round.
 *
 * A page that finds no token stores one of its own at once. "No token" is then
 * never the value a save expects, so a tab that is open when the data is erased
 * (which also erases the token) is refused instead of passing the check against
 * the empty store. Two pages that start at the same moment both store a token;
 * the later write wins and the other page is refused at its first save.
 *
 * A revision that cannot be read or stored leaves the check off for this page
 * instead of stopping the start.
 */
export const rememberStoredRevision = async (): Promise<void> => {
    try {
        const stored = await indexedDBStorage.getItem(REDUX_STATE_REVISION_KEY)
        if (stored !== null) {
            knownRevision = stored
            return
        }
        const claimed = newRevision()
        await indexedDBStorage.setItem(REDUX_STATE_REVISION_KEY, claimed)
        knownRevision = claimed
    } catch (error) {
        knownRevision = undefined
        console.debug('[Store] Could not read or store the snapshot revision:', error)
    }
}

/** Saves the snapshot; throws StaleSnapshotError when another tab saved since. */
export const writeSnapshot = async (serializedState: string): Promise<void> => {
    if (knownRevision === undefined) {
        await indexedDBStorage.setItem(REDUX_STATE_KEY, serializedState)
        return
    }

    const next = newRevision()
    const applied = await indexedDBStorage.setItemIfRevision(
        REDUX_STATE_KEY,
        serializedState,
        REDUX_STATE_REVISION_KEY,
        knownRevision,
        next,
    )
    if (!applied) throw new StaleSnapshotError()
    knownRevision = next
}

/**
 * A deliberate replacement of the saved snapshot (null: removal): import,
 * restore, repair, safe recovery, Reset all data. It does not check the
 * revision, because the user asked for it, but it stores a new one, so every
 * other tab that still holds the old one is refused at its next save instead of
 * overwriting it.
 *
 * This page is refused at its next save too, unless `continueSaving` is set.
 * That is what a replacement followed by a reload needs: the `pagehide` save of
 * the old page must not write the old state over the new one. Only the repair at
 * start, after which this page goes on running, passes it.
 */
export const replaceSnapshot = async (
    serializedState: string | null,
    continueSaving = false,
): Promise<void> => {
    const next = newRevision()
    await indexedDBStorage.replaceItemRotatingRevision(
        REDUX_STATE_KEY,
        serializedState,
        REDUX_STATE_REVISION_KEY,
        next,
    )
    if (continueSaving && knownRevision !== undefined) knownRevision = next
}

/**
 * Read-modify-write of the saved snapshot that fails instead of overwriting a
 * save made in between: the revision is read before the snapshot, and the write
 * only goes through while it is still the stored one (null from `update`: leave
 * the snapshot as it is). Like replaceSnapshot, it is meant for callers that
 * reload afterwards, so this page does not follow the new revision.
 */
export const updateSnapshot = async (
    update: (current: string | null) => string | null | Promise<string | null>,
): Promise<void> => {
    const expected = await indexedDBStorage.getItem(REDUX_STATE_REVISION_KEY)
    const current = await indexedDBStorage.getItem(REDUX_STATE_KEY)
    const updated = await update(current)
    if (updated === null) return

    const applied = await indexedDBStorage.setItemIfRevision(
        REDUX_STATE_KEY,
        updated,
        REDUX_STATE_REVISION_KEY,
        expected,
        newRevision(),
    )
    if (!applied) throw new StaleSnapshotError()
}
