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

/** undefined: no revision was loaded (nothing is checked); null: none was stored yet. */
let knownRevision: string | null | undefined

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
 * loaded, and its first save is refused, which is the safe way round. A revision
 * that cannot be read leaves the check off for this page instead of stopping the
 * start.
 */
export const rememberStoredRevision = async (): Promise<void> => {
    try {
        knownRevision = await indexedDBStorage.getItem(REDUX_STATE_REVISION_KEY)
    } catch (error) {
        knownRevision = undefined
        console.debug('[Store] Could not read the snapshot revision:', error)
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
