import { useState, useMemo, useEffect, useCallback } from 'react';
import { Strain, SortDirection, YieldLevel, DifficultyLevel, HeightLevel, StrainType } from '@/types';

export type SortKey = 'name' | 'difficulty' | 'type' | 'thc' | 'cbd' | 'floweringTime' | 'yield';

interface SortOption {
    key: SortKey;
    direction: SortDirection;
}

const difficultyValues: Record<DifficultyLevel, number> = { Easy: 1, Medium: 2, Hard: 3 };
const yieldValues: Record<YieldLevel, number> = { Low: 1, Medium: 2, High: 3 };

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

export interface AdvancedFilterState {
    thcRange: [number, number];
    cbdRange: [number, number];
    floweringRange: [number, number];
    selectedDifficulties: Set<DifficultyLevel>;
    selectedYields: Set<YieldLevel>;
    selectedHeights: Set<HeightLevel>;
    selectedAromas: Set<string>;
    selectedTerpenes: Set<string>;
}

interface QuickFilterState {
    searchTerm: string;
    showFavorites: boolean;
    typeFilter: Set<StrainType>;
}

export const defaultAdvancedFilters: AdvancedFilterState = {
    thcRange: [0, 35], cbdRange: [0, 20], floweringRange: [6, 16],
    selectedDifficulties: new Set(), selectedYields: new Set(), selectedHeights: new Set(),
    selectedAromas: new Set(), selectedTerpenes: new Set(),
};

export const useStrainFilters = (
    allStrains: Strain[],
    favoriteIds: Set<string>,
    defaultSort: SortOption,
    quickFilters: QuickFilterState
) => {
    const [sort, setSort] = useState<SortOption>(defaultSort);
    const [appliedFilters, setAppliedFilters] = useState<AdvancedFilterState>(defaultAdvancedFilters);
    const [draftFilters, setDraftFilters] = useState<AdvancedFilterState>(defaultAdvancedFilters);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const debouncedSearchTerm = useDebounce(quickFilters.searchTerm, 300);

    const filterFunction = useCallback((strain: Strain, currentQuickFilters: QuickFilterState, currentAdvancedFilters: AdvancedFilterState): boolean => {
        // Quick Filters
        if (currentQuickFilters.showFavorites && !favoriteIds.has(strain.id)) return false;
        if (debouncedSearchTerm && !strain.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) return false;
        if (currentQuickFilters.typeFilter.size > 0 && !currentQuickFilters.typeFilter.has(strain.type)) return false;

        // Advanced Filters
        if (strain.thc < currentAdvancedFilters.thcRange[0] || strain.thc > currentAdvancedFilters.thcRange[1]) return false;
        if (strain.cbd < currentAdvancedFilters.cbdRange[0] || strain.cbd > currentAdvancedFilters.cbdRange[1]) return false;
        if (strain.floweringTime < currentAdvancedFilters.floweringRange[0] || strain.floweringTime > currentAdvancedFilters.floweringRange[1]) return false;
        if (currentAdvancedFilters.selectedDifficulties.size > 0 && !currentAdvancedFilters.selectedDifficulties.has(strain.agronomic.difficulty)) return false;
        if (currentAdvancedFilters.selectedYields.size > 0 && !currentAdvancedFilters.selectedYields.has(strain.agronomic.yield)) return false;
        if (currentAdvancedFilters.selectedHeights.size > 0 && !currentAdvancedFilters.selectedHeights.has(strain.agronomic.height)) return false;
        if (currentAdvancedFilters.selectedAromas.size > 0 && !(strain.aromas || []).some(a => currentAdvancedFilters.selectedAromas.has(a))) return false;
        if (currentAdvancedFilters.selectedTerpenes.size > 0 && !(strain.dominantTerpenes || []).some(t => currentAdvancedFilters.selectedTerpenes.has(t))) return false;

        return true;
    }, [favoriteIds, debouncedSearchTerm]);

    const sortFunction = useCallback((a: Strain, b: Strain) => {
        const { key, direction } = sort;
        let valA: string | number, valB: string | number;
        switch (key) {
            case 'name': case 'type': valA = a[key]; valB = b[key]; return String(valA).localeCompare(String(valB));
            case 'difficulty': valA = difficultyValues[a.agronomic.difficulty]; valB = difficultyValues[b.agronomic.difficulty]; break;
            case 'yield': valA = yieldValues[a.agronomic.yield]; valB = yieldValues[b.agronomic.yield]; break;
            default: valA = a[key as 'thc' | 'cbd' | 'floweringTime']; valB = b[key as 'thc' | 'cbd' | 'floweringTime'];
        }
        const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
        return direction === 'asc' ? comparison : -comparison;
    }, [sort]);

    const strainsForDisplay = useMemo(() => {
        const filtersToApply = isDrawerOpen ? draftFilters : appliedFilters;
        return allStrains.filter(strain => filterFunction(strain, quickFilters, filtersToApply)).sort(sortFunction);
    }, [allStrains, quickFilters, appliedFilters, draftFilters, isDrawerOpen, filterFunction, sortFunction]);

    const previewCount = useMemo(() => {
        return allStrains.filter(strain => filterFunction(strain, quickFilters, draftFilters)).length;
    }, [allStrains, quickFilters, draftFilters, filterFunction]);

    const handleSort = useCallback((key: SortKey) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    }, []);

    const openDrawer = useCallback(() => {
        setDraftFilters(appliedFilters);
        setIsDrawerOpen(true);
    }, [appliedFilters]);

    const closeAndApply = useCallback(() => {
        setAppliedFilters(draftFilters);
        setIsDrawerOpen(false);
    }, [draftFilters]);

    const closeAndDiscard = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    const resetAllFilters = useCallback(() => {
        setAppliedFilters(defaultAdvancedFilters);
        setDraftFilters(defaultAdvancedFilters);
    }, []);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (appliedFilters.thcRange[0] !== defaultAdvancedFilters.thcRange[0] || appliedFilters.thcRange[1] !== defaultAdvancedFilters.thcRange[1]) count++;
        if (appliedFilters.cbdRange[0] !== defaultAdvancedFilters.cbdRange[0] || appliedFilters.cbdRange[1] !== defaultAdvancedFilters.cbdRange[1]) count++;
        if (appliedFilters.floweringRange[0] !== defaultAdvancedFilters.floweringRange[0] || appliedFilters.floweringRange[1] !== defaultAdvancedFilters.floweringRange[1]) count++;
        count += appliedFilters.selectedDifficulties.size > 0 ? 1 : 0;
        count += appliedFilters.selectedYields.size > 0 ? 1 : 0;
        count += appliedFilters.selectedHeights.size > 0 ? 1 : 0;
        count += appliedFilters.selectedAromas.size > 0 ? 1 : 0;
        count += appliedFilters.selectedTerpenes.size > 0 ? 1 : 0;
        return count;
    }, [appliedFilters]);

    return {
        sort, handleSort,
        isDrawerOpen, openDrawer, closeAndApply, closeAndDiscard,
        appliedFilters, draftFilters, setDraftFilters,
        strainsForDisplay, previewCount,
        resetAllFilters, activeFilterCount,
    };
};