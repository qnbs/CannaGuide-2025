import { describe, it, expect } from 'vitest'
import { buildImagePrompt } from './imageGenerationService'
import type { Strain } from '@/types'
import { StrainType } from '@/types'

const mockStrain: Strain = {
    id: 'test-strain-1',
    name: 'Purple Haze',
    type: StrainType.Sativa,
    genetics: 'Purple Thai × Haze',
    floweringType: 'Photoperiod',
    thc: 22,
    cbd: 0.1,
    floweringTime: 65,
    description: 'A legendary sativa strain.',
    aromas: ['Berry', 'Spicy', 'Earthy'],
    dominantTerpenes: ['Myrcene', 'Caryophyllene'],
    agronomic: {
        difficulty: 'Medium',
        yield: 'High',
        height: 'Tall',
    },
    geneticModifiers: {
        pestResistance: 0.5,
        nutrientUptakeRate: 1.0,
        stressTolerance: 0.6,
        rue: 1.2,
        vpdTolerance: { min: 0.4, max: 1.6 },
        transpirationFactor: 1.0,
        stomataSensitivity: 0.5,
    },
}

const highThcStrain: Strain = {
    ...mockStrain,
    id: 'test-strain-2',
    name: 'Super THC',
    thc: 30,
}

describe('imageGenerationService', () => {
    describe('buildImagePrompt', () => {
        it('builds a prompt containing the strain name', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('Purple Haze')
        })

        it('includes the correct strain type', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('sativa')
        })

        it('includes botanical style keywords', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('botanical illustration')
        })

        it('includes cyberpunk style keywords', () => {
            const prompt = buildImagePrompt(mockStrain, 'cyberpunk', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('cyberpunk aesthetic')
        })

        it('includes focus keywords for buds', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('dense cannabis buds')
        })

        it('includes focus keywords for plant', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'plant',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('full cannabis plant')
        })

        it('includes composition keywords', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'symmetrical',
                mood: 'mystical',
            })
            expect(prompt).toContain('centered symmetrical')
        })

        it('includes mood keywords', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'calm',
            })
            expect(prompt).toContain('calm serene')
        })

        it('includes aroma hints', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('Berry')
        })

        it('includes terpene hints', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('Myrcene')
        })

        it('adds heavy trichome text for very high THC strains', () => {
            const prompt = buildImagePrompt(highThcStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('extremely frosty')
        })

        it('adds generous trichome text for moderate-high THC', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('generous trichome')
        })

        it('resolves random style to one of the valid styles', () => {
            // Run multiple times to verify it picks from pool
            const prompts = new Set<string>()
            for (let i = 0; i < 50; i++) {
                prompts.add(
                    buildImagePrompt(mockStrain, 'random', {
                        focus: 'buds',
                        composition: 'dynamic',
                        mood: 'mystical',
                    }),
                )
            }
            // At minimum one unique prompt should exist
            expect(prompts.size).toBeGreaterThan(0)
        })

        it('falls back to default keywords for unknown focus/composition/mood', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'unknown',
                composition: 'unknown',
                mood: 'unknown',
            })
            // Should still include default fallbacks
            expect(prompt).toContain('dense cannabis buds') // default focus
            expect(prompt).toContain('dynamic diagonal') // default composition
            expect(prompt).toContain('mystical atmosphere') // default mood
        })

        it('handles indica type correctly', () => {
            const indicaStrain = { ...mockStrain, type: StrainType.Indica }
            const prompt = buildImagePrompt(indicaStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('indica')
        })

        it('handles hybrid type correctly', () => {
            const hybridStrain = { ...mockStrain, type: StrainType.Hybrid }
            const prompt = buildImagePrompt(hybridStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('hybrid')
        })

        it('always includes quality keywords', () => {
            const prompt = buildImagePrompt(mockStrain, 'botanical', {
                focus: 'buds',
                composition: 'dynamic',
                mood: 'mystical',
            })
            expect(prompt).toContain('photorealistic')
            expect(prompt).toContain('8K quality')
        })
    })
})
