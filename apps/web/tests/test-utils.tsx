import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'

// Import all slice reducers
import settingsReducer from '@/stores/slices/settingsSlice'
import favoritesReducer from '@/stores/slices/favoritesSlice'
import notesReducer from '@/stores/slices/notesSlice'
import archivesReducer from '@/stores/slices/archivesSlice'
import breedingReducer from '@/stores/slices/breedingSlice'
import knowledgeReducer from '@/stores/slices/knowledgeSlice'
import userStrainsReducer from '@/stores/slices/userStrainsSlice'
import sandboxReducer from '@/stores/slices/sandboxSlice'
import savedItemsReducer from '@/stores/slices/savedItemsSlice'
import genealogyReducer from '@/stores/slices/genealogySlice'
import ttsReducer from '@/stores/slices/ttsSlice'
import simulationReducer from '@/stores/slices/simulationSlice'
import navigationReducer from '@/stores/slices/navigationSlice'

import type { RootState } from '@/stores/store'

const rootReducer = combineReducers({
    settings: settingsReducer,
    favorites: favoritesReducer,
    notes: notesReducer,
    archives: archivesReducer,
    breeding: breedingReducer,
    knowledge: knowledgeReducer,
    userStrains: userStrainsReducer,
    sandbox: sandboxReducer,
    savedItems: savedItemsReducer,
    genealogy: genealogyReducer,
    tts: ttsReducer,
    simulation: simulationReducer,
    navigation: navigationReducer,
})

export function createTestStore(preloadedState?: Partial<RootState>) {
    return configureStore({
        reducer: rootReducer,
        preloadedState: preloadedState as Partial<RootState>,
    })
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
    preloadedState?: Partial<RootState>
    store?: ReturnType<typeof createTestStore>
}

export function renderWithProviders(
    ui: React.ReactElement,
    {
        preloadedState,
        store = createTestStore(preloadedState),
        ...renderOptions
    }: RenderWithProvidersOptions = {},
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return <Provider store={store}>{children}</Provider>
    }

    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
