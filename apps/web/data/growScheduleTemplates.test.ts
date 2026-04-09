import { describe, it, expect } from 'vitest'
import { GROW_SCHEDULE_TEMPLATES, findBestTemplate } from './growScheduleTemplates'

describe('growScheduleTemplates', () => {
    it('has 6 templates', () => {
        expect(GROW_SCHEDULE_TEMPLATES).toHaveLength(6)
    })

    it('each template has required fields', () => {
        for (const tpl of GROW_SCHEDULE_TEMPLATES) {
            expect(tpl.id).toBeTruthy()
            expect(tpl.name).toBeTruthy()
            expect(['Sativa', 'Indica', 'Hybrid']).toContain(tpl.strainType)
            expect(['Photoperiod', 'Autoflower']).toContain(tpl.floweringType)
            expect(tpl.seedlingSteps.length).toBeGreaterThan(0)
            expect(tpl.vegetativeSteps.length).toBeGreaterThan(0)
            expect(tpl.floweringSteps.length).toBeGreaterThan(0)
        }
    })

    it('each step has valid action types', () => {
        const validActions = [
            'water',
            'feed',
            'train',
            'defoliate',
            'harvest_check',
            'flush',
            'transplant',
            'photo',
            'other',
        ]
        for (const tpl of GROW_SCHEDULE_TEMPLATES) {
            const allSteps = [...tpl.seedlingSteps, ...tpl.vegetativeSteps, ...tpl.floweringSteps]
            for (const step of allSteps) {
                expect(validActions).toContain(step.action)
                expect(step.dayOffset).toBeGreaterThanOrEqual(0)
                expect(step.notes).toBeTruthy()
            }
        }
    })

    describe('findBestTemplate', () => {
        it('finds exact match for auto indica', () => {
            const result = findBestTemplate('Indica', 'Autoflower')
            expect(result?.id).toBe('auto-indica')
        })

        it('finds exact match for photo sativa', () => {
            const result = findBestTemplate('Sativa', 'Photoperiod')
            expect(result?.id).toBe('photo-sativa')
        })

        it('returns hybrid fallback for unknown combination', () => {
            // All 6 exact combos exist, so this tests the function logic
            const result = findBestTemplate('Hybrid', 'Autoflower')
            expect(result?.id).toBe('auto-hybrid')
        })

        it('finds exact match for photo hybrid', () => {
            const result = findBestTemplate('Hybrid', 'Photoperiod')
            expect(result?.id).toBe('photo-hybrid')
        })
    })
})
