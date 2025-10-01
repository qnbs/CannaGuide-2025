import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdvancedFilterState, DifficultyLevel, YieldLevel, HeightLevel, StrainType } from '@/types';

export interface FiltersState {
    searchTerm: string;
    typeFilter: StrainType[];
    showFavoritesOnly: boolean;
    advancedFilters: AdvancedFilterState;
    letterFilter: string | null;
}

export const initialAdvancedFilters: AdvancedFilterState = {
    thcRange: [0, 35],
    cbdRange: [0, 20],
    floweringRange: [4, 20],
    selectedDifficulties: [],
    selectedYields: [],
    selectedHeights: [],
    selectedAromas: [],
    selectedTerpenes: [],
};

const initialState: FiltersState = {
    searchTerm: '',
    typeFilter: [],
    showFavoritesOnly: false,
    advancedFilters: initialAdvancedFilters,
    letterFilter: null,
};

const filtersSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
        },
        toggleTypeFilter: (state, action: PayloadAction<StrainType>) => {
            const type = action.payload;
            const index = state.typeFilter.indexOf(type);
            if (index > -1) {
                state.typeFilter.splice(index, 1);
            } else {
                state.typeFilter.push(type);
            }
        },
        setShowFavoritesOnly: (state, action: PayloadAction<boolean>) => {
            state.showFavoritesOnly = action.payload;
        },
        setAdvancedFilters: (state, action: PayloadAction<Partial<AdvancedFilterState>>) => {
            state.advancedFilters = { ...state.advancedFilters, ...action.payload };
        },
        setLetterFilter: (state, action: PayloadAction<string | null>) => {
            state.letterFilter = state.letterFilter === action.payload ? null : action.payload;
        },
        resetAllFilters: (state) => {
            state.searchTerm = '';
            state.typeFilter = [];
            state.showFavoritesOnly = false;
            state.advancedFilters = initialAdvancedFilters;
            state.letterFilter = null;
        },
    },
});

export const {
    setSearchTerm,
    toggleTypeFilter,
    setShowFavoritesOnly,
    setAdvancedFilters,
    resetAllFilters,
    setLetterFilter,
} = filtersSlice.actions;

export default filtersSlice.reducer;