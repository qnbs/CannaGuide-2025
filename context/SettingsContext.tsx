import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'base',
  notificationsEnabled: true,
  notificationSettings: {
    stageChange: true,
    problemDetected: true,
    harvestReady: true,
  },
  onboardingCompleted: false,
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('cannabis-grow-guide-settings');
      const parsed = savedSettings ? JSON.parse(savedSettings) : {};
      // Ensure that old, deprecated settings are not carried over
      const validSettings: Partial<AppSettings> = {};
      for (const key of Object.keys(defaultSettings) as (keyof AppSettings)[]) {
        if (key in parsed) {
          (validSettings as any)[key] = parsed[key];
        }
      }
      return { ...defaultSettings, ...validSettings };
    } catch (e) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Light/Dark mode
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);

    // Font Size
    root.classList.remove('sm', 'base', 'lg');
    root.classList.add(settings.fontSize);

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