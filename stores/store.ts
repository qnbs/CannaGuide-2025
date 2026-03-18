import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { ForkedTask } from '@reduxjs/toolkit';

import simulationReducer from './slices/simulationSlice';
import uiReducer, { initialState as initialUiState, setActiveView } from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';
import strainsViewReducer from './slices/strainsViewSlice';
import userStrainsReducer from './slices/userStrainsSlice';
import favoritesReducer from './slices/favoritesSlice';
import notesReducer from './slices/notesSlice';
import archivesReducer from './slices/archivesSlice';
import savedItemsReducer from './slices/savedItemsSlice';
import knowledgeReducer from './slices/knowledgeSlice';
import breedingReducer from './slices/breedingSlice';
import ttsReducer from './slices/ttsSlice';
import sandboxReducer from './slices/sandboxSlice';
import filtersReducer from './slices/filtersSlice';
import genealogyReducer from './slices/genealogySlice';
import navigationReducer from './slices/navigationSlice';
import { geminiApi } from './api';
import { listenerMiddleware } from './listenerMiddleware';
import { indexedDBStorage } from './indexedDBStorage';
import { migrateState } from '../services/migrationLogic';
import { REDUX_STATE_KEY } from '@/constants';

const rootReducer = combineReducers({
    simulation: simulationReducer,
    ui: uiReducer,
    settings: settingsReducer,
    strainsView: strainsViewReducer,
    userStrains: userStrainsReducer,
    favorites: favoritesReducer,
    notes: notesReducer,
    archives: archivesReducer,
    savedItems: savedItemsReducer,
    knowledge: knowledgeReducer,
    breeding: breedingReducer,
    tts: ttsReducer,
    sandbox: sandboxReducer,
    filters: filtersReducer,
    genealogy: genealogyReducer,
    navigation: navigationReducer,
    [geminiApi.reducerPath]: geminiApi.reducer,
});

const makeStore = (preloadedState?: Partial<RootState>) =>
    configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    // RTK Query caches and timestamps are not plain-serializable;
                    // ignore the geminiApi slice paths to keep the guard active elsewhere.
                    ignoredPaths: ['geminiApi'],
                },
            })
                .concat(geminiApi.middleware)
                .prepend(listenerMiddleware.middleware),
    });

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type { ForkedTask };

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const createAppStore = async (): Promise<AppStore> => {
    let preloadedState: Partial<RootState> | undefined;

    const hydratePersistedState = (persistedString: string): Partial<RootState> => {
        const persistedState = JSON.parse(persistedString);
        const migrated = migrateState(persistedState) as Partial<RootState>;

        if (migrated.ui) {
            migrated.ui = { ...initialUiState, ...migrated.ui };
        }

        return migrated;
    };

    const tryLoadBackupState = async (): Promise<Partial<RootState> | undefined> => {
        const backupString = await indexedDBStorage.getItem(REDUX_STATE_KEY + '-backup');
        if (!backupString) {
            return undefined;
        }

        console.warn('[Store] Attempting recovery from pre-migration backup snapshot.');
        const recoveredState = hydratePersistedState(backupString);

        try {
            await indexedDBStorage.setItem(REDUX_STATE_KEY, backupString);
        } catch (repairErr) {
            console.warn('[Store] Could not repair primary snapshot from backup:', repairErr);
        }

        return recoveredState;
    };

    try {
        const persistedString = await indexedDBStorage.getItem(REDUX_STATE_KEY);
        if (persistedString) {
            console.debug('[Store] Hydrating state from IndexedDB.');
            // Save a backup snapshot before migration so data can be recovered if migration fails.
            try {
                await indexedDBStorage.setItem(REDUX_STATE_KEY + '-backup', persistedString);
            } catch (backupErr) {
                console.warn('[Store] Could not save pre-migration backup:', backupErr);
            }
            preloadedState = hydratePersistedState(persistedString);
        }
    } catch (e) {
        console.error("Could not load or migrate state from IndexedDB, starting fresh. A backup may be available at key '" + REDUX_STATE_KEY + "-backup'.", e);
        preloadedState = await tryLoadBackupState();
        if (!preloadedState) {
            await indexedDBStorage.removeItem(REDUX_STATE_KEY);
        }
    }
    
    const store = makeStore(preloadedState);

    // After store creation, set the initial view. Prioritize user's default setting over last active view.
    if (preloadedState?.settings?.settings?.general?.defaultView) {
        store.dispatch(setActiveView(preloadedState.settings.settings.general.defaultView));
    } else if (preloadedState?.ui?.lastActiveView) {
        store.dispatch(setActiveView(preloadedState.ui.lastActiveView));
    }

    return store;
};