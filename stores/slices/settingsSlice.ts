import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { AppSettings, View } from '@/types'
import { indexedDBStorage } from '../indexedDBStorage'
import { RootState } from '../store'
import { GEMINI_API_KEY_STORAGE_KEY, REDUX_STATE_KEY, VersionedSliceName } from '@/constants'
import { aiProviderService } from '@/services/aiProviderService'

export const simulationProfilePresets: Record<AppSettings['simulation']['simulationProfile'], Pick<AppSettings['simulation'], 'pestPressure' | 'nutrientSensitivity' | 'environmentalStability' | 'leafTemperatureOffset' | 'lightExtinctionCoefficient' | 'nutrientConversionEfficiency' | 'stomataSensitivity'>> = {
    beginner: {
        pestPressure: 0.04,
        nutrientSensitivity: 0.85,
        environmentalStability: 0.97,
        leafTemperatureOffset: -2.5,
        lightExtinctionCoefficient: 0.58,
        nutrientConversionEfficiency: 0.62,
        stomataSensitivity: 0.82,
    },
    intermediate: {
        pestPressure: 0.1,
        nutrientSensitivity: 1.0,
        environmentalStability: 0.9,
        leafTemperatureOffset: -2,
        lightExtinctionCoefficient: 0.7,
        nutrientConversionEfficiency: 0.5,
        stomataSensitivity: 1.0,
    },
    expert: {
        pestPressure: 0.18,
        nutrientSensitivity: 1.15,
        environmentalStability: 0.82,
        leafTemperatureOffset: -1.5,
        lightExtinctionCoefficient: 0.78,
        nutrientConversionEfficiency: 0.44,
        stomataSensitivity: 1.16,
    },
}

export const defaultSettings: AppSettings = {
    version: 5,
    onboardingCompleted: false,

    general: {
        language: 'en',
        theme: 'midnight',
        fontSize: 'base',
        defaultView: View.Plants,
        uiDensity: 'comfortable',
        dyslexiaFont: false,
        reducedMotion: false,
        highContrastMode: false,
        colorblindMode: 'none',
    },

    voiceControl: {
        enabled: true,
        hotwordEnabled: false,
        confirmationSound: true,
    },

    tts: {
        enabled: false,
        voiceName: null,
        rate: 1,
        pitch: 1,
        volume: 1,
        highlightSpeakingText: true,
    },

    strainsView: {
        defaultSortKey: 'name',
        defaultSortDirection: 'asc',
        defaultViewMode: 'list',
        strainsPerPage: 25,
        visibleColumns: ['type', 'thc', 'cbd', 'floweringTime'],
        prioritizeUserStrains: true,
        genealogyDefaultDepth: 2,
        genealogyDefaultLayout: 'horizontal',
        aiTipsDefaultFocus: 'overall',
        aiTipsDefaultExperience: 'advanced',
    },

    plantsView: {
        showArchived: true,
        autoGenerateTasks: true,
    },

    simulation: {
        autoJournaling: {
            logStageChanges: true,
            logProblems: true,
            logTasks: true,
        },
        simulationProfile: 'intermediate',
        // General behavior
        pestPressure: 0.1,
        nutrientSensitivity: 1.0,
        environmentalStability: 0.9,
        // Expert physics
        leafTemperatureOffset: -2,
        lightExtinctionCoefficient: 0.7,
        nutrientConversionEfficiency: 0.5,
        stomataSensitivity: 1.0,
        altitudeM: 0,
    },

    notifications: {
        enabled: true,
        stageChange: true,
        problemDetected: true,
        harvestReady: true,
        newTask: true,
        lowWaterWarning: true,
        phDriftWarning: true,
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
        },
    },

    defaults: {
        growSetup: {
            lightType: 'LED',
            lightWattage: 150,
            lightHours: 18,
            ventilation: 'medium',
            hasCirculationFan: true,
            potSize: 15,
            potType: 'Fabric',
            medium: 'Soil',
        },
        journalNotes: {
            watering: 'Standard watering.',
            feeding: 'Standard feeding.',
        },
    },

    data: {
        autoBackup: 'weekly',
        persistenceIntervalMs: 1500,
        cloudSync: {
            enabled: false,
            provider: 'none',
        },
    },

    privacy: {
        requirePinOnLaunch: false,
        pin: null,
        clearAiHistoryOnExit: false,
    },
}

export interface SettingsState {
    settings: AppSettings
    version: number
}

const initialState: SettingsState = {
    settings: defaultSettings,
    version: 5,
}

// Async thunks for data management
export const exportAllData = createAsyncThunk<void, void, { state: RootState }>(
    'settings/exportAllData',
    async (_, { getState }) => {
        const state = getState()
        const stateToSave = JSON.stringify(state, null, 2)
        const blob = new Blob([stateToSave], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cannaguide_backup_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }, 100)
    },
)

export const resetAllData = createAsyncThunk<void, void>('settings/resetAllData', async () => {
    await indexedDBStorage.removeItem(REDUX_STATE_KEY)
    await indexedDBStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY)
    await aiProviderService.clearAllProviderApiKeys()
    // The page reload will effectively reset the store to its initial state
    window.location.reload()
})

/**
 * Resets a single slice to its initial state by removing the persisted key
 * from the IndexedDB snapshot and reloading. This allows users to recover
 * from corrupt slice data without losing everything.
 */
export const resetSliceData = createAsyncThunk<void, VersionedSliceName>(
    'settings/resetSliceData',
    async (sliceName) => {
        const raw = await indexedDBStorage.getItem(REDUX_STATE_KEY)
        if (raw) {
            const state = JSON.parse(raw)
            delete state[sliceName]
            await indexedDBStorage.setItem(REDUX_STATE_KEY, JSON.stringify(state))
        }
        window.location.reload()
    },
)

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettingsState: (_state, action: PayloadAction<SettingsState>) => {
            return action.payload
        },
        setSetting: (state, action: PayloadAction<{ path: string; value: unknown }>) => {
            const { path, value } = action.payload
            if (path === 'simulation.simulationProfile' && typeof value === 'string') {
                const nextProfile = value as AppSettings['simulation']['simulationProfile']
                const preset = simulationProfilePresets[nextProfile]
                if (!preset) return

                state.settings.simulation.simulationProfile = nextProfile
                Object.assign(state.settings.simulation, preset)
                return
            }

            const keys = path.split('.')
            // Guard against prototype pollution via crafted paths
            if (keys.some(k => k === '__proto__' || k === 'constructor' || k === 'prototype')) return
            let current: Record<string, unknown> = state.settings as unknown as Record<string, unknown>
            for (let i = 0; i < keys.length - 1; i++) {
                if (!Object.prototype.hasOwnProperty.call(current, keys[i])) return
                current = current[keys[i]] as Record<string, unknown>
            }
            current[keys[keys.length - 1]] = value
        },
        toggleSetting: (state, action: PayloadAction<{ path: string }>) => {
            const { path } = action.payload
            const keys = path.split('.')
            if (keys.some(k => k === '__proto__' || k === 'constructor' || k === 'prototype')) return
            let current: Record<string, unknown> = state.settings as unknown as Record<string, unknown>
            for (let i = 0; i < keys.length - 1; i++) {
                if (!Object.prototype.hasOwnProperty.call(current, keys[i])) return
                current = current[keys[i]] as Record<string, unknown>
            }
            const finalKey = keys[keys.length - 1]
            current[finalKey] = !current[finalKey]
        },
    },
})

export const { setSettingsState, setSetting, toggleSetting } = settingsSlice.actions

export default settingsSlice.reducer
