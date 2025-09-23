import { AppState } from './useAppStore';
import { Plant, Strain, View } from '@/types';

// UI Selectors
export const selectActiveView = (state: AppState): View => state.activeView;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectIsCommandPaletteOpen = (state: AppState) => state.isCommandPaletteOpen;
export const selectSelectedPlantId = (state: AppState) => state.selectedPlantId;

// Settings Selectors
export const selectSettings = (state: AppState) => state.settings;
export const selectLanguage = (state: AppState) => state.settings.language;
export const selectStrainsViewSettings = (state: AppState) => state.settings.strainsViewSettings;

// Data Selectors
export const selectPlantsRecord = (state: AppState) => state.plants;
export const selectPlantSlots = (state: AppState) => state.plantSlots;
export const selectUserStrains = (state: AppState) => state.userStrains;
export const selectSavedExports = (state: AppState) => state.savedExports;
export const selectSavedSetups = (state: AppState) => state.savedSetups;
export const selectArchivedMentorResponses = (state: AppState) => state.archivedMentorResponses;
export const selectArchivedAdvisorResponses = (state: AppState) => state.archivedAdvisorResponses;
export const selectSavedStrainTips = (state: AppState) => state.savedStrainTips;
export const selectKnowledgeProgress = (state: AppState) => state.knowledgeProgress;

// User Selectors
export const selectFavoriteIds = (state: AppState) => state.favoriteIds;
export const selectStrainNotes = (state: AppState) => state.strainNotes;

// Derived / Memoized Selectors
export const selectActivePlants = (state: AppState): Plant[] => Object.values(state.plants);

export const selectHasAvailableSlots = (state: AppState): boolean => state.plantSlots.some(p => p === null);

export const selectPlantById = (id: string | null) => (state: AppState): Plant | null => {
    if (!id) return null;
    return state.plants[id] || null;
};
