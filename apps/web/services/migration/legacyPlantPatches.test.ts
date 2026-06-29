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
})
