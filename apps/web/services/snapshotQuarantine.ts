import {
    runWithExclusiveRecoveryLock,
    schedulePersistenceWrite,
} from '@/bootstrap/persistenceCoordinator'
import { REDUX_STATE_KEY, REDUX_STATE_QUARANTINE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { redactSnapshotSecrets, scrubSecretsInText } from '@/utils/redactSecrets'

/**
 * - `stored`: this snapshot is now held under the quarantine key.
 * - `kept-earlier`: an earlier snapshot already holds the key and is not replaced.
 * - `nothing`: there was no snapshot to keep.
 * - `failed`: the write or its read-back failed; nothing was kept.
 */
export type QuarantineResult = 'stored' | 'kept-earlier' | 'nothing' | 'failed'

/**
 * Runs the operation under the exclusive cross-tab lock, so no other tab writes
 * while it checks and changes the keys. Without Web Locks the exclusive lock is
 * unavailable; the operation then runs on the shared write path every other
 * persistence write uses, which still fences it against safe recovery.
 */
const underExclusiveLock = async (operation: () => Promise<void>): Promise<void> => {
    const locked = await runWithExclusiveRecoveryLock(async () => {
        await operation()
        return true
    })
    if (locked === null) await schedulePersistenceWrite(operation)
}

/**
 * Writes the snapshot to the quarantine key unless one is already there, and
 * reads it back. Credentials are redacted, in the text too when it is not valid
 * JSON. The caller holds the lock. Throws when the write or the read-back fails.
 */
const keepOnce = async (snapshot: string): Promise<'stored' | 'kept-earlier'> => {
    if ((await indexedDBStorage.getItem(REDUX_STATE_QUARANTINE_KEY)) !== null) {
        return 'kept-earlier'
    }
    // Redact the parsed form first, then scrub the text: a snapshot that is not
    // valid JSON is returned as is by the first step.
    const kept = scrubSecretsInText(redactSnapshotSecrets(snapshot))
    await indexedDBStorage.setItem(REDUX_STATE_QUARANTINE_KEY, kept)
    if ((await indexedDBStorage.getItem(REDUX_STATE_QUARANTINE_KEY)) !== kept) {
        throw new Error('Quarantine snapshot verification failed.')
    }
    return 'stored'
}

/**
 * Keeps the first persisted snapshot that could not be hydrated (stores/store.ts,
 * #666).
 *
 * The startup backup is replaced on every start, so once the app runs from an
 * empty state and saves, the only other copy of the user's data is gone. This
 * key is written once and never replaced by a later snapshot, the same rule
 * the safe-recovery rollback key follows (bootstrap/recovery.ts). The check and
 * the write run under the exclusive cross-tab lock, so two tabs cannot both see
 * an empty key. The copy is for a person to recover data from, and must not
 * become a second long-lived home for a plain-text key.
 *
 * Never throws: a failure is logged and reported as `failed`.
 */
export const quarantineUnreadableSnapshot = async (
    snapshot?: string | null,
): Promise<QuarantineResult> => {
    if (!snapshot) return 'nothing'
    let result: QuarantineResult = 'failed'
    try {
        await underExclusiveLock(async () => {
            result = await keepOnce(snapshot)
        })
    } catch (error) {
        console.error('[Store] Could not quarantine the unreadable snapshot:', error)
        result = 'failed'
    }
    return result
}

/**
 * Removes the primary snapshot that could not be hydrated, but only once its
 * bytes are safe and only if it is still that snapshot.
 *
 * Quarantine, comparison and removal happen in one exclusive section. Another
 * tab may have saved newer valid state since this tab read the primary, and
 * that state must not be deleted with the unreadable one. A failed quarantine
 * keeps the primary too, so a start that makes no change (and so no save) can
 * still retry after storage has been freed. Without a snapshot nothing proves
 * what the primary holds, so it is kept.
 *
 * Returns whether the primary was removed. Never throws.
 */
export const discardUnreadablePrimarySnapshot = async (
    snapshot?: string | null,
): Promise<boolean> => {
    if (!snapshot) return false
    let removed = false
    try {
        await underExclusiveLock(async () => {
            await keepOnce(snapshot)
            if ((await indexedDBStorage.getItem(REDUX_STATE_KEY)) !== snapshot) {
                console.debug('[Store] Keeping the primary snapshot: it changed since it failed.')
                return
            }
            await indexedDBStorage.removeItem(REDUX_STATE_KEY)
            removed = true
        })
    } catch (error) {
        console.error('[Store] Keeping the unreadable primary snapshot:', error)
    }
    return removed
}
