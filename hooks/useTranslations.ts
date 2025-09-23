import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { locales } from '@/locales';
import { selectLanguage } from '@/stores/selectors';

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path;
};

export const useTranslations = () => {
  const language = useAppStore(selectLanguage);
  
  const t = useMemo(() => {
    const translations = locales[language] || locales.en;
    
    return (key: string, replacements?: Record<string, string | number>): any => {
      let translation = getNestedValue(translations, key);
      if (replacements && typeof translation === 'string') {
        Object.keys(replacements).forEach(placeholder => {
          const regex = new RegExp(`{${placeholder}}`, 'g');
          translation = translation.replace(regex, String(replacements[placeholder]));
        });
      }
      return translation;
    };
  }, [language]);

  return { locale: language, t };
};
