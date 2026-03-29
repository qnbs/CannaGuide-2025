/**
 * Tests for strainSchemas (Zod validation)
 */

import { describe, it, expect } from 'vitest'
import {
    externalStrainDataSchema,
    seedfinderStrainSchema,
    otreebaStrainSchema,
    kushyStrainSchema,
    dataProvenanceSchema,
    labTestResultSchema,
    strainLineageSchema,
    medicalInfoSchema,
} from '@/types/strainSchemas'

// ---------------------------------------------------------------------------
// externalStrainDataSchema
// ---------------------------------------------------------------------------

describe('externalStrainDataSchema', () => {
    it('validates minimal external strain data', () => {
        const result = externalStrainDataSchema.safeParse({
            name: 'OG Kush',
            provider: 'seedfinder',
            externalId: 'sf-123',
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
            provider: 'seedfinder',
            externalId: 'sf-123',
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
            provider: 'seedfinder',
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
// seedfinderStrainSchema
// ---------------------------------------------------------------------------

describe('seedfinderStrainSchema', () => {
    it('validates a seedfinder strain response', () => {
        const result = seedfinderStrainSchema.safeParse({
            id: 'sf-123',
            name: 'OG Kush',
            breeder: 'Reserva Privada',
            type: 'mostly_indica',
            cbd: 'low',
            flowering: { indoor: 56, outdoor: 70 },
        })
        expect(result.success).toBe(true)
    })

    it('accepts minimal seedfinder data', () => {
        const result = seedfinderStrainSchema.safeParse({
            id: 'sf-1',
            name: 'Test Strain',
        })
        expect(result.success).toBe(true)
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
            provider: 'seedfinder',
            fetchedAt: '2024-06-15T10:30:00Z',
            externalId: 'sf-123',
            labVerified: true,
            confidence: 0.85,
            sourceUrl: 'https://en.seedfinder.eu/strain-info/OG_Kush/',
        })
        expect(result.success).toBe(true)
    })

    it('rejects confidence > 1', () => {
        const result = dataProvenanceSchema.safeParse({
            provider: 'seedfinder',
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
