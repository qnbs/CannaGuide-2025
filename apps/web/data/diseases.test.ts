import { describe, it, expect } from 'vitest'
import { diseaseAtlas } from './diseases'

describe('diseaseAtlas', () => {
    it('contains 22 entries', () => {
        expect(diseaseAtlas).toHaveLength(22)
    })

    it('every entry has a unique id', () => {
        const ids = diseaseAtlas.map((d) => d.id)
        expect(new Set(ids).size).toBe(diseaseAtlas.length)
    })

    it('every entry has required fields', () => {
        for (const entry of diseaseAtlas) {
            expect(entry.id).toBeTruthy()
            expect(entry.nameKey).toBeTruthy()
            expect(entry.category).toBeTruthy()
            expect(entry.severity).toBeTruthy()
            expect(entry.affectedStages.length).toBeGreaterThan(0)
            expect(entry.urgency).toBeTruthy()
            expect(entry.colorToken).toBeTruthy()
        }
    })

    it('categories are valid', () => {
        const validCategories = new Set([
            'deficiency',
            'toxicity',
            'environmental',
            'pest',
            'disease',
        ])
        for (const entry of diseaseAtlas) {
            expect(validCategories.has(entry.category)).toBe(true)
        }
    })

    it('severity levels are valid', () => {
        const validSeverities = new Set(['low', 'medium', 'high', 'critical'])
        for (const entry of diseaseAtlas) {
            expect(validSeverities.has(entry.severity)).toBe(true)
        }
    })

    it('urgency values are valid', () => {
        const validUrgencies = new Set(['monitor', 'act_soon', 'act_immediately'])
        for (const entry of diseaseAtlas) {
            expect(validUrgencies.has(entry.urgency)).toBe(true)
        }
    })

    it('nameKeys follow the expected pattern', () => {
        for (const entry of diseaseAtlas) {
            expect(entry.nameKey).toMatch(/^knowledgeView\.atlas\.diseases\.[a-z-]+\.name$/)
        }
    })

    it('relatedLexiconKeys are arrays', () => {
        for (const entry of diseaseAtlas) {
            expect(Array.isArray(entry.relatedLexiconKeys)).toBe(true)
        }
    })

    it('relatedArticleIds are arrays', () => {
        for (const entry of diseaseAtlas) {
            expect(Array.isArray(entry.relatedArticleIds)).toBe(true)
        }
    })

    it('contains at least one entry per category', () => {
        const categories = new Set(diseaseAtlas.map((d) => d.category))
        expect(categories.size).toBeGreaterThanOrEqual(3)
    })
})
