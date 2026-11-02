import { describe, expect, it } from 'vitest'
import type { Strain } from '@/types'
import { StrainType } from '@/types'
import {
    compareOptionalRanks,
    compareStrains,
    getSafeStrainType,
    measurementInRange,
    rankIn,
    type StrainSort,
} from '@/hooks/strainFilterSort'

const yieldOrder = { Low: 1, Medium: 2, High: 3 }

describe('compareOptionalRanks', () => {
    it('puts an unknown yield after High when sorting descending', () => {
        const high = rankIn(yieldOrder, 'High')
        const unknown = rankIn(yieldOrder)
        expect(compareOptionalRanks(unknown, high, 'desc')).toBeGreaterThan(0)
        expect(compareOptionalRanks(high, unknown, 'desc')).toBeLessThan(0)
    })

    it('orders reported ranks by direction and ties two unknowns', () => {
        expect(
            compareOptionalRanks(rankIn(yieldOrder, 'Low'), rankIn(yieldOrder, 'High'), 'asc'),
        ).toBeLessThan(0)
        expect(
            compareOptionalRanks(rankIn(yieldOrder, 'Low'), rankIn(yieldOrder, 'High'), 'desc'),
        ).toBeGreaterThan(0)
        expect(compareOptionalRanks(undefined, undefined, 'desc')).toBe(0)
    })
})

const strain = (patch: { id: string; name: string; thc?: number }): Strain => ({
    id: patch.id,
    name: patch.name,
    type: StrainType.Hybrid,
    floweringType: 'Photoperiod',
    thc: patch.thc ?? 18,
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
})

const sortOf = (patch: Partial<StrainSort>): StrainSort => ({
    key: 'name',
    direction: 'asc',
    prioritize: false,
    userStrainIds: new Set<string>(),
    favorites: new Set<string>(),
    ...patch,
})

describe('compareStrains', () => {
    it('keeps an unknown THC after a reported value in both directions', () => {
        const reported = strain({ id: 'reported', name: 'Reported', thc: 20 })
        const unknown = strain({ id: 'unknown', name: 'Unknown', thc: Number.NaN })
        expect(
            compareStrains(unknown, reported, sortOf({ key: 'thc', direction: 'asc' })),
        ).toBeGreaterThan(0)
        expect(
            compareStrains(unknown, reported, sortOf({ key: 'thc', direction: 'desc' })),
        ).toBeGreaterThan(0)
        expect(
            compareStrains(reported, unknown, sortOf({ key: 'thc', direction: 'desc' })),
        ).toBeLessThan(0)
    })

    it('sorts a library strain ahead of the catalog when priority is on', () => {
        const library = strain({ id: 'library', name: 'Zed' })
        const catalog = strain({ id: 'catalog', name: 'Alpha' })
        const sort = sortOf({ prioritize: true, userStrainIds: new Set(['library']) })
        expect(compareStrains(library, catalog, sort)).toBeLessThan(0)
        expect(compareStrains(catalog, library, sort)).toBeGreaterThan(0)
    })
})

describe('measurement filters', () => {
    it('treats an unknown measurement as inside only the untouched range', () => {
        expect(measurementInRange(undefined, [0, 30], [0, 30])).toBe(true)
        expect(measurementInRange(undefined, [10, 20], [0, 30])).toBe(false)
        expect(measurementInRange(0, [0, 30], [0, 30])).toBe(true)
        expect(measurementInRange(Number.NaN, [0, 30], [0, 30])).toBe(true)
        expect(measurementInRange(Number.POSITIVE_INFINITY, [10, 20], [0, 30])).toBe(false)
        expect(getSafeStrainType()).toBe('')
        expect(getSafeStrainType('Sativa')).toBe('Sativa')
    })
})
