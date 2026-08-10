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

const requireArrayField = (
    sliceName: string,
    slice: Record<string, unknown>,
    field: string,
): void => {
    if (!Array.isArray(slice[field])) {
        throw new TypeError(`Persisted ${sliceName}.${field} must be an array.`)
    }
}

const requireRecordField = (
    sliceName: string,
    slice: Record<string, unknown>,
    field: string,
): Record<string, unknown> => {
    const value = slice[field]
    if (!isRecord(value)) {
        throw new TypeError(`Persisted ${sliceName}.${field} must be an object.`)
    }
    return value
}

const requireEntityCollection = (
    sliceName: string,
    slice: Record<string, unknown>,
    field?: string,
): void => {
    const collectionValue = field ? slice[field] : slice
    const path = field ? `${sliceName}.${field}` : sliceName
    if (!isRecord(collectionValue)) {
        throw new TypeError(`Persisted ${path} must be an entity collection.`)
    }
    const collection = collectionValue
    if (!Array.isArray(collection.ids) || !isRecord(collection.entities)) {
        throw new TypeError(`Persisted ${path} must be an entity collection.`)
    }
}

// selectOpenTasksSummary/selectActiveProblemsSummary (stores/selectors.ts) call
// .filter() directly on every active plant's `tasks`/`problems` with no
// optional-chaining fallback. requireEntityCollection only validates the
// plants collection's own `ids`/`entities` container shape, not each plant
// entity's fields, so a backup that passes that check can still crash every
// active-plant selector on the very next render after being restored.
const requirePlantEntityFields = (plants: Record<string, unknown>): void => {
    const entities = plants.entities
    if (!isRecord(entities)) return // requireEntityCollection already rejected this shape
    for (const [plantId, entity] of Object.entries(entities)) {
        if (!isRecord(entity)) {
            throw new TypeError(`Persisted simulation.plants.entities.${plantId} must be an object.`)
        }
        for (const field of ['tasks', 'problems'] as const) {
            if (!Array.isArray(entity[field])) {
                throw new TypeError(
                    `Persisted simulation.plants.entities.${plantId}.${field} must be an array.`,
                )
            }
        }
    }
}

const validateNestedSliceShapes = (state: PersistedState): void => {
    const getSlice = (name: (typeof OBJECT_SLICE_KEYS)[number]): Record<string, unknown> | null => {
        const value: unknown = state[name]
        if (value === undefined) return null
        if (!isRecord(value)) {
            throw new TypeError(`Persisted state slice "${name}" must be an object.`)
        }
        return value
    }

    const simulation = getSlice('simulation')
    if (simulation) {
        requireEntityCollection('simulation', simulation, 'plants')
        if (isRecord(simulation.plants)) requirePlantEntityFields(simulation.plants)
        requireArrayField('simulation', simulation, 'plantSlots')
        requireRecordField('simulation', simulation, 'vpdProfiles')
    }
    const userStrains = getSlice('userStrains')
    if (userStrains) requireEntityCollection('userStrains', userStrains)

    const favorites = getSlice('favorites')
    if (favorites) requireArrayField('favorites', favorites, 'favoriteIds')
    const notes = getSlice('notes')
    if (notes) requireRecordField('notes', notes, 'strainNotes')
    const archives = getSlice('archives')
    if (archives) {
        requireArrayField('archives', archives, 'archivedMentorResponses')
        requireRecordField('archives', archives, 'archivedAdvisorResponses')
    }
    const savedItems = getSlice('savedItems')
    if (savedItems) {
        for (const field of ['savedSetups', 'savedStrainTips', 'savedExports']) {
            requireEntityCollection('savedItems', savedItems, field)
        }
    }
    const knowledge = getSlice('knowledge')
    if (knowledge) {
        requireRecordField('knowledge', knowledge, 'knowledgeProgress')
        requireRecordField('knowledge', knowledge, 'learningPathProgress')
    }
    const breeding = getSlice('breeding')
    if (breeding) {
        for (const field of ['collectedSeeds', 'seedInventory', 'pollenRecords']) {
            requireArrayField('breeding', breeding, field)
        }
        requireRecordField('breeding', breeding, 'breedingSlots')
    }
    const sandbox = getSlice('sandbox')
    if (sandbox) requireArrayField('sandbox', sandbox, 'savedExperiments')
    const genealogy = getSlice('genealogy')
    if (genealogy) requireRecordField('genealogy', genealogy, 'computedTrees')

    for (const [sliceName, fields] of [
        ['nutrientPlanner', ['schedule', 'readings', 'alerts']],
        ['hydro', ['readings', 'alerts']],
        ['metrics', ['readings']],
        ['growPlanner', ['tasks']],
    ] as const) {
        const slice = getSlice(sliceName)
        if (slice) for (const field of fields) requireArrayField(sliceName, slice, field)
    }
    const hydro = getSlice('hydro')
    if (hydro) requireRecordField('hydro', hydro, 'thresholds')
    const grows = getSlice('grows')
    if (grows) requireEntityCollection('grows', grows, 'grows')
    const diagnosisHistory = getSlice('diagnosisHistory')
    if (diagnosisHistory) requireEntityCollection('diagnosisHistory', diagnosisHistory, 'records')
    const problemTracker = getSlice('problemTracker')
    if (problemTracker) requireEntityCollection('problemTracker', problemTracker, 'issues')
}

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

    validateNestedSliceShapes(state)
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
