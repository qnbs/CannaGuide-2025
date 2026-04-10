import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { GrowPlannerState, PlannerTask } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TASKS = 500

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
            state.tasks.push(action.payload)
            // FIFO cap
            if (state.tasks.length > MAX_TASKS) {
                state.tasks = state.tasks.slice(state.tasks.length - MAX_TASKS)
            }
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
        bulkAddTasks(state, action: PayloadAction<PlannerTask[]>) {
            state.tasks.push(...action.payload)
            // FIFO cap
            if (state.tasks.length > MAX_TASKS) {
                state.tasks = state.tasks.slice(state.tasks.length - MAX_TASKS)
            }
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
