import { describe, it, expect } from 'vitest'
import { secureRandom } from './random'

describe('secureRandom', () => {
    it('returns a number', () => {
        expect(typeof secureRandom()).toBe('number')
    })

    it('returns a value in [0, 1)', () => {
        for (let i = 0; i < 100; i++) {
            const val = secureRandom()
            expect(val).toBeGreaterThanOrEqual(0)
            expect(val).toBeLessThan(1)
        }
    })

    it('returns different values across calls', () => {
        const values = new Set(Array.from({ length: 50 }, () => secureRandom()))
        // With 50 calls, collisions are astronomically unlikely
        expect(values.size).toBeGreaterThan(40)
    })

    it('returns a finite number', () => {
        expect(Number.isFinite(secureRandom())).toBe(true)
    })
})
