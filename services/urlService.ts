import { FiltersState } from '@/stores/slices/filtersSlice';
import { StrainType, DifficultyLevel, YieldLevel, HeightLevel, SortKey, SortDirection, AdvancedFilterState } from '@/types';
import { INITIAL_ADVANCED_FILTERS } from '@/constants';

const parseArray = (val: string | null): string[] => val ? val.split(',') : [];
const parseRange = (val: string | null): [number, number] | undefined => {
    if (!val) return undefined;
    const parts = val.split(',').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], parts[1]];
    }
    return undefined;
};

export const urlService = {
    serializeFiltersToQueryString(filters: FiltersState): string {
        const params = new URLSearchParams();

        if (filters.searchTerm) params.set('q', filters.searchTerm);
        if (filters.letterFilter) params.set('l', filters.letterFilter);
        if (filters.typeFilter.length > 0) params.set('t', filters.typeFilter.join(','));
        if (filters.showFavoritesOnly) params.set('fav', '1');

        // Advanced Filters - only add if not default
        if (filters.advancedFilters.thcRange[0] !== INITIAL_ADVANCED_FILTERS.thcRange[0] || filters.advancedFilters.thcRange[1] !== INITIAL_ADVANCED_FILTERS.thcRange[1]) {
            params.set('thc', filters.advancedFilters.thcRange.join(','));
        }
        if (filters.advancedFilters.cbdRange[0] !== INITIAL_ADVANCED_FILTERS.cbdRange[0] || filters.advancedFilters.cbdRange[1] !== INITIAL_ADVANCED_FILTERS.cbdRange[1]) {
            params.set('cbd', filters.advancedFilters.cbdRange.join(','));
        }
        if (filters.advancedFilters.floweringRange[0] !== INITIAL_ADVANCED_FILTERS.floweringRange[0] || filters.advancedFilters.floweringRange[1] !== INITIAL_ADVANCED_FILTERS.floweringRange[1]) {
            params.set('fr', filters.advancedFilters.floweringRange.join(','));
        }
        if (filters.advancedFilters.selectedDifficulties.length > 0) params.set('d', filters.advancedFilters.selectedDifficulties.join(','));
        if (filters.advancedFilters.selectedYields.length > 0) params.set('y', filters.advancedFilters.selectedYields.join(','));
        if (filters.advancedFilters.selectedHeights.length > 0) params.set('h', filters.advancedFilters.selectedHeights.join(','));
        if (filters.advancedFilters.selectedAromas.length > 0) params.set('a', filters.advancedFilters.selectedAromas.join(','));
        if (filters.advancedFilters.selectedTerpenes.length > 0) params.set('tp', filters.advancedFilters.selectedTerpenes.join(','));

        // Sort
        if (filters.sortKey !== 'name' || filters.sortDirection !== 'asc') {
             params.set('s', `${filters.sortKey}-${filters.sortDirection}`);
        }
        
        return params.toString();
    },

    parseQueryStringToFilterState(queryString: string): Partial<FiltersState> {
        const params = new URLSearchParams(queryString);
        const parsedState: Partial<FiltersState> & { advancedFilters?: Partial<AdvancedFilterState> } = {};

        if (params.has('q')) parsedState.searchTerm = params.get('q')!;
        if (params.has('l')) parsedState.letterFilter = params.get('l')!;
        if (params.has('t')) parsedState.typeFilter = parseArray(params.get('t')) as StrainType[];
        if (params.get('fav') === '1') parsedState.showFavoritesOnly = true;

        const advFilters: Partial<AdvancedFilterState> = {};
        const thcRange = parseRange(params.get('thc'));
        if (thcRange) advFilters.thcRange = thcRange;
        
        const cbdRange = parseRange(params.get('cbd'));
        if (cbdRange) advFilters.cbdRange = cbdRange;

        const frRange = parseRange(params.get('fr'));
        if (frRange) advFilters.floweringRange = frRange;
        
        if (params.has('d')) advFilters.selectedDifficulties = parseArray(params.get('d')) as DifficultyLevel[];
        if (params.has('y')) advFilters.selectedYields = parseArray(params.get('y')) as YieldLevel[];
        if (params.has('h')) advFilters.selectedHeights = parseArray(params.get('h')) as HeightLevel[];
        if (params.has('a')) advFilters.selectedAromas = parseArray(params.get('a'));
        if (params.has('tp')) advFilters.selectedTerpenes = parseArray(params.get('tp'));
        
        if (Object.keys(advFilters).length > 0) {
            parsedState.advancedFilters = advFilters as AdvancedFilterState;
        }
        
        if (params.has('s')) {
            const [key, dir] = params.get('s')!.split('-');
            parsedState.sortKey = key as SortKey;
            parsedState.sortDirection = dir as SortDirection;
        }

        return parsedState;
    }
};
