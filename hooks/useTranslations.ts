import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { locales } from '@/locales';
import { selectLanguage } from '@/stores/selectors';

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path;
};

// Escapes characters with special meaning in regular expressions.
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

export const useTranslations = () => {
  const language = useAppStore(selectLanguage);
  
  const t = useMemo(() => {
    const translations = locales[language] || locales.en;
    
    return (key: string, replacements?: Record<string, string | number>): any => {
      let translation = getNestedValue(translations, key);
      
      if (replacements && typeof translation === 'string' && Object.keys(replacements).length > 0) {
        // Build a single, dynamic regex to match all placeholders at once for performance.
        // e.g., /\{key1\}|\{key2\}/g
        const placeholderRegex = new RegExp(
          Object.keys(replacements)
            .map(placeholder => `\\{${escapeRegExp(placeholder)}\\}`) // Escape placeholder to prevent regex injection/errors
            .join('|'),
          'g'
        );

        // Use a replacer function to look up the correct value for each match.
        translation = translation.replace(placeholderRegex, (matched) => {
          // Remove the '{' and '}' from the matched string to get the key
          const placeholderKey = matched.slice(1, -1);
          // Fallback to the original matched string if the key is not found in replacements.
          return String(replacements[placeholderKey] ?? matched);
        });
      }
      return translation;
    };
  }, [language]);

  return { locale: language, t };
};