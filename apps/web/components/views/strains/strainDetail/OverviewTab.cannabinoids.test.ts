import { describe, expect, it } from 'vitest'
import { formatReportedPercent, minorCannabinoidEntries } from './OverviewTab'

describe('minorCannabinoidEntries', () => {
    it('keeps an explicit zero and hides the major cannabinoids', () => {
        expect(minorCannabinoidEntries({ THC: 18, CBD: 0, CBG: 0 })).toEqual([['CBG', 0]])
    })

    it('keeps a small reported percent from looking like zero', () => {
        expect(formatReportedPercent(0.04)).toBe('0.04%')
        expect(formatReportedPercent(0)).toBe('0.0%')
        expect(formatReportedPercent(18.24)).toBe('18.2%')
        expect(formatReportedPercent(Number.NaN)).toBeUndefined()
    })

    it('returns nothing when the profile is absent', () => {
        expect(minorCannabinoidEntries()).toEqual([])
    })
})
