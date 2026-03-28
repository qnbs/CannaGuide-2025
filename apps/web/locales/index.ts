import { de } from './de'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { nl } from './nl'

export { de, en, es, fr, nl }

export type Locale = 'en' | 'de' | 'es' | 'fr' | 'nl'

export const locales: Record<
    Locale,
    { translation: typeof en | typeof de | typeof es | typeof fr | typeof nl }
> = {
    en: { translation: en },
    de: { translation: de },
    es: { translation: es },
    fr: { translation: fr },
    nl: { translation: nl },
}
