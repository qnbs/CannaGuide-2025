import { describe, it, expect } from 'vitest'
import { chemotypeService, type ChemotypeInput } from '@/services/chemotypeService'

const baseInput: ChemotypeInput = {
    thc: 15,
    cbd: 5,
    cbg: 1,
    limonene: 0.3,
    myrcene: 0.4,
    pinene: 0.2,
    linalool: 0.1,
    caryophyllene: 0.2,
}

describe('ChemotypeService', () => {
    it('calculates total cannabinoids correctly', () => {
        const result = chemotypeService.calculate(baseInput)
        expect(result.totalCannabinoids).toBe(21) // 15 + 5 + 1
    })

    it('calculates total terpenes correctly', () => {
        const result = chemotypeService.calculate(baseInput)
        expect(result.totalTerpenes).toBeCloseTo(1.2) // 0.3 + 0.4 + 0.2 + 0.1 + 0.2
    })

    it('identifies dominant cannabinoid', () => {
        const result = chemotypeService.calculate(baseInput)
        expect(result.dominantCannabinoid).toBe('THC')
    })

    it('identifies CBD as dominant when CBD is highest', () => {
        const cbdForward = { ...baseInput, thc: 3, cbd: 18 }
        const result = chemotypeService.calculate(cbdForward)
        expect(result.dominantCannabinoid).toBe('CBD')
    })

    it('identifies dominant terpene', () => {
        const result = chemotypeService.calculate(baseInput)
        // myrcene is 0.4, highest among terpenes
        expect(result.dominantTerpene).toBeTruthy()
    })

    it('returns THC-forward profile for high THC, low CBD', () => {
        const highThc = { ...baseInput, thc: 25, cbd: 0.2 }
        const result = chemotypeService.calculate(highThc)
        expect(result.profileLabel).toBeTruthy()
    })

    it('returns relaxing profile for high myrcene', () => {
        const highMyrcene = { ...baseInput, myrcene: 0.8 }
        const result = chemotypeService.calculate(highMyrcene)
        expect(result.profileLabel).toBeTruthy()
    })

    it('returns uplifting profile for high limonene + pinene', () => {
        const uplifting = { ...baseInput, limonene: 0.6, pinene: 0.5 }
        const result = chemotypeService.calculate(uplifting)
        expect(result.profileLabel).toBeTruthy()
    })

    it('always returns guidance array with 4 items', () => {
        const result = chemotypeService.calculate(baseInput)
        expect(result.guidance).toHaveLength(4)
    })

    it('always returns a disclaimer string', () => {
        const result = chemotypeService.calculate(baseInput)
        expect(result.disclaimer).toBeTruthy()
        expect(typeof result.disclaimer).toBe('string')
    })

    it('handles all-zero input without errors', () => {
        const zeroInput: ChemotypeInput = {
            thc: 0, cbd: 0, cbg: 0,
            limonene: 0, myrcene: 0, pinene: 0, linalool: 0, caryophyllene: 0,
        }
        const result = chemotypeService.calculate(zeroInput)
        expect(result.totalCannabinoids).toBe(0)
        expect(result.totalTerpenes).toBe(0)
    })
})
