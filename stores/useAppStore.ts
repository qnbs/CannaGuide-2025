import { create } from 'zustand';
import { devtools, persist, PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AppState } from '../types';
import { indexedDBStorage } from './indexedDBStorage';

import { createAiSlice } from './slices/aiSlice';
import { createArchivesSlice } from './slices/archivesSlice';
import { createFavoritesSlice } from './slices/favoritesSlice';
import { createKnowledgeSlice } from './slices/knowledgeSlice';
import { createNotesSlice } from './slices/notesSlice';
import { createPlantSlice } from './slices/plantSlice';
import { createSavedItemsSlice } from './slices/savedItemsSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createStrainsViewSlice } from './slices/strainsViewSlice';
import { createTtsSlice } from './slices/ttsSlice';
import { createUISlice } from './slices/uiSlice';
import { createUserStrainsSlice } from './slices/userStrainsSlice';
import { createSimulationSlice } from './slices/simulationSlice';
import { createBreedingSlice } from './slices/breedingSlice';

export type StoreSet = (fn: (state: AppState) => void) => void;
export type StoreGet = () => AppState;

type AppStateForPersistence = Omit<AppState, any>;


const persistOptions: PersistOptions<AppState, AppStateForPersistence> = {
    name: 'cannaguide-2025-storage',
    storage: indexedDBStorage,
    partialize: (state) => ({
        settings: state.settings,
        plants: state.plants,
        plantSlots: state.plantSlots,
        userStrains: state.userStrains,
        favoriteIds: Array.from(state.favoriteIds),
        selectedStrainIds: Array.from(state.selectedStrainIds),
        strainNotes: state.strainNotes,
        savedExports: state.savedExports,
        savedSetups: state.savedSetups,
        archivedMentorResponses: state.archivedMentorResponses,
        archivedAdvisorResponses: state.archivedAdvisorResponses,
        savedStrainTips: state.savedStrainTips,
        knowledgeProgress: state.knowledgeProgress,
        onboardingStep: state.onboardingStep,
        lastActiveTimestamp: state.lastActiveTimestamp,
        collectedSeeds: state.collectedSeeds,
    }),
    onRehydrateStorage: () => (state) => {
        if (state) {
            state.favoriteIds = new Set(state.favoriteIds as any);
            state.selectedStrainIds = new Set(state.selectedStrainIds as any);
        }
    },
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...createAiSlice(set, get),
        ...createArchivesSlice(set, get),
        ...createFavoritesSlice(set),
        ...createKnowledgeSlice(set),
        ...createNotesSlice(set),
        ...createPlantSlice(set, get),
        ...createSavedItemsSlice(set),
        ...createSettingsSlice(set),
        ...createStrainsViewSlice(set, get),
        ...createTtsSlice(set, get),
        ...createUISlice(set, get),
        ...createUserStrainsSlice(set, get),
        ...createSimulationSlice(set, get),
        ...createBreedingSlice(set, get),
      })),
      persistOptions
    )
  )
);
