import React, { createContext, ReactNode } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { locales, Locale } from '@/locales';

interface LanguageContextType {
  locale: Locale;
  t: (key: string, replacements?: Record<string, string | number>) => any;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const locale = settings.language;
  const translations = locales[locale] || locales.en;

  const t = (key: string, replacements?: Record<string, string | number>): any => {
    let translation = getNestedValue(translations, key);
    if (replacements && typeof translation === 'string') {
      Object.keys(replacements).forEach(placeholder => {
        const regex = new RegExp(`{${placeholder}}`, 'g');
        translation = translation.replace(regex, String(replacements[placeholder]));
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ locale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};