import type { TFunction } from 'i18next'
import type { Strain, AdvancedFilterState, DifficultyLevel, YieldLevel, HeightLevel } from '@/types'
import { StrainViewTab } from '@/types'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'
import { compareText } from '@/components/views/strains/compareText'
import { getSafeStrainType, measurementInRange } from '@/hooks/strainFilterSort'

export { getSafeStrainType, measurementInRange }

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

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

const isFinitePair = (range: unknown): range is [number, number] => {
    if (!Array.isArray(range) || range.length !== 2) return false
    return isFiniteNumber(range[0]) && isFiniteNumber(range[1])
}

export const getRangeValue = (
    range: [number, number] | undefined,
    fallback: [number, number],
): [number, number] => (isFinitePair(range) ? range : fallback)

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

const matchesSearchTerm = (strain: Strain, searchTerm: string): boolean => {
    const query = searchTerm.toLowerCase()
    const haystack = [
        getSafeText(strain.name, 'Unknown Strain'),
        getSafeStrainType(strain.type),
        getSafeText(strain.genetics, ''),
        ...getSafeStringArray(strain.aromas),
        ...getSafeStringArray(strain.dominantTerpenes),
    ]
    return haystack.some((entry) => entry.toLowerCase().includes(query))
}

const matchesLetter = (name: string, letterFilter: string): boolean => {
    if (letterFilter === '#') return /^\d/.test(name)
    return name.toLowerCase().startsWith(letterFilter.toLowerCase())
}

const namedLetter = (letterFilter: string | null): string | undefined => {
    if (letterFilter === null || letterFilter === '') return undefined
    return letterFilter
}

const applyLetterFilter = (strains: Strain[], letterFilter: string | null): Strain[] => {
    const letter = namedLetter(letterFilter)
    if (letter === undefined) return strains
    return strains.filter((strain) => matchesLetter(getSafeText(strain.name, ''), letter))
}

const applyTextFilters = (
    strains: Strain[],
    searchTerm: string,
    showFavoritesOnly: boolean,
    typeFilter: string[],
    letterFilter: string | null,
    favoriteIds: Set<string>,
): Strain[] => {
    let next = strains
    if (searchTerm !== '') {
        next = next.filter((strain) => matchesSearchTerm(strain, searchTerm))
    }
    if (showFavoritesOnly) {
        next = next.filter((strain) => favoriteIds.has(strain.id))
    }
    if (typeFilter.length > 0) {
        next = next.filter((strain) => typeFilter.includes(strain.type))
    }
    return applyLetterFilter(next, letterFilter)
}

const levelSelected = <T extends string>(selected: ReadonlySet<T>, value: T | undefined): boolean =>
    selected.size === 0 || (value !== undefined && selected.has(value))

const tokenSelected = (selected: ReadonlySet<string>, values: readonly string[]): boolean =>
    selected.size === 0 || values.some((value) => selected.has(value))

const chemistryInRange = (
    strain: Strain,
    thcRange: [number, number],
    cbdRange: [number, number],
    floweringRange: [number, number],
): boolean =>
    measurementInRange(strain.thc, thcRange, INITIAL_ADVANCED_FILTERS.thcRange) &&
    measurementInRange(strain.cbd, cbdRange, INITIAL_ADVANCED_FILTERS.cbdRange) &&
    measurementInRange(
        strain.floweringTime,
        floweringRange,
        INITIAL_ADVANCED_FILTERS.floweringRange,
    )

const agronomySelected = (
    strain: Strain,
    difficulties: ReadonlySet<DifficultyLevel>,
    yields: ReadonlySet<YieldLevel>,
    heights: ReadonlySet<HeightLevel>,
): boolean =>
    levelSelected(difficulties, strain.agronomic?.difficulty) &&
    levelSelected(yields, strain.agronomic?.yield) &&
    levelSelected(heights, strain.agronomic?.height)

const tokensSelected = (
    strain: Strain,
    aromas: ReadonlySet<string>,
    terpenes: ReadonlySet<string>,
): boolean =>
    tokenSelected(aromas, getSafeStringArray(strain.aromas)) &&
    tokenSelected(terpenes, getSafeStringArray(strain.dominantTerpenes))

const passesDrawerFilters = (
    strain: Strain,
    thcRange: [number, number],
    cbdRange: [number, number],
    floweringRange: [number, number],
    difficulties: ReadonlySet<DifficultyLevel>,
    yields: ReadonlySet<YieldLevel>,
    heights: ReadonlySet<HeightLevel>,
    aromas: ReadonlySet<string>,
    terpenes: ReadonlySet<string>,
): boolean =>
    chemistryInRange(strain, thcRange, cbdRange, floweringRange) &&
    agronomySelected(strain, difficulties, yields, heights) &&
    tokensSelected(strain, aromas, terpenes)

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
    const thcRange = getRangeValue(tempFilterState.thcRange, INITIAL_ADVANCED_FILTERS.thcRange)
    const cbdRange = getRangeValue(tempFilterState.cbdRange, INITIAL_ADVANCED_FILTERS.cbdRange)
    const floweringRange = getRangeValue(
        tempFilterState.floweringRange,
        INITIAL_ADVANCED_FILTERS.floweringRange,
    )
    const narrowed = applyTextFilters(
        strainsForCurrentTab,
        searchTerm,
        showFavoritesOnly,
        typeFilter,
        letterFilter,
        favoriteIds,
    )
    return narrowed.filter((strain) =>
        passesDrawerFilters(
            strain,
            thcRange,
            cbdRange,
            floweringRange,
            new Set(tempFilterState.selectedDifficulties),
            new Set(tempFilterState.selectedYields),
            new Set(tempFilterState.selectedHeights),
            new Set(tempFilterState.selectedAromas),
            new Set(tempFilterState.selectedTerpenes),
        ),
    ).length
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
