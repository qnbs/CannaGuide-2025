import { describe, expect, it } from 'vitest'
import {
    simClamp,
    simFiniteOr,
    simFiniteOrClamped,
    simFiniteOrMin,
    simIsFiniteNumber,
} from '@/services/simulation/simulationMath'

describe('simulationMath', () => {
    it('simClamp bounds values', () => {
        expect(simClamp(5, 0, 10)).toBe(5)
        expect(simClamp(-1, 0, 10)).toBe(0)
        expect(simClamp(99, 0, 10)).toBe(10)
    })

    it('simIsFiniteNumber rejects non-finite numbers', () => {
        expect(simIsFiniteNumber(1)).toBe(true)
        expect(simIsFiniteNumber(NaN)).toBe(false)
        expect(simIsFiniteNumber('1')).toBe(false)
    })

    it('simFiniteOr uses fallback for invalid input', () => {
        expect(simFiniteOr(3, 0)).toBe(3)
        expect(simFiniteOr(undefined, 7)).toBe(7)
    })

    it('simFiniteOrMin enforces minimum', () => {
        expect(simFiniteOrMin(-2, 5, 0)).toBe(0)
        expect(simFiniteOrMin(3, 5, 0)).toBe(3)
    })

    it('simFiniteOrClamped clamps after fallback', () => {
        expect(simFiniteOrClamped(150, 50, 0, 100)).toBe(100)
        expect(simFiniteOrClamped(undefined, 50, 0, 100)).toBe(50)
    })
})
