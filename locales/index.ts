import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';

export { de, en, es, fr, it };

export type Locale = 'en' | 'de';

export const locales: Record<Locale, any> = {
  en,
  de,
};
