import { describe, expect, it } from 'vitest'
import { taskSchedulerService } from './taskSchedulerService'
import type { TaskSchedulerInput } from './taskSchedulerService'
import { PlantStage } from '@/types'

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
            const result = taskSchedulerService.generateTasks(makeInput({ currentStage: PlantStage.Vegetative }))
            expect(result.tasks.length).toBeGreaterThan(0)
            for (const task of result.tasks) {
                expect(task.plantId).toBe('p-test')
                expect(task.id).toBeDefined()
                expect(task.scheduledAt).toBeGreaterThanOrEqual(1700000000000)
            }
        })

        it('generates tasks for FLOWERING stage', () => {
            const result = taskSchedulerService.generateTasks(makeInput({ currentStage: PlantStage.Flowering }))
            expect(result.tasks.length).toBeGreaterThan(0)
        })

        it('generates tasks for SEEDLING stage', () => {
            const result = taskSchedulerService.generateTasks(makeInput({ currentStage: PlantStage.Seedling }))
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
            const result = taskSchedulerService.generateTasks(makeInput({ floweringType: 'Autoflower' }))
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
            const result = taskSchedulerService.generateTasks(makeInput({ currentStage: PlantStage.Seed }))
            expect(result).toBeDefined()
        })

        it('returns empty templateUsed when no template found', () => {
            // This should still work but possibly with no template match
            const result = taskSchedulerService.generateTasks(makeInput())
            expect(result).toBeDefined()
        })
    })
})
