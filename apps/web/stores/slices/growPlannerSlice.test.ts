import { describe, it, expect } from 'vitest'
import growPlannerReducer, {
    addPlannerTask,
    completePlannerTask,
    removePlannerTask,
    updatePlannerTask,
    clearCompletedTasks,
    clearTasksForPlant,
    selectPlannerTasksForPlant,
    selectUpcomingTasks,
    selectOverdueTasks,
    selectTodayTasks,
} from './growPlannerSlice'
import type { GrowPlannerState, PlannerTask } from '@/types'

const initialState: GrowPlannerState = { tasks: [] }

let taskCounter = 0
const makeTask = (overrides: Partial<PlannerTask> = {}): PlannerTask => ({
    id: `pt-${++taskCounter}`,
    plantId: 'plant-1',
    type: 'water',
    scheduledAt: Date.now(),
    recurring: false,
    ...overrides,
})

describe('growPlannerSlice', () => {
    it('adds a task', () => {
        const task = makeTask()
        const state = growPlannerReducer(initialState, addPlannerTask(task))
        expect(state.tasks).toHaveLength(1)
        expect(state.tasks[0]?.type).toBe('water')
    })

    it('completes a task by id', () => {
        const task = makeTask()
        let state = growPlannerReducer(initialState, addPlannerTask(task))
        state = growPlannerReducer(
            state,
            completePlannerTask({ taskId: task.id, completedAt: Date.now() }),
        )
        expect(state.tasks[0]?.completedAt).toBeDefined()
    })

    it('removes a task by id', () => {
        const task = makeTask()
        let state = growPlannerReducer(initialState, addPlannerTask(task))
        state = growPlannerReducer(state, removePlannerTask(task.id))
        expect(state.tasks).toHaveLength(0)
    })

    it('updates task fields', () => {
        const task = makeTask()
        let state = growPlannerReducer(initialState, addPlannerTask(task))
        state = growPlannerReducer(
            state,
            updatePlannerTask({ taskId: task.id, changes: { notes: 'Updated note' } }),
        )
        expect(state.tasks[0]?.notes).toBe('Updated note')
    })

    it('clears completed tasks', () => {
        const task1 = makeTask()
        const task2 = makeTask()
        let state = growPlannerReducer(initialState, addPlannerTask(task1))
        state = growPlannerReducer(
            state,
            completePlannerTask({ taskId: task1.id, completedAt: Date.now() }),
        )
        state = growPlannerReducer(state, addPlannerTask(task2))
        expect(state.tasks).toHaveLength(2)
        state = growPlannerReducer(state, clearCompletedTasks())
        expect(state.tasks).toHaveLength(1)
        expect(state.tasks[0]?.completedAt).toBeUndefined()
    })

    it('clears tasks for a specific plant', () => {
        let state = growPlannerReducer(
            initialState,
            addPlannerTask(makeTask({ plantId: 'plant-1' })),
        )
        state = growPlannerReducer(state, addPlannerTask(makeTask({ plantId: 'plant-2' })))
        state = growPlannerReducer(state, clearTasksForPlant('plant-1'))
        expect(state.tasks).toHaveLength(1)
        expect(state.tasks[0]?.plantId).toBe('plant-2')
    })

    describe('selectors', () => {
        const now = Date.now()
        const dayMs = 86400000

        const rootState = {
            growPlanner: {
                tasks: [
                    {
                        id: 'pt-a',
                        plantId: 'p1',
                        type: 'water',
                        scheduledAt: now - dayMs,
                        recurring: false,
                    },
                    {
                        id: 'pt-b',
                        plantId: 'p1',
                        type: 'feed',
                        scheduledAt: now + dayMs * 2,
                        recurring: false,
                    },
                    {
                        id: 'pt-c',
                        plantId: 'p2',
                        type: 'photo',
                        scheduledAt: now,
                        recurring: false,
                    },
                ] as PlannerTask[],
            },
        } as never

        it('selectPlannerTasksForPlant filters by plantId', () => {
            const result = selectPlannerTasksForPlant('p1')(rootState)
            expect(result).toHaveLength(2)
        })

        it('selectOverdueTasks returns past incomplete tasks', () => {
            const result = selectOverdueTasks()(rootState)
            expect(result.length).toBeGreaterThanOrEqual(1)
            expect(result[0]?.id).toBe('pt-a')
        })

        it('selectUpcomingTasks returns future tasks', () => {
            const result = selectUpcomingTasks()(rootState)
            expect(result.length).toBeGreaterThanOrEqual(1)
        })

        it('selectTodayTasks returns tasks scheduled today', () => {
            const result = selectTodayTasks()(rootState)
            expect(result.some((t) => t.id === 'pt-c')).toBe(true)
        })
    })
})
