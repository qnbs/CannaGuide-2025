import { useEffect } from 'react'
import { AppSettings, Theme } from '@/types'

/**
 * A custom hook to manage global side effects on the document's root element (<html>).
 * It centralizes logic for applying themes, accessibility settings, and base styles.
 * This version uses a robust "atomic reset-and-apply" strategy to ensure consistency and prevent
 * stale classes from persisting, which could otherwise lead to a broken UI state.
 * @param settings - The application's settings object.
 */
export const useDocumentEffects = (settings: AppSettings) => {
    useEffect(() => {
        const root = window.document.documentElement
        const { general, tts } = settings;

        // --- Define ALL classes that this hook is responsible for managing. ---
        // This is crucial for the "reset" part of the pattern.
        const managedClasses = [
            'ui-density-compact',
            'tts-disabled',
            'font-dyslexia',
            'reduced-motion',
            'colorblind-protanopia',
            'colorblind-deuteranopia',
            'colorblind-tritanopia',
            // All possible theme classes. We must list them manually as Theme is a TypeScript type, not a runtime object.
            'theme-midnight', 'theme-forest', 'theme-purpleHaze', 'theme-desertSky', 'theme-roseQuartz', 'theme-rainbowKush'
        ];
        
        // --- ATOMIC UPDATE: Step 1: Reset ---
        // Remove all managed classes to ensure a clean slate before applying the new state.
        // This prevents "stale" classes from remaining if a setting is toggled off or changes.
        root.classList.remove(...managedClasses);

        // --- ATOMIC UPDATE: Step 2: Apply ---
        // Add back only the currently active classes based on the settings object.
        root.classList.add('dark'); // App is always in dark mode.
        root.classList.add(`theme-${general.theme}`);
        
        if (general.uiDensity === 'compact') root.classList.add('ui-density-compact');
        if (!tts.enabled) root.classList.add('tts-disabled');
        if (general.dyslexiaFont) root.classList.add('font-dyslexia');
        if (general.reducedMotion) root.classList.add('reduced-motion');
        if (general.colorblindMode && general.colorblindMode !== 'none') {
            root.classList.add(`colorblind-${general.colorblindMode}`);
        }
        
        // --- Apply styles and attributes that are not class-based ---
        root.style.fontSize =
            general.fontSize === 'sm' ? '14px' : general.fontSize === 'lg' ? '18px' : '16px';
        root.lang = general.language;
        
    }, [settings]) // The hook re-runs whenever any part of the settings object changes.
}