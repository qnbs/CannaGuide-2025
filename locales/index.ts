import { de } from './de'
import { en } from './en'

export { de, en }

export type Locale = 'en' | 'de'

export const locales: Record<Locale, { translation: typeof en | typeof de }> = {
    en: { translation: en },
    de: { translation: de },
}
