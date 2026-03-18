import { useEffect } from 'react'
import { AppSettings, View } from '@/types'

/**
 * A custom hook to manage global side effects on the document's root element (<html>).
 * It centralizes logic for applying themes, accessibility settings, and base styles.
 * This version uses a robust "atomic reset-and-apply" strategy to ensure consistency and prevent
 * stale classes from persisting, which could otherwise lead to a broken UI state.
 * @param settings - The application's settings object.
 */
export const useDocumentEffects = (settings: AppSettings, activeView?: View) => {
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
            'high-contrast',
            'colorblind-protanopia',
            'colorblind-deuteranopia',
            'colorblind-tritanopia',
            // All possible theme classes. We must list them manually as Theme is a TypeScript type, not a runtime object.
            'theme-midnight', 'theme-forest', 'theme-purpleHaze', 'theme-desertSky', 'theme-roseQuartz', 'theme-rainbowKush',
            'theme-ogKushGreen', 'theme-runtzRainbow', 'theme-lemonSkunk'
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
        if (general.highContrastMode) root.classList.add('high-contrast');
        if (general.colorblindMode && general.colorblindMode !== 'none') {
            root.classList.add(`colorblind-${general.colorblindMode}`);
        }

        // --- Apply styles and attributes that are not class-based ---
        root.style.fontSize =
            general.fontSize === 'sm' ? '14px' : general.fontSize === 'lg' ? '18px' : '16px';
        root.lang = general.language;

        const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
        // Per-theme base colours (match --color-bg-primary from styles.css)
        const themeColorMap: Partial<Record<string, string>> = {
            midnight: '#050A14',
            forest: '#121D1B',
            purpleHaze: '#1C122B',
            desertSky: '#111827',
            roseQuartz: '#2B1221',
            rainbowKush: '#141419',
            ogKushGreen: '#0C140E',
            runtzRainbow: '#0F0C16',
            lemonSkunk: '#101208',
        }
        const viewThemeMap: Partial<Record<View, string>> = {
            [View.Plants]: '#0b1f19',
            [View.Strains]: '#131c2e',
            [View.Equipment]: '#1f1a0f',
            [View.Knowledge]: '#1d1226',
            [View.Settings]: '#0f172a',
            [View.Help]: '#1f1722',
        }
        if (themeMeta) {
            themeMeta.content = (activeView && viewThemeMap[activeView]) ||
                themeColorMap[general.theme] ||
                '#0F172A'
        }

    }, [settings, activeView]) // The hook re-runs whenever any part of the settings object changes.
}
