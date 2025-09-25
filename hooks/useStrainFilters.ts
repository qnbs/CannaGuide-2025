import { useState, useMemo, useCallback, useDeferredValue, useEffect } from 'react';
import { Strain, StrainType, DifficultyLevel, YieldLevel, HeightLevel, SortKey, SortDirection, AppSettings } from '@/types';
import { dbService } from '@/services/dbService';

export interface AdvancedFilterState {
    thcRange: [number, number];
    cbdRange: [number, number];
    floweringRange: [number, number];
    selectedDifficulties: Set<DifficultyLevel>;
    selectedYields: Set<YieldLevel>;
    selectedHeights: Set<HeightLevel>;
    selectedTerpenes: Set<string>;
    selectedAromas: Set<string>;
}

const defaultAdvancedFilters: AdvancedFilterState = {
    thcRange: [0, 50],
    cbdRange: [0, 25],
    floweringRange: [4, 20],
    selectedDifficulties: new Set(),
    selectedYields: new Set(),
    selectedHeights: new Set(),
    selectedTerpenes: new Set(),
    selectedAromas: new Set(),
};

const getYieldSortValue = (yieldDetailsIndoor: string) => {
    if (!yieldDetailsIndoor) return 0;
    const match = yieldDetailsIndoor.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
};

const tokenizeQuery = (query: string): string[] => {
    return query
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2); // Same logic as indexer
};

export const useStrainFilters = (
    allStrains: Strain[],
    settings: AppSettings['strainsViewSettings']
) => {
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [typeFilter, setTypeFilter] = useState<Set<StrainType>>(new Set());
    const [sort, setSort] = useState<{ key: SortKey, direction: SortDirection }>({ key: settings.defaultSortKey, direction: settings.defaultSortDirection });
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(defaultAdvancedFilters);

    const [searchedIds, setSearchedIds] = useState<Set<string> | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (deferredSearchTerm.trim()) {
                setIsSearching(true);
                const tokens = tokenizeQuery(deferredSearchTerm);
                const ids = await dbService.searchIndex(tokens);
                setSearchedIds(ids);
                setIsSearching(false);
            } else {
                setSearchedIds(null); // No search term, so don't filter by IDs
            }
        };
        performSearch();
    }, [deferredSearchTerm]);

    const filteredStrains = useMemo(() => {
        let strains = [...allStrains];

        // Search term filter (using deferred value for non-blocking UI)
        if (searchedIds !== null) {
            strains = strains.filter(s => searchedIds.has(s.id));
        }

        // Type filter
        if (typeFilter.size > 0) {
            strains = strains.filter(s => typeFilter.has(s.type));
        }

        // Advanced filters
        strains = strains.filter(s => {
            const { thcRange, cbdRange, floweringRange, selectedDifficulties, selectedYields, selectedHeights, selectedTerpenes, selectedAromas } = advancedFilters;
            if (s.thc < thcRange[0] || s.thc > thcRange[1]) return false;
            if (s.cbd < cbdRange[0] || s.cbd > cbdRange[1]) return false;
            if (s.floweringTime < floweringRange[0] || s.floweringTime > floweringRange[1]) return false;
            if (selectedDifficulties.size > 0 && !selectedDifficulties.has(s.agronomic.difficulty)) return false;
            if (selectedYields.size > 0 && !selectedYields.has(s.agronomic.yield)) return false;
            if (selectedHeights.size > 0 && !selectedHeights.has(s.agronomic.height)) return false;
            if (selectedTerpenes.size > 0 && !(s.dominantTerpenes || []).some(t => selectedTerpenes.has(t))) return false;
            if (selectedAromas.size > 0 && !(s.aromas || []).some(a => selectedAromas.has(a))) return false;
            return true;
        });

        // Sorting
        strains.sort((a, b) => {
            const aVal = sort.key === 'yield' ? getYieldSortValue(a.agronomic.yieldDetails?.indoor || '') : a[sort.key as keyof Strain] ?? a.agronomic[sort.key as keyof Strain['agronomic']];
            const bVal = sort.key === 'yield' ? getYieldSortValue(b.agronomic.yieldDetails?.indoor || '') : b[sort.key as keyof Strain] ?? b.agronomic[sort.key as keyof Strain['agronomic']];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });

        return strains;
    }, [allStrains, searchedIds, typeFilter, advancedFilters, sort]);

    const handleSort = useCallback((key: SortKey) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);
    
    const handleToggleTypeFilter = useCallback((type: StrainType) => {
        setTypeFilter(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) newSet.delete(type);
            else newSet.add(type);
            return newSet;
        });
    }, []);

    const resetAllFilters = useCallback(() => {
        setSearchTerm('');
        setShowFavoritesOnly(false);
        setTypeFilter(new Set());
        setAdvancedFilters(defaultAdvancedFilters);
    }, []);
    
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (typeFilter.size > 0) count++;
        if (advancedFilters.selectedDifficulties.size > 0) count++;
        if (advancedFilters.selectedYields.size > 0) count++;
        if (advancedFilters.selectedHeights.size > 0) count++;
        if (advancedFilters.selectedTerpenes.size > 0) count++;
        if (advancedFilters.selectedAromas.size > 0) count++;
        // Ranges are not counted as they are always active
        return count;
    }, [typeFilter, advancedFilters]);

    const isAnyFilterActive = useMemo(() => {
      return (
        searchTerm !== '' ||
        showFavoritesOnly ||
        typeFilter.size > 0 ||
        activeFilterCount > 0
      );
    }, [searchTerm, showFavoritesOnly, typeFilter, activeFilterCount]);

    return {
        searchTerm, setSearchTerm,
        showFavoritesOnly, setShowFavoritesOnly,
        typeFilter, setTypeFilter, handleToggleTypeFilter,
        sort, handleSort,
        advancedFilters, setAdvancedFilters,
        defaultAdvancedFilters,
        filteredStrains,
        resetAllFilters,
        activeFilterCount,
        isAnyFilterActive,
        isSearching,
    };
};
