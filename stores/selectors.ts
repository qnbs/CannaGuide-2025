import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store';
// FIX: Removed 'Experiment' from this import as it is not exported from '@/types', causing an error.
import { Plant, ArchivedAdvisorResponse, SimulationState, AppSettings, Task, PlantProblem, Notification, Strain, SavedExport, SavedSetup, SavedStrainTip, View } from '@/types';
import { SavedItemsState } from './slices/savedItemsSlice';
// FIX: Import state types from their respective slice files.
import { UIState } from './slices/uiSlice';
import { FavoritesState } from './slices/favoritesSlice';
import { ArchivesState } from './slices/archivesSlice';
import { TtsState } from './slices/ttsSlice';
import { StrainsViewState } from './slices/strainsViewSlice';
import { SandboxState } from '@/types';

// --- Base Selectors (for each slice) ---
export const selectUi = (state: RootState) => state.ui;
const selectSettingsState = (state: RootState) => state.settings;
export const selectSavedItems = (state: RootState) => state.savedItems;
const selectUserStrainsState = (state: RootState) => state.userStrains;
const selectFavoritesState = (state: RootState) => state.favorites;
export const selectArchives = (state: RootState) => state.archives;
const selectTts = (state: RootState) => state.tts;
export const selectSimulation = (state: RootState) => state.simulation;
export const selectStrainsView = (state: RootState) => state.strainsView;
const selectKnowledge = (state: RootState) => state.knowledge;
const selectBreeding = (state: RootState) => state.breeding;
const selectSandbox = (state: RootState) => state.sandbox;
const selectGenealogy = (state: RootState) => state.genealogy;
export const selectNavigation = (state: RootState) => state.navigation; // New selector for navigation state

// --- Adapter Selectors ---
import { userStrainsAdapter } from './slices/userStrainsSlice';
import { savedExportsAdapter, savedSetupsAdapter, savedStrainTipsAdapter } from './slices/savedItemsSlice';
import { plantsAdapter } from './slices/simulationSlice';

// --- UI Selectors ---
export const selectActiveView = createSelector([selectUi], (ui: UIState): View => ui.activeView);
export const selectIsCommandPaletteOpen = createSelector([selectUi], (ui: UIState): boolean => ui.isCommandPaletteOpen);
export const selectHighlightedElement = createSelector([selectUi], (ui: UIState): string | null => ui.highlightedElement);
export const selectNotifications = createSelector([selectUi], (ui: UIState): Notification[] => ui.notifications);
export const selectOnboardingStep = createSelector([selectUi], (ui: UIState): number => ui.onboardingStep);
export const selectActionModalState = createSelector([selectUi], (ui: UIState) => ui.actionModal);
export const selectDeepDiveModalState = createSelector([selectUi], (ui: UIState) => ui.deepDiveModal);

// --- Settings Selectors ---
export const selectSettings = createSelector([selectSettingsState], (settingsState): AppSettings => settingsState.settings);
export const selectLanguage = createSelector([selectSettings], (settings: AppSettings) => settings.language);
export const selectIsExpertMode = createSelector([selectSettings], (settings: AppSettings): boolean => settings.isExpertMode);

// --- Saved Items Selectors ---
export const { selectAll: selectSavedExports } = savedExportsAdapter.getSelectors<RootState>(state => state.savedItems.savedExports);
export const { selectAll: selectSavedSetups } = savedSetupsAdapter.getSelectors<RootState>(state => state.savedItems.savedSetups);
export const { selectAll: selectSavedStrainTips } = savedStrainTipsAdapter.getSelectors<RootState>(state => state.savedItems.savedStrainTips);

// --- User Strains & Favorites Selectors ---
export const { selectAll: selectUserStrains, selectIds: selectUserStrainIdsAsArray } = userStrainsAdapter.getSelectors<RootState>(selectUserStrainsState);

export const selectUserStrainIds = createSelector(
  [selectUserStrainIdsAsArray],
  (ids) => new Set(ids as string[])
);
export const selectFavoriteIds = createSelector(
    [selectFavoritesState],
    (favorites: FavoritesState): Set<string> => new Set(favorites?.favoriteIds || [])
);

// --- Archives Selectors ---
export const selectArchivedMentorResponses = createSelector([selectArchives], (archives: ArchivesState) => archives.archivedMentorResponses);
const selectAllArchivedAdvisorResponses = createSelector([selectArchives], (archives: ArchivesState) => archives.archivedAdvisorResponses);

const emptyArchivedAdvisorResponses: ArchivedAdvisorResponse[] = []; // Stable reference for memoization

export const selectArchivedAdvisorResponsesForPlant = createSelector(
  [
    selectAllArchivedAdvisorResponses,
    (state: RootState, plantId: string) => plantId,
  ],
  (archives, plantId) => archives[plantId] || emptyArchivedAdvisorResponses
);

export const selectArchivedAdvisorResponses = selectAllArchivedAdvisorResponses;

// --- TTS Selectors ---
export const selectTtsState = createSelector(
    [selectTts],
    (tts: TtsState): TtsState => ({
        isTtsSpeaking: tts.isTtsSpeaking,
        isTtsPaused: tts.isTtsPaused,
        ttsQueue: tts.ttsQueue,
        currentlySpeakingId: tts.currentlySpeakingId
    })
);
export const selectCurrentlySpeakingId = createSelector([selectTts], (tts: TtsState) => tts.currentlySpeakingId);

// --- Plant Simulation Selectors ---
export const { selectAll: selectAllPlants, selectById: selectPlantEntityById } = plantsAdapter.getSelectors<RootState>(state => state.simulation.plants);

export const selectPlantSlots = createSelector([selectSimulation], (sim: SimulationState) => sim.plantSlots);

export const selectActivePlants = createSelector(
  [selectPlantSlots, (state: RootState) => state.simulation.plants.entities],
  (slots, plantEntities): Plant[] => slots
    .filter((id): id is string => id !== null)
    .map(id => plantEntities[id])
    .filter((p): p is Plant => p !== undefined)
);

export const selectHasAvailableSlots = createSelector(
  [selectPlantSlots],
  (slots) => slots.some(s => s === null)
);

export const selectSelectedPlantId = createSelector([selectSimulation], (sim: SimulationState) => sim.selectedPlantId);

export const selectPlantById = (id: string | null) => createSelector(
  [selectSimulation],
  (sim: SimulationState): Plant | null => (id ? sim.plants.entities[id] : null) || null
);

export const selectOpenTasksSummary = createSelector(
  [selectActivePlants],
  (activePlants): (Task & { plantId: string; plantName: string; })[] => activePlants
    .flatMap(p => p.tasks.filter(t => !t.isCompleted).map(t => ({ ...t, plantId: p.id, plantName: p.name })))
);

export const selectActiveProblemsSummary = createSelector(
  [selectActivePlants],
  (activePlants): (PlantProblem & { plantId: string; plantName: string; })[] => activePlants
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
export const selectStrainsViewState = createSelector([selectStrainsView], (view: StrainsViewState) => view);
export const selectActiveStrainViewTab = createSelector([selectStrainsView], (view: StrainsViewState) => view.strainsViewTab);
export const selectStrainsViewMode = createSelector([selectStrainsView], (view: StrainsViewState) => view.strainsViewMode);
export const selectSelectedStrainIds = createSelector(
    [selectStrainsView],
    (view: StrainsViewState) => new Set(view.selectedStrainIds)
);

// --- Knowledge & Breeding Selectors ---
export const selectKnowledgeProgress = createSelector([selectKnowledge], (k) => k.knowledgeProgress);
export const selectCollectedSeeds = createSelector([selectBreeding], (b) => b.collectedSeeds);
export const selectBreedingSlots = createSelector([selectBreeding], b => b.breedingSlots);

// --- Sandbox Selector ---
export const selectSandboxState = createSelector([selectSandbox], (s: SandboxState) => s);
export const selectSavedExperiments = createSelector([selectSandboxState], (s) => s.savedExperiments);

// --- Genealogy Selector ---
export const selectGenealogyState = selectGenealogy;