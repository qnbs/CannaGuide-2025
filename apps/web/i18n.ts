import i18next, { TFunction } from 'i18next'
import { initReactI18next } from 'react-i18next'

type LocalePayload = Record<string, unknown>

export type SupportedLocale = 'en' | 'de' | 'es' | 'fr' | 'nl'

const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'de', 'es', 'fr', 'nl'] as const

// RTL locales -- empty for now; add 'ar', 'he' etc. when translations land
const RTL_LOCALES: ReadonlySet<string> = new Set<string>()

/** Returns the text direction for a given locale. */
export const getTextDirection = (locale: string): 'ltr' | 'rtl' =>
    RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'

export const loadLocale = async (lang: SupportedLocale): Promise<LocalePayload> => {
    switch (lang) {
        case 'de': {
            const module = await import('./locales/de')
            return module.de as LocalePayload
        }
        case 'es': {
            const module = await import('./locales/es')
            return module.es as LocalePayload
        }
        case 'fr': {
            const module = await import('./locales/fr')
            return module.fr as LocalePayload
        }
        case 'nl': {
            const module = await import('./locales/nl')
            return module.nl as LocalePayload
        }
        default: {
            const module = await import('./locales/en')
            return module.en as LocalePayload
        }
    }
}

// Create a direct instance of i18next
export const i18nInstance = i18next.createInstance()

/**
 * Provides a global accessor to the translation function (`t`) from the initialized i18next instance.
 * This is the single source of truth for translations outside of React components (e.g., in services, stores).
 * @returns The translation function.
 */
export const getT = (): TFunction => i18nInstance.t.bind(i18nInstance)

// Detect initial language from browser settings. The store will sync it up later upon hydration.
const detectedLang =
    typeof navigator !== 'undefined' ? (navigator.language.split('-')[0] ?? 'en') : 'en'
const initialLang: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(detectedLang)
    ? (detectedLang as SupportedLocale)
    : 'en'

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

    // Sync <html lang="..." dir="..."> on every language switch
    i18nInstance.on('languageChanged', (lng: string) => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lng
            document.documentElement.dir = getTextDirection(lng)
        }
    })
})()
