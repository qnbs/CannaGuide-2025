/**
 * Tests for strainLookupService -- enrichment helpers and entourage scoring.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock heavy dependencies before importing the service
// ---------------------------------------------------------------------------

vi.mock('@/data/strains/index', () => ({
    allStrainsData: [
        {
            id: 'og-kush',
            name: 'OG Kush',
            type: 'Hybrid',
            floweringType: 'Photoperiod',
            thc: 20,
            cbd: 0.3,
            cbg: 1.2,
            thcv: 0,
            description: 'Classic West Coast strain',
            genetics: 'Chemdawg x Hindu Kush',
            dominantTerpenes: ['Myrcene', 'Limonene', 'Caryophyllene'],
            lineage: { breeder: 'Unknown' },
        },
        {
            id: 'blue-dream',
            name: 'Blue Dream',
            type: 'Sativa',
            floweringType: 'Photoperiod',
            thc: 18,
            cbd: 1.0,
            cbg: 0,
            thcv: 0,
            description: 'Balanced Sativa',
            genetics: 'Blueberry x Haze',
            dominantTerpenes: ['Myrcene', 'Pinene', 'Terpinolene'],
            lineage: { breeder: 'DJ Short' },
        },
    ],
}))

vi.mock('@/data/terpeneDatabase', () => ({
    TERPENE_DATABASE: {
        Myrcene: {
            name: 'Myrcene',
            class: 'monoterpene',
            aromas: ['Earthy', 'Musky', 'Herbal'],
            effects: ['Relaxing', 'Sedating', 'Pain Relief'],
            typicalRange: { min: 0.1, max: 3.0 },
            averagePercent: 0.85,
            mechanisms: [],
            alsoFoundIn: [],
        },
        Limonene: {
            name: 'Limonene',
            class: 'monoterpene',
            aromas: ['Citrus', 'Lemon'],
            effects: ['Uplifting', 'Energizing'],
            typicalRange: { min: 0.05, max: 2.0 },
            averagePercent: 0.52,
            mechanisms: [],
            alsoFoundIn: [],
        },
        Caryophyllene: {
            name: 'Caryophyllene',
            class: 'sesquiterpene',
            aromas: ['Spicy', 'Peppery'],
            effects: ['Pain Relief', 'Anti-Inflammatory'],
            typicalRange: { min: 0.05, max: 1.5 },
            averagePercent: 0.42,
            mechanisms: [],
            alsoFoundIn: [],
        },
        Pinene: {
            name: 'Pinene',
            class: 'monoterpene',
            aromas: ['Pine', 'Fresh'],
            effects: ['Alertness', 'Memory Retention'],
            typicalRange: { min: 0.02, max: 1.2 },
            averagePercent: 0.3,
            mechanisms: [],
            alsoFoundIn: [],
        },
        Terpinolene: {
            name: 'Terpinolene',
            class: 'monoterpene',
            aromas: ['Floral', 'Sweet'],
            effects: ['Uplifting', 'Energizing'],
            typicalRange: { min: 0.01, max: 1.0 },
            averagePercent: 0.2,
            mechanisms: [],
            alsoFoundIn: [],
        },
    },
}))

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: vi.fn(() => false),
}))

// ---------------------------------------------------------------------------
// Import service internals via re-exported helpers
// ---------------------------------------------------------------------------

import {
    getFuzzySuggestions,
    lookupStrain,
    type TerpeneDataPoint,
    type LookupStrainResult,
} from './strainLookupService'

// ---------------------------------------------------------------------------
// getFuzzySuggestions
// ---------------------------------------------------------------------------

describe('getFuzzySuggestions', () => {
    it('returns empty array for query shorter than 2 chars', () => {
        expect(getFuzzySuggestions('O')).toEqual([])
        expect(getFuzzySuggestions('')).toEqual([])
    })

    it('returns prefix matches first', () => {
        const results = getFuzzySuggestions('OG')
        expect(results[0]).toBe('OG Kush')
    })

    it('includes partial matches', () => {
        const results = getFuzzySuggestions('kush')
        expect(results.some((r) => r === 'OG Kush')).toBe(true)
    })

    it('respects the limit parameter', () => {
        expect(getFuzzySuggestions('og', 1)).toHaveLength(1)
    })
})

// ---------------------------------------------------------------------------
// lookupStrain -- local catalog path
// ---------------------------------------------------------------------------

describe('lookupStrain (local catalog)', () => {
    it('resolves exact name match', async () => {
        const result = await lookupStrain('OG Kush')
        expect(result).not.toBeNull()
        expect(result?.name).toBe('OG Kush')
        expect(result?.confidenceSource).toBe('local')
        expect(result?.confidenceScore).toBe(95)
    })

    it('resolves case-insensitive match', async () => {
        const result = await lookupStrain('og kush')
        expect(result).not.toBeNull()
        expect(result?.name).toBe('OG Kush')
    })

    it('resolves partial match', async () => {
        const result = await lookupStrain('dream')
        expect(result).not.toBeNull()
        expect(result?.name).toBe('Blue Dream')
    })

    it('returns null for unknown strain in local-only mode', async () => {
        const { isLocalOnlyMode } = await import('@/services/localOnlyModeService')
        vi.mocked(isLocalOnlyMode).mockReturnValueOnce(true)
        const result = await lookupStrain('Unknown Strain XYZ')
        expect(result).toBeNull()
    })

    it('uses sessionStorage cache on second call', async () => {
        const result1 = await lookupStrain('OG Kush')
        const result2 = await lookupStrain('OG Kush')
        expect(result1?.id).toBe(result2?.id)
    })
})

// ---------------------------------------------------------------------------
// Terpene enrichment
// ---------------------------------------------------------------------------

describe('terpene enrichment (via lookupStrain local path)', () => {
    let result: LookupStrainResult | null = null

    beforeEach(async () => {
        // Clear sessionStorage cache between tests
        sessionStorage.clear()
        result = await lookupStrain('OG Kush')
    })

    it('assigns role to terpenes', () => {
        expect(result?.terpenes[0]?.role).toBe('dominant')
        expect(result?.terpenes[1]?.role).toBe('secondary')
    })

    it('populates aromaNotes from TERPENE_DATABASE', () => {
        const myrcene = result?.terpenes.find((t: TerpeneDataPoint) => t.name === 'Myrcene')
        expect(myrcene?.aromaNotes).toContain('Earthy')
    })

    it('populates primaryEffects from TERPENE_DATABASE', () => {
        const myrcene = result?.terpenes.find((t: TerpeneDataPoint) => t.name === 'Myrcene')
        expect(myrcene?.primaryEffects?.length).toBeGreaterThan(0)
    })

    it('includes cannabinoidInteractions for known terpenes', () => {
        const myrcene = result?.terpenes.find((t: TerpeneDataPoint) => t.name === 'Myrcene')
        expect(myrcene?.cannabinoidInteractions?.length).toBeGreaterThan(0)
        const thcSynergy = myrcene?.cannabinoidInteractions?.find((ix) => ix.cannabinoid === 'THC')
        expect(thcSynergy).toBeDefined()
        expect(thcSynergy?.strength).toBe('high')
    })

    it('has valid entourageScore per terpene (0-10)', () => {
        for (const tp of result?.terpenes ?? []) {
            if (tp.entourageScore !== undefined) {
                expect(tp.entourageScore).toBeGreaterThanOrEqual(0)
                expect(tp.entourageScore).toBeLessThanOrEqual(10)
            }
        }
    })
})

// ---------------------------------------------------------------------------
// Flavonoid estimation
// ---------------------------------------------------------------------------

describe('flavonoid estimation (via lookupStrain local path)', () => {
    beforeEach(() => sessionStorage.clear())

    it('returns flavonoids for local strain', async () => {
        const result = await lookupStrain('OG Kush')
        expect(result?.flavonoids).toBeDefined()
        expect(result?.flavonoids?.length).toBeGreaterThan(0)
    })

    it('assigns cannabinoidInteractions to flavonoids', async () => {
        const result = await lookupStrain('OG Kush')
        const dominant = result?.flavonoids?.find((f) => f.role === 'dominant')
        expect(dominant?.cannabinoidInteractions?.length).toBeGreaterThan(0)
    })

    it('returns Sativa-specific flavonoids for Blue Dream', async () => {
        const result = await lookupStrain('Blue Dream')
        const names = result?.flavonoids?.map((f) => f.name) ?? []
        // Sativa profile should include Luteolin as dominant
        expect(names).toContain('Luteolin')
    })
})

// ---------------------------------------------------------------------------
// Entourage scoring
// ---------------------------------------------------------------------------

describe('entourage scoring (via lookupStrain local path)', () => {
    beforeEach(() => sessionStorage.clear())

    it('returns totalEntourageScore in range 0-100', async () => {
        const result = await lookupStrain('OG Kush')
        expect(result?.totalEntourageScore).toBeDefined()
        expect(result?.totalEntourageScore as number).toBeGreaterThanOrEqual(0)
        expect(result?.totalEntourageScore as number).toBeLessThanOrEqual(100)
    })

    it('returns terpeneDiversity as non-negative number', async () => {
        const result = await lookupStrain('OG Kush')
        expect(result?.terpeneDiversity).toBeDefined()
        expect(result?.terpeneDiversity as number).toBeGreaterThanOrEqual(0)
    })
})
