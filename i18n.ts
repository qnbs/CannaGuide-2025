import i18next, { TFunction } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de, en } from './locales'

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
export const i18nPromise = i18nInstance.use(initReactI18next).init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        de: { translation: de },
    },
    interpolation: {
        escapeValue: false, // React already handles escaping
    },
})