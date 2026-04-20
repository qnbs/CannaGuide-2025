import { describe, expect, it } from 'vitest'
import {
    localizeStr,
    languageConstraint,
    localizeInstruction,
    LANGUAGE_NAMES,
} from './localeHelpers'

describe('localeHelpers', () => {
    describe('LANGUAGE_NAMES', () => {
        it('maps all 5 supported languages', () => {
            expect(LANGUAGE_NAMES.en).toBe('English')
            expect(LANGUAGE_NAMES.de).toBe('German')
            expect(LANGUAGE_NAMES.es).toBe('Spanish')
            expect(LANGUAGE_NAMES.fr).toBe('French')
            expect(LANGUAGE_NAMES.nl).toBe('Dutch')
        })
    })

    describe('localizeStr', () => {
        const texts = { en: 'Hello', de: 'Hallo', fr: 'Bonjour' }

        it('returns exact language match', () => {
            expect(localizeStr('de', texts)).toBe('Hallo')
        })

        it('falls back to English for missing language', () => {
            expect(localizeStr('es', texts)).toBe('Hello')
        })

        it('returns English for en', () => {
            expect(localizeStr('en', texts)).toBe('Hello')
        })
    })

    describe('languageConstraint', () => {
        it('includes language name for English', () => {
            expect(languageConstraint('en')).toContain('English')
        })

        it('includes language name for German', () => {
            expect(languageConstraint('de')).toContain('German')
        })

        it('starts with CRITICAL', () => {
            expect(languageConstraint('en')).toMatch(/^CRITICAL/)
        })
    })

    describe('localizeInstruction', () => {
        const instructions = { en: 'Describe the plant', de: 'Beschreibe die Pflanze' }

        it('returns matching language instruction', () => {
            expect(localizeInstruction('de', instructions)).toBe('Beschreibe die Pflanze')
        })

        it('falls back to English', () => {
            expect(localizeInstruction('es', instructions)).toBe('Describe the plant')
        })
    })
})
