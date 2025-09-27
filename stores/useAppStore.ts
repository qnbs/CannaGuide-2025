import create from 'zustand';
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
// FIX: Corrected typo from createTTSSlice to createTtsSlice.
import { createTtsSlice } from './slices/ttsSlice';
import { createUISlice } from './slices/uiSlice';
import { createUserStrainsSlice } from './slices/userStrainsSlice';
import { createSimulationSlice } from './slices/simulationSlice';
import { createBreedingSlice } from './slices/breedingSlice';

export type StoreSet = (fn: (state: AppState) => void) => void;
export type StoreGet = () => AppState;

type AppStateForPersistence = Omit<AppState,
  | 'setActiveView' | 'setIsCommandPaletteOpen' | 'addNotification' | 'removeNotification' | 'openAddModal' | 'closeAddModal' | 'openExportModal' | 'closeExportModal' | 'startEquipmentGeneration' | 'resetEquipmentGenerationState' | 'startDiagnostics' | 'startAdvisorGeneration' | 'startPlantMentorChat' | 'clearMentorChat' | 'startStrainTipGeneration' | 'startDeepDiveGeneration' | 'toggleFavorite' | 'addMultipleToFavorites' | 'removeMultipleFromFavorites' | 'toggleKnowledgeProgressItem' | 'updateNoteForStrain' | 'startNewPlant' | 'deletePlant' | 'waterPlant' | 'waterAllPlants' | 'addJournalEntry' | 'completeTask' | 'setSelectedPlantId' | 'advanceDay' | 'addExport' | 'updateExport' | 'deleteExport' | 'addSetup' | 'updateSetup' | 'deleteSetup' | 'setSetting' | 'setStrainsViewTab' | 'setStrainsViewMode' | 'toggleStrainSelection' | 'toggleAllStrainSelection' | 'clearStrainSelection' | 'addToTtsQueue' | 'playTts' | 'pauseTts' | 'stopTts' | 'nextTts' | 'clearTtsQueue' | '_startNextInQueue' | '_setCurrentlySpeakingId' | 'initiateGrowFromStrainList' | 'startGrowInSlot' | 'selectStrainForGrow' | 'confirmSetupAndShowConfirmation' | 'cancelNewGrow' | 'finalizeNewGrow' | 'setActiveMentorPlantId' | 'setAppReady' | 'setOnboardingStep' | 'isUserStrain' | 'addUserStrain' | 'updateUserStrain' | 'deleteUserStrain' | 'setIsCatchingUp' | 'setIsInitialized' | 'setLastActiveTimestamp' | 'addSeed' | 'breedStrains' | 'topPlant' | 'applyLst' | 'applyPestControl' | 'addAmendment' | 'advanceMultipleDays' | 'startProactiveDiagnosis' | 'harvestPlant' | 'processPostHarvest' | 'allStrains'
  // Also omit nested functions if any
>;


const persistOptions: PersistOptions<AppState, AppStateForPersistence> = {
    name: 'cannaguide-2025-storage',
    storage: indexedDBStorage,
    partialize: (state) => ({
        settings: state.settings,
        plants: state.plants,
        plantSlots: state.plantSlots,
        userStrains: state.userStrains,
        favoriteIds: state.favoriteIds,
        selectedStrainIds: state.selectedStrainIds,
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
            state.favoriteIds = new Set(state.favoriteIds);
            state.selectedStrainIds = new Set(state.selectedStrainIds);
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

// FIX: Export AppState type so other modules can import it.
export type { AppState };