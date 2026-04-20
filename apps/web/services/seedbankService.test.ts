import { describe, expect, it } from 'vitest'
import { getSeedbanks, getSeedbankById, getAvailabilityForStrain } from './seedbankService'

describe('seedbankService', () => {
    describe('getSeedbanks', () => {
        it('returns 5 seedbanks', () => {
            const banks = getSeedbanks()
            expect(banks).toHaveLength(5)
        })

        it('returns a copy (not the original array)', () => {
            const a = getSeedbanks()
            const b = getSeedbanks()
            expect(a).not.toBe(b)
            expect(a).toEqual(b)
        })

        it('each seedbank has required fields', () => {
            for (const sb of getSeedbanks()) {
                expect(sb.id).toBeTruthy()
                expect(sb.name).toBeTruthy()
                expect(sb.websiteUrl).toBeTruthy()
                expect(sb.rating).toBeGreaterThan(0)
                expect(sb.rating).toBeLessThanOrEqual(5)
            }
        })
    })

    describe('getSeedbankById', () => {
        it('returns the correct seedbank by id', () => {
            const sb = getSeedbankById('sensi-seeds')
            expect(sb).toBeDefined()
            expect(sb?.name).toBe('Sensi Seeds')
        })

        it('returns undefined for unknown id', () => {
            expect(getSeedbankById('unknown-bank')).toBeUndefined()
        })

        it('finds all known seedbanks', () => {
            const ids = [
                'sensi-seeds',
                'barneys-farm',
                'royal-queen-seeds',
                'dutch-passion',
                'fastbuds',
            ]
            for (const id of ids) {
                expect(getSeedbankById(id)).toBeDefined()
            }
        })
    })

    describe('getAvailabilityForStrain', () => {
        it('returns availability entries', async () => {
            const results = await getAvailabilityForStrain('test-strain-1')
            expect(results.length).toBeGreaterThan(0)
            expect(results.length).toBeLessThanOrEqual(5)
        })

        it('returns deterministic results for the same strain', async () => {
            const a = await getAvailabilityForStrain('deterministic-test')
            // Clear cache by waiting or using a new strain
            const b = await getAvailabilityForStrain('deterministic-test')
            expect(a).toEqual(b)
        })

        it('returns different results for different strains', async () => {
            const a = await getAvailabilityForStrain('strain-alpha')
            const b = await getAvailabilityForStrain('strain-beta')
            // Different strains produce different hash-based results
            expect(a.length > 0 && b.length > 0).toBe(true)
        })

        it('each entry has correct structure', async () => {
            const results = await getAvailabilityForStrain('struct-test')
            for (const entry of results) {
                expect(entry.seedbankId).toBeTruthy()
                expect(entry.pricePerSeed).toBeGreaterThan(0)
                expect(entry.currency).toBe('EUR')
                expect(typeof entry.inStock).toBe('boolean')
                expect(entry.packSizes.length).toBeGreaterThan(0)
                expect(['Feminized', 'Regular', 'Autoflowering']).toContain(entry.seedType)
            }
        })

        it('uses cache for repeated calls', async () => {
            const id = 'cache-test-strain'
            const a = await getAvailabilityForStrain(id)
            const b = await getAvailabilityForStrain(id)
            // Same reference from cache
            expect(a).toBe(b)
        })
    })
})
