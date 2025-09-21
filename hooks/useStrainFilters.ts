import { useState, useMemo, useEffect, useCallback } from 'react';
import { Strain, SortDirection, YieldLevel, DifficultyLevel, HeightLevel, StrainType } from '../types';

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
interface AdvancedFilterState {
    typeFilter: 'All' | StrainType;
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

const defaultAdvancedFilters: AdvancedFilterState = {
    typeFilter: 'All',
    thcRange: [0, 35],
    cbdRange: [0, 20],
    floweringRange: [6, 16],
    selectedDifficulties: new Set(),
    selectedYields: new Set(),
    selectedHeights: new Set(),
    selectedAromas: new Set(),
    selectedTerpenes: new Set(),
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

    const applyFilters = (strains: Strain[], filters: Partial<FilterState> & AdvancedFilterState) => {
        return strains.filter(strain => {
            // Basic filters
            if (filters.showFavorites && !favoriteIds.has(strain.id)) return false;
            
            const searchTerm = filters.searchTerm || debouncedSearchTerm;
            if (searchTerm && !strain.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            
            // Advanced filters
            if (filters.typeFilter !== 'All' && strain.type !== filters.typeFilter) return false;
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
    };
    
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
                    return valA.localeCompare(valB as string);
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
    }, [strainsToDisplay, debouncedSearchTerm, filterState, favoriteIds]);
    
    const previewFilteredStrains = useMemo(() => {
        // Preview uses the temp state for advanced filters but the current state for search/favorites
        return applyFilters(strainsToDisplay, { ...filterState, ...tempFilterState, searchTerm: filterState.searchTerm });
    }, [strainsToDisplay, filterState.searchTerm, filterState.showFavorites, tempFilterState, favoriteIds]);


    const handleSort = useCallback((key: SortKey) => {
        setFilterState(prev => {
            const newDirection = prev.sort.key === key && prev.sort.direction === 'asc' ? 'desc' : 'asc';
            return { ...prev, sort: { key, direction: newDirection } };
        });
    }, []);

    const filterControls = useMemo(() => ({
        setSearchTerm: (term: string) => setFilterState(prev => ({...prev, searchTerm: term })),
        setShowFavorites: (show: boolean) => setFilterState(prev => ({...prev, showFavorites: show })),
        handleSort,
    }), [handleSort]);
    
    const openAdvancedFilterModal = () => {
        setTempFilterState({
            typeFilter: filterState.typeFilter,
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
    };
};
