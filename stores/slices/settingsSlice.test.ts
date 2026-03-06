import { describe, it, expect } from 'vitest'
import settingsReducer, { defaultSettings, setSetting, toggleSetting, simulationProfilePresets } from '@/stores/slices/settingsSlice'
import type { SettingsState } from '@/stores/slices/settingsSlice'

const initial: SettingsState = { settings: defaultSettings, version: 4 }

describe('settingsSlice', () => {
    it('returns initial state', () => {
        const state = settingsReducer(undefined, { type: 'unknown' })
        expect(state.settings).toEqual(defaultSettings)
        expect(state.version).toBe(4)
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

    it('applying a simulation profile updates the bundled simulation parameters', () => {
        const state = settingsReducer(initial, setSetting({ path: 'simulation.simulationProfile', value: 'expert' }))
        expect(state.settings.simulation.simulationProfile).toBe('expert')
        expect(state.settings.simulation.pestPressure).toBe(simulationProfilePresets.expert.pestPressure)
        expect(state.settings.simulation.nutrientSensitivity).toBe(simulationProfilePresets.expert.nutrientSensitivity)
        expect(state.settings.simulation.environmentalStability).toBe(simulationProfilePresets.expert.environmentalStability)
        expect(state.settings.simulation.lightExtinctionCoefficient).toBe(simulationProfilePresets.expert.lightExtinctionCoefficient)
    })

    it('simulation profile switches preserve altitude calibration', () => {
        const withAltitude = settingsReducer(initial, setSetting({ path: 'simulation.altitudeM', value: 1250 }))
        const switched = settingsReducer(withAltitude, setSetting({ path: 'simulation.simulationProfile', value: 'beginner' }))
        expect(switched.settings.simulation.altitudeM).toBe(1250)
    })
})
