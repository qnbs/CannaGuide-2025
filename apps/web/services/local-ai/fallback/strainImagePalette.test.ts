import { describe, it, expect } from 'vitest'
import {
    buildStylePalette,
    DIFFICULTY_VAL,
    YIELD_VAL,
    HEIGHT_VAL,
    TERPENE_COLORS,
} from './strainImagePalette'

describe('strainImagePalette', () => {
    it('builds palettes for every concrete style', () => {
        const styles = ['fantasy', 'botanical', 'psychedelic', 'macro', 'cyberpunk'] as const
        for (const style of styles) {
            const palette = buildStylePalette(style)
            expect(palette.accent).toMatch(/^#/)
            expect(palette.bg1).toBeTruthy()
            expect(palette.barBg).toBeTruthy()
        }
    })

    it('exposes agronomic lookup tables', () => {
        expect(DIFFICULTY_VAL.Hard).toBe(95)
        expect(YIELD_VAL.High).toBe(90)
        expect(HEIGHT_VAL.Tall).toBe(90)
    })

    it('maps common terpenes to hex colors', () => {
        expect(TERPENE_COLORS.myrcene).toBe('#86efac')
        expect(TERPENE_COLORS.limonene).toBe('#fde047')
        expect(TERPENE_COLORS.caryophyllene).toBe('#f97316')
    })
})
