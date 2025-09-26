import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SettingsSlice, createSettingsSlice, defaultSettings } from './slices/settingsSlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { StrainsViewSlice, createStrainsViewSlice } from './slices/strainsViewSlice';
import { AiSlice, createAiSlice } from './slices/aiSlice';
import { PlantSlice, createPlantSlice } from './slices/plantSlice';
import { UserStrainsSlice, createUserStrainsSlice } from './slices/userStrainsSlice';
import { FavoritesSlice, createFavoritesSlice } from './slices/favoritesSlice';
import { NotesSlice, createNotesSlice } from './slices/notesSlice';
import { SavedItemsSlice, createSavedItemsSlice } from './slices/savedItemsSlice';
import { ArchivesSlice, createArchivesSlice } from './slices/archivesSlice';
import { KnowledgeSlice, createKnowledgeSlice } from './slices/knowledgeSlice';
import { TTSSlice, createTtsSlice } from './slices/ttsSlice';
import { SimulationSlice, createSimulationSlice } from './slices/simulationSlice';
import { View, AppSettings } from '@/types';
import { indexedDBStorage } from './indexedDBStorage';

export type TFunction = (key: string, params?: Record<string, any>) => string;
let t: TFunction = (key: string) => key;
const getT = () => t;

export type AppState = SettingsSlice & UISlice & StrainsViewSlice & AiSlice & PlantSlice & UserStrainsSlice & FavoritesSlice & NotesSlice & SavedItemsSlice & ArchivesSlice & KnowledgeSlice & TTSSlice & SimulationSlice & AppSlice;
export type StoreSet = (partial: AppState | Partial<AppState> | ((state: AppState) => AppState | Partial<AppState> | void), replace?: boolean | undefined) => void;
export type StoreGet = () => AppState;

interface AppSlice {
    init: (newT: TFunction) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        init: (newT: TFunction) => { t = newT; },
        ...createSettingsSlice(set),
        ...createUISlice(set, get, getT),
        ...createStrainsViewSlice(set, get),
        ...createAiSlice(set, get, getT),
        ...createPlantSlice(set, get, getT),
        ...createUserStrainsSlice(set, get),
        ...createFavoritesSlice(set),
        ...createNotesSlice(set),
        ...createSavedItemsSlice(set),
        ...createArchivesSlice(set, get),
        ...createKnowledgeSlice(set),
        ...createTtsSlice(set, get),
        ...createSimulationSlice(set, get),
      })),
      {
        name: 'cannaguide-2025-storage',
        storage: createJSONStorage(() => indexedDBStorage, {
          replacer: (key, value) => {
            if (value instanceof Set) {
              return {
                _type: 'set',
                value: Array.from(value),
              };
            }
            return value;
          },
          reviver: (key, value) => {
            if (value && typeof value === 'object' && (value as any)._type === 'set') {
              return new Set((value as any).value);
            }
            return value;
          },
        }),
        partialize: (state) => ({
          // Persist settings
          settings: state.settings,
          // Persist core user data
          plants: state.plants,
          plantSlots: state.plantSlots,
          userStrains: state.userStrains,
          favoriteIds: state.favoriteIds,
          strainNotes: state.strainNotes,
          savedExports: state.savedExports,
          savedSetups: state.savedSetups,
          archivedMentorResponses: state.archivedMentorResponses,
          archivedAdvisorResponses: state.archivedAdvisorResponses,
          savedStrainTips: state.savedStrainTips,
          knowledgeProgress: state.knowledgeProgress,
          // Persist some UI state for better UX on reload
          activeView: state.activeView,
          strainsViewTab: state.strainsViewTab,
          strainsViewMode: state.strainsViewMode,
          // Persist for offline catch-up logic
          lastActiveTimestamp: state.lastActiveTimestamp,
        }),
        merge: (persistedState, currentState) => {
            const typedPersistedState = persistedState as Partial<AppState>;
            const mergedState = { ...currentState, ...typedPersistedState };

            // Deep merge settings to ensure new default properties are included for existing users
            if (typedPersistedState.settings) {
                mergedState.settings = {
                    ...defaultSettings,
                    ...typedPersistedState.settings,
                    accessibility: { ...defaultSettings.accessibility, ...(typedPersistedState.settings.accessibility || {}) },
                    strainsViewSettings: { ...defaultSettings.strainsViewSettings, ...(typedPersistedState.settings.strainsViewSettings || {}) },
                    notificationSettings: { ...defaultSettings.notificationSettings, ...(typedPersistedState.settings.notificationSettings || {}) },
                    simulationSettings: { 
                        ...defaultSettings.simulationSettings, 
                        ...(typedPersistedState.settings.simulationSettings || {}),
                        autoJournaling: { 
                            ...defaultSettings.simulationSettings.autoJournaling, 
                            ...(typedPersistedState.settings.simulationSettings?.autoJournaling || {})
                        },
                        customDifficultyModifiers: {
                            ...defaultSettings.simulationSettings.customDifficultyModifiers,
                            ...(typedPersistedState.settings.simulationSettings?.customDifficultyModifiers || {})
                        }
                    },
                    defaultJournalNotes: { ...defaultSettings.defaultJournalNotes, ...(typedPersistedState.settings.defaultJournalNotes || {}) },
                    defaultExportSettings: { ...defaultSettings.defaultExportSettings, ...(typedPersistedState.settings.defaultExportSettings || {}) },
                    quietHours: { ...defaultSettings.quietHours, ...(typedPersistedState.settings.quietHours || {}) },
                    tts: { ...defaultSettings.tts, ...(typedPersistedState.settings.tts || {}) },
                };
            }

            // Ensure activeView has a valid value after hydration
            if (!mergedState.activeView && mergedState.settings) {
                mergedState.activeView = mergedState.settings.defaultView;
            }

            return mergedState as AppState;
        },
      }
    ),
    { name: "CannaGuide2025Store" }
  )
);