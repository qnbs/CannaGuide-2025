import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdvancedFilterState, DifficultyLevel, YieldLevel, HeightLevel, StrainType, SortKey, SortDirection } from '@/types';
import { INITIAL_ADVANCED_FILTERS } from '@/constants';

export interface FiltersState {
    searchTerm: string;
    typeFilter: StrainType[];
    showFavoritesOnly: boolean;
    advancedFilters: AdvancedFilterState;
    letterFilter: string | null;
    sortKey: SortKey;
    sortDirection: SortDirection;
}

const initialState: FiltersState = {
    searchTerm: '',
    typeFilter: [],
    showFavoritesOnly: false,
    advancedFilters: INITIAL_ADVANCED_FILTERS,
    letterFilter: null,
    sortKey: 'name',
    sortDirection: 'asc',
};

const filtersSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setFiltersState: (state, action: PayloadAction<FiltersState>) => {
            return action.payload;
        },
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
        setSort: (state, action: PayloadAction<{ key: SortKey; direction: SortDirection }>) => {
            state.sortKey = action.payload.key;
            state.sortDirection = action.payload.direction;
        },
        hydrateFilters: (state, action: PayloadAction<Partial<FiltersState>>) => {
            const { advancedFilters, ...rest } = action.payload;
            Object.assign(state, rest);
            if (advancedFilters) {
                state.advancedFilters = { ...state.advancedFilters, ...advancedFilters };
            }
        },
        resetAllFilters: (state) => {
            state.searchTerm = '';
            state.typeFilter = [];
            state.showFavoritesOnly = false;
            state.advancedFilters = INITIAL_ADVANCED_FILTERS;
            state.letterFilter = null;
            state.sortKey = 'name';
            state.sortDirection = 'asc';
        },
    },
});

export const {
    setFiltersState,
    setSearchTerm,
    toggleTypeFilter,
    setShowFavoritesOnly,
    setAdvancedFilters,
    resetAllFilters,
    setLetterFilter,
    setSort,
    hydrateFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
