import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SettingsSlice, createSettingsSlice, defaultSettings } from './slices/settingsSlice';
import { DataSlice, createDataSlice } from './slices/dataSlice';
import { UserSlice, createUserSlice } from './slices/userSlice';
import { UISlice, createUISlice } from './slices/uiSlice';

export type TFunction = (key: string, params?: Record<string, any>) => string;
let t: TFunction = (key: string) => key;
const getT = () => t;

export type AppState = SettingsSlice & DataSlice & UserSlice & UISlice & AppSlice;
// FIX: The StoreSet type was too restrictive for use with the immer middleware.
// The updater function passed to `set` with immer can return `void` after mutating the draft state.
// Added `| void` to the return type of the updater function to align with immer's behavior
// and resolve TypeScript errors across all store slices.
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
        ...createUserSlice(set, get),
        ...createDataSlice(set, get, getT),
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
          favoriteIds: Array.from(state.favoriteIds), // Convert Set to Array for JSON serialization
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
            // Restore Set from persisted Array
            state.favoriteIds = new Set(state.favoriteIds as unknown as string[]);
            
            // Set default view from potentially updated settings
            state.activeView = state.settings?.defaultView || defaultSettings.defaultView;

            // Gracefully merge persisted settings with defaults to handle new settings in updates
            state.settings = {
                ...defaultSettings,
                ...state.settings,
                accessibility: { ...defaultSettings.accessibility, ...state.settings.accessibility },
                strainsViewSettings: { ...defaultSettings.strainsViewSettings, ...state.settings.strainsViewSettings },
                simulationSettings: { ...defaultSettings.simulationSettings, ...state.settings.simulationSettings },
            };
          }
        },
      }
    ),
    { name: "CannaGuide2025Store" }
  )
);