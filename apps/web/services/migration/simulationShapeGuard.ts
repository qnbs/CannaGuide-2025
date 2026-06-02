import type { LegacyPlant, PersistedState } from '@/services/migration/migrationTypes'
import {
    ensureSimulationRootShape,
    patchLegacyPlantShape,
} from '@/services/migration/legacyPlantPatches'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

export const ensureSimulationShape = (state: PersistedState): void => {
    if (!state.simulation) {
        return
    }

    const sim = state.simulation as unknown as Record<string, unknown>
    ensureSimulationRootShape(sim)

    const entities = (sim.plants as Record<string, unknown>)?.entities
    if (entities && typeof entities === 'object') {
        for (const id in entities as Record<string, unknown>) {
            const plant = (entities as Record<string, LegacyPlant | undefined>)[id]
            if (!plant) continue

            patchLegacyPlantShape(plant)
        }
    }
}
