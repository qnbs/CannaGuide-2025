import i18next, { TFunction } from 'i18next'
import { initReactI18next } from 'react-i18next'

type LocalePayload = Record<string, unknown>

export const loadLocale = async (lang: 'en' | 'de'): Promise<LocalePayload> => {
    if (lang === 'de') {
        const module = await import('./locales/de')
        return module.de as LocalePayload
    }

    const module = await import('./locales/en')
    return module.en as LocalePayload
}

// Create a direct instance of i18next
export const i18nInstance = i18next.createInstance()

/**
 * Provides a global accessor to the translation function (`t`) from the initialized i18next instance.
 * This is the single source of truth for translations outside of React components (e.g., in services, stores).
 * @returns The translation function.
 */
export const getT = (): TFunction => i18nInstance.t.bind(i18nInstance);

// Detect initial language from browser settings. The store will sync it up later upon hydration.
const detectedLang = navigator.language.split('-')[0]
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en'

// The initialization is now a promise that the app will wait for
export const i18nPromise = (async () => {
    // Only load the initially detected language at startup to minimize bundle loading time.
    // The other language is loaded on demand when the user switches languages.
    const initialTranslations = await loadLocale(initialLang)

    await i18nInstance.use(initReactI18next).init({
        lng: initialLang,
        fallbackLng: 'en',
        resources: {
            [initialLang]: { translation: initialTranslations },
        },
        interpolation: {
            escapeValue: false,
        },
    })
})()
