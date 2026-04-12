// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- issue tracking domain types
// ---------------------------------------------------------------------------

import type { IssueCategory, IssueStatus, IssueSeverity } from './enums'

/** Treatment log entry for a plant issue */
export interface IssueTreatment {
    id: string
    /** Timestamp of treatment */
    timestamp: number
    /** Description of what was done */
    action: string
    /** Optional product/substance used */
    product?: string | undefined
    /** Outcome notes */
    notes?: string | undefined
}

/** Tracked plant issue with lifecycle */
export interface PlantIssue {
    id: string
    plantId: string
    /** Category of the issue */
    category: IssueCategory
    /** Current status */
    status: IssueStatus
    /** Severity level */
    severity: IssueSeverity
    /** Short title / label */
    title: string
    /** Detailed description */
    description?: string | undefined
    /** Timestamp when issue was first detected */
    detectedAt: number
    /** Timestamp when issue was resolved (if applicable) */
    resolvedAt?: number | undefined
    /** Treatment log */
    treatments: IssueTreatment[]
    /** Optional linked diagnosis record ID */
    diagnosisId?: string | undefined
    /** Optional linked image IDs (before/after) */
    imageIds?: string[] | undefined
}

/** Redux state for problem tracker */
export interface ProblemTrackerState {
    issues: PlantIssue[]
}
