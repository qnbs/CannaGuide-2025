import { describe, expect, it } from 'vitest'
import {
    strainFactSchema,
    adaptLegacyStrainFacts,
    isFactReleaseEligible,
    factMatchesScope,
    lineageClaimSchema,
} from '@cannaguide/ai-core'

const base = {
    version: 1,
    analyte: 'total_thc',
    unit: '%',
    scope: {
        kind: 'product_batch',
        id: 'product_batch:synthetic-1',
        productId: 'medical_flower_product:synthetic-1',
    },
    evidenceIds: ['evidence:synthetic-coa'],
    sourceId: 'source:synthetic-coa',
    claimStatus: 'laboratory_reported',
    basis: null,
    dates: {
        sampleDate: null,
        testDate: null,
        generalReportDate: '2026-10-30',
        certificateDate: null,
        publishedAt: null,
        observedAt: null,
    },
    method: null,
    rights: 'schema_only',
}
const point = { ...base, state: 'lab_measured_point', value: 0 }

describe('versioned strain fact boundary (synthetic fixtures only)', () => {
    it('keeps missing and legacy zero unverified without a numeric point or changing IDs', () => {
        const legacy = { id: 'user:private-42', thc: 0, cbd: undefined }
        const facts = adaptLegacyStrainFacts(legacy)
        expect(facts.id).toBe(legacy.id)
        expect(facts.thc).toMatchObject({ state: 'legacy_unverified', value: null })
        expect(facts.cbd).toMatchObject({ state: 'unknown', value: null })
        expect(legacy.thc).toBe(0)
        expect(strainFactSchema.parse(facts.thc)).toEqual(facts.thc)
    })
    it('keeps adapted fact identities independent from sibling and caller mutations', () => {
        const identity = { kind: 'legacy' as const, id: 'legacy:synthetic' }
        const facts = adaptLegacyStrainFacts({ id: 'synthetic', thc: 0, cbd: 0 }, identity)
        facts.thc.scope.id = 'legacy:changed'
        expect(facts.cbd.scope.id).toBe('legacy:synthetic')
        expect(identity.id).toBe('legacy:synthetic')
    })
    it('accepts explicit source-backed measured zero and preserves unknown test date', () => {
        expect(strainFactSchema.parse(point)).toEqual(point)
        expect(strainFactSchema.parse(point).dates.testDate).toBeNull()
    })
    it.each(['<', '<='] as const)('preserves the %s bound with no point', (operator) => {
        const bound = { ...base, state: 'lab_measured_bound', operator, limit: 0.1, value: null }
        expect(strainFactSchema.parse(bound)).toEqual(bound)
    })
    it('keeps nominal product labels distinct from exact batch measurements', () => {
        const nominal = {
            ...point,
            state: 'source_stated_nominal',
            scope: { kind: 'medical_flower_product', id: 'medical_flower_product:synthetic-1' },
            value: 1,
        }
        expect(strainFactSchema.parse(nominal).state).toBe('source_stated_nominal')
        expect(strainFactSchema.safeParse({ ...point, scope: nominal.scope }).success).toBe(false)
        expect(
            strainFactSchema.safeParse({
                ...point,
                scope: {
                    kind: 'product_batch',
                    id: 'product_batch:other',
                    productId: 'medical_flower_product:synthetic-1',
                },
            }).success,
        ).toBe(true)
    })
    it('never transfers synthetic batch 22.2/0.2 results by product name', () => {
        for (const [analyte, value] of [
            ['total_thc', 22.2],
            ['total_cbd', 0.2],
        ] as const) {
            const result = strainFactSchema.parse({ ...point, analyte, value })
            expect(
                factMatchesScope(
                    result,
                    base.scope as { kind: 'product_batch'; id: string; productId: string },
                ),
            ).toBe(true)
            expect(
                factMatchesScope(result, {
                    kind: 'product_batch',
                    id: 'product_batch:other',
                    productId: base.scope.productId,
                }),
            ).toBe(false)
            expect(
                factMatchesScope(result, {
                    kind: 'medical_flower_product',
                    id: base.scope.productId,
                }),
            ).toBe(false)
            expect(
                factMatchesScope(result, {
                    kind: 'product_batch',
                    id: base.scope.id,
                    productId: 'medical_flower_product:other',
                }),
            ).toBe(false)
        }
    })
    it.each([
        ['aflatoxin_b1', 2, '\u00b5g/kg'],
        ['arsenic', 0.1, 'ppm'],
    ] as const)('preserves contaminant %s bounds', (analyte, limit, unit) => {
        const bound = {
            ...base,
            state: 'lab_measured_bound',
            value: null,
            operator: '<',
            analyte,
            limit,
            unit,
        }
        expect(strainFactSchema.parse(bound)).toEqual(bound)
    })
    it('keeps optional dates absent without filling them from report dates', () => {
        const fact = strainFactSchema.parse({
            ...point,
            dates: { generalReportDate: '2026-10-30' },
        })
        expect(fact.dates.testDate).toBeUndefined()
        expect(fact.dates.sampleDate).toBeUndefined()
    })
    it('keeps legacy catalog and explicit private scope separate', () => {
        expect(adaptLegacyStrainFacts({ id: 'original-42' }).thc.scope).toEqual({
            kind: 'legacy',
            id: 'original-42',
        })
        expect(
            adaptLegacyStrainFacts({ id: 'private-42' }, { kind: 'user', id: 'private-42' }).thc
                .scope,
        ).toEqual({ kind: 'user', id: 'private-42' })
    })
    it('preserves breeder-attributed lineage as a claim with unknown direction', () => {
        const claim = {
            kind: 'direct_attributed',
            id: 'lineage_claim:synthetic',
            cultivarId: 'cultivar_selection:synthetic',
            claimedParentId: null,
            direction: 'unknown',
            claimStatus: 'primary_breeder_attributed',
            sourceId: 'source:synthetic',
            evidenceIds: ['evidence:synthetic'],
        }
        expect(lineageClaimSchema.parse(claim)).toEqual(claim)
        expect(
            lineageClaimSchema.safeParse({
                ...claim,
                evidenceIds: ['evidence:synthetic', 'evidence:synthetic'],
            }).success,
        ).toBe(false)
        expect(
            lineageClaimSchema.safeParse({ ...claim, claimedParentId: 'cultivar_selection:0' })
                .success,
        ).toBe(false)
        expect(
            lineageClaimSchema.safeParse({
                ...claim,
                kind: 'selfing',
                claimedParentId: claim.cultivarId,
            }).success,
        ).toBe(false)
        expect(
            lineageClaimSchema.safeParse({ ...claim, kind: 'selfing', claimedParentId: null })
                .success,
        ).toBe(true)
    })
    it.each(['', '   '])('rejects blank legacy identity %j', (id) => {
        expect(() => adaptLegacyStrainFacts({ id, thc: 0 })).toThrow()
    })
    it('retains a valid namespaced parent ending in zero', () => {
        expect(
            lineageClaimSchema.safeParse({
                kind: 'historical',
                id: 'lineage_claim:zero-tail',
                cultivarId: 'cultivar_selection:child',
                claimedParentId: 'cultivar_selection:breeder:0',
                direction: 'unknown',
                claimStatus: 'primary_breeder_attributed',
                sourceId: 'source:synthetic',
                evidenceIds: ['evidence:synthetic'],
            }).success,
        ).toBe(true)
    })
    it('retains a laboratory result identity and exact batch anchor', () => {
        const scope = {
            kind: 'laboratory_result' as const,
            id: 'laboratory_result:synthetic',
            batchId: base.scope.id,
            productId: base.scope.productId,
        }
        const fact = strainFactSchema.parse({ ...point, scope })
        expect(factMatchesScope(fact, scope)).toBe(true)
        expect(factMatchesScope(fact, { ...scope, batchId: 'product_batch:other' })).toBe(false)
    })
    it.each(['unknown', 'restricted', 'schema_only'] as const)('blocks %s rights', (rights) => {
        expect(isFactReleaseEligible(strainFactSchema.parse({ ...point, rights }))).toBe(false)
    })
    it.each(['%', 'ppm', '\u00b5g/kg'] as const)('preserves unit %s', (unit) => {
        expect(strainFactSchema.parse({ ...point, unit }).unit).toBe(unit)
    })
    it('supports a specification interval without a point measurement', () => {
        const interval = {
            ...base,
            state: 'specification_interval',
            scope: { kind: 'medical_flower_product', id: 'medical_flower_product:synthetic-1' },
            lower: 0,
            lowerOperator: '>=',
            upper: 1,
            upperOperator: '<=',
            value: null,
        }
        expect(strainFactSchema.parse(interval)).toEqual(interval)
        expect(strainFactSchema.safeParse({ ...interval, lower: 2 }).success).toBe(false)
    })
    it('requires explicit production rights and never promotes schema-only facts', () => {
        expect(isFactReleaseEligible(strainFactSchema.parse(point))).toBe(false)
        expect(
            isFactReleaseEligible(
                strainFactSchema.parse({ ...point, rights: 'production_permitted' }),
            ),
        ).toBe(true)
        expect(
            isFactReleaseEligible(
                adaptLegacyStrainFacts({ id: 'cultivar_selection:legacy', thc: 0 }).thc,
            ),
        ).toBe(false)
    })
    it.each(['aflatoxin_b1', 'arsenic'])(
        'rejects percent for %s for the unit rule alone',
        (analyte) => {
            expect(strainFactSchema.safeParse({ ...point, analyte, unit: 'ppm' }).success).toBe(
                true,
            )
            const result = strainFactSchema.safeParse({ ...point, analyte, unit: '%' })
            expect(result.success).toBe(false)
            if (!result.success)
                expect(result.error.issues.map((issue) => issue.message)).toEqual([
                    'Unit is not supported for this analyte',
                ])
        },
    )
    it.each([
        ['unknown', 'unknown'],
        ['legacy_unverified', 'unverified'],
    ])('rejects non-null %s solely at the value boundary', (state, claimStatus) => {
        const valid = { ...base, state, claimStatus, value: null }
        expect(strainFactSchema.safeParse(valid).success).toBe(true)
        const result = strainFactSchema.safeParse({ ...valid, value: 0 })
        expect(result.success).toBe(false)
        if (!result.success)
            expect(result.error.issues.map((issue) => issue.path)).toEqual([['value']])
    })
    it.each([
        { value: NaN },
        { evidenceIds: ['evidence:duplicate', 'evidence:duplicate'] },
        { evidenceIds: ['evidence: '] },
        { method: '' },
        { value: Infinity },
        { value: -1 },
        { value: 101 },
        { unit: 'pg' },
        { analyte: 'aflatoxin_b1', unit: '%' },
        { analyte: 'arsenic', unit: '%' },
        { state: 'unknown', value: 0, claimStatus: 'unknown' },
        { state: 'legacy_unverified', value: 0, claimStatus: 'unverified' },
        { analyte: 'THC-ish' },
        { evidenceIds: [] },
        { state: 'estimated_simulation_only' },
        { state: 'unknown' },
        { scope: { kind: 'cultivar_selection', id: 'cultivar_selection:synthetic' } },
        {
            scope: {
                kind: 'product_batch',
                id: 'medical_flower_product:wrong',
                productId: 'medical_flower_product:synthetic',
            },
        },
        { dates: { ...base.dates, testDate: '2026-02-30' } },
        { sourceId: null },
        { sourceId: 'source:trailing\n' },
        { state: 'unknown', value: null },
        { state: 'legacy_unverified', value: null },
        { claimStatus: 'primary_breeder_attributed' },
        { state: 'lab_measured_bound', value: null, limit: 1, operator: '>' },
        { unit: 'ppm', value: 1000001 },
        { unit: '\u00b5g/kg', value: 1000000001 },
    ])('rejects invalid state/value/unit/scope/date combination %j', (patch) => {
        expect(strainFactSchema.safeParse({ ...point, ...patch }).success).toBe(false)
    })
})
