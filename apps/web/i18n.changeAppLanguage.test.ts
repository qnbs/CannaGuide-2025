import { afterEach, describe, it, expect, vi } from 'vitest'
import { isSupportedLocale, SUPPORTED_LOCALES } from './i18n'

describe('i18n locale helpers', () => {
    it('SUPPORTED_LOCALES lists all bundled languages', () => {
        expect(SUPPORTED_LOCALES).toEqual(['en', 'de', 'es', 'fr', 'nl'])
    })

    it('isSupportedLocale narrows known locale codes', () => {
        expect(isSupportedLocale('de')).toBe(true)
        expect(isSupportedLocale('en')).toBe(true)
        expect(isSupportedLocale('xx')).toBe(false)
        expect(isSupportedLocale('it')).toBe(false)
    })
})

// `fallbackLng: 'en'` only resolves against a loaded English bundle; without
// it a string missing from es/fr/nl renders as its raw key (#647 review).
describe('English fallback bundle', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.resetModules()
    })

    it('is loaded at startup when the browser language is not English', async () => {
        vi.resetModules()
        vi.stubGlobal('navigator', { language: 'es-ES' })
        const { i18nInstance, i18nPromise } = await import('./i18n')
        await i18nPromise
        expect(i18nInstance.language).toBe('es')
        expect(i18nInstance.hasResourceBundle('en', 'translation')).toBe(true)
    })

    it('is loaded again when switching to a non-English locale', async () => {
        const { i18nInstance, i18nPromise, changeAppLanguage } = await import('./i18n')
        await i18nPromise
        i18nInstance.removeResourceBundle('en', 'translation')
        await changeAppLanguage('fr')
        expect(i18nInstance.hasResourceBundle('en', 'translation')).toBe(true)
        await changeAppLanguage('en')
    })
})
