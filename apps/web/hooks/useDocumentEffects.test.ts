import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDocumentEffects } from '@/hooks/useDocumentEffects'
import type { AppSettings } from '@/types'

const mockRemove = vi.fn()
const mockAdd = vi.fn()

const baseSettings: AppSettings = {
    general: {
        theme: 'midnight',
        language: 'en',
        fontSize: 'base',
        uiDensity: 'default',
        dyslexiaFont: false,
        reducedMotion: false,
        highContrastMode: false,
        colorblindMode: 'none',
        showLabels: true,
        isLocalOnlyMode: false,
        unitSystem: 'metric',
    },
    notifications: { enabled: true, alerts: true, tips: true },
    tts: { enabled: true, rate: 1, pitch: 1, volume: 1, voice: '', autoSpeak: false },
    simulation: { autoAdvance: false, realtimeSpeed: 1 },
    apiKeys: {},
} as unknown as AppSettings

describe('useDocumentEffects', () => {
    beforeEach(() => {
        mockRemove.mockClear()
        mockAdd.mockClear()

        const root = document.documentElement
        // Spy on the real classList
        vi.spyOn(root.classList, 'remove').mockImplementation(mockRemove)
        vi.spyOn(root.classList, 'add').mockImplementation(mockAdd)
    })

    it('sets dark mode and theme class', () => {
        renderHook(() => useDocumentEffects(baseSettings))
        expect(mockAdd).toHaveBeenCalledWith('dark')
        expect(mockAdd).toHaveBeenCalledWith('theme-midnight')
    })

    it('applies compact density', () => {
        const settings = {
            ...baseSettings,
            general: { ...baseSettings.general, uiDensity: 'compact' as const },
        }
        renderHook(() => useDocumentEffects(settings))
        expect(mockAdd).toHaveBeenCalledWith('ui-density-compact')
    })

    it('applies dyslexia font', () => {
        const settings = {
            ...baseSettings,
            general: { ...baseSettings.general, dyslexiaFont: true },
        }
        renderHook(() => useDocumentEffects(settings))
        expect(mockAdd).toHaveBeenCalledWith('font-dyslexia')
    })

    it('applies reduced motion', () => {
        const settings = {
            ...baseSettings,
            general: { ...baseSettings.general, reducedMotion: true },
        }
        renderHook(() => useDocumentEffects(settings))
        expect(mockAdd).toHaveBeenCalledWith('reduced-motion')
    })

    it('applies high contrast', () => {
        const settings = {
            ...baseSettings,
            general: { ...baseSettings.general, highContrastMode: true },
        }
        renderHook(() => useDocumentEffects(settings))
        expect(mockAdd).toHaveBeenCalledWith('high-contrast')
    })

    it('applies colorblind mode protanopia', () => {
        const settings = {
            ...baseSettings,
            general: { ...baseSettings.general, colorblindMode: 'protanopia' as const },
        }
        renderHook(() => useDocumentEffects(settings))
        expect(mockAdd).toHaveBeenCalledWith('colorblind-protanopia')
    })

    it('sets font size', () => {
        renderHook(() => useDocumentEffects(baseSettings))
        expect(globalThis.document.documentElement.style.fontSize).toBe('16px')
    })

    it('sets language attribute', () => {
        renderHook(() => useDocumentEffects(baseSettings))
        expect(globalThis.document.documentElement.lang).toBe('en')
    })

    it('resets all managed classes before applying', () => {
        renderHook(() => useDocumentEffects(baseSettings))
        expect(mockRemove).toHaveBeenCalledTimes(1)
    })

    it('adds tts-disabled when tts is off', () => {
        const settings = {
            ...baseSettings,
            tts: { ...baseSettings.tts, enabled: false },
        }
        renderHook(() => useDocumentEffects(settings))
        expect(mockAdd).toHaveBeenCalledWith('tts-disabled')
    })
})
