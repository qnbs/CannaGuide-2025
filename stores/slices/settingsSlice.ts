import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AppSettings, Language, Theme, View, SortKey, SortDirection } from '@/types';
import { indexedDBStorage } from '../indexedDBStorage';
import { RootState } from '../store';

const REDUX_STATE_KEY = 'cannaguide-redux-storage';

export const defaultSettings: AppSettings = {
    version: 2,
    language: 'en',
    theme: 'midnight',
    fontSize: 'base',
    defaultView: View.Plants,
    isExpertMode: false,
    accessibility: {
        highContrast: false,
        dyslexiaFont: false,
        reducedMotion: false,
    },
    tts: {
        enabled: false,
        voiceName: null,
        rate: 1,
        pitch: 1,
    },
    uiDensity: 'comfortable',
    strainsViewSettings: {
        defaultSortKey: 'name',
        defaultSortDirection: 'asc',
        visibleColumns: ['type', 'thc', 'cbd', 'floweringTime'],
    },
    simulationSettings: {
        autoAdvance: true,
        autoJournaling: {
            logStageChanges: true,
            logProblems: true,
            logTasks: true,
        },
        speedMultiplier: 1,
        simulationProfile: 'expert',
        pestPressure: 0.1,
        nutrientSensitivity: 1.0,
        environmentalStability: 0.9,
    },
    notificationSettings: {
        enabled: true,
        stageChange: true,
        problemDetected: true,
        harvestReady: true,
        newTask: true,
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
        },
    },
    defaultGrowSetup: {
        light: { wattage: 150 },
        potSize: 15,
        medium: 'Soil',
        lightHours: 18,
    },
    defaultExportFormat: 'pdf',
    defaultJournalNotes: {
        watering: 'Standard watering.',
        feeding: 'Standard feeding.',
    },
    onboardingCompleted: false,
    showArchivedInPlantsView: true,
};

export interface SettingsState {
    settings: AppSettings;
    version: number;
}

const initialState: SettingsState = {
    settings: defaultSettings,
    version: 2,
};

// Async thunks for data management
export const exportAllData = createAsyncThunk<void, void, { state: RootState }>(
    'settings/exportAllData',
    async (_, { getState }) => {
        const state = getState();
        const stateToSave = JSON.stringify(state, null, 2);
        const blob = new Blob([stateToSave], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cannaguide_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
);

export const resetAllData = createAsyncThunk<void, void>(
    'settings/resetAllData',
    async () => {
        await indexedDBStorage.removeItem(REDUX_STATE_KEY);
        // The page reload will effectively reset the store to its initial state
        window.location.reload();
    }
);


const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettingsState: (state, action: PayloadAction<SettingsState>) => {
            return action.payload;
        },
        setSetting: (state, action: PayloadAction<{ path: string; value: any }>) => {
            const { path, value } = action.payload;
            const keys = path.split('.');
            let current: any = state.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        },
        toggleSetting: (state, action: PayloadAction<{ path: string }>) => {
            const { path } = action.payload;
            const keys = path.split('.');
            let current: any = state.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            const finalKey = keys[keys.length - 1];
            current[finalKey] = !current[finalKey];
        },
    }
});

export const { setSettingsState, setSetting, toggleSetting } = settingsSlice.actions;

export default settingsSlice.reducer;
