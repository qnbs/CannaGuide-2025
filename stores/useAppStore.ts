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
import { View } from '@/types';

export type TFunction = (key: string, params?: Record<string, any>) => string;
let t: TFunction = (key: string) => key;
const getT = () => t;

export type AppState = SettingsSlice & UISlice & StrainsViewSlice & AiSlice & PlantSlice & UserStrainsSlice & FavoritesSlice & NotesSlice & SavedItemsSlice & ArchivesSlice & KnowledgeSlice & TTSSlice & AppSlice;
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
        ...createUISlice(set, get),
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
      })),
      {
        name: 'cannaguide-2025-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist only the data that should survive a page refresh
          settings: state.settings,
          plants: state.plants,
          plantSlots: state.plantSlots,
          userStrains: state.userStrains,
          favoriteIds: Array.from(state.favoriteIds),
          strainNotes: state.strainNotes,
          savedExports: state.savedExports,
          savedSetups: state.savedSetups,
          archivedMentorResponses: state.archivedMentorResponses,
          archivedAdvisorResponses: state.archivedAdvisorResponses,
          savedStrainTips: state.savedStrainTips,
          knowledgeProgress: state.knowledgeProgress,
          strainsViewTab: state.strainsViewTab,
          strainsViewMode: state.strainsViewMode,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.favoriteIds = new Set(state.favoriteIds as unknown as string[]);
            
            const rehydratedSettings = state.settings || {};
            
            // Perform a safe, deep merge to prevent crashes from new settings properties
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
                        ...rehydratedSettings.simulationSettings?.autoJournaling 
                    }
                },
                defaultJournalNotes: { ...defaultSettings.defaultJournalNotes, ...rehydratedSettings.defaultJournalNotes },
                defaultExportSettings: { ...defaultSettings.defaultExportSettings, ...rehydratedSettings.defaultExportSettings },
                quietHours: { ...defaultSettings.quietHours, ...rehydratedSettings.quietHours },
                tts: { ...defaultSettings.tts, ...rehydratedSettings.tts },
            };
            
            state.activeView = state.settings.defaultView;
            state.strainsViewMode = state.settings.strainsViewSettings.defaultViewMode;
          }
        },
      }
    ),
    { name: "CannaGuide2025Store" }
  )
);
