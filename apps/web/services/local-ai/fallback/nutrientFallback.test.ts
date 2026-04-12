import { describe, expect, it } from 'vitest'
import { buildNutrientRecommendation } from './nutrientFallback'

describe('nutrientFallback', () => {
    const baseContext = {
        medium: 'Soil',
        stage: 'vegetative',
        currentEc: 1.2,
        currentPh: 6.3,
        optimalRange: { ecMin: 1.0, ecMax: 1.6, phMin: 6.0, phMax: 6.8 },
        readings: [{ ec: 1.2, ph: 6.3, readingType: 'manual', timestamp: Date.now() }],
    }

    it('returns a non-empty recommendation string', () => {
        const result = buildNutrientRecommendation(baseContext, 'en')
        expect(result.length).toBeGreaterThan(0)
    })

    it('includes medium-specific advice for coco', () => {
        const result = buildNutrientRecommendation({ ...baseContext, medium: 'Coco' }, 'en')
        expect(result.toLowerCase()).toContain('coco')
    })

    it('includes medium-specific advice for hydro', () => {
        const result = buildNutrientRecommendation({ ...baseContext, medium: 'Hydro' }, 'en')
        expect(result.toLowerCase()).toContain('hydro')
    })

    it('returns German text when lang=de', () => {
        const result = buildNutrientRecommendation(baseContext, 'de')
        expect(result.length).toBeGreaterThan(0)
    })

    it('warns about high EC', () => {
        const result = buildNutrientRecommendation(
            {
                ...baseContext,
                currentEc: 2.5,
                optimalRange: { ecMin: 1.0, ecMax: 1.6, phMin: 6.0, phMax: 6.8 },
            },
            'en',
        )
        expect(result.toLowerCase()).toContain('ec')
    })

    it('warns about low pH', () => {
        const result = buildNutrientRecommendation(
            {
                ...baseContext,
                currentPh: 4.8,
                optimalRange: { ecMin: 1.0, ecMax: 1.6, phMin: 6.0, phMax: 6.8 },
            },
            'en',
        )
        expect(result.toLowerCase()).toContain('ph')
    })

    it('includes plant info when provided', () => {
        const result = buildNutrientRecommendation(
            {
                ...baseContext,
                plant: {
                    name: 'Aurora',
                    strain: { name: 'Northern Lights' },
                    stage: 'vegetative',
                    age: 30,
                    health: 75,
                    medium: { ph: 6.3, ec: 1.2 },
                },
            },
            'en',
        )
        expect(result).toContain('Aurora')
    })
})
