
import { AppSettings, View, Language, Theme } from '@/types';
import { getT } from '../../i18n';
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { indexedDBStorage } from '../indexedDBStorage';

const detectedLang = navigator.language.split('-')[0];
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en';

export const defaultSettings: AppSettings = {
  fontSize: 'base', language: initialLang, theme: 'midnight', defaultView: View.Plants,
  strainsViewSettings: { defaultSortKey: 'name', defaultSortDirection: 'asc', defaultViewMode: 'list', visibleColumns: { type: true, thc: true, cbd: true, floweringTime: true, yield: true, difficulty: true }},
  notificationsEnabled: true, notificationSettings: { stageChange: true, problemDetected: true, harvestReady: true, newTask: true }, onboardingCompleted: false,
  simulationSettings: { 
    difficulty: 'normal', 
    autoJournaling: { stageChanges: true, problems: true, tasks: true }, 
    customDifficultyModifiers: { pestPressure: 1.0, nutrientSensitivity: 1.0, environmentalStability: 1.0 },
    autoAdvance: false,
    speed: '1x'
  },
  defaultGrowSetup: { light: { type: 'LED', wattage: 150 }, potSize: 15, medium: 'Soil' },
  defaultJournalNotes: { watering: 'plantsView.actionModals.defaultNotes.watering', feeding: 'plantsView.actionModals.defaultNotes.feeding' },
  defaultExportSettings: { source: 'all', format: 'pdf' }, lastBackupTimestamp: undefined,
  accessibility: { reducedMotion: false, dyslexiaFont: false }, uiDensity: 'comfortable',
  quietHours: { enabled: false, start: '22:00', end: '08:00' },
  tts: { enabled: true, rate: 1, pitch: 1, voiceName: null }
};

const isObject = (item: any): item is Record<string, any> => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

export const mergeSettings = (persisted: Partial<AppSettings>): AppSettings => {
    const output = JSON.parse(JSON.stringify(defaultSettings));
    function deepMerge(target: any, source: any) {
        for (const key of Object.keys(source)) {
            const sourceValue = source[key];
            if (isObject(sourceValue)) {
                if (!target[key] || !isObject(target[key])) {
                    target[key] = {};
                }
                deepMerge(target[key], sourceValue);
            } else if (sourceValue !== undefined) {
                target[key] = sourceValue;
            }
        }
    }
    if (isObject(persisted)) {
        deepMerge(output, persisted);
    }
    return output;
};

export interface SettingsState {
    settings: AppSettings;
}

const initialState: SettingsState = {
    settings: defaultSettings,
};

export const exportAllData = createAsyncThunk<void, void, { state: RootState }>(
    'settings/exportAllData',
    async (_, { getState, dispatch }) => {
        const t = getT();
        const stateToExport = getState();
        const blob = new Blob([JSON.stringify(stateToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cannaguide-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        dispatch(setSetting({ path: 'lastBackupTimestamp', value: Date.now() }));
        // addNotification needs to be dispatched from component
    }
);

export const resetAllData = createAsyncThunk<void, void, { state: RootState }>(
    'settings/resetAllData',
    async (_, { getState }) => {
        const t = getT();
        if (window.confirm(t('settingsView.data.resetAllConfirm'))) {
            await indexedDBStorage.removeItem('cannaguide-redux-storage'); // Assuming this is the key used for redux persist
            window.location.reload();
        }
    }
);


const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettings: (state, action: PayloadAction<AppSettings>) => {
            state.settings = action.payload;
        },
        setSetting: (state, action: PayloadAction<{ path: string, value: any }>) => {
            const { path, value } = action.payload;
            const keys = path.split('.');
            let currentLevel: any = state.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = value;
        },
    }
});

export const { setSetting, setSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
