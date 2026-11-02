import { describe, expect, it } from 'vitest'

import { floweringDaysFromWeeks, formatFloweringDays, formatReportedPercent } from './genetics'

describe('floweringDaysFromWeeks', () => {
    it('converts the weeks crossStrains stores into days (#647 review)', () => {
        expect(floweringDaysFromWeeks(8)).toBe(56)
        expect(floweringDaysFromWeeks(8.5)).toBe(60)
    })

    it('keeps an explicit zero and leaves a missing value absent', () => {
        expect(floweringDaysFromWeeks(0)).toBe(0)
        expect(floweringDaysFromWeeks()).toBeUndefined()
        expect(floweringDaysFromWeeks(Number.NaN)).toBeUndefined()
    })
})

describe('reported genetics labels', () => {
    it('prints a reported percent, including zero, and unknown otherwise', () => {
        expect(formatReportedPercent(0, 'Unknown')).toBe('0.0%')
        expect(formatReportedPercent(0.04, 'Unknown')).toBe('0.04%')
        expect(formatReportedPercent(18.24, 'Unknown')).toBe('18.2%')
        expect(formatReportedPercent(undefined, 'Unknown')).toBe('Unknown')
        expect(formatReportedPercent(Number.NaN, 'Unknown')).toBe('Unknown')
    })

    it('prints flowering days only when the week count was reported', () => {
        expect(formatFloweringDays(9, 'Unknown', 'days')).toBe('63 days')
        expect(formatFloweringDays(undefined, 'Unknown', 'days')).toBe('Unknown')
    })
})
