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
    getAiHistoryClearMarker,
    getAiHistoryClearPhase,
    hasNoArchivedAiResponses,
    markAiHistoryClearPending,
    markAiHistoryRecoveryPending,
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

const sanitizeRecoveryCopy = async (key: string): Promise<boolean> => {
    try {
        const saved = await indexedDBStorage.getItem(key)
        if (saved === null) return true

        const result = clearArchivedAiResponsesFromSnapshot(saved)
        if (result.status === 'unrecognized') {
            // Opaque recovery data is deliberately preserved rather than deleted.
            return true
        }
        if (result.status === 'clean') return true

        await indexedDBStorage.setItem(key, result.serialized)
        return (await indexedDBStorage.getItem(key)) === result.serialized
    } catch {
        // Preserve a recovery copy that cannot be safely read or verified.
        return false
    }
}

const sanitizeRecoveryCopies = async (): Promise<boolean> => {
    const results: boolean[] = []
    for (const key of [
        REDUX_STATE_BACKUP_KEY,
        REDUX_STATE_QUARANTINE_KEY,
        REDUX_STATE_ROLLBACK_KEY,
    ]) {
        results.push(await sanitizeRecoveryCopy(key))
    }
    return results.every(Boolean)
}

const promotePendingAiHistoryClear = (expectedMarker: string): string | null =>
    getAiHistoryClearPhase() === 'active'
        ? markAiHistoryRecoveryPending(expectedMarker)
        : expectedMarker

const finishPendingAiHistoryClear = async (expectedMarker: string): Promise<boolean> => {
    if (getAiHistoryClearMarker() !== expectedMarker) return false
    const recoveryMarker = promotePendingAiHistoryClear(expectedMarker)
    if (recoveryMarker === null) return false

    const finished = await runWithExclusiveRecoveryLock(sanitizeRecoveryCopies)
    if (finished !== true) return false
    return clearPendingAiHistoryClear(recoveryMarker)
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
                const pendingAiHistoryMarker = getAiHistoryClearMarker()
                if (pendingAiHistoryMarker !== null) {
                    try {
                        const activeSnapshotIsSafe =
                            getAiHistoryClearPhase() !== 'active' ||
                            wroteArchiveFreeSnapshot ||
                            hydratedStore.getState().settings.settings.privacy
                                ?.clearAiHistoryOnExit === false
                        if (activeSnapshotIsSafe) {
                            await finishPendingAiHistoryClear(pendingAiHistoryMarker)
                        }
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

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            clearTimeout(saveTimeout)
            void saveState()
        }
    })

    window.addEventListener('pagehide', (event: PageTransitionEvent) => {
        const { settings } = hydratedStore.getState()
        if (!event.persisted && settings.settings.privacy?.clearAiHistoryOnExit) {
            const pendingMarker = markAiHistoryClearPending()
            if (pendingMarker !== null) hydratedStore.dispatch(clearArchives())
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
