import type { AppStore, RootState } from '@/stores/store'
import { getUISnapshot } from '@/stores/useUIStore'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY, SLICE_SCHEMA_VERSIONS } from '@/constants'
import { dbService } from '@/services/dbService'
import { workerBus } from '@/services/workerBus'

export const setupPersistedStateSync = (hydratedStore: AppStore): void => {
    const saveState = async () => {
        try {
            const state = hydratedStore.getState() as RootState
            const optimizedSimulation = await dbService.optimizeSimulationForPersistence(
                state.simulation,
            )
            const stateToSave = {
                version: state.settings.version,
                _sliceVersions: SLICE_SCHEMA_VERSIONS,
                settings: state.settings,
                simulation: optimizedSimulation,
                userStrains: state.userStrains,
                favorites: state.favorites,
                notes: state.notes,
                archives: state.archives,
                savedItems: state.savedItems,
                knowledge: state.knowledge,
                breeding: state.breeding,
                genealogy: state.genealogy,
                nutrientPlanner: {
                    schedule: state.nutrientPlanner.schedule,
                    readings: state.nutrientPlanner.readings,
                    alerts: state.nutrientPlanner.alerts,
                    autoAdjustEnabled: state.nutrientPlanner.autoAdjustEnabled,
                    medium: state.nutrientPlanner.medium,
                    activePluginId: state.nutrientPlanner.activePluginId,
                    activeBrandId: state.nutrientPlanner.activeBrandId,
                    isAiLoading: false,
                    lastAiRecommendation: state.nutrientPlanner.lastAiRecommendation,
                    autoAdjustRecommendation: state.nutrientPlanner.autoAdjustRecommendation,
                },
                sandbox: {
                    savedExperiments: state.sandbox.savedExperiments,
                    currentExperiment: null,
                    status: 'idle' as const,
                },
                hydro: state.hydro,
                grows: state.grows,
                metrics: state.metrics,
                growPlanner: state.growPlanner,
                diagnosisHistory: state.diagnosisHistory,
                problemTracker: state.problemTracker,
                ui: {
                    lastActiveView: getUISnapshot().lastActiveView,
                    onboardingStep: getUISnapshot().onboardingStep,
                    equipmentViewTab: getUISnapshot().equipmentViewTab,
                    knowledgeViewTab: getUISnapshot().knowledgeViewTab,
                },
            }
            const serializedState = JSON.stringify(stateToSave)
            await indexedDBStorage.setItem(REDUX_STATE_KEY, serializedState)
        } catch (e) {
            console.error('[Persistence] Failed to save state:', e)
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
}
