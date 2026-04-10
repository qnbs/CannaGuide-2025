import { describe, it, expect } from 'vitest'
import { lexiconData } from './lexicon'

describe('lexiconData', () => {
    it('contains 83 entries', () => {
        expect(lexiconData).toHaveLength(83)
    })

    it('every entry has a unique key', () => {
        const keys = lexiconData.map((e) => e.key)
        expect(new Set(keys).size).toBe(lexiconData.length)
    })

    it('every entry has required fields', () => {
        for (const entry of lexiconData) {
            expect(entry.key).toBeTruthy()
            expect(entry.category).toBeTruthy()
        }
    })

    it('categories are valid', () => {
        const validCategories = new Set([
            'Cannabinoid',
            'Terpene',
            'Flavonoid',
            'General',
            'Nutrient',
            'Disease',
        ])
        for (const entry of lexiconData) {
            expect(validCategories.has(entry.category)).toBe(true)
        }
    })

    it('has entries for all 6 categories', () => {
        const categories = new Set(lexiconData.map((e) => e.category))
        expect(categories.size).toBe(6)
    })

    it('contains expected cannabinoids', () => {
        const cannabinoidKeys = lexiconData
            .filter((e) => e.category === 'Cannabinoid')
            .map((e) => e.key)
        expect(cannabinoidKeys).toContain('thc')
        expect(cannabinoidKeys).toContain('cbd')
        expect(cannabinoidKeys).toContain('cbg')
    })

    it('contains expected terpenes', () => {
        const terpeneKeys = lexiconData.filter((e) => e.category === 'Terpene').map((e) => e.key)
        expect(terpeneKeys).toContain('myrcene')
        expect(terpeneKeys).toContain('limonene')
        expect(terpeneKeys).toContain('caryophyllene')
    })

    it('keys use camelCase or lowercase format', () => {
        for (const entry of lexiconData) {
            expect(entry.key).toMatch(/^[a-zA-Z]+$/)
        }
    })
})
