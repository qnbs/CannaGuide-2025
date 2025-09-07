import { de } from './de/index';
import { en } from './en/index';

export { de, en };

export type Locale = 'en' | 'de';

export const locales: Record<Locale, any> = {
  en,
  de,
};
