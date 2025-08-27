import React, { createContext, ReactNode } from 'react';
import { useSettings } from '../hooks/useSettings';
import { locales, Locale } from '../locales';

interface LanguageContextType {
  locale: Locale;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to get nested values from an object using a string path
const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const locale = settings.language;
  const translations = locales[locale] || locales.en; // Fallback to English

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let translation = getNestedValue(translations, key);
    if (replacements) {
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
