import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import simulationReducer from './slices/simulationSlice';
import uiReducer from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';
import strainsViewReducer from './slices/strainsViewSlice';
import userStrainsReducer from './slices/userStrainsSlice';
import favoritesReducer from './slices/favoritesSlice';
import notesReducer from './slices/notesSlice';
import aiReducer from './slices/aiSlice';
import archivesReducer from './slices/archivesSlice';
import savedItemsReducer from './slices/savedItemsSlice';
import knowledgeReducer from './slices/knowledgeSlice';
import breedingReducer from './slices/breedingSlice';
import ttsReducer from './slices/ttsSlice';
import sandboxReducer from './slices/sandboxSlice';
import filtersReducer from './slices/filtersSlice';
import { indexedDBStorage } from './indexedDBStorage';

const rootReducer = combineReducers({
    simulation: simulationReducer,
    ui: uiReducer,
    settings: settingsReducer,
    strainsView: strainsViewReducer,
    userStrains: userStrainsReducer,
    favorites: favoritesReducer,
    notes: notesReducer,
    ai: aiReducer,
    archives: archivesReducer,
    savedItems: savedItemsReducer,
    knowledge: knowledgeReducer,
    breeding: breedingReducer,
    tts: ttsReducer,
    sandbox: sandboxReducer,
    filters: filtersReducer,
});

const tempStoreForTypes = configureStore({ reducer: rootReducer });
export type RootState = ReturnType<typeof tempStoreForTypes.getState>;
export type AppDispatch = typeof tempStoreForTypes.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const REDUX_STATE_KEY = 'cannaguide-redux-storage';
let saveTimeout: number | null = null;

const saveState = (state: RootState) => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(() => {
        try {
            const stateToSave = {
                settings: state.settings,
                simulation: state.simulation,
                strainsView: state.strainsView,
                userStrains: state.userStrains,
                favorites: state.favorites,
                notes: state.notes,
                archives: state.archives,
                savedItems: state.savedItems,
                knowledge: state.knowledge,
                breeding: state.breeding,
                sandbox: state.sandbox,
                filters: state.filters,
            };
            const serializedState = JSON.stringify(stateToSave);
            indexedDBStorage.setItem(REDUX_STATE_KEY, serializedState);
        } catch (e) {
            console.error("Could not save state", e);
        }
    }, 1000);
};

export const createAppStore = (preloadedState?: Partial<RootState>) => {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({
            serializableCheck: false,
        }),
    });

    store.subscribe(() => {
        saveState(store.getState());
    });

    return store;
};
