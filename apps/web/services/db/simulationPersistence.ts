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
            const mergedArchive: ArchivedJournalMap = { ...existingArchive }

            Object.entries(archivedByPlant).forEach(([plantId, entries]) => {
                const current = mergedArchive[plantId] ?? []
                const combined = [...current, ...entries]
                mergedArchive[plantId] = combined.slice(-MAX_ARCHIVED_LOGS_PER_PLANT)
            })

            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, mergedArchive)
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
