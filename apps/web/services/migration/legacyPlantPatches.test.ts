import { describe, expect, it } from 'vitest'
import { PlantStage } from '@/types'
import type { LegacyPlant } from '@/services/migration/migrationTypes'
import {
    ensureSimulationRootShape,
    patchLegacyPlantShape,
} from '@/services/migration/legacyPlantPatches'

describe('legacyPlantPatches', () => {
    it('ensureSimulationRootShape seeds slots and removes dev multiplier', () => {
        const sim: Record<string, unknown> = { devSpeedMultiplier: 5 }
        ensureSimulationRootShape(sim)
        expect(sim.plantSlots).toEqual([null, null, null])
        expect(sim.devSpeedMultiplier).toBeUndefined()
        expect(sim.selectedPlantId).toBeNull()
    })

    it('patchLegacyPlantShape fills timestamps and terpene profile', () => {
        const plant = { stage: PlantStage.Vegetative } as LegacyPlant
        patchLegacyPlantShape(plant)
        expect(typeof plant.createdAt).toBe('number')
        expect(typeof plant.lastUpdated).toBe('number')
        expect(plant.terpeneProfile).toEqual({})
        expect(plant.mediumType).toBe('Soil')
    })

    it('patchLegacyPlantShape backfills tasks/problems arrays', () => {
        // selectOpenTasksSummary/selectActiveProblemsSummary call .filter()
        // directly on these with no fallback -- a plant missing either
        // crashes every active-plant selector on the next render.
        const plant = { stage: PlantStage.Vegetative } as LegacyPlant
        patchLegacyPlantShape(plant)
        expect(plant.tasks).toEqual([])
        expect(plant.problems).toEqual([])

        const plantWithGarbage = { tasks: 'not-an-array', problems: null } as unknown as LegacyPlant
        patchLegacyPlantShape(plantWithGarbage)
        expect(plantWithGarbage.tasks).toEqual([])
        expect(plantWithGarbage.problems).toEqual([])
    })
})
