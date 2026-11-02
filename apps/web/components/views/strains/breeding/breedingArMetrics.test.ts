import { describe, expect, it } from 'vitest'
import {
    clampPreviewStat,
    finitePreviewResin,
    previewAxesFromStability,
    resinFromReportedThc,
} from './breedingArMetrics'

const missingPercent = (): number | undefined => {
    const reported: { thc?: number } = {}
    return reported.thc
}

describe('resinFromReportedThc', () => {
    it('keeps a reported zero and scales a reported percent', () => {
        expect(resinFromReportedThc(0)).toBe(0)
        expect(resinFromReportedThc(10)).toBe(5)
        expect(resinFromReportedThc(21)).toBe(10)
    })

    it('does not turn a missing THC figure into a number', () => {
        expect(resinFromReportedThc(missingPercent())).toBeUndefined()
        expect(resinFromReportedThc(null)).toBeUndefined()
        expect(resinFromReportedThc(Number.NaN)).toBeUndefined()
        expect(resinFromReportedThc(-1)).toBeUndefined()
    })
})

describe('finitePreviewResin', () => {
    it('keeps zero and drops NaN', () => {
        expect(finitePreviewResin(0)).toBe(0)
        expect(finitePreviewResin(Number.NaN)).toBeUndefined()
        expect(finitePreviewResin(missingPercent())).toBeUndefined()
    })
})

describe('previewAxesFromStability', () => {
    it('keeps a reported score and does not treat a missing score as that score', () => {
        expect(previewAxesFromStability(0)).toEqual({
            vigor: 0,
            resistance: 0,
            stabilityKnown: true,
        })
        expect(previewAxesFromStability(60)).toEqual({
            vigor: 6,
            resistance: 5,
            stabilityKnown: true,
        })
        expect(previewAxesFromStability(null)).toEqual({
            vigor: 0,
            resistance: 0,
            stabilityKnown: false,
        })
        expect(previewAxesFromStability(missingPercent())).toEqual({
            vigor: 0,
            resistance: 0,
            stabilityKnown: false,
        })
    })
})

describe('clampPreviewStat', () => {
    it('clamps a finite stat and replaces a non-finite vigor input with zero', () => {
        expect(clampPreviewStat(12)).toBe(10)
        expect(clampPreviewStat(Number.NaN)).toBe(0)
    })
})
