import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppSettings, Language, GrowSetup, Theme, View, UiDensity } from '@/types';
import { storageService } from '@/services/storageService';

interface SettingsContextType {
  settings: AppSettings;
  setSetting: (path: string, value: any) => void;
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
    customDifficultyModifiers: {
      pestPressure: 1.0,
      nutrientSensitivity: 1.0,
      environmentalStability: 1.0,
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
    watering: 'plantsView.actionModals.defaultNotes.watering',
    feeding: 'plantsView.actionModals.defaultNotes.feeding',
  },
  defaultExportSettings: {
    source: 'filtered',
    format: 'pdf',
  },
  lastBackupTimestamp: undefined,
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    dyslexiaFont: false,
  },
  uiDensity: 'comfortable',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
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
    
    // Clear old classes to avoid conflicts
    root.className = ''; 

    root.classList.add('dark', `theme-${settings.theme}`);
    if (settings.accessibility.highContrast) {
        root.classList.add('high-contrast');
    }
    if (settings.accessibility.dyslexiaFont) {
        root.classList.add('dyslexia-font');
    }
    if (settings.accessibility.reducedMotion) {
        root.classList.add('reduced-motion');
    }
    if (settings.uiDensity === 'compact') {
        root.classList.add('ui-density-compact');
    }


    root.style.fontSize = settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px';
    root.lang = settings.language;

    storageService.setItem('settings', settings);
  }, [settings]);

  const setSetting = useCallback((path: string, value: any) => {
    setSettingsState(prev => {
      const keys = path.split('.');
      // Create a deep copy to avoid mutation
      const newState = JSON.parse(JSON.stringify(prev));
      
      let currentLevel = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (currentLevel[key] === undefined) {
          // If a key in the path doesn't exist, create it.
          currentLevel[key] = {};
        }
        currentLevel = currentLevel[key];
      }

      currentLevel[keys[keys.length - 1]] = value;
      return newState;
    });
  }, []);


  return (
    <SettingsContext.Provider value={{ settings, setSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};