// ---------------------------------------------------------------------------
// problemTrackerSlice -- Plant Issue Tracking for CannaGuide 2025
//
// CRUD + status machine for plant issues (pests, deficiencies, toxicities,
// diseases, environmental). FIFO capped at 200 issues.
// ---------------------------------------------------------------------------

import { createSlice, createSelector, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { PlantIssue, IssueTreatment, ProblemTrackerState, IssueStatus } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ISSUES = 200
const MAX_TREATMENTS_PER_ISSUE = 50

export const issuesAdapter = createEntityAdapter<PlantIssue>()

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: ProblemTrackerState = {
    issues: issuesAdapter.getInitialState(),
}

const selectIssuesEntityState = (state: RootState) => state.problemTracker.issues

const issueSelectors = issuesAdapter.getSelectors(selectIssuesEntityState)

function trimIssuesFifo(state: ProblemTrackerState): void {
    const excess = state.issues.ids.length - MAX_ISSUES
    if (excess > 0) {
        issuesAdapter.removeMany(state.issues, state.issues.ids.slice(0, excess))
    }
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const problemTrackerSlice = createSlice({
    name: 'problemTracker',
    initialState,
    reducers: {
        addIssue(state, action: PayloadAction<PlantIssue>) {
            issuesAdapter.addOne(state.issues, action.payload)
            trimIssuesFifo(state)
        },

        updateIssue(
            state,
            action: PayloadAction<{
                issueId: string
                changes: Partial<Omit<PlantIssue, 'id' | 'plantId' | 'detectedAt'>>
            }>,
        ) {
            issuesAdapter.updateOne(state.issues, {
                id: action.payload.issueId,
                changes: action.payload.changes,
            })
        },

        removeIssue(state, action: PayloadAction<string>) {
            issuesAdapter.removeOne(state.issues, action.payload)
        },

        setIssueStatus(state, action: PayloadAction<{ issueId: string; status: IssueStatus }>) {
            const issue = state.issues.entities[action.payload.issueId]
            if (!issue) {
                return
            }
            const changes: Partial<PlantIssue> = { status: action.payload.status }
            if (action.payload.status === 'resolved' && issue.resolvedAt == null) {
                changes.resolvedAt = Date.now()
            }
            issuesAdapter.updateOne(state.issues, {
                id: action.payload.issueId,
                changes,
            })
        },

        addTreatment(state, action: PayloadAction<{ issueId: string; treatment: IssueTreatment }>) {
            const issue = state.issues.entities[action.payload.issueId]
            if (!issue) {
                return
            }
            const treatments = [...issue.treatments, action.payload.treatment]
            if (treatments.length > MAX_TREATMENTS_PER_ISSUE) {
                treatments.splice(0, treatments.length - MAX_TREATMENTS_PER_ISSUE)
            }
            const changes: Partial<PlantIssue> = { treatments }
            if (issue.status === 'detected') {
                changes.status = 'treating'
            }
            issuesAdapter.updateOne(state.issues, {
                id: action.payload.issueId,
                changes,
            })
        },

        removeTreatment(state, action: PayloadAction<{ issueId: string; treatmentId: string }>) {
            const issue = state.issues.entities[action.payload.issueId]
            if (!issue) {
                return
            }
            issuesAdapter.updateOne(state.issues, {
                id: action.payload.issueId,
                changes: {
                    treatments: issue.treatments.filter(
                        (t) => t.id !== action.payload.treatmentId,
                    ),
                },
            })
        },

        clearIssuesForPlant(state, action: PayloadAction<string>) {
            const plantId = action.payload
            const idsToRemove = state.issues.ids.filter(
                (id) => state.issues.entities[id]?.plantId === plantId,
            )
            issuesAdapter.removeMany(state.issues, idsToRemove)
        },

        clearResolvedIssues(state) {
            const idsToRemove = state.issues.ids.filter(
                (id) => state.issues.entities[id]?.status === 'resolved',
            )
            issuesAdapter.removeMany(state.issues, idsToRemove)
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

export const selectAllIssues = (state: RootState): PlantIssue[] => issueSelectors.selectAll(state)

export const selectIssuesForPlant = (plantId: string): ((state: RootState) => PlantIssue[]) =>
    createSelector((state: RootState) => selectAllIssues(state), (issues) =>
        issues.filter((i) => i.plantId === plantId),
    )

export const selectActiveIssuesForPlant = (plantId: string): ((state: RootState) => PlantIssue[]) =>
    createSelector((state: RootState) => selectAllIssues(state), (issues) =>
        issues.filter((i) => i.plantId === plantId && i.status !== 'resolved'),
    )

export const selectIssueById = (issueId: string): ((state: RootState) => PlantIssue | undefined) =>
    createSelector(
        (state: RootState) => state.problemTracker.issues.entities[issueId],
        (issue) => issue,
    )

export const selectIssueCountByStatus = createSelector(
    (state: RootState) => selectAllIssues(state),
    (issues) => ({
        detected: issues.filter((i) => i.status === 'detected').length,
        treating: issues.filter((i) => i.status === 'treating').length,
        resolved: issues.filter((i) => i.status === 'resolved').length,
        total: issues.length,
    }),
)

export default problemTrackerSlice.reducer
