import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import growPlannerReducer, {
    MAX_TASKS,
    addGeneratedTasks,
    addPlannerTask,
    bulkAddTasks,
} from '@/stores/slices/growPlannerSlice'
import { createAppStoreSync } from '@/stores/store'
import type { GrowPlannerState, PlannerTask } from '@/types'

const task = (id: string, overrides: Partial<PlannerTask> = {}): PlannerTask => ({
    id,
    plantId: 'p1',
    type: 'water',
    scheduledAt: 1,
    recurring: false,
    ...overrides,
})

const tasks = (count: number, prefix: string, overrides: Partial<PlannerTask> = {}) =>
    Array.from({ length: count }, (_, index) => task(`${prefix}${String(index)}`, overrides))

const withTasks = (list: PlannerTask[]): GrowPlannerState => ({ tasks: list })

describe('growPlanner task cap and generated tasks (GH #659)', () => {
    it('adds the same generated tasks only once', () => {
        const generated = tasks(5, 'auto-')

        const once = growPlannerReducer(withTasks([]), bulkAddTasks(generated))
        const twice = growPlannerReducer(once, bulkAddTasks(generated))

        expect(twice.tasks.map(({ id }) => id)).toEqual(generated.map(({ id }) => id))
    })

    it('makes room by removing the longest-completed tasks, never an open one', () => {
        const done = tasks(10, 'done-').map((t, index) => ({ ...t, completedAt: 100 + index }))
        const open = tasks(MAX_TASKS - 10, 'open-')

        const next = growPlannerReducer(
            withTasks([...done, ...open]),
            bulkAddTasks(tasks(3, 'new-')),
        )

        const ids = next.tasks.map(({ id }) => id)
        expect(ids).toHaveLength(MAX_TASKS)
        expect(ids.filter((id) => id.startsWith('open-'))).toHaveLength(MAX_TASKS - 10)
        // The three that completed first made room for the three new tasks.
        expect(ids.filter((id) => id.startsWith('done-'))).toEqual([
            'done-3',
            'done-4',
            'done-5',
            'done-6',
            'done-7',
            'done-8',
            'done-9',
        ])
        expect(ids.filter((id) => id.startsWith('new-'))).toHaveLength(3)
    })

    it('refuses new generated tasks rather than removing open ones when the planner is full', () => {
        const open = tasks(MAX_TASKS, 'open-')

        const next = growPlannerReducer(withTasks(open), bulkAddTasks(tasks(4, 'new-')))

        expect(next.tasks).toEqual(open)
    })

    it('keeps every open task when one is added by hand to a full planner', () => {
        const open = tasks(MAX_TASKS, 'open-')

        const next = growPlannerReducer(withTasks(open), addPlannerTask(task('manual')))

        expect(next.tasks).toHaveLength(MAX_TASKS + 1)
        expect(next.tasks.at(-1)?.id).toBe('manual')
    })

    it('reports what was added, already there and refused', () => {
        const store = createAppStoreSync()
        store.dispatch(bulkAddTasks(tasks(MAX_TASKS - 2, 'open-')))

        const first = store.dispatch(
            addGeneratedTasks([task('auto-1'), task('auto-2'), task('auto-3')]),
        )
        const again = store.dispatch(addGeneratedTasks([task('auto-1'), task('auto-2')]))

        expect(first).toEqual({ added: 2, alreadyScheduled: 0, refusedForCap: 1 })
        expect(again).toEqual({ added: 0, alreadyScheduled: 2, refusedForCap: 0 })
    })
})
