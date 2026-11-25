import { describe, it, expect } from 'vitest'
import { buildStrainImageSvg } from './strainImageSvgComposer'
import { StrainType, type Strain } from '@/types'

const makeStrain = (overrides: Partial<Strain> = {}): Strain =>
    ({
        id: 'composer-test',
        name: 'Blue Dream',
        type: StrainType.Hybrid,
        thc: 21,
        cbd: 1,
        floweringTime: 9,
        floweringType: 'Photoperiod',
        agronomic: { difficulty: 'Medium', yield: 'High', height: 'Tall' },
        aromas: ['Earthy', 'Berry', 'Sweet', 'Citrus', 'Pine', 'Woody'],
        dominantTerpenes: ['myrcene', 'limonene', 'caryophyllene'],
        terpeneProfile: { myrcene: 0.4, limonene: 0.3 },
        ...overrides,
    }) as Strain

describe('strainImageSvgComposer', () => {
    const svgFor = (overrides: Partial<Strain>, lang: 'en' | 'de' = 'en') =>
        buildStrainImageSvg(
            makeStrain(overrides),
            'botanical',
            { focus: 'buds', composition: 'symmetrical', mood: 'calm' },
            lang,
        )

    it('states the reported flowering time in weeks, the unit the catalog uses', () => {
        expect(svgFor({})).toContain('9 weeks flowering')
        expect(svgFor({}, 'de')).toContain('9 Wochen Bl\u00fcte')
        expect(svgFor({ floweringTimeRange: '8-9' })).toContain('8-9 weeks flowering')
    })

    it('says the flowering time is unknown instead of printing an absent value', () => {
        const svg = svgFor({ floweringTime: undefined })
        expect(svg).toContain('Flowering time unknown')
        expect(svg).not.toContain('undefined')
    })

    it('escapes a reported flowering range before it enters the SVG', () => {
        const svg = svgFor({ floweringTimeRange: '8<9' })
        expect(svg).toContain('8&lt;9 weeks flowering')
        expect(svg).not.toContain('8<9')
    })

    it('composes SVG for botanical style in English', () => {
        const svg = buildStrainImageSvg(
            makeStrain(),
            'botanical',
            { focus: 'buds', composition: 'symmetrical', mood: 'calm' },
            'en',
        )
        expect(svg).toContain('<svg')
        expect(svg).toContain('Blue Dream')
        expect(svg).toContain('LOCAL STRAIN PREVIEW')
    })

    it('scales title font for long strain names', () => {
        const longName = 'A'.repeat(30)
        const svg = buildStrainImageSvg(
            makeStrain({ name: longName }),
            'macro',
            { focus: 'abstract', composition: 'dynamic', mood: 'energetic' },
            'de',
        )
        expect(svg).toContain('font-size="48"')
        expect(svg).toContain('LOKALE STRAIN-VORSCHAU')
    })

    it('renders all supported styles and languages', () => {
        const styles = ['fantasy', 'botanical', 'psychedelic', 'macro', 'cyberpunk'] as const
        const langs = ['en', 'de', 'es', 'fr', 'nl'] as const
        for (const style of styles) {
            for (const lang of langs) {
                const svg = buildStrainImageSvg(
                    makeStrain(),
                    style,
                    { focus: 'plant', composition: 'minimalist', mood: 'mystical' },
                    lang,
                )
                expect(svg.length).toBeGreaterThan(500)
            }
        }
    })
})
