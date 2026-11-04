import type { JournalEntry, Plant, SimulationState } from '@/types'
import { metadataStore } from './metadataStore'
import {
    chooseJournalRetentionLimit,
    compactArchivedEntry,
    getStorageEstimateSnapshot,
} from './storageHelpers'
import {
    ARCHIVED_LOGS_METADATA_KEY,
    MAX_ARCHIVED_LOGS_PER_PLANT,
    stripSimulationDerivedData,
    type ArchivedJournalMap,
} from './types'

/**
 * Adds to a plant's archive only the entries it does not hold yet, by id,
 * oldest first, within the cap (GH #668).
 *
 * Every save trims only the copy it writes: the store keeps the full journal,
 * so the next save hands over the same overflow again. Appending it each time
 * filled the archive with copies, and the cap then pushed distinct older
 * entries out. Merging by id makes repeated saves of the same state a no-op.
 */
/** The entries of `incoming` the archive does not hold yet, by id. */
const newEntries = (
    current: readonly JournalEntry[],
    incoming: readonly JournalEntry[],
): JournalEntry[] => {
    const known = new Set(current.map((entry) => entry.id))
    return incoming.filter((entry) => !known.has(entry.id))
}

/** The archive with this save's new overflow merged in, or null when nothing is new. */
const mergeArchive = (
    existing: ArchivedJournalMap,
    archivedByPlant: ArchivedJournalMap,
): ArchivedJournalMap | null => {
    const merged: ArchivedJournalMap = { ...existing }
    let changed = false
    for (const [plantId, entries] of Object.entries(archivedByPlant)) {
        const current = merged[plantId] ?? []
        const added = newEntries(current, entries)
        if (added.length === 0) continue
        changed = true
        merged[plantId] = [...current, ...added].slice(-MAX_ARCHIVED_LOGS_PER_PLANT)
    }
    return changed ? merged : null
}

export const simulationPersistence = {
    async optimizeSimulationForPersistence(
        simulationState: SimulationState,
    ): Promise<SimulationState> {
        const estimate = await getStorageEstimateSnapshot()
        const keepPerPlant = chooseJournalRetentionLimit(estimate.usageRatio)

        const entityIds = simulationState.plants.ids.filter(
            (id): id is string => typeof id === 'string',
        )
        const archivedByPlant: ArchivedJournalMap = {}
        const nextEntities: Record<string, Plant> = {}
        let hasChanges = false

        for (const plantId of entityIds) {
            const plant = simulationState.plants.entities[plantId]
            if (!plant) {
                continue
            }

            if (plant.journal.length <= keepPerPlant) {
                nextEntities[plantId] = plant
                continue
            }

            hasChanges = true
            const archiveCutoff = plant.journal.length - keepPerPlant
            const archivedEntries = plant.journal.slice(0, archiveCutoff).map(compactArchivedEntry)
            const keptEntries = plant.journal.slice(-keepPerPlant)

            archivedByPlant[plantId] = archivedEntries
            nextEntities[plantId] = {
                ...plant,
                journal: keptEntries,
            }
        }

        if (Object.keys(archivedByPlant).length > 0) {
            const existingArchive =
                (await metadataStore.getMetadata<ArchivedJournalMap>(ARCHIVED_LOGS_METADATA_KEY)) ??
                {}
            const mergedArchive = mergeArchive(existingArchive, archivedByPlant)
            // The same overflow as last time: nothing to write.
            if (mergedArchive) {
                await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, mergedArchive)
            }
        }

        if (!hasChanges) {
            return stripSimulationDerivedData(simulationState)
        }

        const rest = stripSimulationDerivedData(simulationState)
        return {
            ...rest,
            plants: {
                ...simulationState.plants,
                entities: nextEntities,
            },
        } as SimulationState
    },

    async getArchivedPlantLogs(plantId: string): Promise<JournalEntry[]> {
        const archive =
            (await metadataStore.getMetadata<ArchivedJournalMap>(ARCHIVED_LOGS_METADATA_KEY)) ?? {}
        return archive[plantId] ?? []
    },
}
