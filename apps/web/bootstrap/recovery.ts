import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'
import { Sentry } from '@/services/sentryService'
import { suspendPersistenceForRecovery } from './persistenceCoordinator'

export const SAFE_RECOVERY_ATTEMPT_KEY = 'cannaguide.safeRecoveryAttempted'
export const SAFE_RECOVERY_ROLLBACK_KEY = `${REDUX_STATE_KEY}-recovery-rollback`
const SAFE_RECOVERY_BACKUP_KEY = `${REDUX_STATE_KEY}-backup`

const isValidPersistedSnapshot = (snapshot: string): boolean => {
    try {
        const parsed: unknown = JSON.parse(snapshot)
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    } catch {
        return false
    }
}

export const triggerSafeRecovery = async (
    reason: string,
    error?: unknown,
    reload: () => void = () => window.location.reload(),
): Promise<boolean> => {
    let originalSnapshot: string | null = null
    let primarySnapshotChanged = false
    let resumePersistence: (() => void) | null = null

    try {
        const alreadyAttempted = sessionStorage.getItem(SAFE_RECOVERY_ATTEMPT_KEY) === '1'
        if (alreadyAttempted) {
            return false
        }
        // This synchronous marker closes the gap in which two recovery calls could
        // both pass the guard before the first IndexedDB read completes.
        sessionStorage.setItem(SAFE_RECOVERY_ATTEMPT_KEY, '1')

        resumePersistence = await suspendPersistenceForRecovery()
        if (!resumePersistence) {
            throw new Error('Persisted-state recovery is already in progress.')
        }

        const backupSnapshot = await indexedDBStorage.getItem(SAFE_RECOVERY_BACKUP_KEY)
        if (!backupSnapshot || !isValidPersistedSnapshot(backupSnapshot)) {
            throw new Error('No valid backup snapshot is available.')
        }

        originalSnapshot = await indexedDBStorage.getItem(REDUX_STATE_KEY)
        if (originalSnapshot !== null) {
            // Preserve the current primary so recovery itself is reversible.
            await indexedDBStorage.setItem(SAFE_RECOVERY_ROLLBACK_KEY, originalSnapshot)
        }

        console.debug(`[SafeRecovery] Triggered by: ${reason}`, error)
        if (error instanceof Error) {
            Sentry.captureException(error, { tags: { recovery: reason } })
        }

        primarySnapshotChanged = true
        await indexedDBStorage.setItem(REDUX_STATE_KEY, backupSnapshot)
        const restoredSnapshot = await indexedDBStorage.getItem(REDUX_STATE_KEY)
        if (restoredSnapshot !== backupSnapshot) {
            throw new Error('Backup snapshot verification failed after restore.')
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
        sessionStorage.removeItem(SAFE_RECOVERY_ATTEMPT_KEY)
        if (rollbackSucceeded) resumePersistence?.()
        console.error('[SafeRecovery] Failed to restore the backup snapshot.', recoveryError)
        return false
    }
}

export const registerRecoveryListeners = (): void => {
    window.addEventListener('cannaguide-safe-recovery-request', () => {
        void triggerSafeRecovery('manual-safe-recovery')
    })
}
