import { configureStore, combineReducers } from '@reduxjs/toolkit';
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
import { geminiApi } from './api';
import { listenerMiddleware } from './listenerMiddleware';

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
    [geminiApi.reducerPath]: geminiApi.reducer,
});

const tempStoreForTypes = configureStore({ reducer: rootReducer });
export type RootState = ReturnType<typeof tempStoreForTypes.getState>;
export type AppDispatch = typeof tempStoreForTypes.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const createAppStore = (preloadedState?: Partial<RootState>) => {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({
            serializableCheck: false,
        }).concat(geminiApi.middleware).prepend(listenerMiddleware.middleware),
    });

    return store;
};