import { describe, expect, it } from 'vitest'
import { buildEquipmentRecommendation } from './equipmentFallback'

describe('equipmentFallback', () => {
    it('returns a complete recommendation with all required keys', () => {
        const result = buildEquipmentRecommendation('60x60 tent basic setup', 'en')
        expect(result).toHaveProperty('tent')
        expect(result).toHaveProperty('light')
        expect(result).toHaveProperty('ventilation')
        expect(result).toHaveProperty('pots')
        expect(result).toHaveProperty('soil')
        expect(result).toHaveProperty('nutrients')
        expect(result).toHaveProperty('proTip')
    })

    it('returns German text when lang=de', () => {
        const result = buildEquipmentRecommendation('Zeltsetup', 'de')
        expect(result.proTip.length).toBeGreaterThan(0)
        expect(result.tent.rationale.length).toBeGreaterThan(0)
    })

    it('handles large tent keyword', () => {
        const result = buildEquipmentRecommendation('120x120 large tent', 'en')
        expect(result.tent.name).toBeTruthy()
        expect(result.light.watts).toBeGreaterThan(0)
    })

    it('handles budget keyword', () => {
        const result = buildEquipmentRecommendation('budget setup cheap', 'en')
        const totalBudget =
            result.tent.price +
            result.light.price +
            result.ventilation.price +
            result.pots.price +
            result.soil.price +
            result.nutrients.price
        expect(totalBudget).toBeGreaterThan(0)
    })

    it('always returns numeric prices', () => {
        const result = buildEquipmentRecommendation('test', 'en')
        expect(typeof result.tent.price).toBe('number')
        expect(typeof result.light.price).toBe('number')
    })

    it('includes watts on the light item', () => {
        const result = buildEquipmentRecommendation('LED setup', 'en')
        expect(typeof result.light.watts).toBe('number')
        expect(result.light.watts).toBeGreaterThan(0)
    })
})
