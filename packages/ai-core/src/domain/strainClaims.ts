import { z } from 'zod'

/**
 * Non-chemical cultivar claims. This schema is separate from strainFactSchema
 * and does not accept laboratory analytes or concentration units.
 * A missing claim stays absent. Explicit null is the unknown value.
 * Conflicting attributed names stay as separate claims.
 */

const entityId = <T extends string>(kind: T) =>
    z
        .string()
        .refine(
            (id) => id.startsWith(`${kind}:`) && id.length > kind.length + 1 && !/\s/.test(id),
            `Expected a nonblank ${kind} identifier without whitespace`,
        )

const claimStatusSchema = z.enum([
    'unknown',
    'unverified',
    'primary_breeder_attributed',
    'source_attributed',
])

const common = {
    version: z.literal(1),
    cultivarId: entityId('cultivar_selection'),
    sourceId: entityId('source').nullable(),
    evidenceIds: z.array(entityId('evidence')),
    claimStatus: claimStatusSchema,
    rights: z.enum(['unknown', 'restricted', 'schema_only', 'production_permitted']),
}

const partyRoles = [
    'breeder',
    'owner',
    'creator',
    'publisher',
    'co_developer',
    'grower',
    'wholesaler',
    'pharmacy_seller',
] as const

const claimShape = z.discriminatedUnion('kind', [
    z.strictObject({
        ...common,
        kind: z.literal('party'),
        role: z.enum(partyRoles),
        name: z.string().trim().min(1).nullable(),
    }),
    z.strictObject({
        ...common,
        kind: z.literal('propagation_form'),
        form: z.enum(['regular', 'feminized', 'autoflower', 'unknown']),
    }),
    z.strictObject({
        ...common,
        kind: z.literal('duration'),
        subject: z.enum(['flowering', 'lifecycle']),
        quantity: z.number().finite().nonnegative(),
        unit: z.enum(['days', 'weeks']),
    }),
])

type ClaimShape = z.infer<typeof claimShape>
type RejectClaim = (message: string) => void
const unverifiedStatuses = new Set(['unknown', 'unverified'])

const rejectUnverifiedSource = (claim: ClaimShape, reject: RejectClaim): boolean => {
    if (!unverifiedStatuses.has(claim.claimStatus)) return false
    if (claim.sourceId !== null) reject('Unverified claims cannot carry a source')
    if (claim.evidenceIds.length !== 0) reject('Unverified claims cannot carry evidence')
    return true
}

const rejectMissingSource = (claim: ClaimShape, reject: RejectClaim): void => {
    if (claim.sourceId === null) reject('Attributed claims require a source')
    if (claim.evidenceIds.length === 0) reject('Attributed claims require evidence')
}

const validateAttribution = (claim: ClaimShape, reject: RejectClaim): void => {
    if (rejectUnverifiedSource(claim, reject)) return
    rejectMissingSource(claim, reject)
}

const validateParty = (claim: ClaimShape, reject: RejectClaim): void => {
    if (claim.kind !== 'party') return
    if (claim.name === null) {
        if (!unverifiedStatuses.has(claim.claimStatus))
            reject('An attributed party requires a name')
        return
    }
    if (unverifiedStatuses.has(claim.claimStatus))
        reject('A named party requires an attributed claim status')
}

const validateForm = (claim: ClaimShape, reject: RejectClaim): void => {
    if (claim.kind !== 'propagation_form') return
    if (claim.form === 'unknown') {
        if (!unverifiedStatuses.has(claim.claimStatus))
            reject('An unknown form cannot be attributed')
        return
    }
    if (unverifiedStatuses.has(claim.claimStatus))
        reject('A stated form requires an attributed claim status')
}

const validateDuration = (claim: ClaimShape, reject: RejectClaim): void => {
    if (claim.kind !== 'duration') return
    if (unverifiedStatuses.has(claim.claimStatus))
        reject('A duration requires an attributed claim status')
}

export const strainClaimSchema = claimShape.superRefine((claim, ctx) => {
    const reject: RejectClaim = (message) => ctx.addIssue({ code: 'custom', message })
    validateAttribution(claim, reject)
    validateParty(claim, reject)
    validateForm(claim, reject)
    validateDuration(claim, reject)
    if (new Set(claim.evidenceIds).size !== claim.evidenceIds.length)
        reject('Evidence IDs must be unique')
})

export type StrainClaim = z.infer<typeof strainClaimSchema>

/**
 * One cultivar has one attributed breeder, owner, creator, or publisher.
 * Growers, co-developers, wholesalers, and pharmacy sellers may differ
 * without being a conflict. Neither claim is dropped.
 */
type PartyClaim = Extract<StrainClaim, { kind: 'party' }>
const singularRoles = new Set<PartyClaim['role']>(['breeder', 'owner', 'creator', 'publisher'])

const namedSingularParty = (
    claim: StrainClaim,
): claim is PartyClaim & { name: string } =>
    claim.kind === 'party' && claim.name !== null && singularRoles.has(claim.role)

const groupByCultivarRole = (
    claims: readonly (PartyClaim & { name: string })[],
): Map<string, PartyClaim[]> => {
    const groups = new Map<string, PartyClaim[]>()
    for (const claim of claims) {
        const key = `${claim.cultivarId} ${claim.role}`
        const group = groups.get(key) ?? []
        group.push(claim)
        groups.set(key, group)
    }
    return groups
}

const namesDiffer = (group: readonly PartyClaim[]): boolean =>
    new Set(group.map((claim) => claim.name)).size > 1

export const conflictingPartyClaims = (claims: readonly StrainClaim[]): PartyClaim[][] =>
    [...groupByCultivarRole(claims.filter(namedSingularParty)).values()].filter(namesDiffer)

/**
 * Days and weeks are different units. This does not convert 7 days into 1 week.
 * Flowering and lifecycle are different subjects. A match also requires the
 * same cultivar.
 */
export const durationsMatch = (left: StrainClaim, right: StrainClaim): boolean =>
    left.kind === 'duration' &&
    right.kind === 'duration' &&
    left.cultivarId === right.cultivarId &&
    left.subject === right.subject &&
    left.unit === right.unit &&
    left.quantity === right.quantity
