import { createSelector } from '@reduxjs/toolkit'
import { RootState } from './store'
import {
    ArchivedAdvisorResponse,
    SimulationState,
    AppSettings,
    Task,
    PlantProblem,
    Notification,
    Strain,
    SavedSetup,
    SavedStrainTip,
    View,
    Plant,
    SavedExport,
    TTSSettings,
    SandboxState,
} from '@/types'
import { SavedItemsState } from './slices/savedItemsSlice'
import { UIState } from './slices/uiSlice'
import { FavoritesState } from './slices/favoritesSlice'
import { ArchivesState } from './slices/archivesSlice'
import { TtsState } from './slices/ttsSlice'
import { StrainsViewState } from './slices/strainsViewSlice'
// FIX: Module '"@/types"' has no exported member 'BreedingState'.
import { BreedingState } from './slices/breedingSlice'
import { SettingsState } from './slices/settingsSlice'

// --- Base Selectors (for each slice) ---
export const selectUi = (state: RootState): UIState => state.ui
const selectSettingsState = (state: RootState) => state.settings
export const selectSavedItems = (state: RootState): SavedItemsState => state.savedItems
const selectUserStrainsState = (state: RootState) => state.userStrains
const selectFavoritesState = (state: RootState): FavoritesState => state.favorites
export const selectArchives = (state: RootState): ArchivesState => state.archives
const selectTts = (state: RootState): TtsState => state.tts
export const selectSimulation = (state: RootState): SimulationState => state.simulation
export const selectStrainsView = (state: RootState): StrainsViewState => state.strainsView
const selectKnowledge = (state: RootState) => state.knowledge
const selectBreeding = (state: RootState) => state.breeding
const selectSandbox = (state: RootState) => state.sandbox
const selectGenealogy = (state: RootState) => state.genealogy
export const selectNavigation = (state: RootState) => state.navigation

// --- Adapter Selectors ---
import { userStrainsAdapter } from './slices/userStrainsSlice'
import { savedSetupsAdapter, savedStrainTipsAdapter, savedExportsAdapter } from './slices/savedItemsSlice'
import { plantsAdapter } from './slices/simulationSlice'

// --- UI Selectors ---
// FIX: Added explicit types to selector callbacks to ensure correct type inference.
export const selectActiveView = createSelector([selectUi], (ui: UIState): View => ui.activeView)
export const selectIsCommandPaletteOpen = createSelector(
    [selectUi],
    (ui: UIState): boolean => ui.isCommandPaletteOpen,
)
export const selectHighlightedElement = createSelector(
    [selectUi],
    (ui: UIState): string | null => ui.highlightedElement,
)
export const selectNotifications = createSelector(
    [selectUi],
    (ui: UIState): Notification[] => ui.notifications,
)
export const selectOnboardingStep = createSelector([selectUi], (ui: UIState): number => ui.onboardingStep)
export const selectActionModalState = createSelector([selectUi], (ui: UIState) => ui.actionModal)
export const selectDeepDiveModalState = createSelector([selectUi], (ui: UIState) => ui.deepDiveModal)
export const selectIsAppReady = createSelector([selectUi], (ui: UIState) => ui.isAppReady);
export const selectNewGrowFlow = createSelector([selectUi], (ui: UIState) => ui.newGrowFlow);
export const selectKnowledgeViewTab = createSelector([selectUi], (ui: UIState) => ui.knowledgeViewTab);
export const selectActiveMentorPlantId = createSelector([selectUi], (ui: UIState) => ui.activeMentorPlantId);
export const selectEquipmentViewTab = createSelector([selectUi], (ui: UIState) => ui.equipmentViewTab);
export const selectIsSaveSetupModalOpen = createSelector([selectUi], (ui: UIState) => ui.isSaveSetupModalOpen);
export const selectSetupToSave = createSelector([selectUi], (ui: UIState) => ui.setupToSave);
// FIX: Added new selectors for diagnostics modal state
export const selectIsDiagnosticsModalOpen = createSelector([selectUi], (ui: UIState) => ui.isDiagnosticsModalOpen);
export const selectDiagnosticsPlantId = createSelector([selectUi], (ui: UIState) => ui.diagnosticsPlantId);


// --- Settings Selectors ---
export const selectSettings = createSelector(
    // FIX: Added explicit type to selector callback.
    [selectSettingsState],
    (settingsState: SettingsState): AppSettings => settingsState.settings,
)
export const selectLanguage = createSelector(
    [selectSettings],
    (settings: AppSettings) => settings.general.language,
)
export const selectIsExpertMode = createSelector(
    [selectSettings],
    (settings: AppSettings): boolean => !!settings.general.expertMode,
)
export const selectTheme = createSelector(
    [selectSettings],
    (settings: AppSettings) => settings.general.theme,
)
export const selectDefaults = createSelector(
    [selectSettings],
    (settings: AppSettings) => settings.defaults
)
export const selectTtsSettings = createSelector(
    [selectSettings],
    (settings: AppSettings): TTSSettings => settings.tts
)
export const selectTtsEnabled = createSelector(
    [selectTtsSettings],
    (tts: TTSSettings) => tts.enabled
)

// --- Saved Items Selectors ---
export const { selectAll: selectSavedSetups } = savedSetupsAdapter.getSelectors<RootState>(
    (state) => state.savedItems.savedSetups,
)
export const { selectAll: selectSavedStrainTips } = savedStrainTipsAdapter.getSelectors<RootState>(
    (state) => state.savedItems.savedStrainTips,
)
export const { selectAll: selectSavedExports, selectTotal: selectSavedExportsCount } = savedExportsAdapter.getSelectors<RootState>(
    (state) => state.savedItems.savedExports,
)


// --- User Strains & Favorites Selectors ---
export const { selectAll: selectUserStrains, selectIds: selectUserStrainIdsAsArray } =
    userStrainsAdapter.getSelectors<RootState>(selectUserStrainsState)

export const selectUserStrainIds = createSelector(
    [selectUserStrainIdsAsArray],
    (ids) => new Set(ids as string[]),
)
export const selectFavoriteIds = createSelector(
    // FIX: Added explicit type to selector callback.
    [selectFavoritesState],
    (favorites: FavoritesState): Set<string> => new Set(favorites?.favoriteIds || []),
)

// --- Archives Selectors ---
export const selectArchivedMentorResponses = createSelector(
    [selectArchives],
    (archives: ArchivesState) => archives.archivedMentorResponses,
)
const selectAllArchivedAdvisorResponses = createSelector(
    // FIX: Added explicit type to selector callback.
    [selectArchives],
    (archives: ArchivesState) => archives.archivedAdvisorResponses,
)

const emptyArchivedAdvisorResponses: ArchivedAdvisorResponse[] = [] // Stable reference for memoization

export const selectArchivedAdvisorResponsesForPlant = createSelector(
    [selectAllArchivedAdvisorResponses, (state: RootState, plantId: string) => plantId],
    (archives, plantId) => archives[plantId] || emptyArchivedAdvisorResponses,
)

export const selectArchivedAdvisorResponses = selectAllArchivedAdvisorResponses

// --- TTS Selectors ---
export const selectTtsState = createSelector(
    [selectTts],
    (tts: TtsState): TtsState => ({
        isTtsSpeaking: tts.isTtsSpeaking,
        isTtsPaused: tts.isTtsPaused,
        ttsQueue: tts.ttsQueue,
        currentlySpeakingId: tts.currentlySpeakingId,
    }),
)
export const selectCurrentlySpeakingId = createSelector(
    [selectTts],
    (tts: TtsState) => tts.currentlySpeakingId,
)

// --- Plant Simulation Selectors ---
export const { selectAll: selectAllPlants, selectById: selectPlantEntityById } =
    plantsAdapter.getSelectors<RootState>((state) => state.simulation.plants)

export const selectPlantSlots = createSelector(
    // FIX: Added explicit type to selector callback.
    [selectSimulation],
    (sim: SimulationState) => sim.plantSlots,
)

export const selectActivePlants = createSelector(
    [selectPlantSlots, (state: RootState) => state.simulation.plants.entities],
    (slots, plantEntities): Plant[] =>
        slots
            .filter((id): id is string => id !== null)
            .map((id) => plantEntities[id])
            .filter((p): p is Plant => p !== undefined),
)

export const selectHasAvailableSlots = createSelector([selectPlantSlots], (slots) =>
    slots.some((s) => s === null),
)

export const selectSelectedPlantId = createSelector(
    // FIX: Added explicit type to selector callback.
    [selectSimulation],
    (sim: SimulationState) => sim.selectedPlantId,
)

export const selectPlantById = (id: string | null) =>
    createSelector(
        [selectSimulation],
        (sim: SimulationState): Plant | null => (id ? sim.plants.entities[id] : null) || null,
    )

export const selectOpenTasksSummary = createSelector(
    [selectActivePlants],
    (activePlants): (Task & { plantId: string; plantName: string })[] =>
        activePlants.flatMap((p) =>
            p.tasks.filter((t) => !t.isCompleted).map((t) => ({ ...t, plantId: p.id, plantName: p.name })),
        ),
)

export const selectActiveProblemsSummary = createSelector(
    [selectActivePlants],
    (activePlants): (PlantProblem & { plantId: string; plantName: string })[] =>
        activePlants.flatMap((p) =>
            p.problems
                .filter((prob) => prob.status === 'active')
                .map((prob) => ({ ...prob, plantId: p.id, plantName: p.name })),
        ),
)

// Copied from simulationSlice to avoid circular dependencies
const calculateVPD = (tempC: number, rh: number, leafTempOffset: number): number => {
    const tempLeaf = tempC + leafTempOffset;
    const svpAir = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
    const avp = svpAir * (rh / 100);
    const svpLeaf = 0.61078 * Math.exp((17.27 * tempLeaf) / (tempLeaf + 237.3));
    return svpLeaf - avp;
};

export const selectGardenHealthMetrics = createSelector([selectActivePlants], (activePlants) => {
    const activePlantsCount = activePlants.length;
    if (activePlantsCount === 0) {
        const defaultTemp = 22;
        const defaultHumidity = 55;
        return { 
            gardenHealth: 100, 
            activePlantsCount: 0, 
            avgTemp: defaultTemp, 
            avgHumidity: defaultHumidity,
            avgVPD: calculateVPD(defaultTemp, defaultHumidity, -2)
        };
    }
    const totalHealth = activePlants.reduce((sum, p) => sum + p.health, 0);
    const totalTemp = activePlants.reduce((sum, p) => sum + p.environment.internalTemperature, 0);
    const totalHumidity = activePlants.reduce((sum, p) => sum + p.environment.internalHumidity, 0);
    
    const avgTemp = totalTemp / activePlantsCount;
    const avgHumidity = totalHumidity / activePlantsCount;

    return {
        gardenHealth: totalHealth / activePlantsCount,
        activePlantsCount,
        avgTemp,
        avgHumidity,
        avgVPD: calculateVPD(avgTemp, avgHumidity, -2)
    };
});


// --- Strains View Selectors ---
export const selectStrainsViewState = createSelector(
    [selectStrainsView],
    (view: StrainsViewState) => view,
)
export const selectActiveStrainViewTab = createSelector(
    [selectStrainsView],
    (view: StrainsViewState) => view.strainsViewTab,
)
export const selectStrainsViewMode = createSelector(
    [selectStrainsView],
    (view: StrainsViewState) => view.strainsViewMode,
)
export const selectSelectedStrainIds = createSelector(
    [selectStrainsView],
    (view: StrainsViewState) => new Set(view.selectedStrainIds),
)

// --- Knowledge & Breeding Selectors ---
export const selectKnowledgeProgress = createSelector([selectKnowledge], (k) => k.knowledgeProgress)
export const selectCollectedSeeds = createSelector([selectBreeding], (b: BreedingState) => b.collectedSeeds)
export const selectBreedingSlots = createSelector([selectBreeding], (b: BreedingState) => b.breedingSlots)

// --- Sandbox Selector ---
// FIX: Added explicit type to selector callback.
export const selectSandboxState = createSelector([selectSandbox], (s: SandboxState) => s)
export const selectSavedExperiments = createSelector([selectSandboxState], (s) => s.savedExperiments)

// --- Genealogy Selector ---
export const selectGenealogyState = selectGenealogy