import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdvancedFilterState, DifficultyLevel, YieldLevel, HeightLevel, StrainType } from '@/types';

export interface FiltersState {
    searchTerm: string;
    typeFilter: Set<StrainType>;
    showFavoritesOnly: boolean;
    advancedFilters: AdvancedFilterState;
}

export const initialAdvancedFilters: AdvancedFilterState = {
    thcRange: [0, 35],
    cbdRange: [0, 20],
    floweringRange: [4, 20],
    selectedDifficulties: new Set(),
    selectedYields: new Set(),
    selectedHeights: new Set(),
    selectedAromas: new Set(),
    selectedTerpenes: new Set(),
};

const initialState: FiltersState = {
    searchTerm: '',
    typeFilter: new Set(),
    showFavoritesOnly: false,
    advancedFilters: initialAdvancedFilters,
};

const filtersSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
        },
        toggleTypeFilter: (state, action: PayloadAction<StrainType>) => {
            const newSet = new Set(state.typeFilter);
            if (newSet.has(action.payload)) {
                newSet.delete(action.payload);
            } else {
                newSet.add(action.payload);
            }
            state.typeFilter = newSet;
        },
        setShowFavoritesOnly: (state, action: PayloadAction<boolean>) => {
            state.showFavoritesOnly = action.payload;
        },
        setAdvancedFilters: (state, action: PayloadAction<Partial<AdvancedFilterState>>) => {
            state.advancedFilters = { ...state.advancedFilters, ...action.payload };
        },
        setAdvancedFilter: (state, action: PayloadAction<{ filter: keyof AdvancedFilterState, value: any }>) => {
            const { filter, value } = action.payload;
            if (filter === 'selectedAromas' || filter === 'selectedTerpenes' || filter === 'selectedDifficulties' || filter === 'selectedYields' || filter === 'selectedHeights') {
                const currentSet = new Set(state.advancedFilters[filter] as Set<string>);
                if (currentSet.has(value)) {
                    currentSet.delete(value);
                } else {
                    currentSet.add(value);
                }
                (state.advancedFilters as any)[filter] = currentSet;
            } else {
                 (state.advancedFilters as any)[filter] = value;
            }
        },
        resetAllFilters: (state) => {
            state.searchTerm = '';
            state.typeFilter = new Set();
            state.showFavoritesOnly = false;
            state.advancedFilters = initialAdvancedFilters;
        },
    },
});

export const {
    setSearchTerm,
    toggleTypeFilter,
    setShowFavoritesOnly,
    setAdvancedFilters,
    setAdvancedFilter,
    resetAllFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
