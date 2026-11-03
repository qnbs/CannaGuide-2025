import {
    runWithExclusiveRecoveryLock,
    schedulePersistenceWrite,
} from '@/bootstrap/persistenceCoordinator'
import { REDUX_STATE_QUARANTINE_KEY } from '@/constants'
import { removePrimaryPersistedSnapshot } from '@/services/persistedStateService'
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
 * Keeps the first persisted snapshot that could not be hydrated, before the
 * caller removes the primary (stores/store.ts, #666).
 *
 * The startup backup is replaced on every start, so once the app runs from an
 * empty state and saves, the only other copy of the user's data is gone. This
 * key is written once and never replaced by a later snapshot, the same rule
 * the safe-recovery rollback key follows (bootstrap/recovery.ts). The check and
 * the write run under the exclusive cross-tab lock, so two tabs cannot both see
 * an empty key. Credentials are redacted, in the text too when it is not valid
 * JSON: the copy is for a person to recover data from, and must not become a
 * second long-lived home for a plain-text key.
 *
 * Never throws: a failure is logged and reported as `failed`, and the caller
 * keeps the primary then.
 */
export const quarantineUnreadableSnapshot = async (
    snapshot?: string | null,
): Promise<QuarantineResult> => {
    if (!snapshot) return 'nothing'
    let result: QuarantineResult = 'failed'
    const write = async (): Promise<void> => {
        if ((await indexedDBStorage.getItem(REDUX_STATE_QUARANTINE_KEY)) !== null) {
            result = 'kept-earlier'
            return
        }
        // Redact the parsed form first, then scrub the text: a snapshot that is
        // not valid JSON is returned as is by the first step.
        const kept = scrubSecretsInText(redactSnapshotSecrets(snapshot))
        await indexedDBStorage.setItem(REDUX_STATE_QUARANTINE_KEY, kept)
        if ((await indexedDBStorage.getItem(REDUX_STATE_QUARANTINE_KEY)) !== kept) {
            throw new Error('Quarantine snapshot verification failed.')
        }
        result = 'stored'
    }
    try {
        // Without Web Locks the exclusive lock is unavailable; fall back to the
        // shared write path every other persistence write uses.
        const locked = await runWithExclusiveRecoveryLock(async () => {
            await write()
            return true
        })
        if (locked === null) await schedulePersistenceWrite(write)
    } catch (error) {
        console.error('[Store] Could not quarantine the unreadable snapshot:', error)
        result = 'failed'
    }
    return result
}

/**
 * Removes the primary snapshot that could not be hydrated, but only once its
 * bytes are safe: a failed quarantine keeps the primary, so a start that makes
 * no change (and so no save) can still retry after storage has been freed.
 * Returns whether the primary was removed.
 */
export const discardUnreadablePrimarySnapshot = async (
    snapshot?: string | null,
): Promise<boolean> => {
    if ((await quarantineUnreadableSnapshot(snapshot)) === 'failed') {
        console.error(
            '[Store] Keeping the unreadable primary snapshot: it could not be quarantined.',
        )
        return false
    }
    return removePrimaryPersistedSnapshot()
}
