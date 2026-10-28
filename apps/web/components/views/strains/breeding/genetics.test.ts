import { describe, expect, it } from 'vitest'

import { floweringDaysFromWeeks } from './genetics'

describe('floweringDaysFromWeeks', () => {
    it('converts the weeks crossStrains stores into days (#647 review)', () => {
        expect(floweringDaysFromWeeks(8)).toBe(56)
        expect(floweringDaysFromWeeks(8.5)).toBe(60)
    })

    it('falls back to 9 weeks for a missing or non-finite value', () => {
        expect(floweringDaysFromWeeks(undefined)).toBe(63)
        expect(floweringDaysFromWeeks(Number.NaN)).toBe(63)
    })
})
