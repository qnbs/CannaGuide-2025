import { z } from 'zod'

/** Additive v1 boundary. Existing Strain values remain legacy, not lab evidence. */
const entityId = <T extends string>(kind: T) =>
    z
        .string()
        .refine(
            (id) => id.startsWith(`${kind}:`) && id.length > kind.length + 1 && !/\s/.test(id),
            `Expected a nonblank ${kind} identifier without whitespace`,
        )
const legacyId = z.string().refine((id) => id.trim().length > 0, 'Identity must not be blank')
const productId = z.union([entityId('medical_flower_product'), entityId('medical_extract_product')])
const scopeSchema = z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('cultivar_selection'), id: entityId('cultivar_selection') }),
    z.strictObject({
        kind: z.literal('medical_flower_product'),
        id: entityId('medical_flower_product'),
    }),
    z.strictObject({
        kind: z.literal('medical_extract_product'),
        id: entityId('medical_extract_product'),
    }),
    z.strictObject({ kind: z.literal('product_batch'), id: entityId('product_batch'), productId }),
    z.strictObject({
        kind: z.literal('laboratory_result'),
        id: entityId('laboratory_result'),
        batchId: entityId('product_batch'),
        productId,
    }),
    z.strictObject({ kind: z.literal('user'), id: legacyId }),
    z.strictObject({ kind: z.literal('legacy'), id: legacyId }),
])
const dateSchema = z.iso.date().nullable()
const common = {
    version: z.literal(1),
    analyte: z.enum([
        'thc',
        'thca',
        'total_thc',
        'cbd',
        'cbda',
        'total_cbd',
        'aflatoxin_b1',
        'arsenic',
    ]),
    unit: z.enum(['%', 'ppm', '\u00b5g/kg']),
    scope: scopeSchema,
    evidenceIds: z.array(entityId('evidence')),
    sourceId: entityId('source').nullable(),
    claimStatus: z.enum([
        'unknown',
        'unverified',
        'primary_breeder_attributed',
        'source_attributed',
        'laboratory_reported',
    ]),
    basis: z.enum(['unknown', 'dry_weight', 'as_received']).nullable(),
    laboratoryId: entityId('laboratory').nullable().optional(),
    dates: z.strictObject({
        sampleDate: dateSchema.optional(),
        testDate: dateSchema.optional(),
        generalReportDate: dateSchema.optional(),
        certificateDate: dateSchema.optional(),
        publishedAt: dateSchema.optional(),
        observedAt: dateSchema.optional(),
    }),
    method: z.string().trim().min(1).nullable(),
    rights: z.enum(['unknown', 'restricted', 'schema_only', 'production_permitted']),
}
const amount = z.number().finite().nonnegative()

/** Simulation estimates deliberately have no variant in the factual schema. */
export const strainFactSchema = z
    .discriminatedUnion('state', [
        z.strictObject({ ...common, state: z.literal('unknown'), value: z.null() }),
        z.strictObject({ ...common, state: z.literal('legacy_unverified'), value: z.null() }),
        z.strictObject({ ...common, state: z.literal('source_stated_nominal'), value: amount }),
        z.strictObject({ ...common, state: z.literal('lab_measured_point'), value: amount }),
        z.strictObject({
            ...common,
            state: z.literal('lab_measured_bound'),
            value: z.null(),
            operator: z.enum(['<', '<=']),
            limit: amount,
        }),
        z.strictObject({
            ...common,
            state: z.literal('specification_interval'),
            value: z.null(),
            lower: amount,
            lowerOperator: z.enum(['>', '>=']),
            upper: amount,
            upperOperator: z.enum(['<', '<=']),
        }),
    ])
    .superRefine((fact, ctx) => {
        const known = fact.state !== 'unknown' && fact.state !== 'legacy_unverified'
        const lab = fact.state === 'lab_measured_point' || fact.state === 'lab_measured_bound'
        const reject = (message: string) => ctx.addIssue({ code: 'custom', message })
        if (
            known &&
            (fact.sourceId === null ||
                fact.claimStatus === 'unknown' ||
                fact.claimStatus === 'unverified')
        )
            reject('Stated facts require an attributed source')
        if (lab && fact.claimStatus !== 'laboratory_reported')
            reject('Lab facts require a laboratory report claim')
        if (!known && fact.claimStatus !== 'unknown' && fact.claimStatus !== 'unverified')
            reject('Unknown and legacy values cannot carry attributed claim status')
        if (known && fact.evidenceIds.length === 0) reject('A stated fact requires evidence IDs')
        if (new Set(fact.evidenceIds).size !== fact.evidenceIds.length)
            reject('Evidence IDs must be unique')
        if (lab && fact.scope.kind !== 'product_batch' && fact.scope.kind !== 'laboratory_result')
            reject('Lab facts require an exact batch scope')
        if (
            fact.state === 'source_stated_nominal' &&
            fact.scope.kind !== 'medical_flower_product' &&
            fact.scope.kind !== 'medical_extract_product'
        )
            reject('Nominal labels require a product scope')
        if (
            fact.state === 'specification_interval' &&
            fact.scope.kind !== 'medical_flower_product' &&
            fact.scope.kind !== 'medical_extract_product'
        )
            reject('Specifications require a product scope')
        const ceiling = { '%': 100, ppm: 1000000, '\u00b5g/kg': 1000000000 }[fact.unit]
        const values =
            fact.state === 'specification_interval'
                ? [fact.lower, fact.upper]
                : fact.state === 'lab_measured_bound'
                  ? [fact.limit]
                  : fact.value === null
                    ? []
                    : [fact.value]
        if (values.some((value) => value > ceiling)) reject('Concentration exceeds unit maximum')
        if (
            fact.state === 'specification_interval' &&
            (fact.lower > fact.upper ||
                (fact.lower === fact.upper &&
                    (fact.lowerOperator === '>' || fact.upperOperator === '<')))
        )
            reject('Interval lower bound exceeds upper bound')
    })

export type StrainFact = z.infer<typeof strainFactSchema>
export type StrainFactScope = z.infer<typeof scopeSchema>

/** A batch result cannot be reused for a product or a different batch. */
export function factMatchesScope(fact: StrainFact, target: StrainFactScope): boolean {
    return (
        fact.scope.kind === target.kind &&
        fact.scope.id === target.id &&
        (!('productId' in fact.scope) ||
            ('productId' in target && fact.scope.productId === target.productId)) &&
        (!('batchId' in fact.scope) ||
            ('batchId' in target && fact.scope.batchId === target.batchId))
    )
}

/** Rights are explicit admission metadata, never inferred from a source URL. */
export function isFactReleaseEligible(fact: StrainFact): boolean {
    const parsed = strainFactSchema.safeParse(fact)
    return (
        parsed.success &&
        parsed.data.rights === 'production_permitted' &&
        parsed.data.state !== 'unknown' &&
        parsed.data.state !== 'legacy_unverified'
    )
}

/** Pure sidecar adapter: preserves private IDs and never promotes legacy numbers. */
export function adaptLegacyStrainFacts(
    legacy: {
        id: string
        thc?: number | null | undefined
        cbd?: number | null | undefined
    },
    identity?: StrainFactScope,
): { id: string; thc: StrainFact; cbd: StrainFact } {
    legacyId.parse(legacy.id)
    const scope = scopeSchema.parse(identity ?? { kind: 'legacy', id: legacy.id })
    const adapt = (analyte: 'thc' | 'cbd'): StrainFact => ({
        version: 1,
        state:
            legacy[analyte] === undefined || legacy[analyte] === null
                ? 'unknown'
                : 'legacy_unverified',
        value: null,
        analyte,
        unit: '%',
        // Legacy identity is opaque; it is not retroactively a certified cultivar ID.
        scope,
        evidenceIds: [],
        sourceId: null,
        claimStatus: 'unverified',
        basis: null,
        dates: {
            sampleDate: null,
            testDate: null,
            generalReportDate: null,
            certificateDate: null,
            publishedAt: null,
            observedAt: null,
        },
        method: null,
        rights: 'unknown',
    })
    return { id: legacy.id, thc: adapt('thc'), cbd: adapt('cbd') }
}

/** Attribution is a claim, not a verified genetic parent edge. */
export const lineageClaimSchema = z
    .strictObject({
        kind: z.enum([
            'direct_attributed',
            'selection_of',
            'selfing',
            'historical',
            'multiway_unresolved',
        ]),
        id: entityId('lineage_claim'),
        cultivarId: entityId('cultivar_selection'),
        claimedParentId: entityId('cultivar_selection')
            .refine((id) => id !== 'cultivar_selection:0', 'Zero is not a known parent identity')
            .nullable(),
        direction: z.enum(['maternal', 'paternal', 'unknown']),
        claimStatus: z.literal('primary_breeder_attributed'),
        sourceId: entityId('source'),
        evidenceIds: z.array(entityId('evidence')).min(1),
    })
    .refine(
        (claim) => new Set(claim.evidenceIds).size === claim.evidenceIds.length,
        'Evidence IDs must be unique',
    )
    .refine(
        (claim) => claim.claimedParentId !== claim.cultivarId,
        'A lineage claim cannot create a self-edge',
    )
export type LineageClaim = z.infer<typeof lineageClaimSchema>
