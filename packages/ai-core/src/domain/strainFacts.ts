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
const analyteUnits: Record<
    z.infer<typeof common.analyte>,
    readonly z.infer<typeof common.unit>[]
> = {
    thc: ['%', 'ppm', '\u00b5g/kg'],
    thca: ['%', 'ppm', '\u00b5g/kg'],
    total_thc: ['%', 'ppm', '\u00b5g/kg'],
    cbd: ['%', 'ppm', '\u00b5g/kg'],
    cbda: ['%', 'ppm', '\u00b5g/kg'],
    total_cbd: ['%', 'ppm', '\u00b5g/kg'],
    aflatoxin_b1: ['ppm', '\u00b5g/kg'],
    arsenic: ['ppm', '\u00b5g/kg'],
}
const amount = z.number().finite().nonnegative()

/** Simulation estimates deliberately have no variant in the factual schema. */
const factShape = z.discriminatedUnion('state', [
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

type FactShape = z.infer<typeof factShape>
type RejectFact = (message: string) => void
const unverifiedStates = new Set(['unknown', 'legacy_unverified'])
const unverifiedStatuses = new Set(['unknown', 'unverified'])
const labStates = new Set(['lab_measured_point', 'lab_measured_bound'])
const productScopes = new Set(['medical_flower_product', 'medical_extract_product'])
const batchScopes = new Set(['product_batch', 'laboratory_result'])

const validateStatedFact = (fact: FactShape, reject: RejectFact): void => {
    if (fact.sourceId === null || unverifiedStatuses.has(fact.claimStatus))
        reject('Stated facts require an attributed source')
    if (fact.evidenceIds.length === 0) reject('A stated fact requires evidence IDs')
}

const validateAttribution = (fact: FactShape, reject: RejectFact): void => {
    if (!unverifiedStates.has(fact.state)) {
        validateStatedFact(fact, reject)
        return
    }
    if (!unverifiedStatuses.has(fact.claimStatus))
        reject('Unknown and legacy values cannot carry attributed claim status')
}

const validateLaboratoryStatus = (fact: FactShape, reject: RejectFact): void => {
    if (labStates.has(fact.state)) return
    if (fact.claimStatus === 'laboratory_reported')
        reject('Laboratory claim status requires a measured laboratory state')
}

const validateLabScope = (fact: FactShape, reject: RejectFact): void => {
    if (fact.claimStatus !== 'laboratory_reported')
        reject('Lab facts require a laboratory report claim')
    if (!batchScopes.has(fact.scope.kind)) reject('Lab facts require an exact batch scope')
}

const validateScope = (fact: FactShape, reject: RejectFact): void => {
    if (labStates.has(fact.state)) validateLabScope(fact, reject)
    if (productScopes.has(fact.scope.kind)) return
    if (fact.state === 'source_stated_nominal') reject('Nominal labels require a product scope')
    if (fact.state === 'specification_interval') reject('Specifications require a product scope')
}

const concentrationValues = (fact: FactShape): number[] => {
    if (fact.state === 'specification_interval') return [fact.lower, fact.upper]
    if (fact.state === 'lab_measured_bound') return [fact.limit]
    return fact.value === null ? [] : [fact.value]
}

const validateConcentration = (fact: FactShape, reject: RejectFact): void => {
    if (!analyteUnits[fact.analyte].includes(fact.unit))
        reject('Unit is not supported for this analyte')
    const ceiling = { '%': 100, ppm: 1000000, '\u00b5g/kg': 1000000000 }[fact.unit]
    if (concentrationValues(fact).some((value) => value > ceiling))
        reject('Concentration exceeds unit maximum')
}

const validateInterval = (fact: FactShape, reject: RejectFact): void => {
    if (fact.state !== 'specification_interval') return
    const hasOpenBoundary = [fact.lowerOperator, fact.upperOperator].some(
        (operator) => operator === '>' || operator === '<',
    )
    const emptyPointInterval = fact.lower === fact.upper && hasOpenBoundary
    if (fact.lower > fact.upper || emptyPointInterval)
        reject('Interval lower bound exceeds upper bound')
}

/** A nonnegative amount cannot satisfy `< 0`; `<= 0` remains a real measured zero. */
const validateBound = (fact: FactShape, reject: RejectFact): void => {
    if (fact.state !== 'lab_measured_bound') return
    if (fact.operator === '<' && fact.limit === 0)
        reject('A strict upper bound of zero is empty for a nonnegative amount')
}

export const strainFactSchema = factShape.superRefine((fact, ctx) => {
    const reject: RejectFact = (message) => ctx.addIssue({ code: 'custom', message })
    validateAttribution(fact, reject)
    validateLaboratoryStatus(fact, reject)
    validateScope(fact, reject)
    validateConcentration(fact, reject)
    validateInterval(fact, reject)
    validateBound(fact, reject)
    if (new Set(fact.evidenceIds).size !== fact.evidenceIds.length)
        reject('Evidence IDs must be unique')
})

export type StrainFact = z.infer<typeof strainFactSchema>
export type StrainFactScope = z.infer<typeof scopeSchema>

const scopeIdentity = (scope: StrainFactScope): readonly (string | undefined)[] => [
    scope.kind,
    scope.id,
    'productId' in scope ? scope.productId : undefined,
    'batchId' in scope ? scope.batchId : undefined,
]

/** A batch result cannot be reused for a product or a different batch. */
export const factMatchesScope = (fact: StrainFact, target: StrainFactScope): boolean => {
    if (fact.scope.kind === 'laboratory_result' && target.kind === 'product_batch')
        return fact.scope.batchId === target.id && fact.scope.productId === target.productId
    const targetIdentity = scopeIdentity(target)
    return scopeIdentity(fact.scope).every((value, index) => value === targetIdentity[index])
}

/** Rights are explicit admission metadata, never inferred from a source URL. */
export const isFactReleaseEligible = (fact: StrainFact): boolean => {
    const parsed = strainFactSchema.safeParse(fact)
    return (
        parsed.success &&
        parsed.data.rights === 'production_permitted' &&
        parsed.data.state !== 'unknown' &&
        parsed.data.state !== 'legacy_unverified'
    )
}

/** Pure sidecar adapter: preserves private IDs and never promotes legacy numbers. */
export const adaptLegacyStrainFacts = (
    legacy: {
        id: string
        thc?: number | null | undefined
        cbd?: number | null | undefined
    },
    identity?: StrainFactScope,
): { id: string; thc: StrainFact; cbd: StrainFact } => {
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
        scope: { ...scope },
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
