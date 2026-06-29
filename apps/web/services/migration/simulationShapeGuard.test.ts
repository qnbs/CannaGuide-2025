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
})
