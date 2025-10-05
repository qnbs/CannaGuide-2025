import { useEffect } from 'react'
import { AppSettings } from '@/types'

/**
 * A custom hook to manage global side effects on the document's root element (<html>).
 * It centralizes logic for applying themes, accessibility settings, and base styles.
 * @param settings - The application's settings object.
 */
export const useDocumentEffects = (settings: AppSettings) => {
    useEffect(() => {
        const root = window.document.documentElement

        // Reset all managed classes to ensure a clean state
        root.className = ''

        // Apply core classes
        root.classList.add('dark', `theme-${settings.theme}`)

        // Apply accessibility settings
        if (settings.accessibility.dyslexiaFont) root.classList.add('dyslexia-font')
        if (settings.accessibility.reducedMotion) root.classList.add('reduced-motion')

        // Apply UI density
        if (settings.uiDensity === 'compact') root.classList.add('ui-density-compact')

        // Apply TTS visibility class
        if (!settings.tts.enabled) root.classList.add('tts-disabled')

        // Apply base font size
        root.style.fontSize =
            settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px'

        // Set document language for accessibility
        root.lang = settings.language
    }, [
        settings.theme,
        settings.fontSize,
        settings.language,
        settings.accessibility.dyslexiaFont,
        settings.accessibility.reducedMotion,
        settings.uiDensity,
        settings.tts.enabled,
    ])
}