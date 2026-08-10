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
            const plant = (entities as Record<string, unknown>)[id]
            // Only a genuine object can be patched in place -- assigning a
            // property onto a primitive (a corrupt entity persisted as a
            // string/number/etc.) throws in strict mode. Leave it as-is and
            // let the post-migration validator reject it with a clear error.
            if (!plant || typeof plant !== 'object' || Array.isArray(plant)) continue

            patchLegacyPlantShape(plant as LegacyPlant)
        }
    }
}
