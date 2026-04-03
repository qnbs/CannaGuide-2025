/**
 * Tests for strainSchemas (Zod validation)
 */

import { describe, it, expect } from 'vitest'
import {
    externalStrainDataSchema,
    otreebaStrainSchema,
    kushyStrainSchema,
    dataProvenanceSchema,
    labTestResultSchema,
    strainLineageSchema,
    medicalInfoSchema,
    terpeneInteractionSchema,
    enhancedTerpeneSchema,
    flavonoidInteractionSchema,
    entourageInsightSchema,
} from '@/types/strainSchemas'

// ---------------------------------------------------------------------------
// externalStrainDataSchema
// ---------------------------------------------------------------------------

describe('externalStrainDataSchema', () => {
    it('validates minimal external strain data', () => {
        const result = externalStrainDataSchema.safeParse({
            name: 'OG Kush',
            provider: 'otreeba',
            externalId: 'ot-123',
        })
        expect(result.success).toBe(true)
    })

    it('validates full external strain data', () => {
        const result = externalStrainDataSchema.safeParse({
            name: 'OG Kush',
            provider: 'otreeba',
            externalId: 'ot-456',
            type: 'Hybrid',
            thc: 22.5,
            cbd: 0.1,
            description: 'A classic hybrid.',
            genetics: 'Chemdawg x Lemon Thai',
            aromas: ['Earthy', 'Pine'],
            dominantTerpenes: ['Myrcene'],
            terpeneProfile: { Myrcene: 0.4 },
            cannabinoidProfile: { THC: 22.5 },
            labTested: true,
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing name', () => {
        const result = externalStrainDataSchema.safeParse({
            provider: 'otreeba',
            externalId: 'ot-123',
        })
        expect(result.success).toBe(false)
    })

    it('rejects invalid provider', () => {
        const result = externalStrainDataSchema.safeParse({
            name: 'Test',
            provider: 'invalid-provider',
            externalId: 'x',
        })
        expect(result.success).toBe(false)
    })

    it('clamps THC to valid range', () => {
        const result = externalStrainDataSchema.safeParse({
            name: 'Test',
            provider: 'otreeba',
            externalId: 'x',
            thc: -5,
        })
        // Zod should either reject or the schema should constrain
        if (result.success) {
            expect(result.data.thc).toBeGreaterThanOrEqual(0)
        }
    })
})

// ---------------------------------------------------------------------------
// otreebaStrainSchema
// ---------------------------------------------------------------------------

describe('otreebaStrainSchema', () => {
    it('validates an otreeba strain response', () => {
        const result = otreebaStrainSchema.safeParse({
            ucpc: 'ABC123',
            name: 'Blue Dream',
            lineage: { Blueberry: 'Indica', Haze: 'Sativa' },
            genetics: { names: 'Blueberry x Haze' },
            type: 'Hybrid',
        })
        expect(result.success).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// kushyStrainSchema
// ---------------------------------------------------------------------------

describe('kushyStrainSchema', () => {
    it('validates a kushy strain response', () => {
        const result = kushyStrainSchema.safeParse({
            slug: 'blue-dream',
            name: 'Blue Dream',
            category: 'hybrid',
            rating: 4.5,
        })
        expect(result.success).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// dataProvenanceSchema
// ---------------------------------------------------------------------------

describe('dataProvenanceSchema', () => {
    it('validates a full provenance record', () => {
        const result = dataProvenanceSchema.safeParse({
            provider: 'otreeba',
            fetchedAt: '2024-06-15T10:30:00Z',
            externalId: 'ot-123',
            labVerified: true,
            confidence: 0.85,
            sourceUrl: 'https://otreeba.com/strains/og-kush',
        })
        expect(result.success).toBe(true)
    })

    it('rejects confidence > 1', () => {
        const result = dataProvenanceSchema.safeParse({
            provider: 'otreeba',
            fetchedAt: '2024-06-15T10:30:00Z',
            confidence: 1.5,
        })
        expect(result.success).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// labTestResultSchema
// ---------------------------------------------------------------------------

describe('labTestResultSchema', () => {
    it('validates a lab test result', () => {
        const result = labTestResultSchema.safeParse({
            labName: 'SC Labs',
            testDate: '2024-03-15',
            cannabinoids: { THC: 22.3, CBD: 0.1 },
            terpenes: { Myrcene: 0.4 },
            safetyPassed: true,
        })
        expect(result.success).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// strainLineageSchema
// ---------------------------------------------------------------------------

describe('strainLineageSchema', () => {
    it('validates a lineage record', () => {
        const result = strainLineageSchema.safeParse({
            parents: [{ name: 'Chemdawg' }, { name: 'Hindu Kush' }],
            breeder: 'Reserva Privada',
            yearReleased: 1996,
            isIBL: false,
        })
        expect(result.success).toBe(true)
    })

    it('validates empty lineage', () => {
        const result = strainLineageSchema.safeParse({})
        expect(result.success).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// medicalInfoSchema
// ---------------------------------------------------------------------------

describe('medicalInfoSchema', () => {
    it('validates a medical info record', () => {
        const result = medicalInfoSchema.safeParse({
            euNovelFood: true,
            euCatalogListed: false,
            gmpCertified: true,
            cultivationCountry: 'DE',
        })
        expect(result.success).toBe(true)
    })

    it('validates empty medical info', () => {
        const result = medicalInfoSchema.safeParse({})
        expect(result.success).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// terpeneInteractionSchema
// ---------------------------------------------------------------------------

describe('terpeneInteractionSchema', () => {
    it('validates a valid interaction', () => {
        const result = terpeneInteractionSchema.safeParse({
            cannabinoid: 'THC',
            effect: 'Enhanced sedation',
            strength: 'high',
        })
        expect(result.success).toBe(true)
    })

    it('rejects invalid strength', () => {
        const result = terpeneInteractionSchema.safeParse({
            cannabinoid: 'THC',
            effect: 'Some effect',
            strength: 'extreme',
        })
        expect(result.success).toBe(false)
    })

    it('rejects missing cannabinoid', () => {
        const result = terpeneInteractionSchema.safeParse({
            effect: 'Some effect',
            strength: 'medium',
        })
        expect(result.success).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// enhancedTerpeneSchema
// ---------------------------------------------------------------------------

describe('enhancedTerpeneSchema', () => {
    it('validates a minimal enhanced terpene', () => {
        const result = enhancedTerpeneSchema.safeParse({
            name: 'Myrcene',
            percentage: 25.4,
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.aromaNotes).toEqual([])
            expect(result.data.primaryEffects).toEqual([])
            expect(result.data.cannabinoidInteractions).toEqual([])
        }
    })

    it('validates a fully specified enhanced terpene', () => {
        const result = enhancedTerpeneSchema.safeParse({
            name: 'Limonene',
            percentage: 18.0,
            role: 'dominant',
            aromaNotes: ['Citrus', 'Lemon'],
            primaryEffects: ['Uplifting', 'Anti-Anxiety'],
            cannabinoidInteractions: [
                { cannabinoid: 'THC', effect: 'Anxiety reduction', strength: 'high' },
            ],
            entourageScore: 8.5,
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.role).toBe('dominant')
            expect(result.data.entourageScore).toBe(8.5)
        }
    })

    it('rejects entourageScore above 10', () => {
        const result = enhancedTerpeneSchema.safeParse({
            name: 'Myrcene',
            percentage: 25,
            entourageScore: 11,
        })
        expect(result.success).toBe(false)
    })

    it('rejects invalid role value', () => {
        const result = enhancedTerpeneSchema.safeParse({
            name: 'Myrcene',
            percentage: 25,
            role: 'major',
        })
        expect(result.success).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// flavonoidInteractionSchema
// ---------------------------------------------------------------------------

describe('flavonoidInteractionSchema', () => {
    it('validates a minimal flavonoid', () => {
        const result = flavonoidInteractionSchema.safeParse({
            name: 'Cannflavin A',
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.cannabinoidInteractions).toEqual([])
        }
    })

    it('validates a full flavonoid with interactions', () => {
        const result = flavonoidInteractionSchema.safeParse({
            name: 'Quercetin',
            role: 'secondary',
            percentage: 0.05,
            entourageScore: 6.5,
            cannabinoidInteractions: [
                { cannabinoid: 'CBD', effect: 'Antioxidant synergy', strength: 'medium' },
            ],
        })
        expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
        const result = flavonoidInteractionSchema.safeParse({ name: '' })
        expect(result.success).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// entourageInsightSchema
// ---------------------------------------------------------------------------

describe('entourageInsightSchema', () => {
    it('validates a minimal insight', () => {
        const result = entourageInsightSchema.safeParse({ totalScore: 72 })
        expect(result.success).toBe(true)
    })

    it('validates a full insight', () => {
        const result = entourageInsightSchema.safeParse({
            totalScore: 85,
            terpeneDiversity: 1.8,
            dominantSynergy: 'Myrcene + THC: Enhanced sedation',
            flavonoidContribution: 7.2,
            summary: 'High entourage potential with Myrcene-dominant profile.',
        })
        expect(result.success).toBe(true)
    })

    it('rejects totalScore above 100', () => {
        const result = entourageInsightSchema.safeParse({ totalScore: 101 })
        expect(result.success).toBe(false)
    })

    it('rejects negative totalScore', () => {
        const result = entourageInsightSchema.safeParse({ totalScore: -1 })
        expect(result.success).toBe(false)
    })
})
