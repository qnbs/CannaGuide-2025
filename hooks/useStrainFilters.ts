import { useMemo, useTransition, useCallback } from 'react';
import {
    Strain,
    SortKey,
    SortDirection,
    StrainType,
    DifficultyLevel,
    YieldLevel,
    HeightLevel,
    AppSettings,
    AdvancedFilterState,
} from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import {
    setSearchTerm,
    toggleTypeFilter,
    setShowFavoritesOnly,
    setAdvancedFilters,
    resetAllFilters as resetFiltersAction,
    setLetterFilter,
} from '@/stores/slices/filtersSlice';
import { selectFavoriteIds } from '@/stores/selectors';
import React from 'react';

export const useStrainFilters = (
    allStrains: Strain[],
    strainsViewSettings: AppSettings['strainsViewSettings']
) => {
    const dispatch = useAppDispatch();
    const { searchTerm, typeFilter, showFavoritesOnly, advancedFilters, letterFilter } =
        useAppSelector((state) => state.filters);
    const favorites = useAppSelector(selectFavoriteIds);

    const [sort, setSort] = React.useState<{ key: SortKey; direction: SortDirection }>({
        key: strainsViewSettings.defaultSortKey,
        direction: strainsViewSettings.defaultSortDirection,
    });
    const [isPending, startTransition] = useTransition();

    const handleSort = useCallback((key: SortKey) => {
        startTransition(() => {
            setSort((prev) => ({
                key,
                direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
            }));
        });
    }, []);

    const handleSetSearchTerm = useCallback(
        (term: string) => {
            startTransition(() => {
                dispatch(setSearchTerm(term));
            });
        },
        [dispatch]
    );

    const handleToggleTypeFilter = useCallback(
        (type: StrainType) => {
            dispatch(toggleTypeFilter(type));
        },
        [dispatch]
    );

    const handleSetAdvancedFilters = useCallback(
        (filters: Partial<AdvancedFilterState>) => {
            dispatch(setAdvancedFilters(filters));
        },
        [dispatch]
    );

    const handleSetLetterFilter = useCallback(
        (letter: string | null) => {
            dispatch(setLetterFilter(letter));
        },
        [dispatch]
    );

    const resetAllFilters = useCallback(() => {
        dispatch(resetFiltersAction());
    }, [dispatch]);

    const isAnyFilterActive = useMemo(() => {
        return (
            searchTerm.trim() !== '' ||
            typeFilter.length > 0 ||
            showFavoritesOnly ||
            letterFilter !== null ||
            advancedFilters.thcRange[0] > 0 ||
            advancedFilters.thcRange[1] < 35 ||
            advancedFilters.cbdRange[0] > 0 ||
            advancedFilters.cbdRange[1] < 20 ||
            advancedFilters.floweringRange[0] > 4 ||
            advancedFilters.floweringRange[1] < 20 ||
            advancedFilters.selectedDifficulties.length > 0 ||
            advancedFilters.selectedYields.length > 0 ||
            advancedFilters.selectedHeights.length > 0 ||
            advancedFilters.selectedAromas.length > 0 ||
            advancedFilters.selectedTerpenes.length > 0
        );
    }, [searchTerm, typeFilter, showFavoritesOnly, advancedFilters, letterFilter]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (advancedFilters.selectedAromas.length > 0) count++;
        if (advancedFilters.selectedTerpenes.length > 0) count++;
        if (advancedFilters.selectedDifficulties.length > 0) count++;
        if (advancedFilters.selectedYields.length > 0) count++;
        if (advancedFilters.selectedHeights.length > 0) count++;
        if (advancedFilters.thcRange[0] > 0 || advancedFilters.thcRange[1] < 35) count++;
        if (advancedFilters.cbdRange[0] > 0 || advancedFilters.cbdRange[1] < 20) count++;
        if (advancedFilters.floweringRange[0] > 4 || advancedFilters.floweringRange[1] < 20) count++;
        return count;
    }, [advancedFilters]);

    const filteredStrains = useMemo(() => {
        let strains = [...allStrains];

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            strains = strains.filter(
                (s) =>
                    s.name.toLowerCase().includes(lowerCaseSearch) ||
                    s.type.toLowerCase().includes(lowerCaseSearch) ||
                    (s.aromas || []).some((a) => a.toLowerCase().includes(lowerCaseSearch)) ||
                    (s.dominantTerpenes || []).some((t) =>
                        t.toLowerCase().includes(lowerCaseSearch)
                    ) ||
                    s.genetics?.toLowerCase().includes(lowerCaseSearch)
            );
        }

        if (showFavoritesOnly) strains = strains.filter((s) => favorites.has(s.id));

        const typeFilterSet = new Set(typeFilter);
        if (typeFilterSet.size > 0) {
            strains = strains.filter((s) => typeFilterSet.has(s.type));
        }

        if (letterFilter) {
            if (letterFilter === '#') {
                strains = strains.filter((s) => /^\d/.test(s.name));
            } else {
                strains = strains.filter((s) =>
                    s.name.toLowerCase().startsWith(letterFilter.toLowerCase())
                );
            }
        }

        const selectedDifficultiesSet = new Set(advancedFilters.selectedDifficulties);
        const selectedYieldsSet = new Set(advancedFilters.selectedYields);
        const selectedHeightsSet = new Set(advancedFilters.selectedHeights);
        const selectedAromasSet = new Set(advancedFilters.selectedAromas);
        const selectedTerpenesSet = new Set(advancedFilters.selectedTerpenes);

        strains = strains.filter(
            (s) =>
                s.thc >= advancedFilters.thcRange[0] &&
                s.thc <= advancedFilters.thcRange[1] &&
                s.cbd >= advancedFilters.cbdRange[0] &&
                s.cbd <= advancedFilters.cbdRange[1] &&
                s.floweringTime >= advancedFilters.floweringRange[0] &&
                s.floweringTime <= advancedFilters.floweringRange[1]
        );

        if (selectedDifficultiesSet.size > 0)
            strains = strains.filter((s) => selectedDifficultiesSet.has(s.agronomic.difficulty));
        if (selectedYieldsSet.size > 0)
            strains = strains.filter((s) => selectedYieldsSet.has(s.agronomic.yield));
        if (selectedHeightsSet.size > 0)
            strains = strains.filter((s) => selectedHeightsSet.has(s.agronomic.height));
        if (selectedAromasSet.size > 0)
            strains = strains.filter((s) =>
                (s.aromas || []).some((a) => selectedAromasSet.has(a))
            );
        if (selectedTerpenesSet.size > 0)
            strains = strains.filter((s) =>
                (s.dominantTerpenes || []).some((t) => selectedTerpenesSet.has(t))
            );

        strains.sort((a, b) => {
            const aVal = a[sort.key as keyof Strain] ?? a.agronomic[sort.key as keyof Strain['agronomic']];
            const bVal = b[sort.key as keyof Strain] ?? b.agronomic[sort.key as keyof Strain['agronomic']];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });

        return strains;
    }, [allStrains, searchTerm, showFavoritesOnly, typeFilter, advancedFilters, favorites, sort, letterFilter]);

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
        setAdvancedFilters: handleSetAdvancedFilters,
        letterFilter,
        handleSetLetterFilter,
        resetAllFilters,
        sort,
        handleSort,
        isAnyFilterActive,
        activeFilterCount,
    };
};