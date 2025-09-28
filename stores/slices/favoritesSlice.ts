
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FavoritesState {
    favoriteIds: string[];
}

const initialState: FavoritesState = {
    favoriteIds: [],
};

const favoritesSlice = createSlice({
    name: 'favorites',
    initialState,
    reducers: {
        toggleFavorite: (state, action: PayloadAction<string>) => {
            const set = new Set(state.favoriteIds);
            if (set.has(action.payload)) {
                set.delete(action.payload);
            } else {
                set.add(action.payload);
            }
            state.favoriteIds = Array.from(set);
        },
        addMultipleToFavorites: (state, action: PayloadAction<string[]>) => {
            const set = new Set(state.favoriteIds);
            action.payload.forEach(id => set.add(id));
            state.favoriteIds = Array.from(set);
        },
        removeMultipleFromFavorites: (state, action: PayloadAction<string[]>) => {
            const set = new Set(state.favoriteIds);
            action.payload.forEach(id => set.delete(id));
            state.favoriteIds = Array.from(set);
        },
        // For migration purposes
        setFavorites: (state, action: PayloadAction<string[]>) => {
            state.favoriteIds = action.payload;
        }
    }
});

export const { toggleFavorite, addMultipleToFavorites, removeMultipleFromFavorites, setFavorites } = favoritesSlice.actions;

export default favoritesSlice.reducer;
