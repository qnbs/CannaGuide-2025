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
        // FIX: The createAiSlice function expects a function that returns TFunction, not TFunction directly.
        ...createAiSlice(set, get, getT),
        // FIX: The createPlantSlice function expects a function that returns TFunction, not TFunction directly.
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
              return Array.from(value);
            }
            return value;
          },
        }),
        partialize: (state) => ({
          settings: state.settings,
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
          strainsViewTab: state.strainsViewTab,
          strainsViewMode: state.strainsViewMode,
          activeView: state.activeView,
          activeMentorPlantId: state.activeMentorPlantId,
          lastActiveTimestamp: state.lastActiveTimestamp,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            const rehydratedSettings: Partial<AppSettings> = state.settings || {};
            
            state.settings = {
                ...defaultSettings,
                ...rehydratedSettings,
                accessibility: { ...defaultSettings.accessibility, ...rehydratedSettings.accessibility },
                strainsViewSettings: { ...defaultSettings.strainsViewSettings, ...rehydratedSettings.strainsViewSettings },
                notificationSettings: { ...defaultSettings.notificationSettings, ...rehydratedSettings.notificationSettings },
                simulationSettings: { 
                    ...defaultSettings.simulationSettings, 
                    ...rehydratedSettings.simulationSettings, 
                    autoJournaling: { 
                        ...defaultSettings.simulationSettings.autoJournaling, 
                        ...(rehydratedSettings.simulationSettings?.autoJournaling || {})
                    },
                    customDifficultyModifiers: {
                        ...defaultSettings.simulationSettings.customDifficultyModifiers,
                        ...(rehydratedSettings.simulationSettings?.customDifficultyModifiers || {})
                    }
                },
                defaultJournalNotes: { ...defaultSettings.defaultJournalNotes, ...rehydratedSettings.defaultJournalNotes },
                defaultExportSettings: { ...defaultSettings.defaultExportSettings, ...rehydratedSettings.defaultExportSettings },
                quietHours: { ...defaultSettings.quietHours, ...rehydratedSettings.quietHours },
                tts: { ...defaultSettings.tts, ...rehydratedSettings.tts },
            };
            
            if (state.favoriteIds && Array.isArray(state.favoriteIds)) {
              state.favoriteIds = new Set(state.favoriteIds);
            }
            
            if (!state.activeView) {
                state.activeView = state.settings.defaultView;
            }
          }
        },
      }
    ),
    { name: "CannaGuide2025Store" }
  )
);