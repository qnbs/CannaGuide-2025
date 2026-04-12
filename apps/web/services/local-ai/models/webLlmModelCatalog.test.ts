import { describe, expect, it } from 'vitest'
import { getAllModels, getModelById, autoSelectModel } from './webLlmModelCatalog'

describe('webLlmModelCatalog', () => {
    it('getAllModels returns at least 4 models', () => {
        const models = getAllModels()
        expect(models.length).toBeGreaterThanOrEqual(4)
    })

    it('every model has required fields', () => {
        for (const m of getAllModels()) {
            expect(m.id).toBeTruthy()
            expect(m.label).toBeTruthy()
            expect(m.sizeBytes).toBeGreaterThan(0)
            expect(m.sizeTier).toBeTruthy()
            expect(m.languages.length).toBeGreaterThan(0)
        }
    })

    it('exactly one model is marked recommended', () => {
        const recommended = getAllModels().filter((m) => m.recommended)
        expect(recommended).toHaveLength(1)
        expect(recommended[0]!.sizeTier).toBe('3B')
    })

    it('autoSelectModel high returns 3B model', () => {
        const model = autoSelectModel('high')
        expect(model.sizeTier).toBe('3B')
        expect(model.id).toContain('Llama')
    })

    it('autoSelectModel mid returns 1.5B model', () => {
        const model = autoSelectModel('mid')
        expect(model.sizeTier).toBe('1.5B')
    })

    it('autoSelectModel low returns 0.5B model', () => {
        const model = autoSelectModel('low')
        expect(model.sizeTier).toBe('0.5B')
    })

    it('autoSelectModel none returns 0.5B model', () => {
        const model = autoSelectModel('none')
        expect(model.sizeTier).toBe('0.5B')
    })

    it('getModelById returns correct model for valid ID', () => {
        const model = getModelById('Llama-3.2-3B-Instruct-q4f16_1-MLC')
        expect(model).toBeDefined()
        expect(model!.label).toBe('Llama 3.2 3B')
    })

    it('getModelById returns undefined for unknown ID', () => {
        expect(getModelById('nonexistent-model')).toBeUndefined()
    })
})
