import { describe, it, expect, vi } from 'vitest'

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

import { VPD_TARGET_BANDS, getVPDStatusAdvice } from '@/lib/vpd/recommendations'

describe('VPD_TARGET_BANDS', () => {
    it('has entry for seedling stage', () => {
        expect(VPD_TARGET_BANDS.seedling).toBeDefined()
        expect(VPD_TARGET_BANDS.seedling.min).toBe(0.4)
        expect(VPD_TARGET_BANDS.seedling.max).toBe(0.8)
    })

    it('has entry for vegetative stage', () => {
        expect(VPD_TARGET_BANDS.vegetative.min).toBe(0.8)
        expect(VPD_TARGET_BANDS.vegetative.max).toBe(1.2)
    })

    it('has entry for earlyFlower stage', () => {
        expect(VPD_TARGET_BANDS.earlyFlower.min).toBe(1.0)
        expect(VPD_TARGET_BANDS.earlyFlower.max).toBe(1.4)
    })

    it('has entry for lateFlower stage', () => {
        expect(VPD_TARGET_BANDS.lateFlower.min).toBe(1.2)
        expect(VPD_TARGET_BANDS.lateFlower.max).toBe(1.6)
    })
})

describe('getVPDStatusAdvice', () => {
    it('returns optimal advice key', () => {
        expect(getVPDStatusAdvice('optimal')).toBe('plantsView.vpd.advice.optimal')
    })

    it('returns low advice key', () => {
        expect(getVPDStatusAdvice('low')).toBe('plantsView.vpd.advice.low')
    })

    it('returns high advice key', () => {
        expect(getVPDStatusAdvice('high')).toBe('plantsView.vpd.advice.high')
    })

    it('returns danger advice key for danger status', () => {
        expect(getVPDStatusAdvice('danger')).toBe('plantsView.vpd.advice.danger')
    })
})
