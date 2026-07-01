import type { JournalEntry, SimulationState } from '@/types'

/** Represents a key-value pair in the metadata store. */
export interface MetadataItem<T = unknown> {
    key: string
    value: T
}

/** Represents a snapshot of storage estimate data. */
export interface StorageEstimateSnapshot {
    usage: number
    quota: number
    usageRatio: number
}

export type ArchivedJournalMap = Record<string, JournalEntry[]>

/** A single calculator computation saved to IndexedDB for history recall. */
export interface CalculatorHistoryEntry {
    id: string
    calculatorId: string
    inputs: Record<string, number | string>
    result: Record<string, number | string>
    timestamp: number
    label?: string
}

export const MAX_CALCULATOR_HISTORY_PER_CALCULATOR = 20
export const ARCHIVED_LOGS_METADATA_KEY = 'archived_plant_logs_v1'
export const STORAGE_USAGE_WARNING_RATIO = 0.78
export const STORAGE_USAGE_CRITICAL_RATIO = 0.9
export const DEFAULT_JOURNAL_KEEP_PER_PLANT = 350
export const WARNING_JOURNAL_KEEP_PER_PLANT = 220
export const CRITICAL_JOURNAL_KEEP_PER_PLANT = 120
export const MAX_ARCHIVED_LOGS_PER_PLANT = 1200
export const IMAGE_PRUNE_BATCH_SIZE = 20

export const stripSimulationDerivedData = (simulationState: SimulationState): SimulationState => {
    const { vpdProfiles: _vp, ...rest } = simulationState
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return rest as SimulationState
}
