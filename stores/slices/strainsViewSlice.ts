import { StrainViewTab } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StrainsViewState {
    strainsViewTab: StrainViewTab;
    strainsViewMode: 'list' | 'grid';
    selectedStrainIds: string[];
    selectedStrainId: string | null;
}

const initialState: StrainsViewState = {
    strainsViewTab: StrainViewTab.All,
    strainsViewMode: 'list',
    selectedStrainIds: [],
    selectedStrainId: null,
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
            state.selectedStrainId = null;
        },
        setSelectedStrainId: (state, action: PayloadAction<string | null>) => {
            state.selectedStrainId = action.payload;
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
        toggleAllStrainSelection: (state, action: PayloadAction<{ ids: string[] }>) => {
            const { ids } = action.payload;
            const currentSelection = new Set(state.selectedStrainIds);
            const areAllSelected = ids.every(id => currentSelection.has(id));

            if (areAllSelected) {
                // If all are selected, deselect them
                ids.forEach(id => currentSelection.delete(id));
            } else {
                // If any are not selected, select them all
                ids.forEach(id => currentSelection.add(id));
            }
            state.selectedStrainIds = Array.from(currentSelection);
        },
        clearStrainSelection: (state) => {
            state.selectedStrainIds = [];
        },
    },
});

export const {
    setStrainsViewState,
    setStrainsViewTab,
    setSelectedStrainId,
    setStrainsViewMode,
    toggleStrainSelection,
    toggleAllStrainSelection,
    clearStrainSelection,
} = strainsViewSlice.actions;

export default strainsViewSlice.reducer;