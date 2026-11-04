import type { AppStore, RootState } from '@/stores/store'
import { StaleSnapshotError, writeSnapshot } from '@/stores/snapshotRevision'
import { dbService } from '@/services/dbService'
import { workerBus } from '@/services/workerBus'
import { pendingLegacySecretPaths } from '@/services/settingsSecretStores'
import { buildPersistedSnapshot } from '@/services/persistedSnapshotFormat'
import { schedulePersistenceWrite } from './persistenceCoordinator'

export type FlushPersistedState = () => Promise<boolean>

/**
 * @param onStaleSnapshot called with the refusal when a save is refused because
 * another tab saved since this page loaded, or because this page cannot check
 * that (UnverifiedSnapshotError; stores/snapshotRevision.ts, GH #669). The
 * caller must stop saving and tell the user; nothing was written.
 */
export const setupPersistedStateSync = (
    hydratedStore: AppStore,
    onStaleSnapshot?: (refusal: StaleSnapshotError) => void,
): FlushPersistedState => {
    const saveState = async () => {
        try {
            return await schedulePersistenceWrite(async () => {
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
        } catch (e) {
            if (e instanceof StaleSnapshotError) {
                console.warn('[Persistence] Not saved:', e.message)
                onStaleSnapshot?.(e)
                return false
            }
            console.error('[Persistence] Failed to save state:', e)
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
