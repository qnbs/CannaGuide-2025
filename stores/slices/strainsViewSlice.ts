import { StrainViewTab } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StrainsViewState {
    strainsViewTab: StrainViewTab;
    strainsViewMode: 'list' | 'grid';
    selectedStrainIds: string[];
}

const initialState: StrainsViewState = {
    strainsViewTab: StrainViewTab.All,
    strainsViewMode: 'list',
    selectedStrainIds: [],
};

const strainsViewSlice = createSlice({
    name: 'strainsView',
    initialState,
    reducers: {
        setStrainsViewState: (state, action: PayloadAction<StrainsViewState>) => {
            return action.payload;
        },
        setStrainsViewTab: (state, action: PayloadAction<StrainViewTab>) => {
            state.strainsViewTab = action.payload;
            state.selectedStrainIds = []; // Clear selection when changing tabs
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
                 const currentSelection = new Set(state.selectedStrainIds);
                 ids.forEach(id => currentSelection.delete(id));
                 state.selectedStrainIds = Array.from(currentSelection);
            } else {
                const newSelection = new Set(state.selectedStrainIds);
                ids.forEach(id => newSelection.add(id));
                state.selectedStrainIds = Array.from(newSelection);
            }
        },
        clearStrainSelection: (state) => {
            state.selectedStrainIds = [];
        },
    },
});

export const {
    setStrainsViewState,
    setStrainsViewTab,
    setStrainsViewMode,
    toggleStrainSelection,
    toggleAllStrainSelection,
    clearStrainSelection,
} = strainsViewSlice.actions;

export default strainsViewSlice.reducer;
