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

/** Generated before stable ids existed (GH #659): `auto-<time>-<counter>-<uuid>`. */
const LEGACY_AUTO_ID = /^auto-\d+-\d+-/u

const taskKey = (task: PlannerTask): string => `${task.plantId}|${task.type}|${task.notes ?? ''}`

/** Open tasks generated with the old random ids, by what they are. */
const legacyOpenKeys = (tasks: readonly PlannerTask[]): Set<string> =>
    new Set(
        tasks
            .filter((task) => task.completedAt == null && LEGACY_AUTO_ID.test(task.id))
            .map(taskKey),
    )

const uniqueById = (tasks: readonly PlannerTask[]): PlannerTask[] => {
    const seen = new Set<string>()
    const unique: PlannerTask[] = []
    for (const task of tasks) {
        if (seen.has(task.id)) continue
        seen.add(task.id)
        unique.push(task)
    }
    return unique
}

export interface GeneratedTasksPlan {
    next: PlannerTask[]
    added: number
    alreadyScheduled: number
    refusedForCap: number
}

/**
 * What adding generated tasks does to the planner. A task counts as already
 * scheduled when its id is there, or when an open task generated before stable
 * ids has the same plant, type and notes. With nothing new, nothing changes,
 * not even the completed tasks. Room is made by removing the longest-completed
 * tasks only; the new tasks that still do not fit are left out, latest first.
 */
export const planNewTasks = (
    tasks: PlannerTask[],
    incoming: readonly PlannerTask[],
): GeneratedTasksPlan => {
    const known = new Set(tasks.map((task) => task.id))
    const legacy = legacyOpenKeys(tasks)
    const isScheduled = (task: PlannerTask) => known.has(task.id) || legacy.has(taskKey(task))
    const unique = uniqueById(incoming)
    const fresh = unique.filter((task) => !isScheduled(task))
    const alreadyScheduled = unique.length - fresh.length
    if (fresh.length === 0) return { next: tasks, added: 0, alreadyScheduled, refusedForCap: 0 }

    const trimmed = withoutOldestCompleted([...tasks, ...fresh])
    // Manual additions may already exceed the cap: then no new task fits at all.
    const refusedForCap = Math.min(Math.max(trimmed.length - MAX_TASKS, 0), fresh.length)
    const refused = new Set(fresh.slice(fresh.length - refusedForCap).map((task) => task.id))
    return {
        next: trimmed.filter((task) => !refused.has(task.id)),
        added: fresh.length - refusedForCap,
        alreadyScheduled,
        refusedForCap,
    }
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

/** Adds generated tasks and reports how many were new, already there, or did not fit. */
export const addGeneratedTasks =
    (tasks: PlannerTask[]): AddGeneratedTasksThunk =>
    (dispatch, getState) => {
        // The same pure decision the reducer makes, so the counts match what it stores.
        const { added, alreadyScheduled, refusedForCap } = planNewTasks(
            getState().growPlanner.tasks,
            tasks,
        )
        dispatch(bulkAddTasks(tasks))
        return { added, alreadyScheduled, refusedForCap }
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
