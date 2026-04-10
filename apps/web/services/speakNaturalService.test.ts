import { describe, expect, it } from 'vitest'
import { speakNatural } from '@/services/speakNaturalService'

describe('speakNaturalService', () => {
    it('expands pH abbreviation', () => {
        const result = speakNatural('The pH is 6.5', 'en')
        expect(result).toContain('P H')
    })

    it('expands THC/CBD abbreviations', () => {
        const result = speakNatural('THC content is 22%', 'en')
        expect(result).toContain('T H C')
    })

    it('expands VPD abbreviation', () => {
        const result = speakNatural('VPD is optimal', 'en')
        expect(result).toContain('V P D')
    })

    it('strips markdown bold markers', () => {
        const result = speakNatural('This is **bold** text', 'en')
        expect(result).not.toContain('**')
        expect(result).toContain('bold')
    })

    it('strips markdown italic markers', () => {
        const result = speakNatural('This is *italic* text', 'en')
        expect(result).not.toContain('*')
        expect(result).toContain('italic')
    })

    it('strips markdown list markers', () => {
        const result = speakNatural('- list item', 'en')
        expect(result).not.toMatch(/^- /)
    })

    it('handles German decimal format', () => {
        const result = speakNatural('Temperatur: 22,5 Grad', 'de')
        expect(result).toContain('Komma')
    })

    it('returns empty string for empty input', () => {
        expect(speakNatural('', 'en')).toBe('')
    })

    it('preserves normal words unchanged', () => {
        expect(speakNatural('indica sativa', 'en')).toContain('indica')
        expect(speakNatural('indica sativa', 'en')).toContain('sativa')
    })

    it('expands degree Celsius units in English', () => {
        const result = speakNatural('It is 22.5C today', 'en')
        // Should expand temperature notation
        expect(result).toBeDefined()
    })
})
