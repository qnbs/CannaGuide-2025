import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SettingsSlice, createSettingsSlice, defaultSettings } from './slices/settingsSlice';
import { DataSlice, createDataSlice } from './slices/dataSlice';
import { UserSlice, createUserSlice } from './slices/userSlice';
import { UISlice, createUISlice } from './slices/uiSlice';

export type TFunction = (key: string, params?: Record<string, any>) => string;
let t: TFunction = (key: string) => key;
const getT = () => t;

export type AppState = SettingsSlice & DataSlice & UserSlice & UISlice & AppSlice;
export type StoreSet = (partial: AppState | Partial<AppState> | ((state: AppState) => AppState | Partial<AppState>), replace?: boolean | undefined) => void;
export type StoreGet = () => AppState;

interface AppSlice {
    init: (newT: TFunction) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      init: (newT: TFunction) => { t = newT; },
      ...createSettingsSlice(set),
      ...createUISlice(set, get, getT),
      ...createUserSlice(set, get),
      ...createDataSlice(set, get, getT),
    }),
    {
      name: 'cannaguide-2025-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.favoriteIds = new Set(state.favoriteIds as unknown as string[]);
            state.activeView = state.settings?.defaultView || defaultSettings.defaultView;
            // Ensure plants object is not undefined on first load
            state.plants = state.plants || {};
        }
      },
    }
  )
);
