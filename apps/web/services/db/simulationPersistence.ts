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

const byOldestFirst = (left: JournalEntry, right: JournalEntry): number =>
    (Number.isFinite(left.createdAt) ? left.createdAt : 0) -
    (Number.isFinite(right.createdAt) ? right.createdAt : 0)

/** Each id once (the first copy wins), oldest first, the newest MAX_ARCHIVED_LOGS_PER_PLANT kept. */
const canonicalArchive = (entries: readonly JournalEntry[]): JournalEntry[] => {
    const seen = new Set<string>()
    const unique: JournalEntry[] = []
    for (const entry of entries) {
        if (seen.has(entry.id)) continue
        seen.add(entry.id)
        unique.push(entry)
    }
    return unique.sort(byOldestFirst).slice(-MAX_ARCHIVED_LOGS_PER_PLANT)
}

const sameIds = (left: readonly JournalEntry[], right: readonly JournalEntry[]): boolean =>
    left.length === right.length && left.every((entry, index) => entry.id === right[index]?.id)

/** A plant's stored entries; a plant id such as "constructor" must not read Object.prototype. */
const storedEntries = (archive: ArchivedJournalMap, plantId: string): JournalEntry[] =>
    Object.hasOwn(archive, plantId) ? (archive[plantId] ?? []) : []

/**
 * The archive with this save's overflow merged in, or null when it would not
 * change (GH #668).
 *
 * Every save trims only the copy it writes: the store keeps the full journal,
 * so the next save hands over the same overflow again. Appending it each time
 * filled the archive with copies, and the cap then pushed distinct older
 * entries out. Now each plant's archive is a pure function of what it held plus
 * the overflow: each id once, oldest first, the newest entries within the cap.
 * The same input gives the same archive, so repeated saves are no-ops, also
 * when the overflow is larger than the cap, and copies left by the old code are
 * removed by the next write.
 */
const mergeArchive = (
    existing: ArchivedJournalMap,
    archivedByPlant: ArchivedJournalMap,
): ArchivedJournalMap | null => {
    const updates = Object.entries(archivedByPlant).flatMap(([plantId, entries]) => {
        const current = storedEntries(existing, plantId)
        const next = canonicalArchive([...current, ...entries])
        return sameIds(current, next) ? [] : [[plantId, next] as const]
    })
    return updates.length === 0 ? null : { ...existing, ...Object.fromEntries(updates) }
}

interface JournalSplit {
    archivedByPlant: ArchivedJournalMap
    nextEntities: Record<string, Plant>
    hasChanges: boolean
}

/** The saved copy keeps the newest `keepPerPlant` entries; the rest is overflow. */
const splitJournals = (simulationState: SimulationState, keepPerPlant: number): JournalSplit => {
    const split: JournalSplit = { archivedByPlant: {}, nextEntities: {}, hasChanges: false }
    for (const plantId of simulationState.plants.ids) {
        const plant = simulationState.plants.entities[plantId]
        if (!plant) continue
        if (plant.journal.length <= keepPerPlant) {
            split.nextEntities[plantId] = plant
            continue
        }
        split.hasChanges = true
        const cutoff = plant.journal.length - keepPerPlant
        split.archivedByPlant[plantId] = plant.journal.slice(0, cutoff).map(compactArchivedEntry)
        split.nextEntities[plantId] = { ...plant, journal: plant.journal.slice(-keepPerPlant) }
    }
    return split
}

export const simulationPersistence = {
    async optimizeSimulationForPersistence(
        simulationState: SimulationState,
    ): Promise<SimulationState> {
        const estimate = await getStorageEstimateSnapshot()
        const keepPerPlant = chooseJournalRetentionLimit(estimate.usageRatio)
        const { archivedByPlant, nextEntities, hasChanges } = splitJournals(
            simulationState,
            keepPerPlant,
        )

        if (Object.keys(archivedByPlant).length > 0) {
            const existingArchive =
                (await metadataStore.getMetadata<ArchivedJournalMap>(ARCHIVED_LOGS_METADATA_KEY)) ??
                {}
            const mergedArchive = mergeArchive(existingArchive, archivedByPlant)
            // Nothing new for the archive: no write.
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
