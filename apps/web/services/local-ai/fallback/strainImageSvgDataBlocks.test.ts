import { describe, it, expect } from 'vitest'
import { buildStrainDataBars, buildTerpenesBlock, buildAromasBlock, buildDynamicAccentBand } from './strainImageSvgDataBlocks'
import { buildStylePalette } from './strainImagePalette'
import { StrainType, type Strain } from '@/types'

const strain = {
    id: 'block-test',
    name: 'Block Strain',
    type: StrainType.Hybrid,
    thc: 21,
    cbd: 1,
    cbg: 0.5,
    thcv: 0.2,
    thcRange: '18-24%',
    floweringTime: 60,
    floweringType: 'Photoperiod',
    agronomic: { difficulty: 'Medium', yield: 'High', height: 'Tall' },
    aromas: ['Earthy', 'Citrus'],
    dominantTerpenes: ['myrcene', 'limonene', 'verylongterpene'],
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1,
        vpdTolerance: { min: 0.8, max: 1.6 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
} as Strain

const palette = buildStylePalette('botanical')

describe('strainImageSvgDataBlocks', () => {
    it('builds THC/CBD/CBG/THCV bars with localized labels', () => {
        const { bars, dataY } = buildStrainDataBars(strain, palette, 'de')
        expect(bars.length).toBeGreaterThanOrEqual(4)
        expect(bars.join('')).toContain('Schwierigkeit')
        expect(dataY).toBeGreaterThan(820)
    })

    it('builds terpene and aroma blocks', () => {
        const terpenes = buildTerpenesBlock(['myrcene', 'limonene'], 900, palette, 'en')
        const aromas = buildAromasBlock('Earthy, Citrus', 980, palette, 'en')
        expect(terpenes.block).toContain('Terpenes')
        expect(aromas.block).toContain('Earthy')
    })

    it('buildDynamicAccentBand only renders for dynamic composition', () => {
        expect(buildDynamicAccentBand('dynamic', 1200, palette)).toContain('<rect')
        expect(buildDynamicAccentBand('centered', 1200, palette)).toBe('')
    })
})
