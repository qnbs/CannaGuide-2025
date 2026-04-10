import { describe, it, expect } from 'vitest'
import { TERPENE_DATABASE, type TerpeneReference } from './terpeneDatabase'

describe('terpeneDatabase', () => {
    const entries = Object.values(TERPENE_DATABASE)
    const names = Object.keys(TERPENE_DATABASE)

    it('contains entries', () => {
        expect(entries.length).toBeGreaterThanOrEqual(15)
    })

    it('has unique names matching keys', () => {
        for (const [key, entry] of Object.entries(TERPENE_DATABASE)) {
            expect(entry.name).toBe(key)
        }
    })

    it('every entry has a valid class', () => {
        const validClasses = new Set(['monoterpene', 'sesquiterpene', 'diterpene'])
        for (const entry of entries) {
            expect(validClasses.has(entry.class)).toBe(true)
        }
    })

    it('every entry has a CAS number', () => {
        for (const entry of entries) {
            expect(entry.cas).toBeTruthy()
            expect(entry.cas).toMatch(/^\d+-\d+-\d+$/)
        }
    })

    it('every entry has a molecular formula', () => {
        for (const entry of entries) {
            expect(entry.formula).toBeTruthy()
            expect(entry.formula).toMatch(/^C\d+H\d+/)
        }
    })

    it('molecular weights are positive numbers', () => {
        for (const entry of entries) {
            expect(entry.molecularWeight).toBeGreaterThan(0)
        }
    })

    it('boiling points are in realistic range (50-400C)', () => {
        for (const entry of entries) {
            expect(entry.boilingPointC).toBeGreaterThan(50)
            expect(entry.boilingPointC).toBeLessThan(400)
        }
    })

    it('every entry has at least one aroma descriptor', () => {
        for (const entry of entries) {
            expect(entry.aromas.length).toBeGreaterThanOrEqual(1)
        }
    })

    it('typical ranges have min < max and both positive', () => {
        for (const entry of entries) {
            expect(entry.typicalRange.min).toBeGreaterThanOrEqual(0)
            expect(entry.typicalRange.max).toBeGreaterThan(entry.typicalRange.min)
        }
    })

    it('average percent falls within typical range', () => {
        for (const entry of entries) {
            expect(entry.averagePercent).toBeGreaterThanOrEqual(entry.typicalRange.min)
            expect(entry.averagePercent).toBeLessThanOrEqual(entry.typicalRange.max)
        }
    })

    it('every entry has at least one effect', () => {
        for (const entry of entries) {
            expect(entry.effects.length).toBeGreaterThanOrEqual(1)
        }
    })

    it('every entry has at least one mechanism', () => {
        for (const entry of entries) {
            expect(entry.mechanisms.length).toBeGreaterThanOrEqual(1)
        }
    })

    it('every entry has alsoFoundIn plants', () => {
        for (const entry of entries) {
            expect(entry.alsoFoundIn.length).toBeGreaterThanOrEqual(1)
        }
    })

    it('contains well-known terpenes', () => {
        const wellKnown = ['Myrcene', 'Limonene', 'Caryophyllene', 'Pinene', 'Linalool']
        for (const name of wellKnown) {
            expect(names).toContain(name)
        }
    })

    it('Myrcene has correct properties', () => {
        const myrcene = TERPENE_DATABASE['Myrcene'] as TerpeneReference | undefined
        expect(myrcene).toBeDefined()
        expect(myrcene?.class).toBe('monoterpene')
        expect(myrcene?.cas).toBe('123-35-3')
        expect(myrcene?.boilingPointC).toBe(167)
    })

    it('has no duplicate CAS numbers', () => {
        const casNumbers = entries.map((e) => e.cas)
        const uniqueCas = new Set(casNumbers)
        expect(uniqueCas.size).toBe(casNumbers.length)
    })
})
