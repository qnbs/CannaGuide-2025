import type { AppStore, RootState } from '@/stores/store'
import { StaleSnapshotError, writeSnapshot } from '@/stores/snapshotRevision'
import { dbService } from '@/services/dbService'
import { workerBus } from '@/services/workerBus'
import { pendingLegacySecretPaths } from '@/services/settingsSecretStores'
import { buildPersistedSnapshot } from '@/services/persistedSnapshotFormat'
import {
    REDUX_STATE_BACKUP_KEY,
    REDUX_STATE_QUARANTINE_KEY,
    REDUX_STATE_ROLLBACK_KEY,
} from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { clearArchives } from '@/stores/slices/archivesSlice'
import {
    clearArchivedAiResponsesFromSnapshot,
    clearPendingAiHistoryClear,
    hasNoArchivedAiResponses,
    hasPendingAiHistoryClear,
    markAiHistoryClearPending,
} from '@/services/aiHistoryRetention'
import {
    activatePersistenceFailureTab,
    clearSnapshotSaveFailureForTab,
    getPersistenceFailureMarkerTabId,
    markPendingSnapshotSaveFailure,
    markPersistenceFailureTabClosed,
    type PendingSnapshotSaveFailureMarker,
} from '@/services/persistenceFailureMarker'
import { runWithExclusiveRecoveryLock, schedulePersistenceWrite } from './persistenceCoordinator'

export type FlushPersistedState = () => Promise<boolean>

const finishPendingAiHistoryClear = async (): Promise<boolean> => {
    const finished = await runWithExclusiveRecoveryLock(async () => {
        for (const key of [
            REDUX_STATE_BACKUP_KEY,
            REDUX_STATE_QUARANTINE_KEY,
            REDUX_STATE_ROLLBACK_KEY,
        ]) {
            try {
                const saved = await indexedDBStorage.getItem(key)
                if (saved === null) continue

                const result = clearArchivedAiResponsesFromSnapshot(saved)
                if (result.status === 'sanitized') {
                    await indexedDBStorage.setItem(key, result.serialized)
                    if ((await indexedDBStorage.getItem(key)) !== result.serialized) continue
                }
            } catch {
                // Preserve a recovery copy that cannot be safely read or verified.
            }
        }

        return clearPendingAiHistoryClear()
    })

    // The active snapshot has already been saved without archives. If this browser
    // cannot provide the recovery lock, do not keep a retry marker that would erase
    // archives the user creates during a later session.
    if (finished === null) return clearPendingAiHistoryClear()
    return finished === true
}

/**
 * @param onStaleSnapshot called with the refusal when a save is refused because
 * another tab saved since this page loaded, or because this page cannot check
 * that (UnverifiedSnapshotError; stores/snapshotRevision.ts, GH #669). The
 * caller must stop saving and tell the user; nothing was written.
 * @param onSaveFailure called when a save fails for another reason (storage
 * full, IndexedDB error): the latest changes exist only in memory until a save
 * succeeds, and the user must know. Called once per run of failures; a
 * successful save starts the count again (GH #686: with every manual reading
 * kept, a full store must not be silent).
 */
export const setupPersistedStateSync = (
    hydratedStore: AppStore,
    onStaleSnapshot?: (refusal: StaleSnapshotError) => void,
    onSaveFailure?: (error: unknown) => void,
    observedFailureMarkers: readonly PendingSnapshotSaveFailureMarker[] = [],
): FlushPersistedState => {
    const failureMarkerTabId = getPersistenceFailureMarkerTabId()
    activatePersistenceFailureTab(failureMarkerTabId)
    let failing = false
    let saveAttemptSequence = 0
    let latestSuccessfulSaveAttempt = 0
    const reportFailure = (error: unknown): void => {
        if (failing) return
        failing = true
        onSaveFailure?.(error)
    }
    const saveState = async () => {
        const saveAttempt = ++saveAttemptSequence
        let writeCallbackStarted = false
        let wroteArchiveFreeSnapshot = false
        try {
            const saved = await schedulePersistenceWrite(async (isBlocked) => {
                writeCallbackStarted = true
                try {
                    const state = hydratedStore.getState() as RootState
                    const optimizedSimulation = await dbService.optimizeSimulationForPersistence(
                        state.simulation,
                        isBlocked,
                    )
                    const stateToSave = buildPersistedSnapshot(
                        state,
                        optimizedSimulation,
                        pendingLegacySecretPaths(),
                    )
                    const serializedState = JSON.stringify(stateToSave)
                    // Preparing a large snapshot can take seconds: a quit or restart may
                    // have passed its last-write deadline, and then nothing may be committed.
                    if (isBlocked()) return false
                    await writeSnapshot(serializedState)
                    wroteArchiveFreeSnapshot = hasNoArchivedAiResponses(stateToSave.archives)
                    // Do this while still inside the scheduled write slot. A later
                    // save in another tab must not clear this tab's failed lineage.
                    clearSnapshotSaveFailureForTab(failureMarkerTabId, observedFailureMarkers)
                    return true
                } catch (error) {
                    if (!(error instanceof StaleSnapshotError)) {
                        // Record the failure before the coordinator releases its write slot.
                        markPendingSnapshotSaveFailure(failureMarkerTabId)
                    }
                    throw error
                }
            })
            if (saved) {
                latestSuccessfulSaveAttempt = saveAttempt
                failing = false
                if (
                    hasPendingAiHistoryClear() &&
                    wroteArchiveFreeSnapshot
                ) {
                    try {
                        await finishPendingAiHistoryClear()
                    } catch {
                        // Keep the marker so startup retries without exposing archived replies.
                    }
                }
            }
            return saved
        } catch (e) {
            if (e instanceof StaleSnapshotError) {
                console.warn('[Persistence] Not saved:', e.message)
                onStaleSnapshot?.(e)
                return false
            }
            // A coordinator failure (for example, a rejected Web Lock request)
            // can happen before the write callback records its failure. Preserve
            // the warning unless a later save from this tab already succeeded.
            if (!writeCallbackStarted && latestSuccessfulSaveAttempt < saveAttempt) {
                markPendingSnapshotSaveFailure(failureMarkerTabId)
            }
            console.error('[Persistence] Failed to save state:', e)
            reportFailure(e)
            return false
        }
    }

    let saveTimeout: number
    hydratedStore.subscribe(() => {
        clearTimeout(saveTimeout)
        const persistenceDelay =
            hydratedStore.getState().settings.settings.data.persistenceIntervalMs ?? 1500
        saveTimeout = window.setTimeout(() => {
            void saveState()
        }, persistenceDelay)
    })

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            clearTimeout(saveTimeout)
            void saveState()
        }
    })

    window.addEventListener('pagehide', () => {
        const { settings } = hydratedStore.getState()
        if (settings.settings.privacy?.clearAiHistoryOnExit) {
            markAiHistoryClearPending()
            hydratedStore.dispatch(clearArchives())
        }
        clearTimeout(saveTimeout)
        void saveState()
        markPersistenceFailureTabClosed(failureMarkerTabId)
        workerBus.dispose()
    })

    window.addEventListener('pageshow', () => {
        activatePersistenceFailureTab(failureMarkerTabId)
    })

    return saveState
}
