import { describe, expect, it } from 'vitest'
import { StrainType, type DifficultyLevel, type Strain } from '@/types'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'
import { computeDrawerFilterCount, getRangeValue } from './strainsViewHelpers'

const strain = (patch: Partial<Strain> & { id: string; name: string }): Strain => ({
    type: StrainType.Hybrid,
    floweringType: 'Photoperiod',
    thc: 18,
    cbd: 1,
    floweringTime: 9,
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1.5,
        vpdTolerance: { min: 0.8, max: 1.4 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
    ...patch,
})

const option = <T>(value: T | undefined, fallback: T): T => value ?? fallback

const countOf = (
    strains: Strain[],
    patch: Partial<{
        searchTerm: string
        showFavoritesOnly: boolean
        typeFilter: string[]
        letterFilter: string | null
        favoriteIds: Set<string>
        thcRange: [number, number]
        selectedDifficulties: DifficultyLevel[]
    }> = {},
): number => {
    const tempFilterState = { ...INITIAL_ADVANCED_FILTERS }
    if (patch.thcRange !== undefined) tempFilterState.thcRange = patch.thcRange
    if (patch.selectedDifficulties !== undefined) {
        tempFilterState.selectedDifficulties = patch.selectedDifficulties
    }
    return computeDrawerFilterCount(strains, {
        searchTerm: option(patch.searchTerm, ''),
        showFavoritesOnly: option(patch.showFavoritesOnly, false),
        typeFilter: option(patch.typeFilter, []),
        letterFilter: option(patch.letterFilter, null),
        favoriteIds: option(patch.favoriteIds, new Set<string>()),
        tempFilterState,
    })
}

describe('getRangeValue', () => {
    it('keeps a finite pair, including an explicit zero', () => {
        expect(getRangeValue([0, 12], [0, 35])).toEqual([0, 12])
    })

    it('falls back when either end is missing or not finite', () => {
        expect(getRangeValue(undefined, [0, 35])).toEqual([0, 35])
        expect(getRangeValue([Number.NaN, 10], [0, 35])).toEqual([0, 35])
    })
})

describe('computeDrawerFilterCount', () => {
    const alpha = strain({ id: 'alpha', name: 'Alpha', aromas: ['Citrus'] })
    const beta = strain({
        id: 'beta',
        name: 'Beta',
        thc: 0,
        agronomic: { difficulty: 'Easy', yield: 'Low', height: 'Short' },
    })
    const numbered = strain({ id: 'numbered', name: '1-Up', thc: Number.NaN })

    it('counts every strain when the drawer filters are still at their defaults', () => {
        expect(countOf([alpha, beta, numbered])).toBe(3)
    })

    it('matches a search against name or aroma and keeps an explicit zero THC', () => {
        expect(countOf([alpha, beta], { searchTerm: 'citrus' })).toBe(1)
        expect(countOf([alpha, beta], { searchTerm: 'beta' })).toBe(1)
    })

    it('filters favorites, letters, and a selected difficulty independently', () => {
        expect(
            countOf([alpha, beta], { showFavoritesOnly: true, favoriteIds: new Set(['beta']) }),
        ).toBe(1)
        expect(countOf([alpha, numbered], { letterFilter: '#' })).toBe(1)
        expect(countOf([alpha, beta], { selectedDifficulties: ['Easy'] })).toBe(1)
    })

    it('drops an unreported THC only after the THC window moves off the default', () => {
        expect(countOf([numbered], { thcRange: [10, 20] })).toBe(0)
        expect(countOf([beta], { thcRange: [0, 1] })).toBe(1)
    })
})
