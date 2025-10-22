import { View } from '@/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// This payload will hold the state for a single view that we want to cache.
export interface ViewStatePayload {
    scrollY: number
    // We can store any view-specific state, like the active sub-tab.
    activeTabId?: string
}

export interface NavigationState {
    // A record to hold the cached state for each view.
    viewStates: Partial<Record<View, ViewStatePayload>>
}

const initialState: NavigationState = {
    viewStates: {},
}

const navigationSlice = createSlice({
    name: 'navigation',
    initialState,
    reducers: {
        /**
         * Caches the state for a specific view. This is called when the user navigates away from a view.
         */
        cacheViewState: (state, action: PayloadAction<{ view: View; state: ViewStatePayload }>) => {
            state.viewStates[action.payload.view] = {
                ...state.viewStates[action.payload.view],
                ...action.payload.state,
            }
        },
        /**
         * Clears all cached navigation states. Useful on a full app reset.
         */
        clearNavigationCache: (state) => {
            state.viewStates = {}
        },
        setNavigationState: (state, action: PayloadAction<NavigationState>) => {
            // Used for data import/export if we decide to persist this state.
            return action.payload
        },
    },
})

export const { cacheViewState, clearNavigationCache, setNavigationState } = navigationSlice.actions

export default navigationSlice.reducer
