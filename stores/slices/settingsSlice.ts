import { AppSettings, View, Language, Theme, TTSSettings, UiDensity } from '@/types';
import { getT } from '../../i18n';
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { indexedDBStorage } from '../indexedDBStorage';
import { APP_VERSION } from '@/services/migrationLogic';

const detectedLang = navigator.language.split('-')[0];
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en';

export const defaultSettings: AppSettings = {
    fontSize: 'base',
    language: initialLang,
    theme: 'midnight',
    defaultView: View.Plants,
    strainsViewSettings: {
        defaultSortKey: 'name',
        defaultSortDirection: 'asc',
        defaultViewMode: 'list',
    },
    notificationsEnabled: true,
    notificationSettings: {
        stageChange: true,
        problemDetected: true,
        harvestReady: true,
        newTask: true,
    },
    onboardingCompleted: false,
    simulationProfile: 'beginner',
    simulationSettings: {
        difficulty: 'easy',
        autoJournaling: { stageChanges: true, problems: true, tasks: true },
        customDifficultyModifiers: {
            pestPressure: 0.7,
            nutrientSensitivity: 0.7,
            environmentalStability: 1.3,
        },
        autoAdvance: false,
        speed: '1x',
    },
    defaultGrowSetup: { light: { type: 'LED', wattage: 150 }, potSize: 15, medium: 'Soil' },
    defaultJournalNotes: {
        watering: 'plantsView.actionModals.defaultNotes.watering',
        feeding: 'plantsView.actionModals.defaultNotes.feeding',
    },
    defaultExportSettings: { source: 'all', format: 'pdf' },
    lastBackupTimestamp: undefined,
    accessibility: { reducedMotion: false, dyslexiaFont: false },
    uiDensity: 'comfortable',
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    tts: { enabled: true, rate: 1, pitch: 1, voiceName: null },
    showArchivedInPlantsView: true,
    isExpertMode: false,
};

export interface SettingsState {
    settings: AppSettings;
    version: number;
}

const initialState: SettingsState = {
    settings: defaultSettings,
    version: APP_VERSION,
};

export const exportAllData = createAsyncThunk<void, void, { state: RootState }>(
    'settings/exportAllData',
    async (_, { getState, dispatch }) => {
        const t = getT();
        const stateToExport = getState();
        const blob = new Blob([JSON.stringify(stateToExport, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cannaguide-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        dispatch(setSetting({ path: 'lastBackupTimestamp', value: Date.now() }));
    }
);

export const resetAllData = createAsyncThunk<void, void, { state: RootState }>(
    'settings/resetAllData',
    async (_, { getState }) => {
        const t = getT();
        if (window.confirm(t('settingsView.data.resetAllConfirm'))) {
            await indexedDBStorage.removeItem('cannaguide-redux-storage');
            window.location.reload();
        }
    }
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettingsState: (state, action: PayloadAction<SettingsState>) => {
            state.settings = action.payload.settings;
            state.version = action.payload.version;
        },
        setSettings: (state, action: PayloadAction<AppSettings>) => {
            state.settings = action.payload;
        },
        setSetting: (state, action: PayloadAction<{ path: string; value: any }>) => {
            const { path, value } = action.payload;
            const keys = path.split('.');
            let currentLevel: any = state.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = value;

            if (path.startsWith('simulationSettings.customDifficultyModifiers')) {
                state.settings.simulationProfile = 'custom';
            }
        },
        updateAccessibilitySettings: (state, action: PayloadAction<Partial<AppSettings['accessibility']>>) => {
            state.settings.accessibility = { ...state.settings.accessibility, ...action.payload };
        },
        updateTtsSettings: (state, action: PayloadAction<Partial<TTSSettings>>) => {
            state.settings.tts = { ...state.settings.tts, ...action.payload };
        },
        setSimulationProfile: (
            state,
            action: PayloadAction<'beginner' | 'expert' | 'experimental' | 'custom'>
        ) => {
            state.settings.simulationProfile = action.payload;
            switch (action.payload) {
                case 'beginner':
                    state.settings.simulationSettings.difficulty = 'easy';
                    state.settings.simulationSettings.customDifficultyModifiers = {
                        pestPressure: 0.7,
                        nutrientSensitivity: 0.7,
                        environmentalStability: 1.3,
                    };
                    break;
                case 'expert':
                    state.settings.simulationSettings.difficulty = 'hard';
                    state.settings.simulationSettings.customDifficultyModifiers = {
                        pestPressure: 1.2,
                        nutrientSensitivity: 1.2,
                        environmentalStability: 0.8,
                    };
                    break;
                case 'experimental':
                    state.settings.simulationSettings.difficulty = 'hard';
                    state.settings.simulationSettings.customDifficultyModifiers = {
                        pestPressure: 1.5,
                        nutrientSensitivity: 1.5,
                        environmentalStability: 0.6,
                    };
                    break;
                case 'custom':
                    state.settings.simulationSettings.difficulty = 'custom';
                    break;
            }
        },
        toggleSetting: (state, action: PayloadAction<{ path: string }>) => {
            const { path } = action.payload;
            const keys = path.split('.');
            let currentLevel: any = state.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            const finalKey = keys[keys.length - 1];
            if (typeof currentLevel[finalKey] === 'boolean') {
                currentLevel[finalKey] = !currentLevel[finalKey];
            }
        },
    },
});

export const { 
    setSettingsState, 
    setSetting, 
    setSettings, 
    toggleSetting, 
    setSimulationProfile,
    updateAccessibilitySettings,
    updateTtsSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;