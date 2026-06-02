import { describe, it, expect } from 'vitest'
import { isSupportedLocale, SUPPORTED_LOCALES } from './i18n'

describe('i18n locale helpers', () => {
    it('SUPPORTED_LOCALES lists all bundled languages', () => {
        expect(SUPPORTED_LOCALES).toEqual(['en', 'de', 'es', 'fr', 'nl'])
    })

    it('isSupportedLocale narrows known locale codes', () => {
        expect(isSupportedLocale('de')).toBe(true)
        expect(isSupportedLocale('en')).toBe(true)
        expect(isSupportedLocale('xx')).toBe(false)
    })
})
