import { AppSettings, Strain } from '@/types'
import { defaultSettings } from '@/stores/slices/settingsSlice'
import { RootState } from '@/stores/store'
import { APP_VERSION } from '@/constants'

// This represents the shape of the persisted state object.
export type PersistedState = Partial<RootState> & { version?: number }

const ensureSimulationShape = (state: PersistedState): void => {
    if (!state.simulation) {
        return
    }

    const sim = state.simulation as unknown as Record<string, unknown>
    if (!Array.isArray(sim.plantSlots)) {
        sim.plantSlots = [null, null, null]
    }
    if (typeof sim.selectedPlantId === 'undefined') {
        sim.selectedPlantId = null
    }
    if (typeof sim.devSpeedMultiplier !== 'number') {
        sim.devSpeedMultiplier = 1
    }
    if (!sim.vpdProfiles || typeof sim.vpdProfiles !== 'object') {
        sim.vpdProfiles = {}
    }

    // Patch any persisted plant objects that are missing fields introduced after
    // the initial simulation build. This prevents the engine from crashing on
    // old localStorage data after an update.
    type LegacyPlant = Record<string, unknown>
    const entities = (sim.plants as Record<string, unknown>)?.entities
    if (entities && typeof entities === 'object') {
        for (const id in entities as Record<string, unknown>) {
            const plant = (entities as Record<string, LegacyPlant | undefined>)[id]
            if (!plant) continue

            if (!plant.rootSystem || typeof plant.rootSystem !== 'object') {
                plant.rootSystem = { health: 100, rootMass: 0.01 }
            }
            if (!plant.stressCounters || typeof plant.stressCounters !== 'object') {
                plant.stressCounters = { vpd: 0, ph: 0, ec: 0, moisture: 0 }
            }
            if (!plant.cannabinoidProfile || typeof plant.cannabinoidProfile !== 'object') {
                plant.cannabinoidProfile = { thc: 0, cbd: 0, cbn: 0 }
            }
            if (!plant.terpeneProfile || typeof plant.terpeneProfile !== 'object') {
                plant.terpeneProfile = {}
            }
            if (!plant.structuralModel || typeof plant.structuralModel !== 'object') {
                plant.structuralModel = { branches: 1, nodes: 1 }
            }
            if (!plant.medium || typeof plant.medium !== 'object') {
                plant.medium = { ph: 6.5, ec: 0.8, moisture: 80, microbeHealth: 80, substrateWater: 0, nutrientConcentration: { nitrogen: 100, phosphorus: 100, potassium: 100 } }
            } else {
                const medium = plant.medium as Record<string, unknown>
                if (typeof medium.microbeHealth !== 'number') medium.microbeHealth = 80
                if (typeof medium.substrateWater !== 'number') medium.substrateWater = 0
                if (!medium.nutrientConcentration) medium.nutrientConcentration = { nitrogen: 100, phosphorus: 100, potassium: 100 }
            }
            if (!plant.nutrientPool || typeof plant.nutrientPool !== 'object') {
                plant.nutrientPool = { nitrogen: 5, phosphorus: 5, potassium: 5 }
            }
            // phenotypeModifiers is optional – fill it from strain defaults so the
            // engine can use per-plant modifiers without crashing on old saves.
            const legacyStrain = plant.strain as Record<string, unknown> | undefined
            if (!plant.phenotypeModifiers && legacyStrain?.geneticModifiers) {
                plant.phenotypeModifiers = { ...(legacyStrain.geneticModifiers as object) }
            }
        }
    }
}

/**
 * Merges persisted settings with default settings to ensure new properties are added.
 * This is a recursive deep merge.
 */
const deepMergeSettings = (persisted: Partial<AppSettings>): AppSettings => {
    const isObject = (item: unknown): item is Record<string, unknown> => {
        return !!item && typeof item === 'object' && !Array.isArray(item)
    }

    const output = JSON.parse(JSON.stringify(defaultSettings)) // Deep clone defaults

    function merge(target: Record<string, unknown>, source: Record<string, unknown>) {
        for (const key of Object.keys(source)) {
            const sourceValue = source[key]
            if (isObject(sourceValue)) {
                if (!target[key] || !isObject(target[key])) {
                    target[key] = {}
                }
                merge(target[key] as Record<string, unknown>, sourceValue as Record<string, unknown>)
            } else if (sourceValue !== undefined) {
                target[key] = sourceValue
            }
        }
    }
    if (isObject(persisted)) {
        merge(output, persisted)
    }
    return output
}

/**
 * Migration from V1 to V2.
 * - Merges new default settings into persisted settings to prevent crashes on new features.
 * - Adds a new setting property `showArchivedInPlantsView`.
 * - Adds `lastUpdated` property to plant objects if missing.
 */
const migrateV1ToV2 = (state: PersistedState): PersistedState => {
    console.log('[MigrationLogic] Migrating state from v1 to v2...')

    // Note: 'state' is a plain JS object here, it's safe to mutate before it's loaded into Redux.
    const migratedState: PersistedState = state

    if (migratedState.settings?.settings) {
        migratedState.settings.settings = deepMergeSettings(migratedState.settings.settings)
    } else {
        migratedState.settings = { settings: defaultSettings, version: 1 }
    }

    const legacyPlantsView = migratedState.settings.settings.plantsView as unknown as Record<string, unknown>
    if (typeof legacyPlantsView.showArchivedInPlantsView !== 'undefined') {
        migratedState.settings.settings.plantsView.showArchived = legacyPlantsView.showArchivedInPlantsView as boolean
        delete legacyPlantsView.showArchivedInPlantsView
    }

    if (migratedState.simulation?.plants?.entities) {
        for (const id in migratedState.simulation.plants.entities) {
            const plant = migratedState.simulation.plants.entities[id]
            if (plant && !plant.lastUpdated) {
                // Use createdAt as a sensible default for the first lastUpdated value
                plant.lastUpdated = plant.createdAt || Date.now()
            }
        }
    }

    return migratedState
}

const migrateV2ToV3 = (state: PersistedState): PersistedState => {
    console.log('[MigrationLogic] Migrating state from v2 to v3...')

    const migratedState: PersistedState = state

    if (migratedState.simulation?.plants?.entities) {
        for (const id in migratedState.simulation.plants.entities) {
            const plant = migratedState.simulation.plants.entities[id] as unknown as Record<string, unknown> | undefined
            if (plant && !plant.mediumType) {
                plant.mediumType = 'Soil'
            }
        }
    }

    return migratedState
}

/**
 * Merges strain catalogs by id and keeps a stable superset during updates.
 * New bundled entries win for overlapping ids, while unknown legacy ids are retained.
 */
export const mergeStrainCatalogForUpdate = (legacyStrains: Strain[], bundledStrains: Strain[]): Strain[] => {
    const mergedById = new Map<string, Strain>()

    legacyStrains.forEach((strain) => {
        mergedById.set(strain.id, strain)
    })

    bundledStrains.forEach((strain) => {
        const legacy = mergedById.get(strain.id)
        mergedById.set(strain.id, legacy ? { ...legacy, ...strain } : strain)
    })

    return Array.from(mergedById.values())
}

/**
 * Orchestrates the migration of a persisted state object to the current app version.
 * @param persistedState The raw state object loaded from storage.
 * @returns The migrated state object, ready to be hydrated into the store.
 */
export const migrateState = (persistedState: PersistedState): PersistedState => {
    const stateVersion = persistedState.version || 1

    if (stateVersion >= APP_VERSION) {
        console.log('[MigrationLogic] Persisted state is up to date.')
        // Even if up to date, merge settings to catch any new properties added in minor versions
        if (persistedState.settings?.settings) {
            persistedState.settings.settings = deepMergeSettings(persistedState.settings.settings)
        }
        ensureSimulationShape(persistedState)
        return persistedState
    }

    let migratedState: PersistedState = persistedState
    console.log(`[MigrationLogic] Migrating from version ${stateVersion} to ${APP_VERSION}...`)

    if (stateVersion < 2) {
        migratedState = migrateV1ToV2(migratedState)
    }
    if (stateVersion < 3) {
        migratedState = migrateV2ToV3(migratedState)
    }

    migratedState.version = APP_VERSION

    // Also update the version inside the settings slice for consistency
    if (migratedState.settings) {
        migratedState.settings.version = APP_VERSION
    }

    ensureSimulationShape(migratedState)

    return migratedState
}
