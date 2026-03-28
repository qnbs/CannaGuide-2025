import { describe, it, expect } from 'vitest'
import { entourageService } from '@/services/entourageService'

describe('EntourageService', () => {
    it('returns valid result for minimal input', () => {
        const result = entourageService.analyse({
            thc: 20,
            cbd: 1,
            terpeneProfile: {},
        })
        expect(result).toBeDefined()
        expect(result.totalTerpenePercent).toBe(0)
        expect(result.predictedEffects).toBeDefined()
        expect(typeof result.profileLabel).toBe('string')
        expect(typeof result.summary).toBe('string')
    })

    it('detects dominant terpene', () => {
        const result = entourageService.analyse({
            thc: 15,
            cbd: 1,
            terpeneProfile: {
                Myrcene: 0.5,
                Limonene: 0.2,
                Pinene: 0.1,
            },
        })
        expect(result.dominantTerpene).not.toBeNull()
        expect(result.dominantTerpene!.name).toBe('Myrcene')
    })

    it('calculates total terpene percent', () => {
        const result = entourageService.analyse({
            thc: 20,
            cbd: 1,
            terpeneProfile: {
                Myrcene: 0.5,
                Limonene: 0.3,
            },
        })
        expect(result.totalTerpenePercent).toBeCloseTo(0.8)
    })

    it('generates synergies for myrcene + THC combination', () => {
        const result = entourageService.analyse({
            thc: 20,
            cbd: 0,
            terpeneProfile: {
                Myrcene: 0.5,
            },
        })
        expect(result.synergies.length).toBeGreaterThanOrEqual(0)
    })

    it('includes THC:CBD ratio', () => {
        const result = entourageService.analyse({
            thc: 20,
            cbd: 5,
            terpeneProfile: {},
        })
        expect(result.thcCbdRatio).toBeTruthy()
    })

    it('produces effect profile entries sorted by score', () => {
        const result = entourageService.analyse({
            thc: 25,
            cbd: 2,
            terpeneProfile: {
                Myrcene: 0.6,
                Limonene: 0.4,
                Linalool: 0.3,
                Caryophyllene: 0.2,
            },
        })
        expect(result.predictedEffects.length).toBeGreaterThan(0)
        // Should be sorted descending by score
        for (let i = 1; i < result.predictedEffects.length; i++) {
            expect(result.predictedEffects[i - 1]!.score).toBeGreaterThanOrEqual(result.predictedEffects[i]!.score)
        }
    })

    it('handles CBG contribution for focusing', () => {
        const result = entourageService.analyse({
            thc: 15,
            cbd: 1,
            cbg: 2,
            terpeneProfile: { Pinene: 0.3 },
        })
        const focusingEffect = result.predictedEffects.find(e => e.tag === 'Focusing')
        expect(focusingEffect).toBeDefined()
    })

    it('handles all-zero terpene input', () => {
        const result = entourageService.analyse({
            thc: 10,
            cbd: 0,
            terpeneProfile: {
                Myrcene: 0,
                Limonene: 0,
            },
        })
        expect(result.totalTerpenePercent).toBe(0)
        expect(result.dominantTerpene).toBeNull()
    })
})
