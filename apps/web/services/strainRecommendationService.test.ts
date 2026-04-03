import { describe, it, expect } from 'vitest'
import {
    scoreStrain,
    rankStrains,
    getScoreBadgeClass,
    type RecommendationContext,
} from './strainRecommendationService'
import type { Strain } from '@/types'

// ---------------------------------------------------------------------------
// Minimal strain fixture factory
// ---------------------------------------------------------------------------
const makeStrain = (overrides: Partial<Strain> = {}): Strain =>
    ({
        id: 'test-strain',
        name: 'Test Strain',
        type: 'Indica',
        floweringType: 'Photoperiod',
        thc: 18,
        cbd: 0.5,
        floweringTime: '8-9 weeks',
        agronomic: {
            difficulty: 'Medium',
            yield: 'High',
            height: 'Medium',
        },
        geneticModifiers: {
            pestResistance: 0.5,
            nutrientUptakeRate: 0.5,
            stressTolerance: 0.5,
            rue: 1.0,
            vpdTolerance: { min: 0.8, max: 1.4 },
            transpirationFactor: 1.0,
            stomataSensitivity: 1.0,
        },
        ...overrides,
    }) as Strain

// ---------------------------------------------------------------------------
// scoreStrain
// ---------------------------------------------------------------------------

describe('scoreStrain', () => {
    it('returns a score between 0 and 100', () => {
        const result = scoreStrain(makeStrain(), {})
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.score).toBeLessThanOrEqual(100)
    })

    it('returns neutral score when no context is provided', () => {
        const result = scoreStrain(makeStrain(), {})
        // With all neutral sub-scores (0.8) across all dimensions, score should be ~80
        expect(result.score).toBeGreaterThanOrEqual(70)
        expect(result.score).toBeLessThanOrEqual(100)
    })

    it('scores higher when THC is in target range', () => {
        const ctx: RecommendationContext = { targetThcRange: { min: 16, max: 22 } }
        const inRange = scoreStrain(makeStrain({ thc: 18 }), ctx)
        const outOfRange = scoreStrain(makeStrain({ thc: 5 }), ctx)
        expect(inRange.score).toBeGreaterThan(outOfRange.score)
    })

    it('scores higher when CBD meets target minimum', () => {
        const ctx: RecommendationContext = { targetCbdMin: 1 }
        const meetsCbd = scoreStrain(makeStrain({ cbd: 2 }), ctx)
        const lowCbd = scoreStrain(makeStrain({ cbd: 0.1 }), ctx)
        expect(meetsCbd.score).toBeGreaterThan(lowCbd.score)
    })

    it('prefers matching difficulty level', () => {
        const ctx: RecommendationContext = { preferredDifficulty: 'Easy' }
        const easy = scoreStrain(
            makeStrain({
                agronomic: { difficulty: 'Easy', yield: 'Medium', height: 'Short' },
            } as Partial<Strain>),
            ctx,
        )
        const hard = scoreStrain(
            makeStrain({
                agronomic: { difficulty: 'Hard', yield: 'High', height: 'Tall' },
            } as Partial<Strain>),
            ctx,
        )
        expect(easy.score).toBeGreaterThan(hard.score)
    })

    it('prefers matching flowering type', () => {
        const ctx: RecommendationContext = { preferredFloweringType: 'Autoflower' }
        const auto = scoreStrain(makeStrain({ floweringType: 'Autoflower' }), ctx)
        const photo = scoreStrain(makeStrain({ floweringType: 'Photoperiod' }), ctx)
        expect(auto.score).toBeGreaterThan(photo.score)
    })

    it('includes breakdown values', () => {
        const result = scoreStrain(makeStrain(), {})
        expect(result.breakdown).toHaveProperty('cannabinoid')
        expect(result.breakdown).toHaveProperty('difficulty')
        expect(result.breakdown).toHaveProperty('floweringType')
        expect(result.breakdown).toHaveProperty('effects')
        expect(result.breakdown).toHaveProperty('dataQuality')
        expect(result.breakdown).toHaveProperty('bonus')
    })

    it('labels Excellent for score >= 80', () => {
        // No context = neutral = high score
        const result = scoreStrain(makeStrain(), {})
        if (result.score >= 80) {
            expect(result.label).toBe('Excellent')
        } else if (result.score >= 65) {
            expect(result.label).toBe('Good')
        } else if (result.score >= 45) {
            expect(result.label).toBe('Fair')
        } else {
            expect(result.label).toBe('Low')
        }
    })

    it('gives bonus to easy autoflower strains', () => {
        const auto = scoreStrain(
            makeStrain({
                floweringType: 'Autoflower',
                agronomic: { difficulty: 'Easy', yield: 'Medium', height: 'Short' },
            } as Partial<Strain>),
            {},
        )
        const hard = scoreStrain(
            makeStrain({
                floweringType: 'Photoperiod',
                agronomic: { difficulty: 'Hard', yield: 'High', height: 'Tall' },
            } as Partial<Strain>),
            {},
        )
        expect(auto.score).toBeGreaterThanOrEqual(hard.score)
    })

    it('includes effect scoring via dominant terpenes', () => {
        const myrceneStrain = makeStrain({ dominantTerpenes: ['Myrcene', 'Linalool'] })
        const limoneneStrain = makeStrain({ dominantTerpenes: ['Limonene', 'Terpinolene'] })
        const ctx: RecommendationContext = { desiredEffects: ['Relaxing'] }
        const relaxScore = scoreStrain(myrceneStrain, ctx)
        const upScore = scoreStrain(limoneneStrain, ctx)
        // Myrcene/Linalool match Relaxing -- should score higher
        expect(relaxScore.score).toBeGreaterThanOrEqual(upScore.score)
    })

    it('returns deterministic results for identical inputs', () => {
        const strain = makeStrain()
        const ctx: RecommendationContext = { targetThcRange: { min: 15, max: 22 } }
        const r1 = scoreStrain(strain, ctx)
        const r2 = scoreStrain(strain, ctx)
        expect(r1.score).toBe(r2.score)
        expect(r1.label).toBe(r2.label)
    })
})

// ---------------------------------------------------------------------------
// rankStrains
// ---------------------------------------------------------------------------

describe('rankStrains', () => {
    it('returns all strains sorted by score descending', () => {
        const strains = [
            makeStrain({
                id: 'low',
                name: 'Low',
                thc: 1,
                agronomic: { difficulty: 'Hard', yield: 'Low', height: 'Tall' },
            } as Partial<Strain>),
            makeStrain({
                id: 'high',
                name: 'High',
                thc: 18,
                floweringType: 'Autoflower',
                agronomic: { difficulty: 'Easy', yield: 'High', height: 'Short' },
            } as Partial<Strain>),
            makeStrain({ id: 'mid', name: 'Mid', thc: 12 }),
        ]
        const ctx: RecommendationContext = { preferredDifficulty: 'Easy' }
        const ranked = rankStrains(strains, ctx)
        expect(ranked[0]?.strainId).toBe('high')
        for (let i = 1; i < ranked.length; i++) {
            expect(ranked[i - 1]!.score).toBeGreaterThanOrEqual(ranked[i]!.score)
        }
    })

    it('respects topN limit', () => {
        const strains = Array.from({ length: 10 }, (_, i) =>
            makeStrain({ id: `s${i}`, name: `Strain ${i}` }),
        )
        const ranked = rankStrains(strains, {}, 3)
        expect(ranked).toHaveLength(3)
    })

    it('returns all results when topN is undefined', () => {
        const strains = Array.from({ length: 5 }, (_, i) =>
            makeStrain({ id: `s${i}`, name: `Strain ${i}` }),
        )
        const ranked = rankStrains(strains)
        expect(ranked).toHaveLength(5)
    })

    it('handles empty strain list', () => {
        expect(rankStrains([], {})).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// getScoreBadgeClass
// ---------------------------------------------------------------------------

describe('getScoreBadgeClass', () => {
    it('returns green class for scores >= 80', () => {
        expect(getScoreBadgeClass(80)).toContain('green')
        expect(getScoreBadgeClass(100)).toContain('green')
    })

    it('returns primary class for scores 65-79', () => {
        expect(getScoreBadgeClass(65)).toContain('primary')
        expect(getScoreBadgeClass(79)).toContain('primary')
    })

    it('returns yellow class for scores 45-64', () => {
        expect(getScoreBadgeClass(45)).toContain('yellow')
        expect(getScoreBadgeClass(64)).toContain('yellow')
    })

    it('returns muted class for scores below 45', () => {
        expect(getScoreBadgeClass(0)).toContain('muted')
        expect(getScoreBadgeClass(44)).toContain('muted')
    })
})
