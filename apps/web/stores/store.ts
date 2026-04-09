import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { ForkedTask } from '@reduxjs/toolkit'

import simulationReducer from './slices/simulationSlice'
import settingsReducer from './slices/settingsSlice'
import userStrainsReducer from './slices/userStrainsSlice'
import favoritesReducer from './slices/favoritesSlice'
import notesReducer from './slices/notesSlice'
import archivesReducer from './slices/archivesSlice'
import savedItemsReducer from './slices/savedItemsSlice'
import knowledgeReducer from './slices/knowledgeSlice'
import breedingReducer from './slices/breedingSlice'
import sandboxReducer from './slices/sandboxSlice'
import genealogyReducer from './slices/genealogySlice'
import nutrientPlannerReducer from './slices/nutrientPlannerSlice'
import workerMetricsReducer from './slices/workerMetricsSlice'
import hydroReducer from './slices/hydroSlice'
import growsReducer from './slices/growsSlice'
import metricsReducer from './slices/metricsSlice'
import growPlannerReducer from './slices/growPlannerSlice'
import diagnosisHistoryReducer from './slices/diagnosisHistorySlice'
import { geminiApi } from './api'
import {
    listenerMiddleware,
    initFilterUrlSync,
    initVoiceCommandSubscription,
    initOnboardingSubscription,
} from './listenerMiddleware'
import { indexedDBStorage } from './indexedDBStorage'
import { migrateState } from '../services/migrationLogic'
import { REDUX_STATE_KEY } from '@/constants'
import { getUISnapshot, initialUIState } from './useUIStore'
import { initUIStateBridgeFull } from '../services/uiStateBridge'
import type { UIState } from './useUIStore'

const rootReducer = combineReducers({
    simulation: simulationReducer,
    settings: settingsReducer,
    userStrains: userStrainsReducer,
    favorites: favoritesReducer,
    notes: notesReducer,
    archives: archivesReducer,
    savedItems: savedItemsReducer,
    knowledge: knowledgeReducer,
    breeding: breedingReducer,
    sandbox: sandboxReducer,
    genealogy: genealogyReducer,
    nutrientPlanner: nutrientPlannerReducer,
    hydro: hydroReducer,
    grows: growsReducer,
    metrics: metricsReducer, // Persisted -- plant metrics readings (FIFO 168/plant)
    growPlanner: growPlannerReducer, // Persisted -- planner tasks (FIFO 500)
    diagnosisHistory: diagnosisHistoryReducer, // Persisted -- diagnosis records (FIFO 100/plant)
    // Runtime-only -- excluded from stateToSave in indexedDBStorage
    workerMetrics: workerMetricsReducer,
    [geminiApi.reducerPath]: geminiApi.reducer,
})

// RTK's GetDefaultMiddleware callback has optional properties incompatible
// with exactOptionalPropertyTypes (TS2719). This is a known upstream RTK issue.
const makeStore = (preloadedState?: Partial<RootState>) =>
    configureStore({
        reducer: rootReducer,
        ...(preloadedState !== undefined && { preloadedState }),
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredPaths: ['geminiApi', 'workerMetrics'],
                },
            })
                .concat(geminiApi.middleware)
                .prepend(listenerMiddleware.middleware),
    })

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type { ForkedTask }

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

/**
 * Create a store synchronously with default (empty) state.
 * Used to render the app shell immediately while IndexedDB hydration runs.
 */
export const createAppStoreSync = (): AppStore => makeStore()

export const createAppStore = async (): Promise<AppStore> => {
    let preloadedState: Partial<RootState> | undefined
    let persistedUiState: Partial<UIState> | undefined

    const hydratePersistedState = (persistedString: string): Partial<RootState> => {
        const persistedState = JSON.parse(persistedString)
        const migrated = migrateState(persistedState) as Partial<RootState> & {
            ui?: Partial<UIState>
        }

        // Extract UI state for Zustand hydration and remove from Redux preloaded state
        if (migrated.ui) {
            persistedUiState = { ...initialUIState, ...migrated.ui }
            delete (migrated as Record<string, unknown>).ui
        }

        return migrated
    }

    const tryLoadBackupState = async (): Promise<Partial<RootState> | undefined> => {
        const backupString = await indexedDBStorage.getItem(REDUX_STATE_KEY + '-backup')
        if (!backupString) {
            return undefined
        }

        console.debug('[Store] Attempting recovery from pre-migration backup snapshot.')
        const recoveredState = hydratePersistedState(backupString)

        try {
            await indexedDBStorage.setItem(REDUX_STATE_KEY, backupString)
        } catch (repairErr) {
            console.debug('[Store] Could not repair primary snapshot from backup:', repairErr)
        }

        return recoveredState
    }

    try {
        const persistedString = await indexedDBStorage.getItem(REDUX_STATE_KEY)
        if (persistedString) {
            console.debug('[Store] Hydrating state from IndexedDB.')
            // Save a backup snapshot before migration so data can be recovered if migration fails.
            try {
                await indexedDBStorage.setItem(REDUX_STATE_KEY + '-backup', persistedString)
            } catch (backupErr) {
                console.debug('[Store] Could not save pre-migration backup:', backupErr)
            }
            preloadedState = hydratePersistedState(persistedString)
        }
    } catch (e) {
        console.debug(
            "Could not load or migrate state from IndexedDB, starting fresh. A backup may be available at key '" +
                REDUX_STATE_KEY +
                "-backup'.",
            e,
        )
        preloadedState = await tryLoadBackupState()
        if (!preloadedState) {
            await indexedDBStorage.removeItem(REDUX_STATE_KEY)
        }
    }

    const store = makeStore(preloadedState)

    // Wire up Zustand <-> Redux bridges
    initUIStateBridgeFull(() => store.getState(), store.dispatch, store.subscribe)
    initFilterUrlSync()
    initVoiceCommandSubscription(store.dispatch, () => store.getState())
    initOnboardingSubscription(() => store.getState())

    // Hydrate Zustand UI state from persisted data
    if (persistedUiState) {
        getUISnapshot().hydrateUI(persistedUiState)
    }

    // After store creation, set the initial view. Prioritize user's default setting over last active view.
    if (preloadedState?.settings?.settings?.general?.defaultView) {
        getUISnapshot().setActiveView(preloadedState.settings.settings.general.defaultView)
    } else if (persistedUiState?.lastActiveView) {
        getUISnapshot().setActiveView(persistedUiState.lastActiveView)
    }

    return store
}
