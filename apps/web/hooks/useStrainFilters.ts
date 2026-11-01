import { useMemo, useCallback } from 'react'
import {
    Strain,
    SortKey,
    StrainType,
    DifficultyLevel,
    YieldLevel,
    HeightLevel,
    AppSettings,
    AdvancedFilterState,
} from '@/types'
import { useAppSelector } from '@/stores/store'
import { useFiltersStore } from '@/stores/useFiltersStore'
import { selectFavoriteIds, selectUserStrainIds } from '@/stores/selectors'
import React from 'react'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'

const difficultyOrder: Record<DifficultyLevel, number> = { Easy: 1, Medium: 2, Hard: 3 }
const yieldOrder: Record<YieldLevel, number> = { Low: 1, Medium: 2, High: 3 }
const heightOrder: Record<HeightLevel, number> = { Short: 1, Medium: 2, Tall: 3 }
const getSafeText = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback
const getSafeStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const getSafeNumericValue = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

const getSafeStrainType = (value: unknown): string =>
    value === StrainType.Sativa || value === StrainType.Indica || value === StrainType.Hybrid
        ? value
        : ''

const measurementInRange = (
    value: unknown,
    range: [number, number],
    initial: [number, number],
): boolean => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value >= range[0] && value <= range[1]
    }
    return range[0] === initial[0] && range[1] === initial[1]
}

const reportedRank = (order: Record<string, number>, value: string | undefined): number =>
    value !== undefined && Object.prototype.hasOwnProperty.call(order, value)
        ? order[value]!
        : Number.POSITIVE_INFINITY

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
        let strains = allStrains.filter((strain): strain is Strain => Boolean(strain))

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase()
            strains = strains.filter(
                (s) =>
                    getSafeText(s.name, 'Unknown Strain').toLowerCase().includes(lowerCaseSearch) ||
                    getSafeStrainType(s.type).toLowerCase().includes(lowerCaseSearch) ||
                    getSafeStringArray(s.aromas).some((a) =>
                        a.toLowerCase().includes(lowerCaseSearch),
                    ) ||
                    getSafeStringArray(s.dominantTerpenes).some((t) =>
                        t.toLowerCase().includes(lowerCaseSearch),
                    ) ||
                    getSafeText(s.genetics, '').toLowerCase().includes(lowerCaseSearch),
            )
        }

        if (showFavoritesOnly) strains = strains.filter((s) => favorites.has(s.id))

        if (typeFilter.length > 0) {
            strains = strains.filter((s) => typeFilter.includes(s.type))
        }

        if (letterFilter) {
            if (letterFilter === '#') {
                strains = strains.filter((s) => /^\d/.test(getSafeText(s.name, '')))
            } else {
                strains = strains.filter((s) =>
                    getSafeText(s.name, '').toLowerCase().startsWith(letterFilter.toLowerCase()),
                )
            }
        }

        const selectedDifficultiesSet = new Set(advancedFilters.selectedDifficulties)
        const selectedYieldsSet = new Set(advancedFilters.selectedYields)
        const selectedHeightsSet = new Set(advancedFilters.selectedHeights)
        const selectedAromasSet = new Set(advancedFilters.selectedAromas)
        const selectedTerpenesSet = new Set(advancedFilters.selectedTerpenes)

        strains = strains.filter(
            (s) =>
                measurementInRange(
                    s.thc,
                    advancedFilters.thcRange,
                    INITIAL_ADVANCED_FILTERS.thcRange,
                ) &&
                measurementInRange(
                    s.cbd,
                    advancedFilters.cbdRange,
                    INITIAL_ADVANCED_FILTERS.cbdRange,
                ) &&
                measurementInRange(
                    s.floweringTime,
                    advancedFilters.floweringRange,
                    INITIAL_ADVANCED_FILTERS.floweringRange,
                ) &&
                (selectedDifficultiesSet.size === 0 ||
                    (s.agronomic?.difficulty !== undefined &&
                        selectedDifficultiesSet.has(s.agronomic.difficulty))) &&
                (selectedYieldsSet.size === 0 ||
                    (s.agronomic?.yield !== undefined &&
                        selectedYieldsSet.has(s.agronomic.yield))) &&
                (selectedHeightsSet.size === 0 ||
                    (s.agronomic?.height !== undefined &&
                        selectedHeightsSet.has(s.agronomic.height))) &&
                (selectedAromasSet.size === 0 ||
                    getSafeStringArray(s.aromas).some((a) => selectedAromasSet.has(a))) &&
                (selectedTerpenesSet.size === 0 ||
                    getSafeStringArray(s.dominantTerpenes).some((t) => selectedTerpenesSet.has(t))),
        )

        strains = strains.toSorted((a, b) => {
            if (safeSettings.prioritizeUserStrains) {
                const aIsPriority = userStrainIds.has(a.id) || favorites.has(a.id)
                const bIsPriority = userStrainIds.has(b.id) || favorites.has(b.id)
                if (aIsPriority && !bIsPriority) return -1
                if (!aIsPriority && bIsPriority) return 1
            }

            let comparison = 0
            const key = sortKey

            switch (key) {
                case 'difficulty':
                    comparison =
                        reportedRank(difficultyOrder, a.agronomic?.difficulty) -
                        reportedRank(difficultyOrder, b.agronomic?.difficulty)
                    break
                case 'yield':
                    comparison =
                        reportedRank(yieldOrder, a.agronomic?.yield) -
                        reportedRank(yieldOrder, b.agronomic?.yield)
                    break
                case 'height':
                    comparison =
                        reportedRank(heightOrder, a.agronomic?.height) -
                        reportedRank(heightOrder, b.agronomic?.height)
                    break
                case 'name':
                case 'type':
                    comparison = getSafeText(a[key], '').localeCompare(getSafeText(b[key], ''))
                    break
                case 'thc':
                case 'cbd':
                case 'floweringTime': {
                    const left = getSafeNumericValue(a[key], Number.NaN)
                    const right = getSafeNumericValue(b[key], Number.NaN)
                    const leftKnown = Number.isFinite(left)
                    const rightKnown = Number.isFinite(right)
                    if (!leftKnown || !rightKnown) {
                        if (leftKnown === rightKnown) return 0
                        return leftKnown ? -1 : 1
                    }
                    comparison = left - right
                    break
                }
                default:
                    return 0
            }

            return sortDirection === 'asc' ? comparison : -comparison
        })

        return strains
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
