import { schedulePersistenceWrite } from '@/bootstrap/persistenceCoordinator'
import { REDUX_STATE_QUARANTINE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { redactSnapshotSecrets, scrubSecretsInText } from '@/utils/redactSecrets'

/**
 * Keeps the first persisted snapshot that could not be hydrated, before the
 * caller removes the primary (stores/store.ts, #666).
 *
 * The startup backup is replaced on every start, so once the app runs from an
 * empty state and saves, the only other copy of the user's data is gone. This
 * key is written once and never replaced by a later snapshot, the same rule
 * the safe-recovery rollback key follows (bootstrap/recovery.ts). Credentials
 * are redacted: an unreadable snapshot is kept for a person to recover data
 * from, and must not become a second long-lived home for a plain-text key.
 *
 * Never throws: a failure is logged and reported as `false`, because the
 * caller is already on its failure path.
 */
export const quarantineUnreadableSnapshot = async (
    snapshot: string | null | undefined,
): Promise<boolean> => {
    if (!snapshot) return false
    let stored = false
    try {
        await schedulePersistenceWrite(async () => {
            if ((await indexedDBStorage.getItem(REDUX_STATE_QUARANTINE_KEY)) !== null) return
            // Redact the parsed form first, then scrub the text: a snapshot that is
            // not valid JSON is returned as is by the first step.
            const kept = scrubSecretsInText(redactSnapshotSecrets(snapshot))
            await indexedDBStorage.setItem(REDUX_STATE_QUARANTINE_KEY, kept)
            if ((await indexedDBStorage.getItem(REDUX_STATE_QUARANTINE_KEY)) !== kept) {
                throw new Error('Quarantine snapshot verification failed.')
            }
            stored = true
        })
    } catch (error) {
        console.error('[Store] Could not quarantine the unreadable snapshot:', error)
    }
    return stored
}
