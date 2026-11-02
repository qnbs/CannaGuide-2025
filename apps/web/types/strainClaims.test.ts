import { describe, expect, it } from 'vitest'
import { strainClaimSchema, strainFactSchema, conflictingPartyClaims, durationsMatch } from '@cannaguide/ai-core'
import type { StrainClaim } from '@cannaguide/ai-core'

const cultivarId = 'cultivar_selection:synthetic-1'

const unverified = {
    version: 1 as const,
    cultivarId,
    sourceId: null,
    evidenceIds: [] as string[],
    claimStatus: 'unknown' as const,
    rights: 'unknown' as const,
}

const attributed = {
    version: 1 as const,
    cultivarId,
    claimStatus: 'source_attributed' as const,
    rights: 'schema_only' as const,
}

const party = (
    name: string,
    source: string,
    role: 'publisher' | 'breeder' | 'grower' = 'publisher',
    id: string = cultivarId,
): StrainClaim =>
    strainClaimSchema.parse({
        ...attributed,
        cultivarId: id,
        kind: 'party',
        role,
        name,
        sourceId: `source:${source}`,
        evidenceIds: [`evidence:${source}`],
    })

describe('non-chemical cultivar claims', () => {
    it('keeps an unknown breeder and two conflicting publisher names', () => {
        const breeder = strainClaimSchema.parse({
            ...unverified,
            kind: 'party',
            role: 'breeder',
            name: null,
        })
        const alpha = party('Alpha Seeds', 'alpha')
        const beta = party('Beta Seeds', 'beta')
        expect(breeder).toMatchObject({ role: 'breeder', name: null, claimStatus: 'unknown' })
        expect(conflictingPartyClaims([breeder, alpha, beta])).toEqual([[alpha, beta]])
        expect(conflictingPartyClaims([alpha, alpha])).toEqual([])
        const otherRole = party('Other Breeder', 'other-breeder', 'breeder')
        const otherCultivar = party('Gamma Seeds', 'gamma', 'publisher', 'cultivar_selection:synthetic-2')
        const growers = [
            party('Grower A', 'grower-a', 'grower'),
            party('Grower B', 'grower-b', 'grower'),
        ]
        expect(conflictingPartyClaims([alpha, otherRole, otherCultivar, ...growers])).toEqual([])
        expect(
            conflictingPartyClaims([
                party('Breeder A', 'breeder-a', 'breeder'),
                party('Breeder B', 'breeder-b', 'breeder'),
            ]),
        ).toHaveLength(1)
    })

    it('rejects an attributed party with no name and an unverified party with a name', () => {
        const nameless = strainClaimSchema.safeParse({
            ...attributed,
            kind: 'party',
            role: 'publisher',
            name: null,
            sourceId: 'source:alpha',
            evidenceIds: ['evidence:alpha'],
        })
        expect(nameless.success).toBe(false)
        const named = strainClaimSchema.safeParse({
            ...unverified,
            kind: 'party',
            role: 'breeder',
            name: 'Named',
        })
        expect(named.success).toBe(false)
    })

    it('keeps feminized and autoflower as independent forms', () => {
        const feminized = strainClaimSchema.parse({
            ...attributed,
            kind: 'propagation_form',
            form: 'feminized',
            sourceId: 'source:form',
            evidenceIds: ['evidence:form'],
        })
        const autoflower = strainClaimSchema.parse({
            ...attributed,
            kind: 'propagation_form',
            form: 'autoflower',
            sourceId: 'source:form',
            evidenceIds: ['evidence:form-auto'],
        })
        expect(feminized.kind === 'propagation_form' && feminized.form).toBe('feminized')
        expect(autoflower.kind === 'propagation_form' && autoflower.form).toBe('autoflower')
        expect(feminized).not.toEqual(autoflower)
    })

    it('keeps 45 flowering days distinct from 9 lifecycle weeks', () => {
        const flowering = strainClaimSchema.parse({
            ...attributed,
            kind: 'duration',
            subject: 'flowering',
            quantity: 45,
            unit: 'days',
            sourceId: 'source:flowering',
            evidenceIds: ['evidence:flowering'],
        })
        const lifecycle = strainClaimSchema.parse({
            ...attributed,
            kind: 'duration',
            subject: 'lifecycle',
            quantity: 9,
            unit: 'weeks',
            sourceId: 'source:lifecycle',
            evidenceIds: ['evidence:lifecycle'],
        })
        const sameDays = strainClaimSchema.parse({
            ...attributed,
            kind: 'duration',
            subject: 'flowering',
            quantity: 63,
            unit: 'days',
            sourceId: 'source:days',
            evidenceIds: ['evidence:days'],
        })
        const nineWeeks = strainClaimSchema.parse({
            ...attributed,
            kind: 'duration',
            subject: 'flowering',
            quantity: 9,
            unit: 'weeks',
            sourceId: 'source:weeks',
            evidenceIds: ['evidence:weeks'],
        })
        const otherCultivar = strainClaimSchema.parse({
            ...attributed,
            cultivarId: 'cultivar_selection:synthetic-2',
            kind: 'duration',
            subject: 'flowering',
            quantity: 45,
            unit: 'days',
            sourceId: 'source:other',
            evidenceIds: ['evidence:other'],
        })
        expect(durationsMatch(flowering, lifecycle)).toBe(false)
        expect(durationsMatch(sameDays, nineWeeks)).toBe(false)
        expect(durationsMatch(flowering, otherCultivar)).toBe(false)
        expect(durationsMatch(flowering, flowering)).toBe(true)
    })

    it('does not accept a party claim as a laboratory analyte fact', () => {
        const claim = party('Alpha Seeds', 'alpha')
        expect(strainFactSchema.safeParse(claim).success).toBe(false)
    })
})
