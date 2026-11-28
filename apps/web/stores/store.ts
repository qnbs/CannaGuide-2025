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
import problemTrackerReducer from './slices/problemTrackerSlice'
import { geminiApi } from './api'
import {
    listenerMiddleware,
    initFilterUrlSync,
    initOnboardingSubscription,
} from './listenerMiddleware'
import { voiceOrchestratorService } from '@/services/voiceOrchestratorService'
import { indexedDBStorage } from './indexedDBStorage'
import { rememberStoredRevision, setItemIfSnapshotUnchanged } from './snapshotRevision'
import { parseAndMigratePersistedSnapshot } from '@/services/migration/persistedSnapshot'
import {
    clearArchivedAiResponsesFromSnapshot,
    hasPendingAiHistoryClear,
} from '@/services/aiHistoryRetention'
import {
    isNewerSnapshotError,
    isNewerThanThisBuild,
    isSnapshotNewerThan,
} from '@/services/migration/newerSnapshot'
import { REDUX_STATE_BACKUP_KEY, REDUX_STATE_KEY } from '@/constants'
import { getUISnapshot, initialUIState } from './useUIStore'
import { initUIStateBridgeFull } from '../services/uiStateBridge'
import type { UIState } from './useUIStore'
import { tryRepairPrimaryPersistedSnapshot } from '@/services/persistedStateService'
import {
    discardUnreadablePrimarySnapshot,
    quarantineUnreadableSnapshot,
} from '@/services/snapshotQuarantine'

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
    metrics: metricsReducer, // Persisted -- plant metrics readings (all kept, GH #814)
    growPlanner: growPlannerReducer, // Persisted -- planner tasks (FIFO 500)
    diagnosisHistory: diagnosisHistoryReducer, // Persisted -- diagnosis records (FIFO 100/plant)
    problemTracker: problemTrackerReducer, // Persisted -- plant issues (FIFO 200)
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

/** The parsed snapshot, or null when it is not JSON. */
const parseOrNull = (snapshot: string): unknown => {
    try {
        return JSON.parse(snapshot) as unknown
    } catch {
        return null
    }
}

/**
 * Keeps the pre-migration bytes of a primary that has migrated as the backup (#666).
 * Copying them before the migration replaced the last good backup with a corrupt or
 * newer primary before anything read it. A backup newer than the primary is the
 * original that an older release without this guard relabelled and saved over: it goes
 * to the quarantine before it is replaced, and stays the backup if that fails.
 */
const refreshStartupBackup = async (snapshot: string): Promise<void> => {
    try {
        const previous = await indexedDBStorage.getItem(REDUX_STATE_BACKUP_KEY)
        const previousState = previous ? parseOrNull(previous) : null
        // Newer than the primary, or newer than this build (CodeRabbit on #871): a
        // primary without `_sliceVersions` cannot show that a backup slice is newer.
        if (
            previous &&
            (isNewerThanThisBuild(previousState) ||
                isSnapshotNewerThan(previousState, parseOrNull(snapshot)))
        ) {
            if ((await quarantineUnreadableSnapshot(previous)) !== 'stored') return
        }
        // Only while the primary is still the one this page read: without Web Locks a
        // second tab may have saved, and its newer data must not lose its backup.
        if (!(await setItemIfSnapshotUnchanged(REDUX_STATE_BACKUP_KEY, snapshot))) {
            console.debug(
                '[Store] Backup not refreshed: the saved data changed since this page read it.',
            )
        }
    } catch (backupErr) {
        console.debug('[Store] Could not save pre-migration backup:', backupErr)
    }
}

/**
 * Where the last `createAppStore()` took its state from: the saved snapshot, the
 * startup backup, or nothing (a first start, or data that could not be read). The
 * desktop startup report sends it, so the runtime smoke test can tell a restart that
 * loaded the first run's data from one that only found it on disk.
 */
export type StartupHydration = 'snapshot' | 'backup' | 'fresh'

let startupHydration: StartupHydration = 'fresh'

export const getStartupHydration = (): StartupHydration => startupHydration

export const createAppStore = async (): Promise<AppStore> => {
    startupHydration = 'fresh'
    const retryAiHistoryClear = hasPendingAiHistoryClear()
    let preloadedState: Partial<RootState> | undefined
    let persistedUiState: Partial<UIState> | undefined

    const hydratePersistedState = (persistedString: string): Partial<RootState> => {
        const migrated = parseAndMigratePersistedSnapshot(persistedString) as Partial<RootState> & {
            ui?: Partial<UIState>
        }

        // Extract UI state for Zustand hydration and remove from Redux preloaded state
        if (migrated.ui) {
            persistedUiState = { ...initialUIState, ...migrated.ui }
            delete (migrated as Record<string, unknown>).ui
        }

        if (retryAiHistoryClear) {
            migrated.archives = {
                archivedMentorResponses: [],
                archivedAdvisorResponses: {},
            }
        }

        return migrated
    }

    const tryLoadBackupState = async (): Promise<Partial<RootState> | undefined> => {
        try {
            const backupString = await indexedDBStorage.getItem(REDUX_STATE_BACKUP_KEY)
            if (!backupString) {
                return undefined
            }

            console.debug('[Store] Attempting recovery from pre-migration backup snapshot.')
            const repaired = await tryRepairPrimaryPersistedSnapshot(backupString)
            return repaired ? hydratePersistedState(backupString) : undefined
        } catch (backupError) {
            // A newer build's backup stops the start like a newer primary does (#666).
            if (isNewerSnapshotError(backupError)) throw backupError
            // A backup that cannot be read must not stop the start: the primary still
            // has to be quarantined before anything else touches it (#666).
            console.debug('[Store] Could not recover state from the backup:', backupError)
            return undefined
        }
    }

    // Before the snapshot, so a save by another tab in between makes this tab's
    // first save stale rather than letting it overwrite that save (#669).
    await rememberStoredRevision()

    let persistedString: string | null | undefined
    try {
        persistedString = await indexedDBStorage.getItem(REDUX_STATE_KEY)
        if (persistedString) {
            console.debug('[Store] Hydrating state from IndexedDB.')
            preloadedState = hydratePersistedState(persistedString)
            startupHydration = 'snapshot'
            if (retryAiHistoryClear) {
                const backupCopy = clearArchivedAiResponsesFromSnapshot(persistedString)
                if (backupCopy.status !== 'unrecognized') {
                    await refreshStartupBackup(backupCopy.serialized)
                } else {
                    console.debug(
                        '[Store] Startup backup retained because its archive shape could not be verified.',
                    )
                }
            } else {
                await refreshStartupBackup(persistedString)
            }
        }
    } catch (e) {
        // A newer build's snapshot is readable, just not by this build. The backup and
        // quarantine path below would remove it from the primary key, and starting fresh
        // would save over it: leave it alone and let the startup show the notice (#666).
        if (isNewerSnapshotError(e)) throw e
        console.debug(
            "Could not load or migrate state from IndexedDB, starting fresh. A backup may be available at key '" +
                REDUX_STATE_KEY +
                "-backup'.",
            e,
        )
        startupHydration = 'fresh'
        preloadedState = await tryLoadBackupState()
        if (preloadedState) startupHydration = 'backup'
        if (!preloadedState) {
            // The startup backup is replaced on every start, so the original bytes
            // are quarantined first, and the primary stays if that fails (#666).
            await discardUnreadablePrimarySnapshot(persistedString)
        }
    }

    const store = makeStore(preloadedState)

    // Wire up Zustand <-> Redux bridges
    initUIStateBridgeFull(() => store.getState(), store.dispatch, store.subscribe)
    initFilterUrlSync()
    voiceOrchestratorService.init(store)
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
