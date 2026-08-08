import type { PersistedState } from './migrationTypes'
import { migrateState } from './migrateStateOrchestrator'

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const OBJECT_SLICE_KEYS = [
    'settings',
    'simulation',
    'userStrains',
    'favorites',
    'notes',
    'archives',
    'savedItems',
    'knowledge',
    'breeding',
    'sandbox',
    'genealogy',
    'nutrientPlanner',
    'hydro',
    'grows',
    'metrics',
    'growPlanner',
    'diagnosisHistory',
    'problemTracker',
    'ui',
] as const

const validateMigratedShape = (state: PersistedState): void => {
    for (const sliceName of OBJECT_SLICE_KEYS) {
        const slice = state[sliceName]
        if (slice !== undefined && !isRecord(slice)) {
            throw new TypeError(`Persisted state slice "${sliceName}" must be an object.`)
        }
    }

    if (state.settings && !isRecord(state.settings.settings)) {
        throw new TypeError('Persisted settings payload must be an object.')
    }

    if (state.simulation) {
        const plants = state.simulation.plants as unknown
        if (!isRecord(plants) || !Array.isArray(plants.ids) || !isRecord(plants.entities)) {
            throw new TypeError('Persisted simulation plants must be an entity collection.')
        }
    }
}

/** Parse a persisted snapshot and run the canonical migration/shape-repair pipeline. */
export const parseAndMigratePersistedSnapshot = (snapshot: string): PersistedState => {
    const parsed: unknown = JSON.parse(snapshot)
    if (!isRecord(parsed)) {
        throw new TypeError('Persisted state must be a JSON object.')
    }

    const migrated = migrateState(parsed as PersistedState)
    validateMigratedShape(migrated)
    return migrated
}

/** Return a canonical, migrated snapshot that is safe for the hydration path to consume. */
export const migratePersistedSnapshot = (snapshot: string): string =>
    JSON.stringify(parseAndMigratePersistedSnapshot(snapshot))
