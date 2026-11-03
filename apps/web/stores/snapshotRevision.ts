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

let onStaleSnapshot: (() => void) | undefined

/**
 * The page's reaction to a refused write that has no caller to handle it (the
 * start registers it): stop saving, give the writer role up, ask for a reload.
 */
export const setStaleSnapshotHandler = (handler: (() => void) | undefined): void => {
    onStaleSnapshot = handler
}

export class StaleSnapshotError extends Error {
    constructor() {
        super('The saved state was changed by another tab or window since this page loaded.')
        this.name = 'StaleSnapshotError'
    }
}

/**
 * A refused write of a page that runs without the revision check and cannot
 * prove it is the only one saving. Handled like a stale save: nothing was written.
 */
export class UnverifiedSnapshotError extends StaleSnapshotError {
    constructor() {
        super()
        this.message =
            'The saved state has no revision this page could read, and this page does not hold the writer lock.'
        this.name = 'UnverifiedSnapshotError'
    }
}

/** Whether a write without the revision check is allowed; closed until the start registers a check. */
let mayWriteUnchecked: () => boolean = () => false

/**
 * Registers the proof that this page is the only one saving (the writer lock,
 * bootstrap/writerOwnership.ts). Without the revision check, a write goes
 * through only while it returns true; without a registered proof, never.
 */
export const setUncheckedWritePermit = (permit: (() => boolean) | undefined): void => {
    mayWriteUnchecked = permit ?? (() => false)
}

/** Whether this page saves with the revision check (it could read or store a revision). */
export const isRevisionChecked = (): boolean => knownRevision !== undefined

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
 * instead of stopping the start. Such a page may only save while it holds the
 * writer lock (setUncheckedWritePermit); otherwise the start stops it before
 * the first edit (bootstrap/mountHydratedApp.ts).
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

/**
 * Saves the snapshot; throws StaleSnapshotError when another tab saved since, and
 * UnverifiedSnapshotError when the check is off and this page holds no writer lock.
 */
export const writeSnapshot = async (serializedState: string): Promise<void> => {
    if (knownRevision === undefined) {
        if (!mayWriteUnchecked()) throw new UnverifiedSnapshotError()
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

/** Whether this page takes the new token: only if it was up to date, or ran without the check. */
const followsReplacement = (continueSaving: boolean, wasCurrent: boolean): boolean =>
    continueSaving && (knownRevision === undefined || wasCurrent)

/**
 * The token this page expects after a replacement. A page that does not follow
 * keeps its own, which no longer matches, so its next save is refused; one that
 * ran without the check is armed with a token that never matches, or it would
 * save the old state over the replacement on its way out.
 */
const nextKnownRevision = (follows: boolean, next: string): string =>
    follows ? next : (knownRevision ?? newRevision())

/**
 * A deliberate replacement of the saved snapshot (null: removal): import,
 * restore, safe recovery, Reset all data. It does not check the
 * revision, because the user asked for it, but it stores a new one, so every
 * other tab that still holds the old one is refused at its next save instead of
 * overwriting it.
 *
 * This page is refused at its next save too, unless `continueSaving` is set.
 * That is what a replacement followed by a reload needs: the `pagehide` save of
 * the old page must not write the old state over the new one. Only callers after
 * which this page goes on running pass it: the rollback of a failed safe
 * recovery and the startup quarantine. (The repair at start is repairSnapshot.)
 */
export const replaceSnapshot = async (
    serializedState: string | null,
    continueSaving = false,
): Promise<void> => {
    const next = newRevision()
    const wasCurrent = await indexedDBStorage.replaceItemRotatingRevision(
        REDUX_STATE_KEY,
        serializedState,
        REDUX_STATE_REVISION_KEY,
        next,
        knownRevision ?? null,
    )
    knownRevision = nextKnownRevision(followsReplacement(continueSaving, wasCurrent), next)
}

/**
 * A replacement for the start, after which this page goes on running: it applies
 * only while no other tab has saved since this page read the revision, and then
 * the page follows the new revision. A page that runs without the check replaces
 * unconditionally and starts checking.
 */
const replaceRotatingIfCurrent = async (serializedState: string | null): Promise<boolean> => {
    const next = newRevision()
    const applied = await indexedDBStorage.replaceItemRotatingRevision(
        REDUX_STATE_KEY,
        serializedState,
        REDUX_STATE_REVISION_KEY,
        next,
        knownRevision ?? null,
        knownRevision !== undefined,
    )
    if (!applied && knownRevision !== undefined) return false
    knownRevision = next
    return true
}

/** Whether this page may write: with the revision check, or without it under the writer lock. */
const mayWriteAtAll = (): boolean => knownRevision !== undefined || mayWriteUnchecked()

/**
 * replaceRotatingIfCurrent, but a page without the check replaces only while it
 * holds the writer lock; without it nothing is replaced. Resolves to whether it
 * was applied.
 */
const replaceIfCurrent = (serializedState: string | null): Promise<boolean> =>
    mayWriteAtAll() ? replaceRotatingIfCurrent(serializedState) : Promise.resolve(false)

/**
 * The repair at start: replaces an unreadable primary with the backup, but only
 * while no other tab has saved since this page read the revision; otherwise it
 * throws StaleSnapshotError and writes nothing, and the caller starts without
 * the repair (its first save is then refused and the page asks for a reload).
 */
export const repairSnapshot = async (serializedState: string): Promise<void> => {
    if (!(await replaceIfCurrent(serializedState))) throw new StaleSnapshotError()
}

/**
 * The quarantine at start removes the unreadable primary the same way: only while
 * no other tab has saved since. Resolves to whether the primary was removed.
 */
export const removeSnapshotIfCurrent = (): Promise<boolean> => replaceIfCurrent(null)

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
    if (updated === null) {
        // Nothing to write, but a save another tab made meanwhile means the caller's
        // answer ('nothing to change') is out of date: do not report success.
        if ((await indexedDBStorage.getItem(REDUX_STATE_REVISION_KEY)) !== expected) {
            onStaleSnapshot?.()
            throw new StaleSnapshotError()
        }
        return
    }

    const applied = await indexedDBStorage.setItemIfRevision(
        REDUX_STATE_KEY,
        updated,
        REDUX_STATE_REVISION_KEY,
        expected,
        newRevision(),
    )
    if (!applied) {
        onStaleSnapshot?.()
        throw new StaleSnapshotError()
    }
    // Same as in replaceSnapshot: the page reloads and must not save over this update.
    knownRevision ??= newRevision()
}
