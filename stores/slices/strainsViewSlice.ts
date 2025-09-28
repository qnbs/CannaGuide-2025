
import { StrainViewTab } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StrainsViewState {
    strainsViewTab: StrainViewTab;
    strainsViewMode: 'list' | 'grid';
    selectedStrainIds: string[];
}

const initialState: StrainsViewState = {
    // FIX: Use enum member for type safety.
    strainsViewTab: StrainViewTab.All,
    strainsViewMode: 'list',
    selectedStrainIds: [],
};

const strainsViewSlice = createSlice({
    name: 'strainsView',
    initialState,
    reducers: {
        setStrainsViewTab: (state, action: PayloadAction<StrainViewTab>) => {
            state.strainsViewTab = action.payload;
        },
        setStrainsViewMode: (state, action: PayloadAction<'list' | 'grid'>) => {
            state.strainsViewMode = action.payload;
        },
        toggleStrainSelection: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            const set = new Set(state.selectedStrainIds);
            if (set.has(id)) {
                set.delete(id);
            } else {
                set.add(id);
            }
            state.selectedStrainIds = Array.from(set);
        },
        toggleAllStrainSelection: (state, action: PayloadAction<{ ids: string[], areAllCurrentlySelected: boolean }>) => {
            const { ids, areAllCurrentlySelected } = action.payload;
            if (areAllCurrentlySelected) {
                state.selectedStrainIds = [];
            } else {
                state.selectedStrainIds = ids;
            }
        },
        clearStrainSelection: (state) => {
            state.selectedStrainIds = [];
        },
    },
});

export const {
    setStrainsViewTab,
    setStrainsViewMode,
    toggleStrainSelection,
    toggleAllStrainSelection,
    clearStrainSelection,
} = strainsViewSlice.actions;

export default strainsViewSlice.reducer;