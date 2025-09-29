import { createSelector } from 'reselect';
import { RootState } from './store';
import { Plant, ArchivedAdvisorResponse, Experiment } from '../types';

// --- Base Selectors (for each slice) ---
const selectUi = (state: RootState) => state.ui;
const selectSettingsState = (state: RootState) => state.settings;
// FIX: Export selectSavedItems to be used in useStorageEstimate hook.
export const selectSavedItems = (state: RootState) => state.savedItems;
const selectUserStrainsState = (state: RootState) => state.userStrains;
const selectFavoritesState = (state: RootState) => state.favorites;
const selectAi = (state: RootState) => state.ai;
// FIX: Export selectArchives to be used in useStorageEstimate hook.
export const selectArchives = (state: RootState) => state.archives;
const selectTts = (state: RootState) => state.tts;
// FIX: Export selectSimulation to be used in useStorageEstimate hook.
export const selectSimulation = (state: RootState) => state.simulation;
const selectStrainsView = (state: RootState) => state.strainsView;
const selectKnowledge = (state: RootState) => state.knowledge;
const selectBreeding = (state: RootState) => state.breeding;
const selectSandbox = (state: RootState) => state.sandbox;

// --- UI Selectors ---
export { selectUi };
export const selectActiveView = createSelector([selectUi], (ui) => ui.activeView);
export const selectIsCommandPaletteOpen = createSelector([selectUi], (ui) => ui.isCommandPaletteOpen);
export const selectHighlightedElement = createSelector([selectUi], (ui) => ui.highlightedElement);
export const selectNotifications = createSelector([selectUi], (ui) => ui.notifications);
export const selectOnboardingStep = createSelector([selectUi], (ui) => ui.onboardingStep);
export const selectActionModalState = createSelector([selectUi], (ui) => ui.actionModal);
export const selectDeepDiveModalState = createSelector([selectUi], (ui) => ui.deepDiveModal);

// --- Settings Selectors ---
export const selectSettings = createSelector([selectSettingsState], (settingsState) => settingsState.settings);
export const selectLanguage = createSelector([selectSettings], (settings) => settings.language);

// --- Saved Items Selectors ---
export const selectSavedSetups = createSelector([selectSavedItems], (savedItems) => savedItems.savedSetups);
export const selectSavedExports = createSelector([selectSavedItems], (savedItems) => savedItems.savedExports);
export const selectSavedStrainTips = createSelector([selectSavedItems], (savedItems) => savedItems.savedStrainTips);

// --- User Strains & Favorites Selectors ---
export const selectUserStrains = createSelector([selectUserStrainsState], (userStrains) => userStrains.userStrains);
export const selectUserStrainIds = createSelector(
  [selectUserStrains],
  (userStrains) => new Set(userStrains.map(s => s.id))
);
export const selectFavoriteIds = createSelector(
    [selectFavoritesState],
    (favorites) => new Set(favorites.favoriteIds)
);

// --- AI Selectors ---
export const selectEquipmentGenerationState = createSelector([selectAi], (ai) => ai.equipmentGeneration);
export const selectDiagnosticsState = createSelector([selectAi], (ai) => ai.diagnostics);
export const selectProactiveDiagnosisState = createSelector([selectAi], (ai) => ai.proactiveDiagnosis);

const emptyAdvisorState = { isLoading: false, response: null, error: null };
export const selectAdvisorStateForPlant = (plantId: string) => createSelector(
  [selectAi],
  (ai) => ai.advisorChats[plantId] || emptyAdvisorState
);

const emptyStrainTipState = { isLoading: false, response: null, error: null };
export const selectStrainTipState = (strainId: string) => createSelector(
  [selectAi],
  (ai) => ai.strainTips[strainId] || emptyStrainTipState
);

const emptyDeepDiveState = { isLoading: false, response: null, error: null };
export const selectDeepDiveState = (plantId: string, topic: string) => createSelector(
    [selectAi],
    (ai) => {
        const key = `${plantId}-${topic}`;
        return ai.deepDives[key] || emptyDeepDiveState;
    }
);

// --- Archives Selectors ---
export const selectArchivedMentorResponses = createSelector([selectArchives], (archives) => archives.archivedMentorResponses);
const selectAllArchivedAdvisorResponses = createSelector([selectArchives], (archives) => archives.archivedAdvisorResponses);

const emptyArchivedAdvisorResponses: ArchivedAdvisorResponse[] = []; // Stable reference
export const selectArchivedAdvisorResponsesForPlant = (plantId: string) => createSelector(
  [selectAllArchivedAdvisorResponses],
  (archives) => archives[plantId] || emptyArchivedAdvisorResponses
);
export const selectArchivedAdvisorResponses = selectAllArchivedAdvisorResponses;

// --- TTS Selectors ---
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
const selectPlants = createSelector([selectSimulation], (sim) => sim.plants);
export const selectPlantSlots = createSelector([selectSimulation], (sim) => sim.plantSlots);

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
export { selectStrainsView };
export const selectActiveStrainViewTab = createSelector([selectStrainsView], (view) => view.strainsViewTab);
export const selectStrainsViewMode = createSelector([selectStrainsView], (view) => view.strainsViewMode);
export const selectSelectedStrainIds = createSelector(
    [selectStrainsView],
    (view) => new Set(view.selectedStrainIds)
);

// --- Knowledge & Breeding Selectors ---
export const selectKnowledgeProgress = createSelector([selectKnowledge], (k) => k.knowledgeProgress);
export const selectCollectedSeeds = createSelector([selectBreeding], (b) => b.collectedSeeds);
export const selectBreedingSlots = createSelector([selectBreeding], b => b.breedingSlots);

// --- Sandbox Selector ---
export const selectSandboxState = createSelector([selectSandbox], (s) => s);
export const selectSavedExperiments = createSelector([selectSandboxState], (s) => s.savedExperiments);