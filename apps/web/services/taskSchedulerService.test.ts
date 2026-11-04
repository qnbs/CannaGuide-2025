import { describe, expect, it } from 'vitest'
import { currentStageStart, taskSchedulerService } from './taskSchedulerService'
import type { TaskSchedulerInput } from './taskSchedulerService'
import { JournalEntryType, PlantStage } from '@/types'
import type { JournalEntry } from '@/types'

describe('taskSchedulerService', () => {
    const makeInput = (overrides: Partial<TaskSchedulerInput> = {}): TaskSchedulerInput => ({
        plantId: 'p-test',
        strainType: 'Hybrid',
        floweringType: 'Photoperiod',
        currentStage: PlantStage.Vegetative,
        stageStartDate: 1700000000000,
        ...overrides,
    })

    describe('generateTasks', () => {
        it('returns result with templateUsed for known strain/type', () => {
            const result = taskSchedulerService.generateTasks(makeInput())
            expect(result.templateUsed).not.toBeNull()
            expect(result.brandUsed).toBeNull()
        })

        it('generates tasks for VEGETATIVE stage', () => {
            const result = taskSchedulerService.generateTasks(
                makeInput({ currentStage: PlantStage.Vegetative }),
            )
            expect(result.tasks.length).toBeGreaterThan(0)
            for (const task of result.tasks) {
                expect(task.plantId).toBe('p-test')
                expect(task.id).toBeDefined()
                expect(task.scheduledAt).toBeGreaterThanOrEqual(1700000000000)
            }
        })

        it('generates tasks for FLOWERING stage', () => {
            const result = taskSchedulerService.generateTasks(
                makeInput({ currentStage: PlantStage.Flowering }),
            )
            expect(result.tasks.length).toBeGreaterThan(0)
        })

        it('generates tasks for SEEDLING stage', () => {
            const result = taskSchedulerService.generateTasks(
                makeInput({ currentStage: PlantStage.Seedling }),
            )
            expect(result.tasks.length).toBeGreaterThanOrEqual(0)
        })

        it('tasks are sorted by scheduledAt', () => {
            const result = taskSchedulerService.generateTasks(makeInput())
            for (let i = 1; i < result.tasks.length; i++) {
                const prev = result.tasks[i - 1]
                const curr = result.tasks[i]
                expect(prev!.scheduledAt).toBeLessThanOrEqual(curr!.scheduledAt)
            }
        })

        it('works for Autoflower strains', () => {
            const result = taskSchedulerService.generateTasks(
                makeInput({ floweringType: 'Autoflower' }),
            )
            expect(result.templateUsed).not.toBeNull()
        })

        it('works for Indica strains', () => {
            const result = taskSchedulerService.generateTasks(makeInput({ strainType: 'Indica' }))
            expect(result.templateUsed).not.toBeNull()
        })

        it('works for Sativa strains', () => {
            const result = taskSchedulerService.generateTasks(makeInput({ strainType: 'Sativa' }))
            expect(result.templateUsed).not.toBeNull()
        })

        it('each task has unique id', () => {
            const result = taskSchedulerService.generateTasks(makeInput())
            const ids = result.tasks.map((t) => t.id)
            expect(new Set(ids).size).toBe(ids.length)
        })

        it('handles SEED stage', () => {
            const result = taskSchedulerService.generateTasks(
                makeInput({ currentStage: PlantStage.Seed }),
            )
            expect(result).toBeDefined()
        })

        it('returns empty templateUsed when no template found', () => {
            // This should still work but possibly with no template match
            const result = taskSchedulerService.generateTasks(makeInput())
            expect(result).toBeDefined()
        })
    })

    describe('repeatable generation (GH #659)', () => {
        it('gives the same tasks the same ids on every run', () => {
            const input = makeInput({
                currentStage: PlantStage.Vegetative,
                brandScheduleId: undefined,
            })

            const first = taskSchedulerService.generateTasks(input).tasks.map(({ id }) => id)
            const second = taskSchedulerService.generateTasks(input).tasks.map(({ id }) => id)

            expect(first.length).toBeGreaterThan(0)
            expect(second).toEqual(first)
            expect(new Set(first).size).toBe(first.length)
        })

        it('lays the schedule out from the start of the current stage', () => {
            const stageChange = {
                id: 'j1',
                type: JournalEntryType.System,
                createdAt: 5_000,
                details: { from: PlantStage.Seedling, to: PlantStage.Vegetative },
            } as unknown as JournalEntry

            expect(
                currentStageStart({
                    stage: PlantStage.Vegetative,
                    createdAt: 1_000,
                    journal: [stageChange],
                }),
            ).toEqual({ at: 5_000, known: true })
        })

        it('gives brand feeding tasks the same ids on every run', () => {
            const input = makeInput({
                currentStage: PlantStage.Vegetative,
                brandScheduleId: 'builtin.biobizz-organic',
            })

            const feed = (run: ReturnType<typeof taskSchedulerService.generateTasks>) =>
                run.tasks.filter(({ id }) => id.includes('-feed-')).map(({ id }) => id)
            const first = feed(taskSchedulerService.generateTasks(input))

            expect(first.length).toBeGreaterThan(0)
            expect(feed(taskSchedulerService.generateTasks(input))).toEqual(first)
        })

        it('reports an unknown start for a later stage without a record, not the creation date', () => {
            expect(
                currentStageStart(
                    { stage: PlantStage.Flowering, createdAt: 1_000, journal: [] },
                    9_000,
                ),
            ).toEqual({ at: 9_000, known: false })
        })

        it('names the template in the id, so another template is not taken for this one', () => {
            const ids = taskSchedulerService
                .generateTasks(makeInput({ currentStage: PlantStage.Vegetative }))
                .tasks.map(({ id }) => id)

            expect(ids.length).toBeGreaterThan(0)
            for (const id of ids.filter((value) => value.includes('-step-'))) {
                expect(id).toMatch(/-step-[a-z0-9-]+-\d+-/u)
            }
        })

        it.each([PlantStage.Germination, PlantStage.Harvest, PlantStage.Drying])(
            'gives %s, a stage without a feeding phase, no brand weeks',
            (currentStage) => {
                const result = taskSchedulerService.generateTasks(
                    makeInput({ currentStage, brandScheduleId: 'builtin.biobizz-organic' }),
                )

                expect(result.tasks.filter(({ id }) => id.includes('-feed-'))).toEqual([])
                expect(result.brandUsed).toBeNull()
            },
        )

        it('starts the first brand week of a stage with the stage', () => {
            const start = 1_700_000_000_000
            const week = 7 * 86_400_000
            const feed = (currentStage: PlantStage) =>
                taskSchedulerService
                    .generateTasks(
                        makeInput({
                            currentStage,
                            stageStartDate: start,
                            brandScheduleId: 'builtin.biobizz-organic',
                        }),
                    )
                    .tasks.filter(({ id }) => id.includes('-feed-builtin.biobizz-organic-w'))
                    .map(({ scheduledAt }) => scheduledAt)
                    .sort((a, b) => a - b)

            // BioBizz numbers its weeks across the grow: Vegetative 3-5, Flowering 6-10.
            expect(feed(PlantStage.Vegetative)).toEqual([start, start + week, start + 2 * week])
            expect(feed(PlantStage.Flowering)[0]).toBe(start)
            expect(feed(PlantStage.Flowering)).toHaveLength(5)
        })

        it('uses the plant creation for its first stage', () => {
            expect(
                currentStageStart({ stage: PlantStage.Seed, createdAt: 1_000, journal: [] }),
            ).toEqual({ at: 1_000, known: true })
        })
    })
})
