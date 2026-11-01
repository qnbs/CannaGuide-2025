import { describe, expect, it } from 'vitest'
import {
    compareOptionalRanks,
    getSafeStrainType,
    measurementInRange,
    rankIn,
} from '@/hooks/strainFilterSort'

const yieldOrder = { Low: 1, Medium: 2, High: 3 }

describe('compareOptionalRanks', () => {
    it('puts an unknown yield after High when sorting descending', () => {
        const high = rankIn(yieldOrder, 'High')
        const unknown = rankIn(yieldOrder, undefined)
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

describe('measurement filters', () => {
    it('treats an unknown measurement as inside only the untouched range', () => {
        expect(measurementInRange(undefined, [0, 30], [0, 30])).toBe(true)
        expect(measurementInRange(undefined, [10, 20], [0, 30])).toBe(false)
        expect(measurementInRange(0, [0, 30], [0, 30])).toBe(true)
        expect(getSafeStrainType(undefined)).toBe('')
        expect(getSafeStrainType('Sativa')).toBe('Sativa')
    })
})
