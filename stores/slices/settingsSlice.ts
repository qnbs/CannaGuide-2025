import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { AppSettings, Language, Theme, View, SortKey, SortDirection } from '@/types'
import { indexedDBStorage } from '../indexedDBStorage'
import { RootState } from '../store'

const REDUX_STATE_KEY = 'cannaguide-redux-storage'

export const defaultSettings: AppSettings = {
    version: 2,
    onboardingCompleted: false,

    general: {
        language: 'en',
        theme: 'midnight',
        fontSize: 'base',
        defaultView: View.Plants,
        uiDensity: 'comfortable',
        expertMode: false,
        dyslexiaFont: false,
        reducedMotion: false,
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
        speedMultiplier: 1,
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
    version: 2,
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
    // The page reload will effectively reset the store to its initial state
    window.location.reload()
})

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettingsState: (state, action: PayloadAction<SettingsState>) => {
            return action.payload
        },
        setSetting: (state, action: PayloadAction<{ path: string; value: any }>) => {
            const { path, value } = action.payload
            const keys = path.split('.')
            let current: any = state.settings
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]]
            }
            current[keys[keys.length - 1]] = value
        },
        toggleSetting: (state, action: PayloadAction<{ path: string }>) => {
            const { path } = action.payload
            const keys = path.split('.')
            let current: any = state.settings
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]]
            }
            const finalKey = keys[keys.length - 1]
            current[finalKey] = !current[finalKey]
        },
    },
})

export const { setSettingsState, setSetting, toggleSetting } = settingsSlice.actions

export default settingsSlice.reducer
