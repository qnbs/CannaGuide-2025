
import { createSelector } from 'reselect';
import { RootState } from './store';
import { Plant, ArchivedAdvisorResponse } from '../types';

// --- UI Selectors ---
export const selectUi = (state: RootState) => state.ui;
export const selectActiveView = createSelector([selectUi], (ui) => ui.activeView);
export const selectIsCommandPaletteOpen = createSelector([selectUi], (ui) => ui.isCommandPaletteOpen);
export const selectHighlightedElement = createSelector([selectUi], (ui) => ui.highlightedElement);
export const selectNotifications = createSelector([selectUi], (ui) => ui.notifications);
export const selectOnboardingStep = createSelector([selectUi], (ui) => ui.onboardingStep);
export const selectActionModalState = createSelector([selectUi], (ui) => ui.actionModal);
export const selectDeepDiveModalState = createSelector([selectUi], (ui) => ui.deepDiveModal);

// --- Settings Selectors ---
export const selectSettings = (state: RootState) => state.settings.settings;
export const selectLanguage = (state: RootState) => state.settings.settings.language;

// --- Saved Items Selectors ---
export const selectSavedItems = (state: RootState) => state.savedItems;
export const selectSavedSetups = createSelector([selectSavedItems], (savedItems) => savedItems.savedSetups);
export const selectSavedExports = createSelector([selectSavedItems], (savedItems) => savedItems.savedExports);
export const selectSavedStrainTips = createSelector([selectSavedItems], (savedItems) => savedItems.savedStrainTips);

// --- User Strains & Favorites Selectors ---
const selectUserStrainsState = (state: RootState) => state.userStrains;
export const selectUserStrains = createSelector([selectUserStrainsState], (userStrains) => userStrains.userStrains);

export const selectUserStrainIds = createSelector(
  [selectUserStrains],
  (userStrains) => new Set(userStrains.map(s => s.id))
);

const selectFavoritesState = (state: RootState) => state.favorites;
export const selectFavoriteIds = createSelector(
    [selectFavoritesState],
    (favorites) => new Set(favorites.favoriteIds)
);

// --- AI Selectors ---
const selectAi = (state: RootState) => state.ai;
export const selectEquipmentGenerationState = createSelector([selectAi], (ai) => ai.equipmentGeneration);
export const selectDiagnosticsState = createSelector([selectAi], (ai) => ai.diagnostics);
export const selectProactiveDiagnosisState = (state: RootState) => state.ai.proactiveDiagnosis;

export const selectAdvisorStateForPlant = (plantId: string) => createSelector(
  [selectAi],
  (ai) => ai.advisorChats[plantId] || { isLoading: false, response: null, error: null }
);

export const selectStrainTipState = (strainId: string) => createSelector(
  [selectAi],
  (ai) => ai.strainTips[strainId] || { isLoading: false, response: null, error: null }
);
export const selectDeepDiveState = (plantId: string, topic: string) => createSelector(
    [selectAi],
    (ai) => {
        const key = `${plantId}-${topic}`;
        return ai.deepDives[key] || { isLoading: false, response: null, error: null };
    }
);

// --- Archives Selectors ---
const selectArchives = (state: RootState) => state.archives;
export const selectArchivedMentorResponses = createSelector([selectArchives], (archives) => archives.archivedMentorResponses);
export const selectArchivedAdvisorResponses = createSelector([selectArchives], (archives) => archives.archivedAdvisorResponses);

export const selectArchivedAdvisorResponsesForPlant = (plantId: string) => createSelector(
  [selectArchivedAdvisorResponses],
  (archives) => archives[plantId] || []
);

// --- TTS Selectors ---
const selectTts = (state: RootState) => state.tts;
export const selectTtsState = createSelector(
    [selectTts],
    (tts) => ({
        isTtsSpeaking: tts.isTtsSpeaking,
        isTtsPaused: tts.isTtsPaused,
        ttsQueue: tts.ttsQueue,
    })
);
export const selectCurrentlySpeakingId = createSelector([selectTts], (tts) => tts.currentlySpeakingId);

// --- Plant Simulation Selectors ---
const selectSimulation = (state: RootState) => state.simulation;
const selectPlants = createSelector([selectSimulation], (sim) => sim.plants);
const selectPlantSlotsState = createSelector([selectSimulation], (sim) => sim.plantSlots);

export const selectPlantSlots = createSelector([selectPlantSlotsState], (slots) => slots);

export const selectActivePlants = createSelector(
  [selectPlantSlots, selectPlants],
  (slots, plants) => slots
    .filter((id): id is string => id !== null)
    .map(id => plants[id])
    .filter((p): p is Plant => p !== undefined)
);

export const selectHasAvailableSlots = createSelector(
  [selectPlantSlots],
  (slots) => slots.some(s => s === null)
);

export const selectSelectedPlantId = createSelector([selectSimulation], (sim) => sim.selectedPlantId);

export const selectPlantById = (id: string | null) => createSelector(
  [selectPlants],
  (plants) => (id ? plants[id] : null)
);

export const selectOpenTasksSummary = createSelector(
  [selectActivePlants],
  (activePlants) => activePlants
    .flatMap(p => p.tasks.filter(t => !t.isCompleted).map(t => ({ ...t, plantId: p.id, plantName: p.name })))
);

export const selectActiveProblemsSummary = createSelector(
  [selectActivePlants],
  (activePlants) => activePlants
    .flatMap(p => p.problems.filter(prob => prob.status === 'active').map(prob => ({ ...prob, plantId: p.id, plantName: p.name })))
);

export const selectGardenHealthMetrics = createSelector(
  [selectActivePlants],
  (activePlants) => {
    const activePlantsCount = activePlants.length;
    if (activePlantsCount === 0) {
      return { gardenHealth: 100, activePlantsCount: 0, avgTemp: 22, avgHumidity: 55 };
    }
    const totalHealth = activePlants.reduce((sum, p) => sum + p.health, 0);
    const totalTemp = activePlants.reduce((sum, p) => sum + p.environment.internalTemperature, 0);
    const totalHumidity = activePlants.reduce((sum, p) => sum + p.environment.internalHumidity, 0);
    return {
      gardenHealth: totalHealth / activePlantsCount,
      activePlantsCount,
      avgTemp: totalTemp / activePlantsCount,
      avgHumidity: totalHumidity / activePlantsCount,
    };
  }
);

// --- Strains View Selectors ---
export const selectStrainsView = (state: RootState) => state.strainsView;
export const selectActiveStrainViewTab = createSelector([selectStrainsView], (view) => view.strainsViewTab);
export const selectStrainsViewMode = createSelector([selectStrainsView], (view) => view.strainsViewMode);
export const selectSelectedStrainIds = createSelector(
    [selectStrainsView],
    (view) => new Set(view.selectedStrainIds) // Memoize the creation of the Set for performance
);

// --- Knowledge Selectors ---
export const selectKnowledge = (state: RootState) => state.knowledge;
export const selectKnowledgeProgress = createSelector([selectKnowledge], (k) => k.knowledgeProgress);

// --- Breeding Selectors ---
export const selectBreeding = (state: RootState) => state.breeding;
export const selectCollectedSeeds = createSelector([selectBreeding], (b) => b.collectedSeeds);
