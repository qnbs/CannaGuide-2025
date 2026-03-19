import { createSelector } from '@reduxjs/toolkit'
import { calculateVPD as calculateScientificVPD } from '@/lib/vpd/calculator'
import { plantSimulationService } from '@/services/plantSimulationService'
import { RootState } from './store'
import {
    ArchivedAdvisorResponse,
    ArchivedMentorResponse,
    SimulationState,
    AppSettings,
    Task,
    PlantProblem,
    Notification,
    View,
    Plant,
    TTSSettings,
    SandboxState,
    Language,
    Theme,
    StrainViewTab,
    Seed,
    SavedExperiment,
} from '@/types'
import { SavedItemsState } from './slices/savedItemsSlice'
import { UIState } from './slices/uiSlice'
import { FavoritesState } from './slices/favoritesSlice'
import { ArchivesState } from './slices/archivesSlice'
import { TtsState } from './slices/ttsSlice'
import { StrainsViewState } from './slices/strainsViewSlice'
import { BreedingState } from './slices/breedingSlice'
import { SettingsState } from './slices/settingsSlice'

// --- Base Selectors (for each slice) ---
export const selectUi = (state: RootState): UIState => state.ui
const selectSettingsState = (state: RootState): SettingsState => state.settings
export const selectSavedItems = (state: RootState): SavedItemsState => state.savedItems
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
import {
    savedSetupsAdapter,
    savedStrainTipsAdapter,
    savedExportsAdapter,
} from './slices/savedItemsSlice'
import { plantsAdapter } from './slices/simulationSlice'

// --- UI Selectors ---
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
export const selectOnboardingStep = createSelector(
    [selectUi],
    (ui: UIState): number => ui.onboardingStep,
)
export const selectActionModalState = createSelector([selectUi], (ui: UIState) => ui.actionModal)
export const selectDeepDiveModalState = createSelector(
    [selectUi],
    (ui: UIState) => ui.deepDiveModal,
)
export const selectIsAppReady = createSelector([selectUi], (ui: UIState): boolean => ui.isAppReady)
export const selectNewGrowFlow = createSelector([selectUi], (ui: UIState) => ui.newGrowFlow)
export const selectKnowledgeViewTab = createSelector(
    [selectUi],
    (ui: UIState) => ui.knowledgeViewTab,
)
export const selectActiveMentorPlantId = createSelector(
    [selectUi],
    (ui: UIState) => ui.activeMentorPlantId,
)
export const selectEquipmentViewTab = createSelector(
    [selectUi],
    (ui: UIState) => ui.equipmentViewTab,
)
export const selectIsSaveSetupModalOpen = createSelector(
    [selectUi],
    (ui: UIState): boolean => ui.isSaveSetupModalOpen,
)
export const selectSetupToSave = createSelector([selectUi], (ui: UIState) => ui.setupToSave)
export const selectIsDiagnosticsModalOpen = createSelector(
    [selectUi],
    (ui: UIState): boolean => ui.isDiagnosticsModalOpen,
)
export const selectDiagnosticsPlantId = createSelector(
    [selectUi],
    (ui: UIState): string | null => ui.diagnosticsPlantId,
)

// --- Settings Selectors ---
export const selectSettings = createSelector(
    [selectSettingsState],
    (settingsState: SettingsState): AppSettings => settingsState.settings,
)
export const selectLanguage = createSelector(
    [selectSettings],
    (settings: AppSettings): Language => settings.general.language,
)
export const selectTheme = createSelector(
    [selectSettings],
    (settings: AppSettings): Theme => settings.general.theme,
)
export const selectDefaults = createSelector(
    [selectSettings],
    (settings: AppSettings) => settings.defaults,
)
export const selectTtsSettings = createSelector(
    [selectSettings],
    (settings: AppSettings): TTSSettings => settings.tts,
)
export const selectTtsEnabled = createSelector(
    [selectTtsSettings],
    (tts: TTSSettings): boolean => tts.enabled,
)

// --- Safe entity adapter fallback ---
const EMPTY_ENTITY_STATE = { ids: [] as string[], entities: {} as Record<string, never> }

// --- Saved Items Selectors ---
export const { selectAll: selectSavedSetups } = savedSetupsAdapter.getSelectors<RootState>(
    (state) => state.savedItems?.savedSetups ?? EMPTY_ENTITY_STATE,
)
export const { selectAll: selectSavedStrainTips } = savedStrainTipsAdapter.getSelectors<RootState>(
    (state) => state.savedItems?.savedStrainTips ?? EMPTY_ENTITY_STATE,
)
export const { selectAll: selectSavedExports, selectTotal: selectSavedExportsCount } =
    savedExportsAdapter.getSelectors<RootState>(
        (state) => state.savedItems?.savedExports ?? EMPTY_ENTITY_STATE,
    )

// --- User Strains & Favorites Selectors ---
export const { selectAll: selectUserStrains, selectIds: selectUserStrainIdsAsArray } =
    userStrainsAdapter.getSelectors<RootState>((state) => state.userStrains ?? EMPTY_ENTITY_STATE)

export const selectUserStrainIds = createSelector(
    [selectUserStrainIdsAsArray],
    (ids): Set<string> => new Set(ids as string[]),
)
export const selectFavoriteIds = createSelector(
    [selectFavoritesState],
    (favorites: FavoritesState): Set<string> => new Set(favorites?.favoriteIds || []),
)

// --- Archives Selectors ---
export const selectArchivedMentorResponses = createSelector(
    [selectArchives],
    (archives: ArchivesState): ArchivedMentorResponse[] => archives.archivedMentorResponses,
)
const selectAllArchivedAdvisorResponses = createSelector(
    [selectArchives],
    (archives: ArchivesState): Record<string, ArchivedAdvisorResponse[]> =>
        archives.archivedAdvisorResponses,
)

// Stable reference for memoization to prevent re-renders when a plant has no archives.
const emptyArchivedAdvisorResponses: ArchivedAdvisorResponse[] = []

export const selectArchivedAdvisorResponsesForPlant = createSelector(
    [selectAllArchivedAdvisorResponses, (_state: RootState, plantId: string) => plantId],
    (archives, plantId): ArchivedAdvisorResponse[] =>
        archives[plantId] || emptyArchivedAdvisorResponses,
)

export const selectArchivedAdvisorResponses = selectAllArchivedAdvisorResponses

// --- TTS Selectors ---
export const selectTtsState = selectTts
export const selectCurrentlySpeakingId = createSelector(
    [selectTts],
    (tts: TtsState): string | null => tts.currentlySpeakingId,
)

// --- Plant Simulation Selectors ---
export const { selectAll: selectAllPlants, selectById: selectPlantEntityById } =
    plantsAdapter.getSelectors<RootState>((state) => state.simulation?.plants ?? EMPTY_ENTITY_STATE)

export const selectPlantSlots = createSelector(
    [selectSimulation],
    (sim: SimulationState): (string | null)[] => sim?.plantSlots ?? [null, null, null],
)

export const selectActivePlants = createSelector(
    [selectPlantSlots, (state: RootState) => state.simulation?.plants?.entities ?? {}],
    (slots, plantEntities): Plant[] =>
        slots
            .filter((id): id is string => id !== null)
            .map((id) => plantEntities[id])
            .filter((p): p is Plant => p !== undefined),
)

export const selectHasAvailableSlots = createSelector([selectPlantSlots], (slots): boolean =>
    slots.some((s) => s === null),
)

export const selectSelectedPlantId = createSelector(
    [selectSimulation],
    (sim: SimulationState): string | null => sim.selectedPlantId,
)

const plantByIdCache = new Map<string | null, (state: RootState) => Plant | null>()
export const selectPlantById = (id: string | null): ((state: RootState) => Plant | null) => {
    let selector = plantByIdCache.get(id)
    if (!selector) {
        selector = createSelector(
            [selectSimulation],
            (sim: SimulationState): Plant | null => (id ? sim.plants.entities[id] : null) ?? null,
        )
        plantByIdCache.set(id, selector)
    }
    return selector
}

export const selectOpenTasksSummary = createSelector(
    [selectActivePlants],
    (activePlants): (Task & { plantId: string; plantName: string })[] =>
        activePlants.flatMap((p) =>
            p.tasks
                .filter((t) => !t.isCompleted)
                .map((t) => ({ ...t, plantId: p.id, plantName: p.name })),
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

export const selectGardenHealthMetrics = createSelector(
    [selectActivePlants, selectSettings],
    (activePlants, settings) => {
        const leafTempOffset = settings.simulation?.leafTemperatureOffset ?? -2
        const altitudeM = settings.simulation?.altitudeM ?? 0
        const activePlantsCount = activePlants.length
        if (activePlantsCount === 0) {
            const defaultTemp = 22
            const defaultHumidity = 55
            return {
                gardenHealth: 100,
                activePlantsCount: 0,
                avgTemp: defaultTemp,
                avgHumidity: defaultHumidity,
                avgVPD: calculateScientificVPD(
                    defaultTemp,
                    defaultHumidity,
                    leafTempOffset,
                    altitudeM,
                ),
            }
        }
        const totalHealth = activePlants.reduce((sum, p) => sum + p.health, 0)
        const totalTemp = activePlants.reduce(
            (sum, p) => sum + p.environment.internalTemperature,
            0,
        )
        const totalHumidity = activePlants.reduce(
            (sum, p) => sum + p.environment.internalHumidity,
            0,
        )
        const totalVpd = activePlants.reduce((sum, plant) => {
            const correctedPlant = plantSimulationService.applyEnvironmentalCorrections(
                plant,
                settings.simulation,
            )
            return sum + correctedPlant.environment.vpd
        }, 0)

        const avgTemp = totalTemp / activePlantsCount
        const avgHumidity = totalHumidity / activePlantsCount

        return {
            gardenHealth: totalHealth / activePlantsCount,
            activePlantsCount,
            avgTemp,
            avgHumidity,
            avgVPD: totalVpd / activePlantsCount,
        }
    },
)

// --- Strains View Selectors ---
export const selectStrainsViewState = selectStrainsView
export const selectActiveStrainViewTab = createSelector(
    [selectStrainsView],
    (view: StrainsViewState): StrainViewTab => view.strainsViewTab,
)
export const selectStrainsViewMode = createSelector(
    [selectStrainsView],
    (view: StrainsViewState): 'list' | 'grid' => view.strainsViewMode,
)
export const selectSelectedStrainIds = createSelector(
    [selectStrainsView],
    (view: StrainsViewState): Set<string> => new Set(view.selectedStrainIds),
)

// --- Knowledge & Breeding Selectors ---
export const selectKnowledgeProgress = createSelector([selectKnowledge], (k) => k.knowledgeProgress)
export const selectCollectedSeeds = createSelector(
    [selectBreeding],
    (b: BreedingState): Seed[] => b.collectedSeeds,
)
export const selectBreedingSlots = createSelector(
    [selectBreeding],
    (b: BreedingState) => b.breedingSlots,
)

// --- Sandbox Selector ---
export const selectSandboxState = createSelector(
    [selectSandbox],
    (s: SandboxState): SandboxState => s,
)
export const selectSavedExperiments = createSelector(
    [selectSandboxState],
    (s): SavedExperiment[] => s.savedExperiments,
)

// --- Genealogy Selector ---
export const selectGenealogyState = selectGenealogy
