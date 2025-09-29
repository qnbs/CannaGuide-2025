// FIX: Add missing React import.
import React, { useMemo, useTransition, useCallback } from 'react';
// FIX: Import AdvancedFilterState type.
import { Strain, SortKey, SortDirection, StrainType, DifficultyLevel, YieldLevel, HeightLevel, AppSettings, AdvancedFilterState } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setSearchTerm, toggleTypeFilter, setShowFavoritesOnly, setAdvancedFilters, resetAllFilters as resetFiltersAction } from '@/stores/slices/filtersSlice';
import { selectFavoriteIds } from '@/stores/selectors';

export const useStrainFilters = (
    allStrains: Strain[],
    strainsViewSettings: AppSettings['strainsViewSettings']
) => {
    const dispatch = useAppDispatch();
    const { searchTerm, typeFilter, showFavoritesOnly, advancedFilters } = useAppSelector(state => state.filters);
    const favorites = useAppSelector(selectFavoriteIds);

    const [sort, setSort] = React.useState<{ key: SortKey; direction: SortDirection }>({
        key: strainsViewSettings.defaultSortKey,
        direction: strainsViewSettings.defaultSortDirection,
    });
    const [isPending, startTransition] = useTransition();

    const handleSort = useCallback((key: SortKey) => {
        startTransition(() => {
            setSort(prev => ({
                key,
                direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
            }));
        });
    }, []);
    
    const handleSetSearchTerm = useCallback((term: string) => {
        startTransition(() => {
            dispatch(setSearchTerm(term));
        });
    }, [dispatch]);
    
    const handleToggleTypeFilter = useCallback((type: StrainType) => {
        dispatch(toggleTypeFilter(type));
    }, [dispatch]);

    const resetAllFilters = useCallback(() => {
        dispatch(resetFiltersAction());
    }, [dispatch]);

    const isAnyFilterActive = useMemo(() => {
        return searchTerm.trim() !== '' ||
            typeFilter.size > 0 ||
            showFavoritesOnly ||
            advancedFilters.thcRange[0] > 0 || advancedFilters.thcRange[1] < 35 ||
            advancedFilters.cbdRange[0] > 0 || advancedFilters.cbdRange[1] < 20 ||
            advancedFilters.floweringRange[0] > 4 || advancedFilters.floweringRange[1] < 20 ||
            advancedFilters.selectedDifficulties.size > 0 ||
            advancedFilters.selectedYields.size > 0 ||
            advancedFilters.selectedHeights.size > 0 ||
            advancedFilters.selectedAromas.size > 0 ||
            advancedFilters.selectedTerpenes.size > 0;
    }, [searchTerm, typeFilter, showFavoritesOnly, advancedFilters]);
    
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (advancedFilters.selectedAromas.size > 0) count++;
        if (advancedFilters.selectedTerpenes.size > 0) count++;
        if (advancedFilters.selectedDifficulties.size > 0) count++;
        if (advancedFilters.selectedYields.size > 0) count++;
        if (advancedFilters.selectedHeights.size > 0) count++;
        if (advancedFilters.thcRange[0] > 0 || advancedFilters.thcRange[1] < 35) count++;
        if (advancedFilters.cbdRange[0] > 0 || advancedFilters.cbdRange[1] < 20) count++;
        if (advancedFilters.floweringRange[0] > 4 || advancedFilters.floweringRange[1] < 20) count++;
        return count;
    }, [advancedFilters]);

    const filteredStrains = useMemo(() => {
        let strains = [...allStrains];
        
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            strains = strains.filter(s =>
                s.name.toLowerCase().includes(lowerCaseSearch) ||
                s.type.toLowerCase().includes(lowerCaseSearch) ||
                (s.aromas || []).some(a => a.toLowerCase().includes(lowerCaseSearch)) ||
                (s.dominantTerpenes || []).some(t => t.toLowerCase().includes(lowerCaseSearch)) ||
                s.genetics?.toLowerCase().includes(lowerCaseSearch)
            );
        }

        if (showFavoritesOnly) strains = strains.filter(s => favorites.has(s.id));
        if (typeFilter.size > 0) strains = strains.filter(s => typeFilter.has(s.type));
        
        strains = strains.filter(s =>
            s.thc >= advancedFilters.thcRange[0] && s.thc <= advancedFilters.thcRange[1] &&
            s.cbd >= advancedFilters.cbdRange[0] && s.cbd <= advancedFilters.cbdRange[1] &&
            s.floweringTime >= advancedFilters.floweringRange[0] && s.floweringTime <= advancedFilters.floweringRange[1]
        );

        if (advancedFilters.selectedDifficulties.size > 0) strains = strains.filter(s => advancedFilters.selectedDifficulties.has(s.agronomic.difficulty));
        if (advancedFilters.selectedYields.size > 0) strains = strains.filter(s => advancedFilters.selectedYields.has(s.agronomic.yield));
        if (advancedFilters.selectedHeights.size > 0) strains = strains.filter(s => advancedFilters.selectedHeights.has(s.agronomic.height));
        if (advancedFilters.selectedAromas.size > 0) strains = strains.filter(s => (s.aromas || []).some(a => advancedFilters.selectedAromas.has(a)));
        if (advancedFilters.selectedTerpenes.size > 0) strains = strains.filter(s => (s.dominantTerpenes || []).some(t => advancedFilters.selectedTerpenes.has(t)));
        
        strains.sort((a, b) => {
            const aVal = a[sort.key] ?? a.agronomic[sort.key as keyof Strain['agronomic']];
            const bVal = b[sort.key] ?? b.agronomic[sort.key as keyof Strain['agronomic']];
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });

        return strains;

    }, [allStrains, searchTerm, showFavoritesOnly, typeFilter, advancedFilters, favorites, sort]);

    return {
        filteredStrains,
        isSearching: isPending,
        searchTerm,
        setSearchTerm: handleSetSearchTerm,
        typeFilter,
        handleToggleTypeFilter,
        showFavoritesOnly,
        setShowFavoritesOnly: (value: boolean) => dispatch(setShowFavoritesOnly(value)),
        advancedFilters,
        setAdvancedFilters: (updater: (prev: AdvancedFilterState) => Partial<AdvancedFilterState>) => dispatch(setAdvancedFilters(updater(advancedFilters))),
        resetAllFilters,
        sort,
        handleSort,
        isAnyFilterActive,
        activeFilterCount,
    };
};