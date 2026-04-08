/**
 * Zod Schemas for External Strain Data Validation
 *
 * Validates and sanitizes strain data from external enrichment providers
 * (Otreeba, Strain API, CannSeek, OpenTHC, Cansativa, Kushy, community
 * datasets) before merging into the local IndexedDB/Redux strain catalog.
 *
 * Core strain catalog was curated via AI-assisted research (Gemini, Opus)
 * based on publicly available breeder, seedbank, and community information.
 *
 * All schemas are permissive (partial) to handle incomplete API responses
 * gracefully while enforcing type safety on the fields that are present.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Primitive enums
// ---------------------------------------------------------------------------

const strainTypeSchema = z.enum(['Sativa', 'Indica', 'Hybrid'])
const floweringTypeSchema = z.enum(['Photoperiod', 'Autoflowering', 'Fast-Flowering'])
const difficultySchema = z.enum(['Easy', 'Medium', 'Hard'])
const yieldSchema = z.enum(['Low', 'Medium', 'High', 'Very High'])
const heightSchema = z.enum(['Short', 'Medium', 'Tall', 'Very Tall'])

const strainApiProviderSchema = z.enum([
    'otreeba',
    'cannlytics',
    'strainapi',
    'cannseek',
    'openthc',
    'cansativa',
    'kushy',
    'community',
])

// ---------------------------------------------------------------------------
// Terpene / Cannabinoid / Flavonoid profiles
// ---------------------------------------------------------------------------

/** Validates a terpene name string (loose -- accepts any string for forward compat) */
const terpeneProfileSchema = z.record(z.string(), z.number().min(0).max(100))

const cannabinoidProfileSchema = z.record(z.string(), z.number().min(0).max(100))

const flavonoidProfileSchema = z.record(z.string(), z.number().min(0).max(100))

// ---------------------------------------------------------------------------
// Data Provenance
// ---------------------------------------------------------------------------

export const dataProvenanceSchema = z.object({
    provider: strainApiProviderSchema,
    fetchedAt: z.string().datetime({ offset: true }).catch(new Date().toISOString()),
    externalId: z.string().max(256).optional(),
    labVerified: z.boolean().default(false),
    confidence: z.number().min(0).max(1).default(0.5),
    sourceUrl: z.string().url().max(2048).optional(),
    dataVersion: z.string().max(64).optional(),
})

// ---------------------------------------------------------------------------
// Lab Test Result
// ---------------------------------------------------------------------------

export const labTestResultSchema = z.object({
    labName: z.string().min(1).max(256),
    testDate: z.string().datetime({ offset: true }).catch(new Date().toISOString()),
    coaUrl: z.string().url().max(2048).optional(),
    batchId: z.string().max(128).optional(),
    cannabinoids: cannabinoidProfileSchema.default({}),
    terpenes: terpeneProfileSchema.optional(),
    moisture: z.number().min(0).max(100).optional(),
    safetyPassed: z.boolean().optional(),
    jurisdiction: z.string().max(64).optional(),
})

// ---------------------------------------------------------------------------
// Lineage
// ---------------------------------------------------------------------------

const lineageParentSchema = z.object({
    name: z.string().min(1).max(256),
    id: z.string().max(256).optional(),
})

export const strainLineageSchema = z.object({
    parents: z.array(lineageParentSchema).max(10).default([]),
    children: z.array(lineageParentSchema).max(200).optional(),
    breeder: z.string().max(256).optional(),
    breederCountry: z.string().max(64).optional(),
    yearReleased: z.number().int().min(1960).max(2030).optional(),
    generation: z.string().max(32).optional(),
    landraceOrigins: z.array(z.string().max(128)).max(20).optional(),
    isIBL: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Medical Info
// ---------------------------------------------------------------------------

export const medicalInfoSchema = z.object({
    euNovelFood: z.boolean().optional(),
    euCatalogListed: z.boolean().optional(),
    pzn: z.string().max(16).optional(),
    apothekenpflichtig: z.boolean().optional(),
    gmpCertified: z.boolean().optional(),
    irradiated: z.boolean().optional(),
    cultivationCountry: z.string().max(64).optional(),
})

// ---------------------------------------------------------------------------
// External Strain Data (unified schema for any provider)
// ---------------------------------------------------------------------------

export const externalStrainDataSchema = z.object({
    provider: strainApiProviderSchema,
    externalId: z.string().max(256).optional(),
    name: z
        .string()
        .min(1)
        .max(256)
        .transform((s) => s.trim()),
    type: strainTypeSchema.optional(),
    typeDetails: z.string().max(256).optional(),
    genetics: z.string().max(512).optional(),
    floweringType: floweringTypeSchema.optional(),
    description: z
        .string()
        .max(10_000)
        .transform((s) => s.trim())
        .optional(),
    thc: z.number().min(0).max(100).optional(),
    cbd: z.number().min(0).max(100).optional(),
    cbg: z.number().min(0).max(100).optional(),
    thcv: z.number().min(0).max(100).optional(),
    thcRange: z.string().max(32).optional(),
    cbdRange: z.string().max(32).optional(),
    floweringTime: z.number().int().min(1).max(365).optional(),
    floweringTimeRange: z.string().max(32).optional(),
    effects: z.array(z.string().max(64)).max(30).optional(),
    aromas: z.array(z.string().max(64)).max(30).optional(),
    dominantTerpenes: z.array(z.string().max(64)).max(15).optional(),
    terpeneProfile: terpeneProfileSchema.optional(),
    cannabinoidProfile: cannabinoidProfileSchema.optional(),
    flavonoidProfile: flavonoidProfileSchema.optional(),
    labTested: z.boolean().optional(),
    labResults: z.array(labTestResultSchema).max(20).optional(),
    lineage: strainLineageSchema.optional(),
    medicalInfo: medicalInfoSchema.optional(),
    agronomic: z
        .object({
            difficulty: difficultySchema.optional(),
            yield: yieldSchema.optional(),
            height: heightSchema.optional(),
            yieldDetails: z
                .object({
                    indoor: z.string().max(64).optional(),
                    outdoor: z.string().max(64).optional(),
                })
                .optional(),
            heightDetails: z
                .object({
                    indoor: z.string().max(64).optional(),
                    outdoor: z.string().max(64).optional(),
                })
                .optional(),
        })
        .optional(),
    dataProvenance: dataProvenanceSchema.optional(),
    sourceUrl: z.string().url().max(2048).optional(),
})

export type ValidatedExternalStrainData = z.infer<typeof externalStrainDataSchema>

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Otreeba-specific response schema
// ---------------------------------------------------------------------------

export const otreebaStrainSchema = z.object({
    ucpc: z.string().max(64).optional(),
    name: z
        .string()
        .min(1)
        .max(256)
        .transform((s) => s.trim()),
    genetics: z
        .object({
            names: z.string().max(512).optional(),
        })
        .optional(),
    lineage: z.record(z.string(), z.string().max(256)).optional(),
    seed_company: z
        .object({
            name: z.string().max(256).optional(),
            ucpc: z.string().max(64).optional(),
        })
        .optional(),
    qr: z.string().url().max(2048).optional(),
    url: z.string().url().max(2048).optional(),
    image: z.string().url().max(2048).optional(),
    reviews: z
        .object({
            count: z.number().int().optional(),
            score: z.number().min(0).max(5).optional(),
        })
        .optional(),
})

export type ValidatedOtreebaStrain = z.infer<typeof otreebaStrainSchema>

// ---------------------------------------------------------------------------
// Kushy/Community JSON dataset record
// ---------------------------------------------------------------------------

export const kushyStrainSchema = z.object({
    name: z
        .string()
        .min(1)
        .max(256)
        .transform((s) => s.trim()),
    race: z.string().max(64).optional(),
    flavors: z
        .union([z.string().max(512), z.array(z.string().max(64))])
        .transform((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()) : v))
        .optional(),
    positive: z
        .union([z.string().max(512), z.array(z.string().max(64))])
        .transform((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()) : v))
        .optional(),
    negative: z
        .union([z.string().max(512), z.array(z.string().max(64))])
        .transform((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()) : v))
        .optional(),
    medical: z
        .union([z.string().max(512), z.array(z.string().max(64))])
        .transform((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()) : v))
        .optional(),
    description: z.string().max(10_000).optional(),
    id: z.union([z.string().max(64), z.number()]).optional(),
})

export type ValidatedKushyStrain = z.infer<typeof kushyStrainSchema>

// ---------------------------------------------------------------------------
// Batch import result
// ---------------------------------------------------------------------------

export interface StrainImportResult {
    /** Total records processed */
    total: number
    /** Successfully validated and imported */
    imported: number
    /** Failed validation */
    failed: number
    /** Merged with existing strains (enrichment) */
    merged: number
    /** New strains added */
    added: number
    /** Validation errors by field */
    errors: Array<{ index: number; field: string; message: string }>
    /** Provider that was imported */
    provider: string
    /** Timestamp of import */
    importedAt: string
}

// ---------------------------------------------------------------------------
// Entourage effect schemas (terpene x cannabinoid x flavonoid interactions)
// Based on Russo (2011) + Booth & Bohlmann (2019)
// ---------------------------------------------------------------------------

/** Directional interaction between a terpene/flavonoid and a cannabinoid */
export const terpeneInteractionSchema = z.object({
    cannabinoid: z.string().min(1).max(32),
    effect: z.string().min(1).max(256),
    strength: z.enum(['low', 'medium', 'high']),
})

/** Enhanced terpene data point with full entourage metadata */
export const enhancedTerpeneSchema = z.object({
    name: z.string().min(1).max(64),
    percentage: z.number().min(0).max(100),
    role: z.enum(['dominant', 'secondary', 'trace']).optional(),
    aromaNotes: z.array(z.string().max(64)).max(10).default([]),
    primaryEffects: z.array(z.string().max(64)).max(8).default([]),
    cannabinoidInteractions: z.array(terpeneInteractionSchema).max(10).default([]),
    entourageScore: z.number().min(0).max(10).optional(),
})

export type EnhancedTerpenePoint = z.infer<typeof enhancedTerpeneSchema>

/** Flavonoid data point with cannabinoid interaction metadata */
export const flavonoidInteractionSchema = z.object({
    name: z.string().min(1).max(64),
    percentage: z.number().min(0).max(100).optional(),
    role: z.enum(['dominant', 'secondary', 'trace']).optional(),
    cannabinoidInteractions: z.array(terpeneInteractionSchema).max(10).default([]),
    entourageScore: z.number().min(0).max(10).optional(),
})

export type FlavonoidInteractionPoint = z.infer<typeof flavonoidInteractionSchema>

/** Overall entourage effect insight for a strain result */
export const entourageInsightSchema = z.object({
    totalScore: z.number().min(0).max(100),
    terpeneDiversity: z.number().min(0).max(5).optional(),
    dominantSynergy: z.string().max(256).optional(),
    flavonoidContribution: z.number().min(0).max(10).optional(),
    summary: z.string().max(512).optional(),
})
