import React, { createContext, ReactNode } from 'react';
import { Language, translations } from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedTranslation = (language: Language, key: string): string | undefined => {
    return key.split('.').reduce((obj, keyPart) => (obj as any)?.[keyPart], translations[language]) as string | undefined;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const language: Language = 'de';

  // Diese Funktion tut nichts mehr, da die Sprache fest eingestellt ist.
  const setLanguage = (lang: Language) => {};

  const t = (key: string, replacements?: { [key: string]: string | number }) => {
    let translation = getNestedTranslation('de', key) || key;

    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
