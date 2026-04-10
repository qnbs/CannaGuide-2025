// ---------------------------------------------------------------------------
// problemTrackerSlice -- Plant Issue Tracking for CannaGuide 2025
//
// CRUD + status machine for plant issues (pests, deficiencies, toxicities,
// diseases, environmental). FIFO capped at 200 issues.
// ---------------------------------------------------------------------------

import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { PlantIssue, IssueTreatment, ProblemTrackerState, IssueStatus } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ISSUES = 200
const MAX_TREATMENTS_PER_ISSUE = 50

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: ProblemTrackerState = {
    issues: [],
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const problemTrackerSlice = createSlice({
    name: 'problemTracker',
    initialState,
    reducers: {
        addIssue(state, action: PayloadAction<PlantIssue>) {
            state.issues.push(action.payload)
            // FIFO cap
            if (state.issues.length > MAX_ISSUES) {
                state.issues = state.issues.slice(state.issues.length - MAX_ISSUES)
            }
        },

        updateIssue(
            state,
            action: PayloadAction<{
                issueId: string
                changes: Partial<Omit<PlantIssue, 'id' | 'plantId' | 'detectedAt'>>
            }>,
        ) {
            const issue = state.issues.find((i) => i.id === action.payload.issueId)
            if (issue) {
                Object.assign(issue, action.payload.changes)
            }
        },

        removeIssue(state, action: PayloadAction<string>) {
            state.issues = state.issues.filter((i) => i.id !== action.payload)
        },

        setIssueStatus(state, action: PayloadAction<{ issueId: string; status: IssueStatus }>) {
            const issue = state.issues.find((i) => i.id === action.payload.issueId)
            if (issue) {
                issue.status = action.payload.status
                if (action.payload.status === 'resolved' && issue.resolvedAt == null) {
                    issue.resolvedAt = Date.now()
                }
            }
        },

        addTreatment(state, action: PayloadAction<{ issueId: string; treatment: IssueTreatment }>) {
            const issue = state.issues.find((i) => i.id === action.payload.issueId)
            if (issue) {
                issue.treatments.push(action.payload.treatment)
                // Cap treatments per issue
                if (issue.treatments.length > MAX_TREATMENTS_PER_ISSUE) {
                    issue.treatments = issue.treatments.slice(
                        issue.treatments.length - MAX_TREATMENTS_PER_ISSUE,
                    )
                }
                // Auto-transition to treating status
                if (issue.status === 'detected') {
                    issue.status = 'treating'
                }
            }
        },

        removeTreatment(state, action: PayloadAction<{ issueId: string; treatmentId: string }>) {
            const issue = state.issues.find((i) => i.id === action.payload.issueId)
            if (issue) {
                issue.treatments = issue.treatments.filter(
                    (t) => t.id !== action.payload.treatmentId,
                )
            }
        },

        clearIssuesForPlant(state, action: PayloadAction<string>) {
            state.issues = state.issues.filter((i) => i.plantId !== action.payload)
        },

        clearResolvedIssues(state) {
            state.issues = state.issues.filter((i) => i.status !== 'resolved')
        },
    },
})

export const {
    addIssue,
    updateIssue,
    removeIssue,
    setIssueStatus,
    addTreatment,
    removeTreatment,
    clearIssuesForPlant,
    clearResolvedIssues,
} = problemTrackerSlice.actions

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectAllIssues = (state: RootState): PlantIssue[] => state.problemTracker.issues

export const selectIssuesForPlant = (plantId: string): ((state: RootState) => PlantIssue[]) =>
    createSelector(
        (state: RootState) => state.problemTracker.issues,
        (issues) => issues.filter((i) => i.plantId === plantId),
    )

export const selectActiveIssuesForPlant = (plantId: string): ((state: RootState) => PlantIssue[]) =>
    createSelector(
        (state: RootState) => state.problemTracker.issues,
        (issues) => issues.filter((i) => i.plantId === plantId && i.status !== 'resolved'),
    )

export const selectIssueById = (issueId: string): ((state: RootState) => PlantIssue | undefined) =>
    createSelector(
        (state: RootState) => state.problemTracker.issues,
        (issues) => issues.find((i) => i.id === issueId),
    )

export const selectIssueCountByStatus = createSelector(
    (state: RootState) => state.problemTracker.issues,
    (issues) => ({
        detected: issues.filter((i) => i.status === 'detected').length,
        treating: issues.filter((i) => i.status === 'treating').length,
        resolved: issues.filter((i) => i.status === 'resolved').length,
        total: issues.length,
    }),
)

export default problemTrackerSlice.reducer
