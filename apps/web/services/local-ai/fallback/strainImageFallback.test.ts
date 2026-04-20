import { describe, it, expect } from 'vitest'
import { buildStrainImage } from '@/services/local-ai/fallback/strainImageFallback'
import { StrainType, type Strain } from '@/types'

const makeStrain = (overrides: Partial<Strain> = {}): Strain =>
    ({
        id: 'strain-test',
        name: 'Blue Dream',
        type: StrainType.Hybrid,
        thc: 21,
        cbd: 1,
        floweringTime: 60,
        floweringType: 'Photoperiod',
        agronomic: { difficulty: 'Medium', yield: 'High', height: 'Tall' },
        terpeneProfile: {
            myrcene: 0.45,
            limonene: 0.3,
            caryophyllene: 0.2,
        },
        geneticModifiers: {
            pestResistance: 1,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1,
            vpdTolerance: { min: 0.8, max: 1.6 },
            transpirationFactor: 1,
            stomataSensitivity: 1,
        },
        ...overrides,
    }) as Strain

const criteria = { focus: 'plant', composition: 'centered', mood: 'vibrant' }

describe('strainImageFallback', () => {
    it('returns a data URI SVG for botanical style', () => {
        const result = buildStrainImage(makeStrain(), 'botanical', criteria, 'en')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
        expect(result).toContain('Blue%20Dream')
    })

    it('returns a data URI SVG for fantasy style', () => {
        const result = buildStrainImage(makeStrain(), 'fantasy', criteria, 'en')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('returns a data URI SVG for psychedelic style', () => {
        const result = buildStrainImage(makeStrain(), 'psychedelic', criteria, 'en')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('returns a data URI SVG for macro style', () => {
        const result = buildStrainImage(makeStrain(), 'macro', criteria, 'en')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('returns a data URI SVG for cyberpunk style', () => {
        const result = buildStrainImage(makeStrain(), 'cyberpunk', criteria, 'en')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('handles random style', () => {
        const result = buildStrainImage(makeStrain(), 'random', criteria, 'en')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('works with indica strain type', () => {
        const result = buildStrainImage(
            makeStrain({ type: StrainType.Indica }),
            'botanical',
            criteria,
            'en',
        )
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('works with sativa strain type', () => {
        const result = buildStrainImage(
            makeStrain({ type: StrainType.Sativa }),
            'botanical',
            criteria,
            'en',
        )
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('works with German language', () => {
        const result = buildStrainImage(makeStrain(), 'botanical', criteria, 'de')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('works without terpene profile', () => {
        const strain = makeStrain({ terpeneProfile: undefined })
        const result = buildStrainImage(strain, 'botanical', criteria, 'en')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('works with minimal agronomic data', () => {
        const strain = makeStrain({
            agronomic: { difficulty: 'Easy', yield: 'Low', height: 'Short' },
        })
        const result = buildStrainImage(strain, 'botanical', criteria, 'en')
        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })

    it('SVG contains strain name', () => {
        const result = buildStrainImage(makeStrain(), 'botanical', criteria, 'en')
        const decoded = decodeURIComponent(result.replace('data:image/svg+xml;charset=utf-8,', ''))
        expect(decoded).toContain('Blue Dream')
    })

    it('SVG contains THC info', () => {
        const result = buildStrainImage(makeStrain(), 'botanical', criteria, 'en')
        const decoded = decodeURIComponent(result.replace('data:image/svg+xml;charset=utf-8,', ''))
        expect(decoded).toContain('THC')
    })
})
