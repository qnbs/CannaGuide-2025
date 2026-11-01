import { useMemo, useCallback } from 'react'
import { Strain, SortKey, StrainType, AppSettings, AdvancedFilterState } from '@/types'
import { useAppSelector } from '@/stores/store'
import { useFiltersStore } from '@/stores/useFiltersStore'
import { selectFavoriteIds, selectUserStrainIds } from '@/stores/selectors'
import React from 'react'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'
import { compareStrains, getSafeStrainType, measurementInRange } from '@/hooks/strainFilterSort'

const getSafeText = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback
const getSafeStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const matchesSearch = (strain: Strain, term: string): boolean => {
    const haystack = [
        getSafeText(strain.name, 'Unknown Strain'),
        getSafeStrainType(strain.type),
        ...getSafeStringArray(strain.aromas),
        ...getSafeStringArray(strain.dominantTerpenes),
        getSafeText(strain.genetics, ''),
    ]
    return haystack.some((entry) => entry.toLowerCase().includes(term))
}

const applySearch = (strains: Strain[], term: string): Strain[] => {
    if (!term) return strains
    return strains.filter((strain) => matchesSearch(strain, term.toLowerCase()))
}

const applyFavorites = (
    strains: Strain[],
    onlyFavorites: boolean,
    favorites: Set<string>,
): Strain[] => {
    if (!onlyFavorites) return strains
    return strains.filter((strain) => favorites.has(strain.id))
}

const applyTypes = (strains: Strain[], types: Strain['type'][]): Strain[] => {
    if (types.length === 0) return strains
    return strains.filter((strain) => types.includes(strain.type))
}

const matchesLetter = (name: string, letter: string): boolean => {
    if (letter === '#') return /^\d/.test(name)
    return name.toLowerCase().startsWith(letter.toLowerCase())
}

const applyLetter = (strains: Strain[], letter: string | null): Strain[] => {
    if (!letter) return strains
    return strains.filter((strain) => matchesLetter(getSafeText(strain.name, ''), letter))
}

const allowsValue = (selected: Set<string>, value: string | undefined): boolean =>
    selected.size === 0 || (value !== undefined && selected.has(value))

const overlaps = (selected: Set<string>, values: string[]): boolean =>
    selected.size === 0 || values.some((value) => selected.has(value))

const measurementsPass = (strain: Strain, filters: AdvancedFilterState): boolean =>
    measurementInRange(strain.thc, filters.thcRange, INITIAL_ADVANCED_FILTERS.thcRange) &&
    measurementInRange(strain.cbd, filters.cbdRange, INITIAL_ADVANCED_FILTERS.cbdRange) &&
    measurementInRange(
        strain.floweringTime,
        filters.floweringRange,
        INITIAL_ADVANCED_FILTERS.floweringRange,
    )

const agronomicField = (
    strain: Strain,
    key: 'difficulty' | 'yield' | 'height',
): string | undefined => strain.agronomic?.[key]

const agronomyPass = (strain: Strain, filters: AdvancedFilterState): boolean =>
    allowsValue(new Set(filters.selectedDifficulties), agronomicField(strain, 'difficulty')) &&
    allowsValue(new Set(filters.selectedYields), agronomicField(strain, 'yield')) &&
    allowsValue(new Set(filters.selectedHeights), agronomicField(strain, 'height'))

const sensoryPass = (strain: Strain, filters: AdvancedFilterState): boolean =>
    overlaps(new Set(filters.selectedAromas), getSafeStringArray(strain.aromas)) &&
    overlaps(new Set(filters.selectedTerpenes), getSafeStringArray(strain.dominantTerpenes))

const passesAdvanced = (strain: Strain, filters: AdvancedFilterState): boolean =>
    measurementsPass(strain, filters) &&
    agronomyPass(strain, filters) &&
    sensoryPass(strain, filters)

const defaultStrainsViewSettings: AppSettings['strainsView'] = {
    defaultSortKey: 'name',
    defaultSortDirection: 'asc',
    defaultViewMode: 'list',
    strainsPerPage: 25,
    visibleColumns: ['type', 'thc', 'cbd', 'floweringTime'],
    prioritizeUserStrains: true,
    genealogyDefaultDepth: 2,
    genealogyDefaultLayout: 'horizontal',
    aiTipsDefaultFocus: 'overall',
    aiTipsDefaultExperience: 'advanced',
}

export const useStrainFilters = (
    allStrains: Strain[],
    strainsViewSettings?: AppSettings['strainsView'],
) => {
    const safeSettings = strainsViewSettings ?? defaultStrainsViewSettings
    const {
        searchTerm,
        typeFilter,
        showFavoritesOnly,
        advancedFilters,
        letterFilter,
        sortKey,
        sortDirection,
        setSearchTerm,
        toggleTypeFilter: storeToggleTypeFilter,
        setShowFavoritesOnly: storeSetShowFavoritesOnly,
        setAdvancedFilters: storeSetAdvancedFilters,
        setLetterFilter: storeSetLetterFilter,
        setSort: storeSetSort,
        resetAllFilters: storeResetAllFilters,
    } = useFiltersStore()
    const favorites = useAppSelector(selectFavoriteIds)
    const userStrainIds = useAppSelector(selectUserStrainIds)
    const [isPending, startTransition] = React.useTransition()

    const handleSort = useCallback(
        (key: SortKey) => {
            startTransition(() => {
                const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
                storeSetSort({ key, direction: newDirection })
            })
        },
        [sortKey, sortDirection, storeSetSort],
    )

    const handleSetSearchTerm = useCallback(
        (term: string) => {
            startTransition(() => {
                setSearchTerm(term)
            })
        },
        [setSearchTerm],
    )

    const handleToggleTypeFilter = useCallback(
        (type: StrainType) => {
            storeToggleTypeFilter(type)
        },
        [storeToggleTypeFilter],
    )

    const handleSetAdvancedFilters = useCallback(
        (filters: Partial<AdvancedFilterState>) => {
            storeSetAdvancedFilters(filters)
        },
        [storeSetAdvancedFilters],
    )

    const handleSetLetterFilter = useCallback(
        (letter: string | null) => {
            storeSetLetterFilter(letter)
        },
        [storeSetLetterFilter],
    )

    const resetAllFilters = useCallback(() => {
        storeResetAllFilters()
    }, [storeResetAllFilters])

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
        )
    }, [searchTerm, typeFilter, showFavoritesOnly, advancedFilters, letterFilter])

    const activeFilterCount = useMemo(() => {
        let count = 0
        if (advancedFilters.selectedAromas.length > 0) count++
        if (advancedFilters.selectedTerpenes.length > 0) count++
        if (advancedFilters.selectedDifficulties.length > 0) count++
        if (advancedFilters.selectedYields.length > 0) count++
        if (advancedFilters.selectedHeights.length > 0) count++
        if (
            advancedFilters.thcRange[0] > INITIAL_ADVANCED_FILTERS.thcRange[0] ||
            advancedFilters.thcRange[1] < INITIAL_ADVANCED_FILTERS.thcRange[1]
        )
            count++
        if (
            advancedFilters.cbdRange[0] > INITIAL_ADVANCED_FILTERS.cbdRange[0] ||
            advancedFilters.cbdRange[1] < INITIAL_ADVANCED_FILTERS.cbdRange[1]
        )
            count++
        if (
            advancedFilters.floweringRange[0] > INITIAL_ADVANCED_FILTERS.floweringRange[0] ||
            advancedFilters.floweringRange[1] < INITIAL_ADVANCED_FILTERS.floweringRange[1]
        )
            count++
        return count
    }, [advancedFilters])

    const filteredStrains = useMemo(() => {
        const present = allStrains.filter((strain): strain is Strain => Boolean(strain))
        const searched = applySearch(present, searchTerm)
        const favored = applyFavorites(searched, showFavoritesOnly, favorites)
        const typed = applyTypes(favored, typeFilter)
        const lettered = applyLetter(typed, letterFilter)
        const advanced = lettered.filter((strain) => passesAdvanced(strain, advancedFilters))
        return advanced.toSorted((left, right) =>
            compareStrains(left, right, {
                key: sortKey,
                direction: sortDirection,
                prioritize: safeSettings.prioritizeUserStrains,
                userStrainIds,
                favorites,
            }),
        )
    }, [
        allStrains,
        searchTerm,
        showFavoritesOnly,
        typeFilter,
        advancedFilters,
        favorites,
        userStrainIds,
        safeSettings.prioritizeUserStrains,
        sortKey,
        sortDirection,
        letterFilter,
    ])

    return {
        filteredStrains,
        isSearching: isPending,
        searchTerm,
        setSearchTerm: handleSetSearchTerm,
        typeFilter,
        handleToggleTypeFilter,
        showFavoritesOnly,
        setShowFavoritesOnly: storeSetShowFavoritesOnly,
        advancedFilters,
        setAdvancedFilters: handleSetAdvancedFilters,
        letterFilter,
        handleSetLetterFilter,
        resetAllFilters,
        sort: { key: sortKey, direction: sortDirection },
        handleSort,
        isAnyFilterActive,
        activeFilterCount,
    }
}
