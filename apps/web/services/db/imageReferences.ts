import { REDUX_STATE_KEY } from '@/constants'
import { getReduxSnapshot } from '@/services/uiStateBridge'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { metadataStore } from './metadataStore'
import { ARCHIVED_LOGS_METADATA_KEY } from './types'

// Journal entries are the only persisted references to stored images
// (`details.imageId`, written by the photo and AI-diagnosis flows). Archiving
// keeps `imageId`, so archived entries still reference their photo.

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const addEntryImageIds = (entries: unknown, referenced: Set<string>): void => {
    if (!Array.isArray(entries)) {
        throw new TypeError('Journal entries must be an array.')
    }
    for (const entry of entries) {
        if (
            isRecord(entry) &&
            isRecord(entry.details) &&
            typeof entry.details.imageId === 'string'
        ) {
            referenced.add(entry.details.imageId)
        }
    }
}

/** Add every journal image ID in a simulation slice; throws on an unexpected shape. */
export const addSimulationImageIds = (simulation: unknown, referenced: Set<string>): void => {
    if (simulation === undefined) return
    if (!isRecord(simulation)) {
        throw new TypeError('Simulation state must be an object.')
    }
    const { plants } = simulation
    const plantList = Array.isArray(plants)
        ? plants
        : isRecord(plants) && isRecord(plants.entities)
          ? Object.values(plants.entities)
          : null
    if (!plantList) {
        throw new TypeError('Simulation plants must be an array or an entity collection.')
    }
    for (const plant of plantList) {
        if (!isRecord(plant)) continue
        // Only a missing journal is empty; `null` or any other value is unexpected.
        if (plant.journal !== undefined) addEntryImageIds(plant.journal, referenced)
    }
}

/**
 * Every image ID that any copy of the journal references: this tab's live state,
 * the persisted primary and backup snapshots, and archived journal entries.
 *
 * Throws when a source cannot be read or has an unexpected shape, so a caller
 * deletes nothing it cannot prove is unreferenced.
 */
export const collectReferencedImageIds = async (): Promise<Set<string>> => {
    const referenced = new Set<string>()
    addSimulationImageIds(
        getReduxSnapshot((state) => state.simulation),
        referenced,
    )

    for (const key of [REDUX_STATE_KEY, `${REDUX_STATE_KEY}-backup`]) {
        const snapshot = await indexedDBStorage.getItem(key)
        if (snapshot === null) continue
        const parsed: unknown = JSON.parse(snapshot)
        if (!isRecord(parsed)) {
            throw new TypeError(`Persisted snapshot "${key}" must be an object.`)
        }
        addSimulationImageIds(parsed.simulation, referenced)
    }

    const archive = await metadataStore.getMetadata(ARCHIVED_LOGS_METADATA_KEY)
    if (archive !== undefined) {
        if (!isRecord(archive)) {
            throw new TypeError('Archived journal logs must be an object.')
        }
        for (const entries of Object.values(archive)) addEntryImageIds(entries, referenced)
    }
    return referenced
}
