import { configureStore } from '@reduxjs/toolkit';
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


export const store = configureStore({
    reducer: {
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
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;