/**
 * Tests for strainCurationService
 */

import { describe, it, expect } from 'vitest'
import {
    isSameStrain,
    assessDataQuality,
    estimateFlavonoidProfile,
    mergeExternalIntoStrain,
    importStrainBatch,
    findDuplicateStrains,
} from '@/services/strainCurationService'
import { StrainType } from '@/types'
import type { Strain } from '@/types'
import type { ValidatedExternalStrainData } from '@/types/strainSchemas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeStrain = (overrides: Partial<Strain> = {}): Strain =>
    ({
        id: 'test-1',
        name: 'OG Kush',
        type: StrainType.Hybrid,
        floweringType: 'Photoperiod',
        thc: 22,
        cbd: 0.1,
        floweringTime: 63,
        agronomic: {
            difficulty: 'Medium',
            yield: 'High',
            height: 'Medium',
        },
        geneticModifiers: {
            pestResistance: 0.5,
            nutrientUptakeRate: 0.5,
            stressTolerance: 0.5,
            rue: 1.5,
            vpdTolerance: { min: 0.8, max: 1.4 },
            transpirationFactor: 1.0,
            stomataSensitivity: 0.5,
        },
        source: 'internal',
        ...overrides,
    }) as Strain

const makeExternal = (
    overrides: Partial<ValidatedExternalStrainData> = {},
): ValidatedExternalStrainData =>
    ({
        name: 'OG Kush',
        provider: 'otreeba',
        externalId: 'sf-123',
        thc: 24,
        cbd: 0.2,
        ...overrides,
    }) as ValidatedExternalStrainData

// ---------------------------------------------------------------------------
// isSameStrain
// ---------------------------------------------------------------------------

describe('isSameStrain', () => {
    it('matches identical names', () => {
        expect(isSameStrain('OG Kush', 'OG Kush')).toBe(true)
    })

    it('matches case-insensitive', () => {
        expect(isSameStrain('OG KUSH', 'og kush')).toBe(true)
    })

    it('matches with suffix stripped (Auto)', () => {
        expect(isSameStrain('OG Kush', 'OG Kush Auto')).toBe(true)
    })

    it('matches with suffix stripped (Feminized)', () => {
        expect(isSameStrain('Blue Dream', 'Blue Dream Feminized')).toBe(true)
    })

    it('rejects different strains', () => {
        expect(isSameStrain('OG Kush', 'Blue Dream')).toBe(false)
    })

    it('rejects very short partial matches', () => {
        expect(isSameStrain('AK', 'AK-47')).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// assessDataQuality
// ---------------------------------------------------------------------------

describe('assessDataQuality', () => {
    it('returns low score for minimal strain', () => {
        const strain = makeStrain({ description: undefined, genetics: undefined })
        const quality = assessDataQuality(strain)
        expect(quality.overall).toBeGreaterThan(0)
        expect(quality.overall).toBeLessThan(0.5)
        expect(quality.hasLabData).toBe(false)
        expect(quality.hasRealTerpeneData).toBe(false)
    })

    it('returns higher score for complete strain', () => {
        const strain = makeStrain({
            description: 'A classic indica-dominant hybrid with earthy and pine aromas.',
            genetics: 'Chemdawg x Lemon Thai x Hindu Kush',
            aromas: ['Earthy', 'Pine'],
            dominantTerpenes: ['Myrcene', 'Limonene'],
            terpeneProfile: { Myrcene: 0.4, Limonene: 0.3 },
            cannabinoidProfile: { THC: 22, CBD: 0.1 },
            chemovarProfile: {
                chemovarType: 'THC-dominant',
                totalTerpenePercent: 0.7,
                totalCannabinoidPercent: 22.1,
                thcCbdRatio: 220,
                detailedTerpeneProfile: {},
                detailedCannabinoidProfile: {},
                predictedEffects: [],
                dataQuality: 0.8,
                lastUpdated: new Date().toISOString(),
            } as unknown as Strain['chemovarProfile'],
            lineage: { parents: [{ name: 'Chemdawg' }] },
            labResults: [
                { labName: 'TestLab', testDate: '2024-01-01' } as Strain['labResults'] extends
                    | (infer U)[]
                    | undefined
                    ? U
                    : never,
            ],
            dataProvenance: [
                {
                    provider: 'otreeba',
                    fetchedAt: '2024-01-01',
                    confidence: 0.8,
                    labVerified: true,
                },
            ],
        })
        const quality = assessDataQuality(strain)
        expect(quality.overall).toBeGreaterThan(0.7)
        expect(quality.hasLabData).toBe(true)
        expect(quality.hasLineageData).toBe(true)
        expect(quality.sourceCount).toBe(1)
    })

    it('tracks lastCurated timestamp', () => {
        const quality = assessDataQuality(makeStrain())
        expect(quality.lastCurated).toBeTruthy()
        // Should be a valid ISO string
        expect(new Date(quality.lastCurated ?? '').getFullYear()).toBeGreaterThan(2024)
    })
})

// ---------------------------------------------------------------------------
// estimateFlavonoidProfile
// ---------------------------------------------------------------------------

describe('estimateFlavonoidProfile', () => {
    it('always includes cannflavins', () => {
        const profile = estimateFlavonoidProfile()
        expect(profile['Cannflavin A']).toBeGreaterThan(0)
        expect(profile['Cannflavin B']).toBeGreaterThan(0)
        expect(profile['Cannflavin C']).toBeGreaterThan(0)
    })

    it('includes more apigenin for high-THC strains', () => {
        const highThc = estimateFlavonoidProfile(undefined, { THC: 25 }, 42)
        const lowThc = estimateFlavonoidProfile(undefined, { THC: 5 }, 42)
        expect(highThc['Apigenin']).toBeGreaterThan(lowThc['Apigenin'] ?? 0)
    })

    it('includes more quercetin for high-CBD strains', () => {
        const highCbd = estimateFlavonoidProfile(undefined, { CBD: 10 }, 42)
        const lowCbd = estimateFlavonoidProfile(undefined, { CBD: 1 }, 42)
        expect(highCbd['Quercetin']).toBeGreaterThan(lowCbd['Quercetin'] ?? 0)
    })

    it('modulates luteolin with myrcene', () => {
        const highMyrcene = estimateFlavonoidProfile({ Myrcene: 0.5 }, undefined, 42)
        const lowMyrcene = estimateFlavonoidProfile({ Myrcene: 0.1 }, undefined, 42)
        expect(highMyrcene['Luteolin']).toBeGreaterThan(lowMyrcene['Luteolin'] ?? 0)
    })

    it('returns deterministic results with same hash', () => {
        const a = estimateFlavonoidProfile(undefined, undefined, 99)
        const b = estimateFlavonoidProfile(undefined, undefined, 99)
        expect(a).toEqual(b)
    })
})

// ---------------------------------------------------------------------------
// mergeExternalIntoStrain
// ---------------------------------------------------------------------------

describe('mergeExternalIntoStrain', () => {
    it('adds missing description', () => {
        const strain = makeStrain({ description: undefined })
        const ext = makeExternal({ description: 'A great strain for relaxation.' })
        const merged = mergeExternalIntoStrain(strain, ext)
        expect(merged.description).toBe('A great strain for relaxation.')
    })

    it('prefers longer description', () => {
        const strain = makeStrain({ description: 'Short.' })
        const ext = makeExternal({
            description: 'A much longer and more detailed description of this excellent strain.',
        })
        const merged = mergeExternalIntoStrain(strain, ext)
        expect(merged.description?.length).toBeGreaterThan(10)
    })

    it('merges aromas without duplicates', () => {
        const strain = makeStrain({ aromas: ['Earthy', 'Pine'] })
        const ext = makeExternal({ aromas: ['earthy', 'Citrus'] })
        const merged = mergeExternalIntoStrain(strain, ext)
        expect(merged.aromas).toHaveLength(3)
        expect(merged.aromas).toContain('Citrus')
    })

    it('adds data provenance record', () => {
        const strain = makeStrain()
        const ext = makeExternal()
        const merged = mergeExternalIntoStrain(strain, ext)
        expect(merged.dataProvenance).toHaveLength(1)
        expect(merged.dataProvenance?.[0]?.provider).toBe('otreeba')
    })

    it('computes data quality after merge', () => {
        const strain = makeStrain()
        const ext = makeExternal()
        const merged = mergeExternalIntoStrain(strain, ext)
        expect(merged.dataQuality).toBeDefined()
        expect(merged.dataQuality?.overall).toBeGreaterThan(0)
    })

    it('merges lineage parents', () => {
        const strain = makeStrain({
            lineage: { parents: [{ name: 'Chemdawg' }] },
        })
        const ext = makeExternal({
            lineage: { parents: [{ name: 'Chemdawg' }, { name: 'Lemon Thai' }] },
        })
        const merged = mergeExternalIntoStrain(strain, ext)
        expect(merged.lineage?.parents).toHaveLength(2) // Chemdawg (existing) + Lemon Thai (new)
    })

    it('does not overwrite THC from low-quality provider', () => {
        const strain = makeStrain({ thc: 22 })
        // kushy is tier 3(low quality) in the provider configs
        const ext = makeExternal({ provider: 'kushy', thc: 30 })
        const merged = mergeExternalIntoStrain(strain, ext)
        expect(merged.thc).toBe(22) // Not overwritten
    })
})

// ---------------------------------------------------------------------------
// importStrainBatch
// ---------------------------------------------------------------------------

describe('importStrainBatch', () => {
    it('merges matching strains and counts correctly', () => {
        const existing = [makeStrain({ name: 'OG Kush' })]
        const external = [makeExternal({ name: 'OG Kush', description: 'Updated description.' })]
        const { updatedStrains, result } = importStrainBatch(existing, external, 'otreeba')
        expect(result.total).toBe(1)
        expect(result.merged).toBe(1)
        expect(result.added).toBe(0)
        expect(result.failed).toBe(0)
        expect(updatedStrains[0]?.description).toBe('Updated description.')
    })

    it('counts new strains as added', () => {
        const existing = [makeStrain({ name: 'OG Kush' })]
        const external = [makeExternal({ name: 'Blue Dream' })]
        const { result } = importStrainBatch(existing, external, 'otreeba')
        expect(result.added).toBe(1)
        expect(result.merged).toBe(0)
    })
})

// ---------------------------------------------------------------------------
// findDuplicateStrains
// ---------------------------------------------------------------------------

describe('findDuplicateStrains', () => {
    it('detects name duplicates', () => {
        const strains = [
            { id: '1', name: 'OG Kush' },
            { id: '2', name: 'Blue Dream' },
            { id: '3', name: 'OG Kush Feminized' },
        ]
        const groups = findDuplicateStrains(strains)
        expect(groups).toHaveLength(1)
        expect(groups[0]?.primaryId).toBe('1')
        expect(groups[0]?.duplicateIds).toContain('3')
    })

    it('returns empty for unique strains', () => {
        const strains = [
            { id: '1', name: 'OG Kush' },
            { id: '2', name: 'Blue Dream' },
            { id: '3', name: 'White Widow' },
        ]
        const groups = findDuplicateStrains(strains)
        expect(groups).toHaveLength(0)
    })
})
