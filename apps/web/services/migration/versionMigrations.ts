import type { Strain } from '@/types'
import { defaultSettings } from '@/stores/slices/settingsSlice'
import {
    APP_VERSION,
    SLICE_SCHEMA_VERSIONS,
    DEFAULT_GROW_ID,
    DEFAULT_GROW_NAME,
} from '@/constants'
import type { PersistedState } from '@/services/migration/migrationTypes'
import { deepMergeSettings } from '@/services/migration/settingsMerge'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

/**
 * Migration from V1 to V2.
 * - Merges new default settings into persisted settings to prevent crashes on new features.
 * - Adds a new setting property `showArchivedInPlantsView`.
 * - Adds `lastUpdated` property to plant objects if missing.
 */
const migrateV1ToV2 = (state: PersistedState): PersistedState => {
    console.debug('[MigrationLogic] Migrating state from v1 to v2...')

    // Note: 'state' is a plain JS object here, it's safe to mutate before it's loaded into Redux.
    const migratedState: PersistedState = state

    if (migratedState.settings?.settings) {
        migratedState.settings.settings = deepMergeSettings(migratedState.settings.settings)
    } else {
        migratedState.settings = { settings: defaultSettings, version: 1 }
    }

    const legacyPlantsView = migratedState.settings.settings.plantsView as unknown as Record<
        string,
        unknown
    >
    if (typeof legacyPlantsView.showArchivedInPlantsView !== 'undefined') {
        migratedState.settings.settings.plantsView.showArchived =
            legacyPlantsView.showArchivedInPlantsView as boolean
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
    console.debug('[MigrationLogic] Migrating state from v2 to v3...')

    const migratedState: PersistedState = state

    if (migratedState.simulation?.plants?.entities) {
        for (const id in migratedState.simulation.plants.entities) {
            const plant = migratedState.simulation.plants.entities[id] as unknown as
                | Record<string, unknown>
                | undefined
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
export const mergeStrainCatalogForUpdate = (
    legacyStrains: Strain[],
    bundledStrains: Strain[],
): Strain[] => {
    const mergedById = new Map<string, Strain>()
    const bundledIds = new Set<string>()
    const duplicateIds: string[] = []

    const mergeStrainEntry = (legacy: Strain, strain: Strain): Strain => ({
        ...legacy,
        ...strain,
        agronomic: {
            ...(legacy.agronomic ?? {}),
            ...(strain.agronomic ?? {}),
        },
        geneticModifiers: {
            ...(legacy.geneticModifiers ?? {}),
            ...(strain.geneticModifiers ?? {}),
            vpdTolerance: {
                ...(legacy.geneticModifiers?.vpdTolerance ?? {}),
                ...(strain.geneticModifiers?.vpdTolerance ?? {}),
            },
        },
        aromas: strain.aromas ?? legacy.aromas,
        dominantTerpenes: strain.dominantTerpenes ?? legacy.dominantTerpenes,
        terpeneProfile: strain.terpeneProfile ?? legacy.terpeneProfile,
    })

    legacyStrains.forEach((strain) => {
        mergedById.set(strain.id, strain)
    })

    bundledStrains.forEach((strain) => {
        if (bundledIds.has(strain.id)) {
            duplicateIds.push(strain.id)
            return
        }
        bundledIds.add(strain.id)

        const legacy = mergedById.get(strain.id)
        mergedById.set(strain.id, legacy ? mergeStrainEntry(legacy, strain) : strain)
    })

    if (duplicateIds.length > 0) {
        console.debug(
            '[MigrationLogic] Duplicate bundled strain ids detected:',
            duplicateIds.slice(0, 10),
        )
    }

    return Array.from(mergedById.values())
}

/**
 * V3->V4 migration.
 * - Stamps per-slice schema versions (_sliceVersions) so future migrations can
 *   detect and auto-reset individual stale slices without nuking everything.
 * - Deep-merges settings to absorb any new defaults.
 */
const migrateV3ToV4 = (state: PersistedState): PersistedState => {
    console.debug('[MigrationLogic] Migrating state from v3 to v4...')

    // Deep-merge settings so new keys from defaultSettings are picked up
    if (state.settings?.settings) {
        state.settings.settings = deepMergeSettings(state.settings.settings)
    } else {
        state.settings = { settings: defaultSettings, version: 4 }
    }

    // Stamp per-slice schema versions for the first time
    state._sliceVersions = { ...SLICE_SCHEMA_VERSIONS }

    return state
}

/**
 * V4->V5 migration.
 * Keeps the persisted shape intact but stamps the new version so recovery can
 * distinguish V5 snapshots and snapshot diffs can be logged deterministically.
 */
const migrateV4ToV5 = (state: PersistedState): PersistedState => {
    console.debug('[MigrationLogic] Migrating state from v4 to v5...')

    if (state.settings?.settings) {
        state.settings.settings = deepMergeSettings(state.settings.settings)
    }

    return state
}

/**
 * V5->V6 migration: Multi-Grow support.
 * - Creates a `grows` slice with one default grow.
 * - Stamps `growId` on every existing Plant.
 * - Stamps `growId` on every existing NutrientScheduleEntry.
 */
const migrateV5ToV6 = (state: PersistedState): PersistedState => {
    console.debug('[MigrationLogic] Migrating state from v5 to v6...')

    const now = Date.now()

    // 1. Create the grows slice with a single default grow
    if (!state.grows) {
        const defaultGrow = {
            id: DEFAULT_GROW_ID,
            name: DEFAULT_GROW_NAME,
            createdAt: now,
            updatedAt: now,
            isActive: true,
        }
        ;(state as Record<string, unknown>).grows = {
            grows: {
                ids: [DEFAULT_GROW_ID],
                entities: { [DEFAULT_GROW_ID]: defaultGrow },
            },
            activeGrowId: DEFAULT_GROW_ID,
        }
    }

    // 2. Stamp growId on all existing plants
    const sim = state.simulation as Record<string, unknown> | undefined
    if (sim) {
        const plants = sim.plants as Record<string, unknown> | undefined
        const entities = plants?.entities as Record<string, Record<string, unknown>> | undefined
        if (entities) {
            for (const id in entities) {
                const plant = entities[id]
                if (plant && !plant.growId) {
                    plant.growId = DEFAULT_GROW_ID
                }
            }
        }
    }

    // 3. Stamp growId on all existing nutrient schedule entries
    const np = state.nutrientPlanner as Record<string, unknown> | undefined
    if (np && Array.isArray(np.schedule)) {
        for (const entry of np.schedule as Record<string, unknown>[]) {
            if (entry && !entry.growId) {
                entry.growId = DEFAULT_GROW_ID
            }
        }
    }

    if (state.settings?.settings) {
        state.settings.settings = deepMergeSettings(state.settings.settings)
    }

    return state
}

const VERSION_MIGRATIONS: ReadonlyArray<{
    targetVersion: number
    migrate: (s: PersistedState) => PersistedState
}> = [
    { targetVersion: 2, migrate: migrateV1ToV2 },
    { targetVersion: 3, migrate: migrateV2ToV3 },
    { targetVersion: 4, migrate: migrateV3ToV4 },
    { targetVersion: 5, migrate: migrateV4ToV5 },
    { targetVersion: 6, migrate: migrateV5ToV6 },
]

/** Applies sequential version migrations when persisted version is below APP_VERSION. */
export const applyVersionMigrations = (
    state: PersistedState,
    stateVersion: number,
): PersistedState => {
    let migratedState = state
    if (stateVersion < APP_VERSION) {
        console.debug(
            `[MigrationLogic] Migrating from version ${stateVersion} to ${APP_VERSION}...`,
        )
        for (const { targetVersion, migrate } of VERSION_MIGRATIONS) {
            if (stateVersion < targetVersion) {
                migratedState = migrate(migratedState)
            }
        }
    } else {
        console.debug('[MigrationLogic] Persisted state is up to date.')
        if (migratedState.settings?.settings) {
            migratedState.settings.settings = deepMergeSettings(migratedState.settings.settings)
        }
    }
    return migratedState
}
