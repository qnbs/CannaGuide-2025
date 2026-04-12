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

    it('includes all 8 built-in scenarios', () => {
        const all = scenarioService.getAllScenarios()
        expect(all.length).toBe(8)
        const ids = all.map((s) => s.id)
        expect(ids).toContain('temperature-plus-2c')
        expect(ids).toContain('topping-vs-lst')
        expect(ids).toContain('humidity-plus-10')
        expect(ids).toContain('humidity-minus-10')
        expect(ids).toContain('light-boost')
        expect(ids).toContain('ph-drift-acidic')
        expect(ids).toContain('ec-ramp-up')
        expect(ids).toContain('defoliation-day-7')
    })

    it('new scenarios use correct action types', () => {
        expect(scenarioService.getScenarioById('humidity-plus-10')!.plantBModifier.action).toBe(
            'HUMIDITY_PLUS_10',
        )
        expect(scenarioService.getScenarioById('humidity-minus-10')!.plantBModifier.action).toBe(
            'HUMIDITY_MINUS_10',
        )
        expect(scenarioService.getScenarioById('light-boost')!.plantBModifier.action).toBe(
            'LIGHT_BOOST',
        )
        expect(scenarioService.getScenarioById('ph-drift-acidic')!.plantBModifier.action).toBe(
            'PH_DRIFT_ACIDIC',
        )
        expect(scenarioService.getScenarioById('ec-ramp-up')!.plantBModifier.action).toBe('EC_RAMP')
        expect(scenarioService.getScenarioById('defoliation-day-7')!.plantBModifier.action).toBe(
            'DEFOLIATE',
        )
    })
})
