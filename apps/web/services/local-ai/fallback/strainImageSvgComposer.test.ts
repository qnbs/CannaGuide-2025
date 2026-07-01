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
        floweringTime: 60,
        floweringType: 'Photoperiod',
        agronomic: { difficulty: 'Medium', yield: 'High', height: 'Tall' },
        aromas: ['Earthy', 'Berry', 'Sweet', 'Citrus', 'Pine', 'Woody'],
        dominantTerpenes: ['myrcene', 'limonene', 'caryophyllene'],
        terpeneProfile: { myrcene: 0.4, limonene: 0.3 },
        ...overrides,
    }) as Strain

describe('strainImageSvgComposer', () => {
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
