// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- multi-grow & planner domain types
// ---------------------------------------------------------------------------

import type { GrowAction } from './enums'
import type { Plant } from './plant'

export interface Grow {
    id: string
    name: string
    createdAt: number
    updatedAt: number
    /** Whether this grow is currently active */
    isActive: boolean
    /** Optional description */
    description?: string | undefined
    /** Accent color (CSS hex) */
    color?: string | undefined
    /** Display emoji */
    emoji?: string | undefined
    /** Archived (finished) grow */
    archived?: boolean | undefined
}

/** Data format for per-grow export (v2.0). */
export interface GrowExportData {
    version: '2.0'
    exportedAt: number
    grow: Grow
    plants: Plant[]
}

/** Summary statistics for a single grow. */
export interface GrowSummary {
    growId: string
    plantCount: number
    activePlantCount: number
    journalEntryCount: number
    nutrientEntryCount: number
    oldestPlantAge: number
    averageHealth: number
}

export interface PlannerTask {
    id: string
    plantId: string
    type: GrowAction
    scheduledAt: number
    completedAt?: number | undefined
    recurring: boolean
    intervalDays?: number | undefined
    notes?: string | undefined
}

export interface GrowPlannerState {
    tasks: PlannerTask[]
}
