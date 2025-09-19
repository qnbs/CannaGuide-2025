import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, Language, GrowSetup, Theme, View } from '../types';
import { storageService } from '../services/storageService';

interface SettingsContextType {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const detectedLang = navigator.language.split('-')[0];
const initialLang: Language = detectedLang === 'de' ? 'de' : 'en';

const defaultSettings: AppSettings = {
  fontSize: 'base',
  language: initialLang,
  theme: 'midnight',
  defaultView: View.Plants,
  strainsViewSettings: {
    defaultSortKey: 'name',
    defaultSortDirection: 'asc',
    defaultViewMode: 'list',
    visibleColumns: {
      type: true,
      thc: true,
      cbd: true,
      floweringTime: true,
      yield: true,
      difficulty: true,
    },
  },
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
    autoAdvance: false,
    autoJournaling: {
        stageChanges: true,
        problems: true,
        tasks: true,
    },
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
    watering: 'Pflanze gegossen.',
    feeding: 'Pflanze gedüngt.',
  },
  defaultExportSettings: {
    source: 'filtered',
    format: 'pdf',
  },
  lastBackupTimestamp: undefined,
};

// A recursive merge function to safely combine default and saved settings
const mergeSettings = (defaults: any, saved: any): any => {
    const merged = { ...defaults };
    for (const key in saved) {
        if (saved.hasOwnProperty(key)) {
            if (typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key]) && typeof defaults[key] === 'object' && defaults[key] !== null) {
                merged[key] = mergeSettings(defaults[key], saved[key]);
            } else if(saved[key] !== undefined) {
                merged[key] = saved[key];
            }
        }
    }
     // Ensure nested defaults exist if they are missing from saved data entirely
    for (const key in defaults) {
        if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
             if (!merged[key] || typeof merged[key] !== 'object') {
                 merged[key] = defaults[key];
             } else {
                 merged[key] = mergeSettings(defaults[key], merged[key]);
             }
        }
    }
    return merged;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    const saved = storageService.getItem<Partial<AppSettings>>('settings', {});
    return mergeSettings(defaultSettings, saved);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.className = `dark theme-${settings.theme}`;
    root.style.fontSize = settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px';
    root.lang = settings.language;

    storageService.setItem('settings', settings);
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