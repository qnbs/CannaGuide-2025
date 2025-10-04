import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import simulationReducer from './slices/simulationSlice';
import uiReducer from './slices/uiSlice';
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
import { geminiApi } from './api';
import { listenerMiddleware } from './listenerMiddleware';
import { indexedDBStorage } from './indexedDBStorage';
import { migrateState } from '../services/migrationLogic';

const rootReducer = {
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
    [geminiApi.reducerPath]: geminiApi.reducer,
};

const tempStoreForTypes = configureStore({ reducer: rootReducer });
export type RootState = ReturnType<typeof tempStoreForTypes.getState>;
export type AppDispatch = typeof tempStoreForTypes.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const REDUX_STATE_KEY = 'cannaguide-redux-storage';

export const createAppStore = async () => {
    let preloadedState: Partial<RootState> | undefined;

    try {
        const persistedString = await indexedDBStorage.getItem(REDUX_STATE_KEY);
        if (persistedString) {
            console.log('[Store] Hydrating state from IndexedDB.');
            const persistedState = JSON.parse(persistedString);
            preloadedState = migrateState(persistedState) as Partial<RootState>;
        }
    } catch (e) {
        console.error("Could not load or migrate state from IndexedDB, starting fresh.", e);
        await indexedDBStorage.removeItem(REDUX_STATE_KEY);
    }
    
    const store = configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({
            serializableCheck: false,
        }).concat(geminiApi.middleware).prepend(listenerMiddleware.middleware),
    });

    return store;
};