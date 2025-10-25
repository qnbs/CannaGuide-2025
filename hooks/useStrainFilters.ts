import { useMemo, useCallback } from 'react';
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
    setSort,
} from '@/stores/slices/filtersSlice';
import { selectFavoriteIds, selectUserStrainIds } from '@/stores/selectors';
import React from 'react';
import { INITIAL_ADVANCED_FILTERS } from '@/constants';

const difficultyOrder: Record<DifficultyLevel, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
const yieldOrder: Record<YieldLevel, number> = { 'Low': 1, 'Medium': 2, 'High': 3 };
const heightOrder: Record<HeightLevel, number> = { 'Short': 1, 'Medium': 2, 'Tall': 3 };

export const useStrainFilters = (
    allStrains: Strain[],
    strainsViewSettings: AppSettings['strainsView']
) => {
    const dispatch = useAppDispatch();
    const { searchTerm, typeFilter, showFavoritesOnly, advancedFilters, letterFilter, sortKey, sortDirection } =
        useAppSelector((state) => state.filters);
    const favorites = useAppSelector(selectFavoriteIds);
    const userStrainIds = useAppSelector(selectUserStrainIds);
    const [isPending, startTransition] = React.useTransition();

    const handleSort = useCallback((key: SortKey) => {
        startTransition(() => {
            const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
            dispatch(setSort({ key, direction: newDirection }));
        });
    }, [dispatch, sortKey, sortDirection]);

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
            advancedFilters.thcRange[0] > INITIAL_ADVANCED_FILTERS.thcRange[0] ||
            advancedFilters.thcRange[1] < INITIAL_ADVANCED_FILTERS.thcRange[1] ||
            advancedFilters.cbdRange[0] > INITIAL_ADVANCED_FILTERS.cbdRange[0] ||
            advancedFilters.cbdRange[1] < INITIAL_ADVANCED_FILTERS.cbdRange[1] ||
            advancedFilters.floweringRange[0] > INITIAL_ADVANCED_FILTERS.floweringRange[0] ||
            advancedFilters.floweringRange[1] < INITIAL_ADVANCED_FILTERS.floweringRange[1] ||
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
        if (advancedFilters.thcRange[0] > INITIAL_ADVANCED_FILTERS.thcRange[0] || advancedFilters.thcRange[1] < INITIAL_ADVANCED_FILTERS.thcRange[1]) count++;
        if (advancedFilters.cbdRange[0] > INITIAL_ADVANCED_FILTERS.cbdRange[0] || advancedFilters.cbdRange[1] < INITIAL_ADVANCED_FILTERS.cbdRange[1]) count++;
        if (advancedFilters.floweringRange[0] > INITIAL_ADVANCED_FILTERS.floweringRange[0] || advancedFilters.floweringRange[1] < INITIAL_ADVANCED_FILTERS.floweringRange[1]) count++;
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

        if (typeFilter.length > 0) {
            strains = strains.filter((s) => typeFilter.includes(s.type));
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

        strains = strains.filter(s => 
            (s.thc >= advancedFilters.thcRange[0] && s.thc <= advancedFilters.thcRange[1]) &&
            (s.cbd >= advancedFilters.cbdRange[0] && s.cbd <= advancedFilters.cbdRange[1]) &&
            (s.floweringTime >= advancedFilters.floweringRange[0] && s.floweringTime <= advancedFilters.floweringRange[1]) &&
            (selectedDifficultiesSet.size === 0 || selectedDifficultiesSet.has(s.agronomic.difficulty)) &&
            (selectedYieldsSet.size === 0 || selectedYieldsSet.has(s.agronomic.yield)) &&
            (selectedHeightsSet.size === 0 || selectedHeightsSet.has(s.agronomic.height)) &&
            (selectedAromasSet.size === 0 || (s.aromas || []).some(a => selectedAromasSet.has(a))) &&
            (selectedTerpenesSet.size === 0 || (s.dominantTerpenes || []).some(t => selectedTerpenesSet.has(t)))
        );

        strains.sort((a, b) => {
            if (strainsViewSettings.prioritizeUserStrains) {
                const aIsPriority = userStrainIds.has(a.id) || favorites.has(a.id);
                const bIsPriority = userStrainIds.has(b.id) || favorites.has(b.id);
                if (aIsPriority && !bIsPriority) return -1;
                if (!aIsPriority && bIsPriority) return 1;
            }

            let comparison = 0;
            const key = sortKey;

            switch (key) {
                case 'difficulty':
                    comparison = difficultyOrder[a.agronomic.difficulty] - difficultyOrder[b.agronomic.difficulty];
                    break;
                case 'yield':
                    comparison = yieldOrder[a.agronomic.yield] - yieldOrder[b.agronomic.yield];
                    break;
                case 'height':
                    comparison = heightOrder[a.agronomic.height] - heightOrder[b.agronomic.height];
                    break;
                case 'name':
                case 'type':
                    comparison = a[key].localeCompare(b[key]);
                    break;
                case 'thc':
                case 'cbd':
                case 'floweringTime':
                    comparison = a[key] - b[key];
                    break;
                default:
                    return 0;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return strains;
    }, [allStrains, searchTerm, showFavoritesOnly, typeFilter, advancedFilters, favorites, userStrainIds, strainsViewSettings.prioritizeUserStrains, sortKey, sortDirection, letterFilter]);

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
        sort: { key: sortKey, direction: sortDirection },
        handleSort,
        isAnyFilterActive,
        activeFilterCount,
    };
};