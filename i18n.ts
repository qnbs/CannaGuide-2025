import i18next from 'i18next';
import { de, en } from '@/locales';

// Create a direct instance of i18next
export const i18nInstance = i18next.createInstance();

// Detect initial language from browser settings. The store will sync it up later upon hydration.
const detectedLang = navigator.language.split('-')[0];
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en';

// The initialization is now a promise that the app will wait for
export const i18nPromise = i18nInstance.init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        de: { translation: de },
    },
    interpolation: {
        escapeValue: false, // React already handles escaping
    },
});

// The subscription logic will be moved to a component like App.tsx
// to ensure the store is initialized before subscribing.
