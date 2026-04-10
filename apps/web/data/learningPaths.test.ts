import { describe, it, expect } from 'vitest'
import { learningPaths } from './learningPaths'

describe('learningPaths', () => {
    it('contains 5 learning paths', () => {
        expect(learningPaths).toHaveLength(5)
    })

    it('every path has a unique id', () => {
        const ids = learningPaths.map((p) => p.id)
        expect(new Set(ids).size).toBe(learningPaths.length)
    })

    it('every path has required fields', () => {
        for (const path of learningPaths) {
            expect(path.id).toBeTruthy()
            expect(path.titleKey).toBeTruthy()
            expect(path.descriptionKey).toBeTruthy()
            expect(path.targetLevel).toBeTruthy()
            expect(path.estimatedMinutes).toBeGreaterThan(0)
            expect(path.tags.length).toBeGreaterThan(0)
            expect(path.steps.length).toBeGreaterThan(0)
        }
    })

    it('target levels are valid', () => {
        const validLevels = new Set(['beginner', 'intermediate', 'expert'])
        for (const path of learningPaths) {
            expect(validLevels.has(path.targetLevel)).toBe(true)
        }
    })

    it('every step has required fields', () => {
        for (const path of learningPaths) {
            for (const step of path.steps) {
                expect(step.id).toBeTruthy()
                expect(step.titleKey).toBeTruthy()
                expect(step.descriptionKey).toBeTruthy()
                expect(step.type).toBeTruthy()
            }
        }
    })

    it('step types are valid', () => {
        const validTypes = new Set(['article', 'practice', 'calculator'])
        for (const path of learningPaths) {
            for (const step of path.steps) {
                expect(validTypes.has(step.type)).toBe(true)
            }
        }
    })

    it('step ids are unique within each path', () => {
        for (const path of learningPaths) {
            const stepIds = path.steps.map((s) => s.id)
            expect(new Set(stepIds).size).toBe(path.steps.length)
        }
    })

    it('contains beginner-first-grow path', () => {
        const firstGrow = learningPaths.find((p) => p.id === 'beginner-first-grow')
        expect(firstGrow).toBeDefined()
        expect(firstGrow?.targetLevel).toBe('beginner')
    })

    it('estimated minutes are reasonable', () => {
        for (const path of learningPaths) {
            expect(path.estimatedMinutes).toBeGreaterThanOrEqual(15)
            expect(path.estimatedMinutes).toBeLessThanOrEqual(120)
        }
    })
})
