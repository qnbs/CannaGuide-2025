import i18next, { TFunction } from 'i18next'
import { initReactI18next } from 'react-i18next'

type LocalePayload = Record<string, unknown>

export type SupportedLocale = 'en' | 'de' | 'es' | 'fr' | 'nl'

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'de', 'es', 'fr', 'nl'] as const

/** Returns true when `lang` is a bundled app locale. */
export const isSupportedLocale = (lang: string): lang is SupportedLocale =>
    (SUPPORTED_LOCALES as readonly string[]).includes(lang)

// RTL locales — enable when ar/he translations land (v2.0)
const RTL_LOCALES: ReadonlySet<string> = new Set<string>(['ar', 'he'])

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

/**
 * Loads a locale bundle into i18next when it is not already present.
 */
export const ensureLocaleLoaded = async (lang: SupportedLocale): Promise<void> => {
    if (!i18nInstance.hasResourceBundle(lang, 'translation')) {
        const translations = await loadLocale(lang)
        i18nInstance.addResourceBundle(lang, 'translation', translations)
    }
}

/**
 * Single entry point for switching the active UI language (lazy-loaded bundles).
 */
export const changeAppLanguage = async (lang: SupportedLocale): Promise<void> => {
    await ensureLocaleLoaded(lang)
    if (i18nInstance.language !== lang) {
        await i18nInstance.changeLanguage(lang)
    }
}

// Detect initial language from browser settings. The store will sync it up later upon hydration.
const detectedLang =
    typeof navigator !== 'undefined' && navigator.language
        ? (navigator.language.split('-')[0] ?? 'en')
        : 'en'
const initialLang: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(detectedLang)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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
