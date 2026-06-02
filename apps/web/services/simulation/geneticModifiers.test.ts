import { describe, expect, it } from 'vitest'
import { normalizeGeneticModifiers } from '@/services/simulation/geneticModifiers'

describe('normalizeGeneticModifiers', () => {
    it('returns defaults for empty input', () => {
        const mods = normalizeGeneticModifiers(undefined)
        expect(mods.pestResistance).toBe(1)
        expect(mods.vpdTolerance.min).toBeGreaterThan(0)
    })

    it('clamps out-of-range values', () => {
        const mods = normalizeGeneticModifiers({ pestResistance: 99, rue: -1 })
        expect(mods.pestResistance).toBe(3)
        expect(mods.rue).toBe(0.5)
    })
})
