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

const validateAttribution = (claim: ClaimShape, reject: RejectClaim): void => {
    if (unverifiedStatuses.has(claim.claimStatus)) {
        if (claim.sourceId !== null) reject('Unverified claims cannot carry a source')
        if (claim.evidenceIds.length !== 0) reject('Unverified claims cannot carry evidence')
        return
    }
    if (claim.sourceId === null) reject('Attributed claims require a source')
    if (claim.evidenceIds.length === 0) reject('Attributed claims require evidence')
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

/** Same cultivar and role with two different attributed names. Neither claim is dropped. */
type PartyClaim = Extract<StrainClaim, { kind: 'party' }>

export const conflictingPartyClaims = (claims: readonly StrainClaim[]): PartyClaim[][] => {
    const groups = new Map<string, PartyClaim[]>()
    for (const claim of claims) {
        if (claim.kind !== 'party' || claim.name === null) continue
        const key = `${claim.cultivarId} ${claim.role}`
        const group = groups.get(key) ?? []
        group.push(claim)
        groups.set(key, group)
    }
    const conflicts: PartyClaim[][] = []
    for (const group of groups.values()) {
        const names = new Set(group.map((claim) => claim.name))
        if (names.size > 1) conflicts.push(group)
    }
    return conflicts
}

/**
 * Days and weeks are different units. This does not convert 7 days into 1 week.
 * Flowering and lifecycle are different subjects.
 */
export const durationsMatch = (left: StrainClaim, right: StrainClaim): boolean =>
    left.kind === 'duration' &&
    right.kind === 'duration' &&
    left.subject === right.subject &&
    left.unit === right.unit &&
    left.quantity === right.quantity
