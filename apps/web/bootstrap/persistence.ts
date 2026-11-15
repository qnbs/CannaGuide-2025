import type { AppStore, RootState } from '@/stores/store'
import { StaleSnapshotError, writeSnapshot } from '@/stores/snapshotRevision'
import { dbService } from '@/services/dbService'
import { workerBus } from '@/services/workerBus'
import { pendingLegacySecretPaths } from '@/services/settingsSecretStores'
import { buildPersistedSnapshot } from '@/services/persistedSnapshotFormat'
import { schedulePersistenceWrite } from './persistenceCoordinator'

export type FlushPersistedState = () => Promise<boolean>

const PENDING_SAVE_FAILURE_KEY = 'cannaguide.pendingSnapshotSaveFailure'

const setPendingSaveFailure = (pending: boolean): void => {
    try {
        if (pending) localStorage.setItem(PENDING_SAVE_FAILURE_KEY, '1')
        else localStorage.removeItem(PENDING_SAVE_FAILURE_KEY)
    } catch {
        // The marker is best-effort: localStorage must never block IndexedDB persistence.
    }
}

export const hasPendingPersistenceFailure = (): boolean => {
    try {
        return localStorage.getItem(PENDING_SAVE_FAILURE_KEY) === '1'
    } catch {
        return false
    }
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
): FlushPersistedState => {
    let failing = false
    const reportFailure = (error: unknown): void => {
        setPendingSaveFailure(true)
        if (failing) return
        failing = true
        onSaveFailure?.(error)
    }
    const saveState = async () => {
        try {
            const saved = await schedulePersistenceWrite(async () => {
                const state = hydratedStore.getState() as RootState
                const optimizedSimulation = await dbService.optimizeSimulationForPersistence(
                    state.simulation,
                )
                const stateToSave = buildPersistedSnapshot(
                    state,
                    optimizedSimulation,
                    pendingLegacySecretPaths(),
                )
                const serializedState = JSON.stringify(stateToSave)
                await writeSnapshot(serializedState)
            })
            if (saved) {
                failing = false
                setPendingSaveFailure(false)
            }
            return saved
        } catch (e) {
            if (e instanceof StaleSnapshotError) {
                console.warn('[Persistence] Not saved:', e.message)
                onStaleSnapshot?.(e)
                return false
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
        clearTimeout(saveTimeout)
        void saveState()
        workerBus.dispose()
    })

    return saveState
}
