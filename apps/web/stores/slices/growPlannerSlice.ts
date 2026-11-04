import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { GrowPlannerState, PlannerTask } from '@/types'

import {
    MAX_TASKS,
    planNewTasks,
    type GeneratedTasks,
    type GeneratedTasksPlan,
} from './growPlannerPlan'

export { MAX_TASKS, planNewTasks, type GeneratedTasks, type GeneratedTasksPlan }

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: GrowPlannerState = {
    tasks: [],
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const growPlannerSlice = createSlice({
    name: 'growPlanner',
    initialState,
    reducers: {
        addPlannerTask(state, action: PayloadAction<PlannerTask>) {
            // A task added by hand is always kept, and nothing is removed for it.
            state.tasks.push(action.payload)
        },
        completePlannerTask(state, action: PayloadAction<{ taskId: string; completedAt: number }>) {
            const task = state.tasks.find((t) => t.id === action.payload.taskId)
            if (task) {
                task.completedAt = action.payload.completedAt
            }
        },
        removePlannerTask(state, action: PayloadAction<string>) {
            state.tasks = state.tasks.filter((t) => t.id !== action.payload)
        },
        updatePlannerTask(
            state,
            action: PayloadAction<{ taskId: string; changes: Partial<Omit<PlannerTask, 'id'>> }>,
        ) {
            const task = state.tasks.find((t) => t.id === action.payload.taskId)
            if (task) {
                Object.assign(task, action.payload.changes)
            }
        },
        clearCompletedTasks(state, action: PayloadAction<string | undefined>) {
            state.tasks = state.tasks.filter(
                (t) =>
                    t.completedAt == null ||
                    (action.payload != null && t.plantId !== action.payload),
            )
        },
        clearTasksForPlant(state, action: PayloadAction<string>) {
            state.tasks = state.tasks.filter((t) => t.plantId !== action.payload)
        },
        bulkAddTasks(state, action: PayloadAction<GeneratedTasks>) {
            state.tasks = planNewTasks(state.tasks, action.payload).next
        },
    },
})

export const {
    addPlannerTask,
    completePlannerTask,
    removePlannerTask,
    updatePlannerTask,
    clearCompletedTasks,
    clearTasksForPlant,
    bulkAddTasks,
} = growPlannerSlice.actions

export type AutoScheduleOutcome = Omit<GeneratedTasksPlan, 'next'>

type AddGeneratedTasksThunk = (
    dispatch: (action: ReturnType<typeof bulkAddTasks>) => unknown,
    getState: () => RootState,
) => AutoScheduleOutcome

/** Adds generated tasks and reports what was added, already there, or left out. */
export const addGeneratedTasks =
    (generated: GeneratedTasks): AddGeneratedTasksThunk =>
    (dispatch, getState) => {
        // The same pure decision the reducer makes, so the counts match what it stores.
        const plan = planNewTasks(getState().growPlanner.tasks, generated)
        dispatch(bulkAddTasks(generated))
        return {
            added: plan.added,
            alreadyScheduled: plan.alreadyScheduled,
            refusedForCap: plan.refusedForCap,
            fromOtherSchedule: plan.fromOtherSchedule,
        }
    }

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectAllPlannerTasks = (state: RootState): PlannerTask[] => state.growPlanner.tasks

export const selectPlannerTasksForPlant = (
    plantId: string,
): ((state: RootState) => PlannerTask[]) =>
    createSelector(
        (state: RootState) => state.growPlanner.tasks,
        (tasks) => tasks.filter((t) => t.plantId === plantId),
    )

export const selectUpcomingTasks = (
    plantId?: string | undefined,
): ((state: RootState) => PlannerTask[]) =>
    createSelector(
        (state: RootState) => state.growPlanner.tasks,
        (tasks) => {
            const now = Date.now()
            return tasks.filter(
                (t) =>
                    t.completedAt == null &&
                    t.scheduledAt >= now &&
                    (plantId == null || t.plantId === plantId),
            )
        },
    )

export const selectOverdueTasks = (
    plantId?: string | undefined,
): ((state: RootState) => PlannerTask[]) =>
    createSelector(
        (state: RootState) => state.growPlanner.tasks,
        (tasks) => {
            const now = Date.now()
            return tasks.filter(
                (t) =>
                    t.completedAt == null &&
                    t.scheduledAt < now &&
                    (plantId == null || t.plantId === plantId),
            )
        },
    )

export const selectTodayTasks = (
    plantId?: string | undefined,
): ((state: RootState) => PlannerTask[]) =>
    createSelector(
        (state: RootState) => state.growPlanner.tasks,
        (tasks) => {
            const now = new Date()
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
            const endOfDay = startOfDay + 86_400_000
            return tasks.filter(
                (t) =>
                    t.completedAt == null &&
                    t.scheduledAt >= startOfDay &&
                    t.scheduledAt < endOfDay &&
                    (plantId == null || t.plantId === plantId),
            )
        },
    )

export default growPlannerSlice.reducer
