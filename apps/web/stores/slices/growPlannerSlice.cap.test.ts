import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import growPlannerReducer, {
    MAX_TASKS,
    addGeneratedTasks,
    addPlannerTask,
    bulkAddTasks,
    planNewTasks,
    updatePlannerTask,
} from '@/stores/slices/growPlannerSlice'
import { createAppStoreSync } from '@/stores/store'
import { taskSchedulerService, type TaskSchedulerInput } from '@/services/taskSchedulerService'
import { PlantStage, type GrowPlannerState, type PlannerTask } from '@/types'

const SCOPE = 'auto-p1-VEGETATIVE-'

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

const generated = (list: PlannerTask[], scope = SCOPE) => ({ tasks: list, scope })

const withTasks = (list: PlannerTask[]): GrowPlannerState => ({ tasks: list })

const ids = (list: readonly PlannerTask[]) => list.map(({ id }) => id)

describe('growPlanner task cap and generated tasks (GH #659)', () => {
    it('adds the same generated tasks only once', () => {
        const batch = generated(tasks(5, 'auto-'))

        const once = growPlannerReducer(withTasks([]), bulkAddTasks(batch))
        const twice = growPlannerReducer(once, bulkAddTasks(batch))

        expect(ids(twice.tasks)).toEqual(ids(batch.tasks))
    })

    it('makes room by removing the longest-completed tasks, never an open one', () => {
        const done = tasks(10, 'done-').map((t, index) => ({ ...t, completedAt: 100 + index }))
        const open = tasks(MAX_TASKS - 10, 'open-')

        const next = growPlannerReducer(
            withTasks([...done, ...open]),
            bulkAddTasks(generated(tasks(3, 'new-'))),
        )

        const result = ids(next.tasks)
        expect(result).toHaveLength(MAX_TASKS)
        expect(result.filter((id) => id.startsWith('open-'))).toHaveLength(MAX_TASKS - 10)
        // The three that completed first made room for the three new tasks.
        expect(result.filter((id) => id.startsWith('done-'))).toEqual(ids(done.slice(3)))
        expect(result.filter((id) => id.startsWith('new-'))).toHaveLength(3)
    })

    describe.each([498, 500, 502, 510])('with %i open tasks and 3 completed', (openCount) => {
        const done = tasks(3, 'done-').map((t, index) => ({ ...t, completedAt: 10 + index }))
        const open = tasks(openCount, 'open-')
        const existing = [...done, ...open]

        it.each([0, 2, 4])('and %i new generated tasks', (freshCount) => {
            const plan = planNewTasks(existing, generated(tasks(freshCount, 'new-')))

            const expectedAdded = Math.min(freshCount, Math.max(MAX_TASKS - openCount, 0))
            expect(plan.added).toBe(expectedAdded)
            expect(plan.refusedForCap).toBe(freshCount - expectedAdded)
            // No open task is ever removed.
            expect(ids(plan.next)).toEqual(expect.arrayContaining(ids(open)))
            // At most one completed task makes room per task added.
            const doneKept = plan.next.filter(({ id }) => id.startsWith('done-')).length
            expect(3 - doneKept).toBeLessThanOrEqual(plan.added)
            if (plan.added === 0) {
                // Nothing added: nothing changes, completed history included.
                expect(plan.next).toBe(existing)
            }
        })
    })

    it('keeps every open task when one is added by hand to a full planner', () => {
        const open = tasks(MAX_TASKS, 'open-')

        const next = growPlannerReducer(withTasks(open), addPlannerTask(task('manual')))

        expect(next.tasks).toHaveLength(MAX_TASKS + 1)
        expect(next.tasks.at(-1)?.id).toBe('manual')
    })

    it('removes one completed task, not all, when a task is added to a planner above the cap', () => {
        const done = tasks(20, 'done-', { completedAt: 1 })
        const existing = [...done, ...tasks(MAX_TASKS - 10, 'open-')]

        const next = growPlannerReducer(withTasks(existing), addPlannerTask(task('manual')))

        expect(next.tasks).toHaveLength(existing.length)
        expect(next.tasks.filter(({ id }) => id.startsWith('done-'))).toHaveLength(19)
    })

    it('reports what was added, already there and refused', () => {
        const store = createAppStoreSync()
        store.dispatch(bulkAddTasks(generated(tasks(MAX_TASKS - 2, 'open-'))))

        const first = store.dispatch(
            addGeneratedTasks(generated([task('auto-1'), task('auto-2'), task('auto-3')])),
        )
        const again = store.dispatch(addGeneratedTasks(generated([task('auto-1'), task('auto-2')])))

        expect(first).toEqual({
            added: 2,
            alreadyScheduled: 0,
            refusedForCap: 1,
            fromOtherSchedule: 0,
        })
        expect(again).toEqual({
            added: 0,
            alreadyScheduled: 2,
            refusedForCap: 0,
            fromOtherSchedule: 0,
        })
    })

    it('counts an id that appears twice in one batch once', () => {
        expect(planNewTasks([], generated([task('auto-x'), task('auto-x')]))).toMatchObject({
            added: 1,
        })
    })
})

describe('schedule identity (GH #659)', () => {
    const input = (overrides: Partial<TaskSchedulerInput> = {}): TaskSchedulerInput => ({
        plantId: 'p1',
        strainType: 'Hybrid',
        floweringType: 'Photoperiod',
        currentStage: PlantStage.Vegetative,
        stageStartDate: 1_700_000_000_000,
        ...overrides,
    })
    const run = (overrides: Partial<TaskSchedulerInput> = {}) => {
        const result = taskSchedulerService.generateTasks(input(overrides))
        return generated(result.tasks, result.scope)
    }

    it('adds nothing and names the count when the stage has open tasks of another template', () => {
        const hybrid = run()
        const indica = run({ strainType: 'Indica' })
        expect(ids(indica.tasks)).not.toEqual(ids(hybrid.tasks))
        const existing = planNewTasks([], hybrid).next

        const plan = planNewTasks(existing, indica)

        expect(plan.next).toBe(existing)
        expect(plan).toMatchObject({ added: 0, fromOtherSchedule: hybrid.tasks.length })
    })

    it('schedules the new template once the old template tasks are completed', () => {
        const hybrid = run()
        const done = planNewTasks([], hybrid).next.map((t) => ({ ...t, completedAt: 5 }))

        const plan = planNewTasks(done, run({ strainType: 'Indica' }))

        expect(plan.fromOtherSchedule).toBe(0)
        expect(plan.added).toBeGreaterThan(0)
    })

    it('does not count tasks of another stage as another schedule', () => {
        const flowering = planNewTasks([], run({ currentStage: PlantStage.Flowering })).next

        expect(planNewTasks(flowering, run()).fromOtherSchedule).toBe(0)
    })

    it('never overwrites a generated task the grower edited', () => {
        const batch = run()
        const first = growPlannerReducer(withTasks([]), bulkAddTasks(batch))
        const target = batch.tasks[0]?.id ?? ''
        const edited = growPlannerReducer(
            first,
            updatePlannerTask({
                taskId: target,
                changes: { notes: 'my own note', scheduledAt: 42 },
            }),
        )

        const again = growPlannerReducer(edited, bulkAddTasks(run({ stageStartDate: 1 })))

        expect(again.tasks).toEqual(edited.tasks)
        expect(again.tasks.find(({ id }) => id === target)).toMatchObject({
            notes: 'my own note',
            scheduledAt: 42,
        })
    })
})

describe('tasks generated with the old random ids (GH #659)', () => {
    // One press of Auto Schedule before stable ids: one timestamp, counters 1..3.
    const legacyWater = task('auto-1730000000000-1-aaaaaaaa', {
        type: 'water',
        notes: 'A',
        scheduledAt: 1_000,
    })
    const legacy = [
        legacyWater,
        task('auto-1730000000000-2-bbbbbbbb', { type: 'feed', notes: 'B', scheduledAt: 2_000 }),
        task('auto-1730000000000-3-cccccccc', { type: 'train', notes: 'C', scheduledAt: 3_000 }),
    ]
    // The same steps with stable ids, laid out from a stage start 500 ms later.
    const fresh = [
        task(`${SCOPE}step-t-0-water-0`, { type: 'water', notes: 'A', scheduledAt: 1_500 }),
        task(`${SCOPE}step-t-1-feed-1`, { type: 'feed', notes: 'B', scheduledAt: 2_500 }),
        task(`${SCOPE}step-t-2-train-2`, { type: 'train', notes: 'C', scheduledAt: 3_500 }),
    ]

    it('treats unchanged old rows as already scheduled', () => {
        const plan = planNewTasks(legacy, generated(fresh))

        expect(plan).toMatchObject({ added: 0, alreadyScheduled: 3 })
        expect(plan.next).toBe(legacy)
    })

    it('recognises an old row whose notes the grower edited, by its batch and timing', () => {
        const edited = legacy.map((t) => (t.notes === 'B' ? { ...t, notes: 'my note' } : t))

        const plan = planNewTasks(edited, generated(fresh))

        expect(plan).toMatchObject({ added: 0, alreadyScheduled: 3 })
        expect(plan.next).toBe(edited)
    })

    it('lets one old row stand for one new task only', () => {
        const twins = [
            task(`${SCOPE}step-t-0-water-0`, { notes: 'A', scheduledAt: 1_500 }),
            task(`${SCOPE}step-t-1-water-0`, { notes: 'A', scheduledAt: 1_500 }),
        ]

        expect(planNewTasks([legacyWater], generated(twins))).toMatchObject({
            added: 1,
            alreadyScheduled: 1,
        })
    })

    it('does not match an old batch of another stage, which shares no step', () => {
        const otherStage = [
            task('auto-1720000000000-1-dddddddd', {
                type: 'water',
                notes: 'X',
                scheduledAt: 1_000,
            }),
        ]

        expect(planNewTasks(otherStage, generated(fresh))).toMatchObject({ added: 3 })
    })

    it('ignores completed old rows', () => {
        const done = legacy.map((t) => ({ ...t, completedAt: 9 }))

        expect(planNewTasks(done, generated(fresh))).toMatchObject({ added: 3 })
    })
})
