import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

export const useTranslations = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a LanguageProvider');
  }
  return context;
};
