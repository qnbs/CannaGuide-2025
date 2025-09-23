import { useState, useMemo, useEffect, useCallback } from 'react';
import { Strain, SortDirection, YieldLevel, DifficultyLevel, HeightLevel, StrainType } from '@/types';

export type SortKey = 'name' | 'difficulty' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'yield';

interface SortOption {
    key: SortKey;
    direction: SortDirection;
}

const difficultyValues: Record<DifficultyLevel, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
};

const yieldValues: Record<YieldLevel, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
};

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// Advanced filter state shape
export interface AdvancedFilterState {
    typeFilter: Set<StrainType>;
    thcRange: [number, number];
    cbdRange: [number, number];
    floweringRange: [number, number];
    selectedDifficulties: Set<DifficultyLevel>;
    selectedYields: Set<YieldLevel>;
    selectedHeights: Set<HeightLevel>;
    selectedAromas: Set<string>;
    selectedTerpenes: Set<string>;
}

// Full filter state shape
interface FilterState extends AdvancedFilterState {
    searchTerm: string;
    showFavorites: boolean;
    sort: SortOption;
}

// FIX: Export the default filter state so it can be used externally to reset the temporary filter state.
export const defaultAdvancedFilters: AdvancedFilterState = {
    thcRange: [0, 35],
    cbdRange: [0, 20],
    floweringRange: [6, 16],
    selectedDifficulties: new Set(),
    selectedYields: new Set(),
    selectedHeights: new Set(),
    selectedAromas: new Set(),
    selectedTerpenes: new Set(),
    typeFilter: new Set(),
};


export const useStrainFilters = (strainsToDisplay: Strain[], favoriteIds: Set<string>, defaultSort: SortOption) => {
    const [filterState, setFilterState] = useState<FilterState>({
        searchTerm: '',
        showFavorites: false,
        sort: defaultSort,
        ...defaultAdvancedFilters,
    });
    
    const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);
    const [tempFilterState, setTempFilterState] = useState<AdvancedFilterState>(defaultAdvancedFilters);

    const debouncedSearchTerm = useDebounce(filterState.searchTerm, 300);

    const applyFilters = useCallback((strains: Strain[], filters: Partial<FilterState> & AdvancedFilterState) => {
        return strains.filter(strain => {
            // Basic filters from main state
            if (filters.showFavorites && !favoriteIds.has(strain.id)) return false;
            
            const searchTerm = filters.searchTerm === undefined ? debouncedSearchTerm : filters.searchTerm;
            if (searchTerm && !strain.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            
            // Advanced filters
            if (filters.typeFilter.size > 0 && !filters.typeFilter.has(strain.type)) return false;
            if (strain.thc < filters.thcRange[0] || strain.thc > filters.thcRange[1]) return false;
            if (strain.cbd < filters.cbdRange[0] || strain.cbd > filters.cbdRange[1]) return false;
            if (strain.floweringTime < filters.floweringRange[0] || strain.floweringTime > filters.floweringRange[1]) return false;
            if (filters.selectedDifficulties.size > 0 && !filters.selectedDifficulties.has(strain.agronomic.difficulty)) return false;
            if (filters.selectedYields.size > 0 && !filters.selectedYields.has(strain.agronomic.yield)) return false;
            if (filters.selectedHeights.size > 0 && !filters.selectedHeights.has(strain.agronomic.height)) return false;
            if (filters.selectedAromas.size > 0 && !(strain.aromas || []).some(a => filters.selectedAromas.has(a))) return false;
            if (filters.selectedTerpenes.size > 0 && !(strain.dominantTerpenes || []).some(t => filters.selectedTerpenes.has(t))) return false;

            return true;
        });
    }, [debouncedSearchTerm, favoriteIds]);
    
    const sortedAndFilteredStrains = useMemo(() => {
        let filtered = applyFilters(strainsToDisplay, filterState);

        const { key, direction } = filterState.sort;
        const sorted = [...filtered].sort((a, b) => {
            let valA: string | number, valB: string | number;
            switch (key) {
                case 'name':
                case 'type':
                    valA = a[key];
                    valB = b[key];
                    return String(valA).localeCompare(String(valB));
                case 'difficulty':
                    valA = difficultyValues[a.agronomic.difficulty];
                    valB = difficultyValues[b.agronomic.difficulty];
                    break;
                case 'yield':
                    valA = yieldValues[a.agronomic.yield];
                    valB = yieldValues[b.agronomic.yield];
                    break;
                default:
                    valA = a[key as 'thc' | 'cbd' | 'floweringTime'];
                    valB = b[key as 'thc' | 'cbd' | 'floweringTime'];
            }
             if (valA < valB) return -1;
             if (valA > valB) return 1;
             return 0;
        });
        
        if (direction === 'desc') {
            sorted.reverse();
        }

        return sorted;
    }, [strainsToDisplay, filterState, applyFilters]);
    
    const previewFilteredStrains = useMemo(() => {
        // Preview uses the temp state for advanced filters but the current state for search/favorites
        return applyFilters(strainsToDisplay, { ...filterState, ...tempFilterState, searchTerm: filterState.searchTerm });
    }, [strainsToDisplay, filterState, tempFilterState, applyFilters]);


    const handleSort = useCallback((key: SortKey) => {
        setFilterState(prev => {
            const newDirection = prev.sort.key === key && prev.sort.direction === 'asc' ? 'desc' : 'asc';
            return { ...prev, sort: { key, direction: newDirection } };
        });
    }, []);

    const toggleTypeFilter = useCallback((type: StrainType) => {
        setFilterState(prev => {
            const newTypes = new Set(prev.typeFilter);
            if (newTypes.has(type)) {
                newTypes.delete(type);
            } else {
                newTypes.add(type);
            }
            return { ...prev, typeFilter: newTypes };
        });
    }, []);

    const filterControls = useMemo(() => ({
        setSearchTerm: (term: string) => setFilterState(prev => ({...prev, searchTerm: term })),
        setShowFavorites: (show: boolean) => setFilterState(prev => ({...prev, showFavorites: show })),
        handleSort,
        toggleTypeFilter,
    }), [handleSort, toggleTypeFilter]);
    
    const openAdvancedFilterModal = () => {
        setTempFilterState({
            typeFilter: new Set(filterState.typeFilter),
            thcRange: filterState.thcRange,
            cbdRange: filterState.cbdRange,
            floweringRange: filterState.floweringRange,
            selectedDifficulties: new Set(filterState.selectedDifficulties),
            selectedYields: new Set(filterState.selectedYields),
            selectedHeights: new Set(filterState.selectedHeights),
            selectedAromas: new Set(filterState.selectedAromas),
            selectedTerpenes: new Set(filterState.selectedTerpenes),
        });
        setIsAdvancedFilterModalOpen(true);
    };

    const handleApplyAdvancedFilters = () => {
        setFilterState(prev => ({ ...prev, ...tempFilterState }));
        setIsAdvancedFilterModalOpen(false);
    };

    const resetAdvancedFilters = useCallback(() => {
        setTempFilterState(defaultAdvancedFilters);
        setFilterState(prev => ({...prev, ...defaultAdvancedFilters}));
    }, []);
    
    const activeFilterCount = useMemo(() => {
        let count = 0;
        const stateToCheck = filterState;
        const defaults = defaultAdvancedFilters;
        if (stateToCheck.thcRange[0] !== defaults.thcRange[0] || stateToCheck.thcRange[1] !== defaults.thcRange[1]) count++;
        if (stateToCheck.cbdRange[0] !== defaults.cbdRange[0] || stateToCheck.cbdRange[1] !== defaults.cbdRange[1]) count++;
        if (stateToCheck.floweringRange[0] !== defaults.floweringRange[0] || stateToCheck.floweringRange[1] !== defaults.floweringRange[1]) count++;
        if (stateToCheck.selectedDifficulties.size > 0) count++;
        if (stateToCheck.selectedYields.size > 0) count++;
        if (stateToCheck.selectedHeights.size > 0) count++;
        if (stateToCheck.selectedAromas.size > 0) count++;
        if (stateToCheck.selectedTerpenes.size > 0) count++;
        count += stateToCheck.typeFilter.size;
        return count;
    }, [filterState]);

    return {
        sortedAndFilteredStrains,
        filterControls,
        filterState,
        isAdvancedFilterModalOpen,
        setIsAdvancedFilterModalOpen,
        tempFilterState,
        setTempFilterState,
        previewFilteredStrains,
        openAdvancedFilterModal,
        handleApplyAdvancedFilters,
        resetAdvancedFilters,
        activeFilterCount,
    };
};
