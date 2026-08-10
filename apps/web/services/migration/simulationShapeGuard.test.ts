import { describe, expect, it } from 'vitest'
import { PlantStage } from '@/types'
import type { LegacyPlant, PersistedState } from '@/services/migration/migrationTypes'
import { ensureSimulationShape } from '@/services/migration/simulationShapeGuard'

describe('ensureSimulationShape', () => {
    it('no-ops when simulation slice is missing', () => {
        const state = {} as PersistedState
        ensureSimulationShape(state)
        expect(state.simulation).toBeUndefined()
    })

    it('patches legacy plant entities', () => {
        const state = {
            simulation: {
                plants: {
                    entities: {
                        p1: { stage: PlantStage.Seed } as LegacyPlant,
                    },
                },
            },
        } as unknown as PersistedState
        ensureSimulationShape(state)
        const plant = state.simulation?.plants?.entities?.p1 as unknown as LegacyPlant
        expect(typeof plant.createdAt).toBe('number')
        expect(plant.terpeneProfile).toEqual({})
    })

    it('leaves a non-object entity untouched instead of throwing', () => {
        // Assigning a property onto a primitive throws in strict mode --
        // patching must skip these, not crash, and leave the entity for the
        // post-migration validator to reject with a clear error.
        const state = {
            simulation: {
                plants: {
                    entities: { p1: 'not-an-object', p2: 42, p3: ['a'] },
                },
            },
        } as unknown as PersistedState
        expect(() => ensureSimulationShape(state)).not.toThrow()
        const entities = state.simulation?.plants?.entities as Record<string, unknown>
        expect(entities.p1).toBe('not-an-object')
        expect(entities.p2).toBe(42)
        expect(entities.p3).toEqual(['a'])
    })
})
