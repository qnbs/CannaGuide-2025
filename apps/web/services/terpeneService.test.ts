import { describe, it, expect } from 'vitest'
import {
    resolveTerpeneName,
    classifyChemovar,
    generateTerpeneProfile,
    generateCannabinoidProfile,
    toDetailedTerpeneProfile,
    toDetailedCannabinoidProfile,
    predictEffects,
    buildChemovarProfile,
    cosineSimilarity,
    euclideanDistance,
    sharedTerpeneCount,
    findSimilarStrains,
    predictBreedingProfile,
    scoreStrainForEffects,
    analyzeEntourage,
    profileToVector,
} from './terpeneService'
import type { TerpeneProfile, CannabinoidProfile, Strain, StrainType } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeStrain = (overrides: Partial<Strain> = {}): Strain => ({
    id: 'test-1',
    name: 'Test Strain',
    type: 'Hybrid' as StrainType,
    floweringType: 'Photoperiod',
    thc: 20,
    cbd: 1,
    floweringTime: 9,
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1.5,
        vpdTolerance: { min: 0.8, max: 1.4 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
    dominantTerpenes: ['Myrcene', 'Limonene', 'Caryophyllene'],
    ...overrides,
})

// ---------------------------------------------------------------------------
// resolveTerpeneName
// ---------------------------------------------------------------------------

describe('resolveTerpeneName', () => {
    it('resolves exact name (case-insensitive)', () => {
        expect(resolveTerpeneName('myrcene')).toBe('Myrcene')
        expect(resolveTerpeneName('LIMONENE')).toBe('Limonene')
    })

    it('resolves known aliases', () => {
        expect(resolveTerpeneName('beta-caryophyllene')).toBe('Caryophyllene')
        expect(resolveTerpeneName('alpha-pinene')).toBe('Pinene')
        expect(resolveTerpeneName('d-limonene')).toBe('Limonene')
        expect(resolveTerpeneName('1,8-cineole')).toBe('Eucalyptol')
    })

    it('returns undefined for unknown names', () => {
        expect(resolveTerpeneName('unobtainium')).toBeUndefined()
    })
})

// ---------------------------------------------------------------------------
// classifyChemovar
// ---------------------------------------------------------------------------

describe('classifyChemovar', () => {
    it('Type I: THC-dominant (ratio > 5)', () => {
        expect(classifyChemovar(20, 1)).toBe('Type I')
    })

    it('Type II: Balanced (ratio 1--5)', () => {
        expect(classifyChemovar(10, 5)).toBe('Type II')
    })

    it('Type III: CBD-dominant (ratio < 1)', () => {
        expect(classifyChemovar(2, 10)).toBe('Type III')
    })

    it('Type IV: CBG-dominant', () => {
        expect(classifyChemovar(1, 1, 5)).toBe('Type IV')
    })

    it('Type V: Low cannabinoid', () => {
        expect(classifyChemovar(0.5, 0.3)).toBe('Type V')
    })

    it('Type I when CBD is 0', () => {
        expect(classifyChemovar(20, 0)).toBe('Type I')
    })
})

// ---------------------------------------------------------------------------
// generateTerpeneProfile
// ---------------------------------------------------------------------------

describe('generateTerpeneProfile', () => {
    it('generates profile with dominant terpenes present', () => {
        const profile = generateTerpeneProfile(['Myrcene', 'Limonene'], 500, 'Hybrid')
        expect(profile.Myrcene).toBeGreaterThan(0)
        expect(profile.Limonene).toBeGreaterThan(0)
    })

    it('returns deterministic results for same inputs', () => {
        const a = generateTerpeneProfile(['Pinene'], 123, 'Sativa')
        const b = generateTerpeneProfile(['Pinene'], 123, 'Sativa')
        expect(a).toEqual(b)
    })

    it('adds secondary terpenes', () => {
        const profile = generateTerpeneProfile(['Myrcene'], 42, 'Indica')
        const terpeneCount = Object.keys(profile).length
        expect(terpeneCount).toBeGreaterThan(1)
    })
})

// ---------------------------------------------------------------------------
// generateCannabinoidProfile
// ---------------------------------------------------------------------------

describe('generateCannabinoidProfile', () => {
    it('includes THC and CBD', () => {
        const profile = generateCannabinoidProfile(20, 2)
        expect(profile.THC).toBe(20)
        expect(profile.CBD).toBe(2)
    })

    it('generates minor cannabinoids', () => {
        const profile = generateCannabinoidProfile(20, 2, undefined, undefined, 100)
        expect(profile.CBG).toBeGreaterThan(0)
        expect(profile.CBC).toBeGreaterThan(0)
        expect(profile.THCA).toBeGreaterThan(0)
    })

    it('uses explicit cbg/thcv when provided', () => {
        const profile = generateCannabinoidProfile(20, 2, 3.5, 1.2)
        expect(profile.CBG).toBe(3.5)
        expect(profile.THCV).toBe(1.2)
    })
})

// ---------------------------------------------------------------------------
// Detailed profile conversion
// ---------------------------------------------------------------------------

describe('toDetailedTerpeneProfile', () => {
    it('converts simple profile to detailed with entries', () => {
        const simple: TerpeneProfile = { Myrcene: 0.85, Limonene: 0.52 }
        const detailed = toDetailedTerpeneProfile(simple, 5)
        expect(detailed.Myrcene?.percent).toBe(0.85)
        expect(detailed.Myrcene?.sampleCount).toBe(5)
        expect(detailed.Myrcene?.stability).toBeDefined()
    })

    it('rejects invalid property names to prevent prototype pollution', () => {
        const malicious = { __proto__: 1.0, constructor: 2.0, Myrcene: 0.5 } as unknown as TerpeneProfile
        const detailed = toDetailedTerpeneProfile(malicious)
        expect(detailed.Myrcene?.percent).toBe(0.5)
        expect(Object.keys(detailed)).not.toContain('__proto__')
        expect(Object.keys(detailed)).not.toContain('constructor')
    })
})

describe('toDetailedCannabinoidProfile', () => {
    it('converts cannabinoid profile to detailed', () => {
        const simple: CannabinoidProfile = { THC: 20, CBD: 2 }
        const detailed = toDetailedCannabinoidProfile(simple)
        expect(detailed.THC?.percent).toBe(20)
        expect(detailed.THC?.sampleCount).toBe(0)
    })

    it('rejects invalid property names to prevent prototype pollution', () => {
        const malicious = { __proto__: 10, toString: 5, THC: 20 } as unknown as CannabinoidProfile
        const detailed = toDetailedCannabinoidProfile(malicious)
        expect(detailed.THC?.percent).toBe(20)
        expect(Object.keys(detailed)).not.toContain('__proto__')
        expect(Object.keys(detailed)).not.toContain('toString')
    })
})

// ---------------------------------------------------------------------------
// predictEffects
// ---------------------------------------------------------------------------

describe('predictEffects', () => {
    it('returns effects sorted by confidence', () => {
        const profile: TerpeneProfile = { Myrcene: 1.5, Limonene: 0.8 }
        const effects = predictEffects(profile)
        expect(effects.length).toBeGreaterThan(0)
        // Myrcene's effects should be prominent
        expect(effects).toContain('Relaxing')
    })

    it('includes cannabinoid effects when provided', () => {
        const terp: TerpeneProfile = { Myrcene: 0.5 }
        const cann: CannabinoidProfile = { THC: 25 }
        const effects = predictEffects(terp, cann)
        expect(effects).toContain('Euphoric')
    })

    it('respects maxEffects limit', () => {
        const profile: TerpeneProfile = { Myrcene: 1, Limonene: 1, Caryophyllene: 1 }
        const effects = predictEffects(profile, undefined, 3)
        expect(effects.length).toBeLessThanOrEqual(3)
    })
})

// ---------------------------------------------------------------------------
// buildChemovarProfile
// ---------------------------------------------------------------------------

describe('buildChemovarProfile', () => {
    it('builds a complete profile', () => {
        const strain = makeStrain()
        const profile = buildChemovarProfile(strain)

        expect(profile.chemovarType).toBe('Type I')
        expect(profile.totalTerpenePercent).toBeGreaterThan(0)
        expect(profile.totalCannabinoidPercent).toBeGreaterThan(0)
        expect(profile.thcCbdRatio).toBe(20)
        expect(profile.predictedEffects.length).toBeGreaterThan(0)
        expect(profile.dataQuality).toBeGreaterThan(0)
        expect(profile.lastUpdated).toBeDefined()
    })

    it('uses existing terpene profile if available', () => {
        const strain = makeStrain({ terpeneProfile: { Myrcene: 1.0 } })
        const profile = buildChemovarProfile(strain)
        expect(profile.detailedTerpeneProfile.Myrcene?.percent).toBe(1.0)
        expect(profile.dataQuality).toBeGreaterThanOrEqual(0.6)
    })
})

// ---------------------------------------------------------------------------
// Similarity
// ---------------------------------------------------------------------------

describe('cosineSimilarity', () => {
    it('returns 1 for identical profiles', () => {
        const p: TerpeneProfile = { Myrcene: 1, Limonene: 0.5 }
        expect(cosineSimilarity(p, p)).toBeCloseTo(1, 4)
    })

    it('returns 0 for orthogonal profiles', () => {
        const a: TerpeneProfile = { Myrcene: 1 }
        const b: TerpeneProfile = { Limonene: 1 }
        expect(cosineSimilarity(a, b)).toBe(0)
    })

    it('returns 0 for empty profiles', () => {
        expect(cosineSimilarity({}, {})).toBe(0)
    })
})

describe('euclideanDistance', () => {
    it('returns 0 for identical profiles', () => {
        const p: TerpeneProfile = { Myrcene: 1 }
        expect(euclideanDistance(p, p)).toBe(0)
    })

    it('returns positive for different profiles', () => {
        const a: TerpeneProfile = { Myrcene: 1 }
        const b: TerpeneProfile = { Myrcene: 2 }
        expect(euclideanDistance(a, b)).toBeCloseTo(1, 4)
    })
})

describe('sharedTerpeneCount', () => {
    it('counts terpenes present in both profiles', () => {
        const a: TerpeneProfile = { Myrcene: 0.5, Limonene: 0.3 }
        const b: TerpeneProfile = { Myrcene: 0.8, Pinene: 0.2 }
        expect(sharedTerpeneCount(a, b)).toBe(1) // Only Myrcene
    })
})

describe('findSimilarStrains', () => {
    it('returns strains sorted by similarity', () => {
        const ref: TerpeneProfile = { Myrcene: 1, Limonene: 0.5 }
        const strains = [
            { id: '1', name: 'A', terpeneProfile: { Myrcene: 0.9, Limonene: 0.4 } },
            { id: '2', name: 'B', terpeneProfile: { Pinene: 1 } },
            { id: '3', name: 'C', terpeneProfile: { Myrcene: 0.5 } },
        ]
        const results = findSimilarStrains(ref, strains, 10, 0.01)
        expect(results.length).toBeGreaterThanOrEqual(1)
        expect(results[0]?.strainId).toBe('1')
    })
})

describe('profileToVector', () => {
    it('creates fixed-length vector', () => {
        const v = profileToVector({ Myrcene: 0.5 })
        expect(v.length).toBe(27) // All terpene names
        expect(v[0]).toBe(0.5) // Myrcene is first
    })
})

// ---------------------------------------------------------------------------
// Breeding prediction
// ---------------------------------------------------------------------------

describe('predictBreedingProfile', () => {
    it('produces midpoint-ish values', () => {
        const a: TerpeneProfile = { Myrcene: 1.0 }
        const b: TerpeneProfile = { Myrcene: 0.5 }
        const result = predictBreedingProfile(a, b)
        expect(result.Myrcene).toBeGreaterThan(0.3)
        expect(result.Myrcene).toBeLessThan(1.2)
    })

    it('includes terpenes from both parents', () => {
        const a: TerpeneProfile = { Myrcene: 1.0 }
        const b: TerpeneProfile = { Limonene: 0.8 }
        const result = predictBreedingProfile(a, b)
        expect(Object.keys(result).length).toBeGreaterThanOrEqual(2)
    })
})

// ---------------------------------------------------------------------------
// Effect scoring
// ---------------------------------------------------------------------------

describe('scoreStrainForEffects', () => {
    it('scores higher for matching effects', () => {
        const relaxing: TerpeneProfile = { Myrcene: 2.0, Linalool: 1.0 }
        const energizing: TerpeneProfile = { Limonene: 2.0, Terpinolene: 1.0 }
        const relaxScore = scoreStrainForEffects(relaxing, ['Relaxing', 'Sedating'])
        const energyScore = scoreStrainForEffects(energizing, ['Relaxing', 'Sedating'])
        expect(relaxScore).toBeGreaterThan(energyScore)
    })
})

// ---------------------------------------------------------------------------
// Entourage analysis
// ---------------------------------------------------------------------------

describe('analyzeEntourage', () => {
    it('returns complete analysis', () => {
        const terp: TerpeneProfile = { Myrcene: 1.0, Limonene: 0.5, Linalool: 0.3 }
        const cann: CannabinoidProfile = { THC: 20, CBD: 2 }
        const result = analyzeEntourage(terp, cann)

        expect(result.dominantTerpenes.length).toBeGreaterThan(0)
        expect(result.dominantCannabinoids.length).toBeGreaterThan(0)
        expect(result.chemovarType).toBe('Type I')
        expect(['sedating', 'balanced', 'energizing']).toContain(result.overallProfile)
    })

    it('detects synergies', () => {
        const terp: TerpeneProfile = { Myrcene: 0.8, Limonene: 0.3, Linalool: 0.2 }
        const cann: CannabinoidProfile = { THC: 20, CBD: 0 }
        const result = analyzeEntourage(terp, cann)
        expect(result.synergies.length).toBeGreaterThan(0)
    })
})
