import { describe, expect, it } from 'vitest'
import { minorCannabinoidEntries } from './OverviewTab'

describe('minorCannabinoidEntries', () => {
    it('keeps an explicit zero and hides the major cannabinoids', () => {
        expect(minorCannabinoidEntries({ THC: 18, CBD: 0, CBG: 0 })).toEqual([['CBG', 0]])
    })

    it('returns nothing when the profile is absent', () => {
        expect(minorCannabinoidEntries(undefined)).toEqual([])
    })
})
