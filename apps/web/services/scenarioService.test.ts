import { describe, it, expect } from 'vitest'
import { scenarioService } from '@/services/scenarioService'

describe('ScenarioService', () => {
    it('returns all scenarios', () => {
        const all = scenarioService.getAllScenarios()
        expect(all.length).toBeGreaterThanOrEqual(2)
    })

    it('finds scenario by id', () => {
        const scenario = scenarioService.getScenarioById('temperature-plus-2c')
        expect(scenario).toBeDefined()
        expect(scenario!.id).toBe('temperature-plus-2c')
        expect(scenario!.durationDays).toBe(14)
    })

    it('returns undefined for non-existent id', () => {
        const scenario = scenarioService.getScenarioById('does-not-exist')
        expect(scenario).toBeUndefined()
    })

    it('has well-formed scenario objects', () => {
        const scenarios = scenarioService.getAllScenarios()
        for (const s of scenarios) {
            expect(s.id).toBeTruthy()
            expect(s.titleKey).toBeTruthy()
            expect(s.descriptionKey).toBeTruthy()
            expect(s.durationDays).toBeGreaterThan(0)
            expect(s.plantAModifier).toBeDefined()
            expect(s.plantBModifier).toBeDefined()
        }
    })

    it('topping-vs-lst scenario has correct modifiers', () => {
        const scenario = scenarioService.getScenarioById('topping-vs-lst')
        expect(scenario).toBeDefined()
        expect(scenario!.plantAModifier.action).toBe('LST')
        expect(scenario!.plantBModifier.action).toBe('TOP')
    })
})
