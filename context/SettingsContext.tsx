import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, Language, ExportFormat, ExportSource, GrowSetup, Theme } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Detect initial language
const detectedLang = navigator.language.split('-')[0];
const initialLang: Language = detectedLang === 'de' ? 'de' : 'en';


const defaultSettings: AppSettings = {
  fontSize: 'base',
  language: initialLang,
  theme: 'midnight',
  notificationsEnabled: true,
  notificationSettings: {
    stageChange: true,
    problemDetected: true,
    harvestReady: true,
    newTask: true,
  },
  onboardingCompleted: false,
  simulationSettings: {
    speed: '1x',
    difficulty: 'normal',
  },
  defaultGrowSetup: {
    lightType: 'LED',
    potSize: 10,
    medium: 'Soil',
    temperature: 24,
    humidity: 60,
    lightHours: 18,
  },
  defaultJournalNotes: {
    watering: '',
    feeding: '',
  },
  defaultExportSettings: {
    source: 'filtered',
    format: 'pdf',
  },
  lastBackupTimestamp: undefined,
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('cannabis-grow-guide-settings');
      const parsed = savedSettings ? JSON.parse(savedSettings) : {};
      
      // Deep merge with defaults to ensure new settings are applied
      const mergedSettings = {
        ...defaultSettings,
        ...parsed,
        notificationSettings: {
          ...defaultSettings.notificationSettings,
          ...(parsed.notificationSettings || {}),
        },
        simulationSettings: {
          ...defaultSettings.simulationSettings,
          ...(parsed.simulationSettings || {}),
        },
        defaultGrowSetup: {
            ...defaultSettings.defaultGrowSetup,
            ...(parsed.defaultGrowSetup || {}),
        },
        defaultJournalNotes: {
            ...defaultSettings.defaultJournalNotes,
            ...(parsed.defaultJournalNotes || {}),
        },
        defaultExportSettings: {
            ...defaultSettings.defaultExportSettings,
            ...(parsed.defaultExportSettings || {}),
        },
        lastBackupTimestamp: parsed.lastBackupTimestamp || undefined,
      };
      return mergedSettings;

    } catch (e) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply theme and mode
    root.className = `dark theme-${settings.theme}`;
    
    // Font Size
    root.style.fontSize = settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px';

    // Language
    root.lang = settings.language;

    try {
      localStorage.setItem('cannabis-grow-guide-settings', JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
  }, [settings]);

  const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, setSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};