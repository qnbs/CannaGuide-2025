import { de } from '@/locales/de/index';
import { en } from '@/locales/en/index';

export { de, en };

export type Locale = 'en' | 'de';

export const locales: Record<Locale, any> = {
  en,
  de,
};