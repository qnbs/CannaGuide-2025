import type { TFunction } from 'i18next'
import type { Strain, AdvancedFilterState } from '@/types'
import { StrainViewTab } from '@/types'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'
import { compareText } from '@/components/views/strains/compareText'

export const DEFAULT_AGRONOMIC = {
    difficulty: 'Medium',
    yield: 'Medium',
    height: 'Medium',
} as const

export const getSafeText = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback

export const getSafeStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

export const getSafeNumericValue = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

export const getSafeStrainType = (value: unknown): string =>
    typeof value === 'string' ? value : 'Hybrid'

export const getRangeValue = (
    range: [number, number] | undefined,
    fallback: [number, number],
): [number, number] => {
    if (
        Array.isArray(range) &&
        range.length === 2 &&
        typeof range[0] === 'number' &&
        Number.isFinite(range[0]) &&
        typeof range[1] === 'number' &&
        Number.isFinite(range[1])
    ) {
        return range
    }

    return fallback
}

export const getSafeAgronomic = (strain: Strain) => strain.agronomic ?? DEFAULT_AGRONOMIC

export const getExportSourceTranslationKey = (
    source: 'selected' | 'all',
    count: number,
): string => {
    if (source === 'selected') {
        if (count === 1) {
            return 'strainsView.exportModal.sources.selected_one'
        }
        return 'strainsView.exportModal.sources.selected_other'
    }

    if (count === 1) {
        return 'strainsView.exportModal.sources.all_one'
    }
    return 'strainsView.exportModal.sources.all_other'
}

export const computeDrawerFilterCount = (
    strainsForCurrentTab: Strain[],
    {
        searchTerm,
        showFavoritesOnly,
        typeFilter,
        letterFilter,
        favoriteIds,
        tempFilterState,
    }: {
        searchTerm: string
        showFavoritesOnly: boolean
        typeFilter: string[]
        letterFilter: string | null
        favoriteIds: Set<string>
        tempFilterState: AdvancedFilterState
    },
): number => {
    let strains = [...strainsForCurrentTab]
    const thcRange = getRangeValue(tempFilterState.thcRange, INITIAL_ADVANCED_FILTERS.thcRange)
    const cbdRange = getRangeValue(tempFilterState.cbdRange, INITIAL_ADVANCED_FILTERS.cbdRange)
    const floweringRange = getRangeValue(
        tempFilterState.floweringRange,
        INITIAL_ADVANCED_FILTERS.floweringRange,
    )

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
    if (showFavoritesOnly) {
        strains = strains.filter((s) => favoriteIds.has(s.id))
    }
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

    const difficulties = new Set(tempFilterState.selectedDifficulties)
    const yields = new Set(tempFilterState.selectedYields)
    const heights = new Set(tempFilterState.selectedHeights)
    const aromas = new Set(tempFilterState.selectedAromas)
    const terpenes = new Set(tempFilterState.selectedTerpenes)

    strains = strains.filter(
        (s) =>
            getSafeNumericValue(s.thc, 0) >= thcRange[0] &&
            getSafeNumericValue(s.thc, 0) <= thcRange[1] &&
            getSafeNumericValue(s.cbd, 0) >= cbdRange[0] &&
            getSafeNumericValue(s.cbd, 0) <= cbdRange[1] &&
            getSafeNumericValue(s.floweringTime, 0) >= floweringRange[0] &&
            getSafeNumericValue(s.floweringTime, 0) <= floweringRange[1] &&
            (difficulties.size === 0 || difficulties.has(getSafeAgronomic(s).difficulty)) &&
            (yields.size === 0 || yields.has(getSafeAgronomic(s).yield)) &&
            (heights.size === 0 || heights.has(getSafeAgronomic(s).height)) &&
            (aromas.size === 0 || getSafeStringArray(s.aromas).some((a) => aromas.has(a))) &&
            (terpenes.size === 0 ||
                getSafeStringArray(s.dominantTerpenes).some((t) => terpenes.has(t))),
    )

    return strains.length
}

export const computeStrainsForCurrentTab = (
    strainsViewTab: StrainViewTab,
    allStrains: Strain[],
    userStrains: Strain[],
    favoriteIds: Set<string>,
): Strain[] => {
    const safeAllStrains = allStrains.filter((strain): strain is Strain => Boolean(strain))
    const safeUserStrains = userStrains.filter((strain): strain is Strain => Boolean(strain))
    switch (strainsViewTab) {
        case StrainViewTab.MyStrains:
            return safeUserStrains
        case StrainViewTab.Favorites:
            return safeAllStrains.filter((s) => favoriteIds.has(s.id))
        case StrainViewTab.All:
        default:
            return safeAllStrains
    }
}

export const computeSortedAromasAndTerpenes = (
    allStrains: Strain[],
    t: TFunction,
): { allAromas: string[]; allTerpenes: string[] } => {
    const aromaSet = new Set<string>()
    const terpeneSet = new Set<string>()

    allStrains
        .filter((strain): strain is Strain => Boolean(strain))
        .forEach((strain) => {
            getSafeStringArray(strain.aromas).forEach((aroma) => aromaSet.add(aroma))
            getSafeStringArray(strain.dominantTerpenes).forEach((terpene) =>
                terpeneSet.add(terpene),
            )
        })

    return {
        allAromas: Array.from(aromaSet).toSorted((a, b) =>
            compareText(
                t(`common.aromas.${a}`, { defaultValue: a }),
                t(`common.aromas.${b}`, { defaultValue: b }),
            ),
        ),
        allTerpenes: Array.from(terpeneSet).toSorted((a, b) =>
            compareText(
                t(`common.terpenes.${a}`, { defaultValue: a }),
                t(`common.terpenes.${b}`, { defaultValue: b }),
            ),
        ),
    }
}

export const getStrainsViewTitles = (
    t: TFunction,
    savedTipsCount: number,
    savedExportsCount: number,
): Record<StrainViewTab, string> => ({
    [StrainViewTab.All]: t('strainsView.tabs.allStrains'),
    [StrainViewTab.MyStrains]: t('strainsView.tabs.myStrains'),
    [StrainViewTab.Favorites]: t('strainsView.tabs.favorites'),
    [StrainViewTab.DailyStrains]: t('strainsView.tabs.dailyStrains'),
    [StrainViewTab.Comparison]: t('strainsView.tabs.comparison'),
    [StrainViewTab.Genealogy]: t('strainsView.tabs.genealogy'),
    [StrainViewTab.BreedingLab]: t('strainsView.tabs.breedingLab'),
    [StrainViewTab.SeedVault]: t('strainsView.tabs.seedVault'),
    [StrainViewTab.Exports]: t('strainsView.tabs.exports', { count: savedExportsCount }),
    [StrainViewTab.Tips]: t('strainsView.tabs.tips', { count: savedTipsCount }),
    [StrainViewTab.Trends]: t('strainsView.tabs.trends'),
})
