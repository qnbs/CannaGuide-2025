import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { GrowPlannerState, PlannerTask } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_TASKS = 500

/**
 * Makes room within MAX_TASKS by removing the longest-completed tasks only. An
 * open task, generated or added by hand, is never removed to make room (GH
 * #659): the old FIFO cut dropped the oldest tasks whatever their state.
 */
const withoutOldestCompleted = (tasks: PlannerTask[]): PlannerTask[] => {
    const excess = tasks.length - MAX_TASKS
    if (excess <= 0) return tasks
    const removable = tasks
        .filter((task) => task.completedAt != null)
        .sort((left, right) => (left.completedAt ?? 0) - (right.completedAt ?? 0))
        .slice(0, excess)
    const removed = new Set(removable.map((task) => task.id))
    return tasks.filter((task) => !removed.has(task.id))
}

/**
 * Adds the generated tasks the planner does not have yet. When open tasks fill
 * the planner, the new tasks that do not fit are left out, latest first, rather
 * than removing anything the user already has.
 */
const addNewTasks = (tasks: PlannerTask[], incoming: PlannerTask[]): PlannerTask[] => {
    const known = new Set(tasks.map((task) => task.id))
    const fresh = incoming.filter((task) => {
        if (known.has(task.id)) return false
        known.add(task.id)
        return true
    })
    const trimmed = withoutOldestCompleted([...tasks, ...fresh])
    const overflow = trimmed.length - MAX_TASKS
    if (overflow <= 0) return trimmed
    const refused = new Set(fresh.slice(fresh.length - overflow).map((task) => task.id))
    return trimmed.filter((task) => !refused.has(task.id))
}

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
            // A task added by hand is always kept; only completed tasks make room.
            state.tasks = withoutOldestCompleted([...state.tasks, action.payload])
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
            state.tasks = addNewTasks(state.tasks, action.payload)
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

export interface AutoScheduleOutcome {
    added: number
    alreadyScheduled: number
    refusedForCap: number
}

/** Adds generated tasks and reports how many were new, already there, or did not fit. */
export const addGeneratedTasks =
    (tasks: PlannerTask[]) =>
    (
        dispatch: (action: ReturnType<typeof bulkAddTasks>) => unknown,
        getState: () => RootState,
    ): AutoScheduleOutcome => {
        const before = new Set(getState().growPlanner.tasks.map((task) => task.id))
        const alreadyScheduled = tasks.filter((task) => before.has(task.id)).length
        dispatch(bulkAddTasks(tasks))
        const after = new Set(getState().growPlanner.tasks.map((task) => task.id))
        const added = tasks.filter((task) => !before.has(task.id) && after.has(task.id)).length
        return { added, alreadyScheduled, refusedForCap: tasks.length - alreadyScheduled - added }
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
