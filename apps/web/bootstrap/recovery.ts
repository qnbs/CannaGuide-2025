import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'
import { Sentry } from '@/services/sentryService'
import { migratePersistedSnapshot } from '@/services/migration/persistedSnapshot'
import {
    commitRecoveryEpoch,
    runWithExclusiveRecoveryLock,
    suspendPersistenceForRecovery,
} from './persistenceCoordinator'

export const SAFE_RECOVERY_ATTEMPT_KEY = 'cannaguide.safeRecoveryAttempted'
export const SAFE_RECOVERY_ROLLBACK_KEY = `${REDUX_STATE_KEY}-recovery-rollback`
const SAFE_RECOVERY_BACKUP_KEY = `${REDUX_STATE_KEY}-backup`

export const triggerSafeRecovery = async (
    reason: string,
    error?: unknown,
    reload: () => void = () => window.location.reload(),
): Promise<boolean> => {
    try {
        const alreadyAttempted = sessionStorage.getItem(SAFE_RECOVERY_ATTEMPT_KEY) === '1'
        if (alreadyAttempted) {
            return false
        }
        // This synchronous marker closes the gap in which two recovery calls could
        // both pass the guard before the first IndexedDB read completes.
        sessionStorage.setItem(SAFE_RECOVERY_ATTEMPT_KEY, '1')

        const recoveryResult = await runWithExclusiveRecoveryLock(async () => {
            let originalSnapshot: string | null = null
            let primarySnapshotChanged = false
            let resumePersistence: (() => void) | null = null

            try {
                resumePersistence = await suspendPersistenceForRecovery()
                if (!resumePersistence) {
                    throw new Error('Persisted-state recovery is already in progress.')
                }

                const backupSnapshot = await indexedDBStorage.getItem(SAFE_RECOVERY_BACKUP_KEY)
                if (!backupSnapshot) {
                    throw new Error('No backup snapshot is available.')
                }
                const migratedBackupSnapshot = migratePersistedSnapshot(backupSnapshot)

                originalSnapshot = await indexedDBStorage.getItem(REDUX_STATE_KEY)
                const existingRollback = await indexedDBStorage.getItem(SAFE_RECOVERY_ROLLBACK_KEY)
                if (originalSnapshot !== null && existingRollback === null) {
                    // Preserve the first pre-recovery primary until the user explicitly
                    // accepts or rolls back recovery; never replace it on later attempts.
                    await indexedDBStorage.setItem(SAFE_RECOVERY_ROLLBACK_KEY, originalSnapshot)
                }

                console.debug(`[SafeRecovery] Triggered by: ${reason}`, error)
                if (error instanceof Error) {
                    Sentry.captureException(error, { tags: { recovery: reason } })
                }

                primarySnapshotChanged = true
                await indexedDBStorage.setItem(REDUX_STATE_KEY, migratedBackupSnapshot)
                const restoredSnapshot = await indexedDBStorage.getItem(REDUX_STATE_KEY)
                if (restoredSnapshot !== migratedBackupSnapshot) {
                    throw new Error('Backup snapshot verification failed after restore.')
                }

                // Existing tabs retain the prior epoch and can no longer persist stale
                // in-memory state after the exclusive cross-tab lock is released.
                if (!commitRecoveryEpoch()) {
                    throw new Error('Could not commit the cross-tab recovery fence.')
                }
                reload()
                return true
            } catch (recoveryError) {
                let rollbackSucceeded = !primarySnapshotChanged
                if (primarySnapshotChanged) {
                    try {
                        if (originalSnapshot === null) {
                            await indexedDBStorage.removeItem(REDUX_STATE_KEY)
                        } else {
                            await indexedDBStorage.setItem(REDUX_STATE_KEY, originalSnapshot)
                        }
                        rollbackSucceeded = true
                    } catch (rollbackError) {
                        console.error(
                            '[SafeRecovery] Failed to roll back the primary snapshot.',
                            rollbackError,
                        )
                    }
                }
                if (rollbackSucceeded) resumePersistence?.()
                throw recoveryError
            }
        })

        if (recoveryResult === null) {
            throw new Error('Persisted-state recovery is already active in another tab.')
        }
        return recoveryResult
    } catch (recoveryError) {
        sessionStorage.removeItem(SAFE_RECOVERY_ATTEMPT_KEY)
        console.error('[SafeRecovery] Failed to restore the backup snapshot.', recoveryError)
        return false
    }
}

export const registerRecoveryListeners = (): void => {
    window.addEventListener('cannaguide-safe-recovery-request', () => {
        void triggerSafeRecovery('manual-safe-recovery')
    })
}
