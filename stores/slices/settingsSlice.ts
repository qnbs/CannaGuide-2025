import { AppSettings, View, Language, Theme, SortKey, SortDirection, ExportSource, ExportFormat, UiDensity } from '@/types';
import { AppState, StoreSet } from '@/stores/useAppStore';

const detectedLang = navigator.language.split('-')[0];
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en';

export const defaultSettings: AppSettings = {
  fontSize: 'base', language: initialLang, theme: 'midnight', defaultView: View.Plants,
  strainsViewSettings: { defaultSortKey: 'name', defaultSortDirection: 'asc', defaultViewMode: 'list', visibleColumns: { type: true, thc: true, cbd: true, floweringTime: true, yield: true, difficulty: true }},
  notificationsEnabled: true, notificationSettings: { stageChange: true, problemDetected: true, harvestReady: true, newTask: true }, onboardingCompleted: false,
  simulationSettings: { speed: '1x', difficulty: 'normal', autoAdvance: true, autoJournaling: { stageChanges: true, problems: true, tasks: true }, customDifficultyModifiers: { pestPressure: 1.0, nutrientSensitivity: 1.0, environmentalStability: 1.0 }},
  defaultGrowSetup: { lightType: 'LED', potSize: 10, medium: 'Soil', temperature: 24, humidity: 60, lightHours: 18 },
  defaultJournalNotes: { watering: 'plantsView.actionModals.defaultNotes.watering', feeding: 'plantsView.actionModals.defaultNotes.feeding' },
  defaultExportSettings: { source: 'filtered', format: 'pdf' }, lastBackupTimestamp: undefined,
  accessibility: { reducedMotion: false, dyslexiaFont: false }, uiDensity: 'comfortable',
  quietHours: { enabled: false, start: '22:00', end: '08:00' },
};

export interface SettingsSlice {
    settings: AppSettings;
    setSetting: (path: string, value: any) => void;
}

export const createSettingsSlice = (set: StoreSet): SettingsSlice => ({
    settings: defaultSettings,
    setSetting: (path, value) => {
        set((state: AppState) => {
            const keys = path.split('.');
            let currentLevel: any = state.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = value;
        });
    },
});