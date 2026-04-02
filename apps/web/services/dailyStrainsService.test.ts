import { describe, it, expect } from 'vitest'
import {
    createSeededRng,
    getTodayKey,
    generateDailyPicks,
    buildUserProfile,
    rankStrainsByRelevance,
} from '@/services/dailyStrainsService'
import type { DiscoveredStrain } from '@/services/dailyStrainsService'

describe('dailyStrainsService', () => {
    describe('createSeededRng', () => {
        it('returns deterministic values for the same seed', () => {
            const rng1 = createSeededRng('2025-01-15')
            const rng2 = createSeededRng('2025-01-15')
            expect(rng1()).toBe(rng2())
            expect(rng1()).toBe(rng2())
            expect(rng1()).toBe(rng2())
        })

        it('returns different values for different seeds', () => {
            const rng1 = createSeededRng('2025-01-15')
            const rng2 = createSeededRng('2025-01-16')
            // Very unlikely to be equal
            expect(rng1()).not.toBe(rng2())
        })

        it('returns values in [0, 1)', () => {
            const rng = createSeededRng('2025-06-01')
            for (let i = 0; i < 100; i++) {
                const val = rng()
                expect(val).toBeGreaterThanOrEqual(0)
                expect(val).toBeLessThan(1)
            }
        })
    })

    describe('getTodayKey', () => {
        it('returns a YYYY-MM-DD string', () => {
            const key = getTodayKey()
            expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })
    })

    describe('generateDailyPicks', () => {
        it('returns exactly 5 picks', () => {
            const picks = generateDailyPicks('2025-03-20')
            expect(picks).toHaveLength(5)
        })

        it('returns deterministic picks for the same date', () => {
            const picks1 = generateDailyPicks('2025-07-04')
            const picks2 = generateDailyPicks('2025-07-04')
            expect(picks1.map((p) => p.id)).toEqual(picks2.map((p) => p.id))
        })

        it('returns different picks for different dates', () => {
            const picks1 = generateDailyPicks('2025-01-01')
            const picks2 = generateDailyPicks('2025-01-02')
            const ids1 = picks1.map((p) => p.id)
            const ids2 = picks2.map((p) => p.id)
            // At least one should differ
            expect(ids1).not.toEqual(ids2)
        })

        it('all picks have source "daily-pick"', () => {
            const picks = generateDailyPicks('2025-04-20')
            for (const pick of picks) {
                expect(pick.source).toBe('daily-pick')
            }
        })

        it('all picks have a pickCategory', () => {
            const picks = generateDailyPicks('2025-04-20')
            for (const pick of picks) {
                expect(pick.pickCategory).toBeTruthy()
            }
        })

        it('all picks have a pickReason', () => {
            const picks = generateDailyPicks('2025-04-20')
            for (const pick of picks) {
                expect(pick.pickReason).toBeTruthy()
            }
        })

        it('no duplicate strain IDs', () => {
            const picks = generateDailyPicks('2025-12-25')
            const ids = picks.map((p) => p.id)
            expect(new Set(ids).size).toBe(ids.length)
        })
    })

    describe('buildUserProfile', () => {
        it('returns neutral profile for empty array', () => {
            const profile = buildUserProfile([])
            expect(profile.strainCount).toBe(0)
            expect(profile.avgThc).toBe(15)
            expect(profile.avgCbd).toBe(0.5)
        })

        it('computes averages correctly', () => {
            const profile = buildUserProfile([
                { type: 'Indica', thc: 20, cbd: 2 },
                { type: 'Sativa', thc: 10, cbd: 0 },
            ])
            expect(profile.strainCount).toBe(2)
            expect(profile.avgThc).toBe(15)
            expect(profile.avgCbd).toBe(1)
            expect(profile.preferredTypes['Indica']).toBe(1)
            expect(profile.preferredTypes['Sativa']).toBe(1)
        })
    })

    describe('rankStrainsByRelevance', () => {
        const makeStrain = (overrides: Partial<DiscoveredStrain>): DiscoveredStrain => ({
            id: 'test-1',
            name: 'Test',
            breeder: 'Test',
            type: 'Hybrid',
            floweringType: 'Photoperiod',
            thc: 15,
            cbd: 0,
            description: '',
            genetics: '',
            source: 'daily-pick',
            sourceUrl: '',
            discoveredAt: new Date().toISOString(),
            ...overrides,
        })

        it('returns scored strains sorted by relevance', () => {
            const profile = buildUserProfile([
                { type: 'Indica', thc: 25, cbd: 0 },
                { type: 'Indica', thc: 25, cbd: 0 },
            ])
            const strains = [
                makeStrain({ id: 'sativa', type: 'Sativa', thc: 5 }),
                makeStrain({ id: 'indica', type: 'Indica', thc: 25 }),
            ]
            const ranked = rankStrainsByRelevance(strains, profile)
            expect(ranked[0]!.id).toBe('indica')
            expect(ranked[0]!.relevanceScore).toBeGreaterThan(ranked[1]!.relevanceScore)
        })

        it('gives neutral score when no user data', () => {
            const profile = buildUserProfile([])
            const strains = [makeStrain({ id: 'a' })]
            const ranked = rankStrainsByRelevance(strains, profile)
            expect(ranked[0]!.relevanceScore).toBe(50)
        })
    })
})
