import { describe, it, expect } from 'vitest'
import settingsReducer, { defaultSettings, setSetting, toggleSetting } from '@/stores/slices/settingsSlice'
import type { SettingsState } from '@/stores/slices/settingsSlice'

const initial: SettingsState = { settings: defaultSettings, version: 2 }

describe('settingsSlice', () => {
    it('returns initial state', () => {
        const state = settingsReducer(undefined, { type: 'unknown' })
        expect(state.settings).toEqual(defaultSettings)
        expect(state.version).toBe(2)
    })

    it('setSetting updates nested setting by path', () => {
        const state = settingsReducer(initial, setSetting({ path: 'general.theme', value: 'dark' }))
        expect(state.settings.general.theme).toBe('dark')
    })

    it('setSetting updates deeply nested setting', () => {
        const state = settingsReducer(
            initial,
            setSetting({ path: 'notifications.quietHours.enabled', value: true }),
        )
        expect(state.settings.notifications.quietHours.enabled).toBe(true)
    })

    it('setSetting blocks prototype pollution via __proto__', () => {
        const state = settingsReducer(
            initial,
            setSetting({ path: '__proto__.polluted', value: true }),
        )
        // State should be unchanged; no prototype pollution
        expect((Object.prototype as any).polluted).toBeUndefined()
        expect(state.settings).toEqual(initial.settings)
    })

    it('setSetting blocks prototype pollution via constructor', () => {
        const state = settingsReducer(
            initial,
            setSetting({ path: 'constructor.polluted', value: true }),
        )
        expect(state.settings).toEqual(initial.settings)
    })

    it('toggleSetting toggles boolean setting', () => {
        const state = settingsReducer(initial, toggleSetting({ path: 'tts.enabled' }))
        expect(state.settings.tts.enabled).toBe(!defaultSettings.tts.enabled)
    })

    it('setSetting for onboardingCompleted', () => {
        const state = settingsReducer(initial, setSetting({ path: 'onboardingCompleted', value: true }))
        expect(state.settings.onboardingCompleted).toBe(true)
    })

    it('setSetting for language', () => {
        const state = settingsReducer(initial, setSetting({ path: 'general.language', value: 'de' }))
        expect(state.settings.general.language).toBe('de')
    })
})
