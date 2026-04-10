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
    Plant,
    TTSSettings,
    JournalEntryType,
    EnvironmentDetails,
    JournalEntry,
    SandboxState,
    Language,
    Theme,
    AiMode,
    Seed,
    SavedExperiment,
    PlantStage,
    GrowGoal,
} from '@/types'
import { SavedItemsState } from './slices/savedItemsSlice'
import { FavoritesState } from './slices/favoritesSlice'
import { ArchivesState } from './slices/archivesSlice'
import { BreedingState } from './slices/breedingSlice'
import { SettingsState } from './slices/settingsSlice'

// --- Base Selectors (for each slice) ---
const selectSettingsState = (state: RootState): SettingsState => state.settings
export const selectSavedItems = (state: RootState): SavedItemsState => state.savedItems
const selectFavoritesState = (state: RootState): FavoritesState => state.favorites
export const selectArchives = (state: RootState): ArchivesState => state.archives
export const selectSimulation = (state: RootState): SimulationState => state.simulation
const selectKnowledge = (state: RootState) => state.knowledge
const selectBreeding = (state: RootState) => state.breeding
const selectSandbox = (state: RootState) => state.sandbox
const selectGenealogy = (state: RootState) => state.genealogy
const selectNutrientPlanner = (state: RootState) => state.nutrientPlanner

// --- Adapter Selectors ---
import { userStrainsAdapter } from './slices/userStrainsSlice'
import {
    savedSetupsAdapter,
    savedStrainTipsAdapter,
    savedExportsAdapter,
} from './slices/savedItemsSlice'
import { plantsAdapter } from './slices/simulationSlice'

// --- Settings Selectors ---
export const selectSettings = createSelector(
    [selectSettingsState],
    (settingsState: SettingsState): AppSettings => settingsState.settings,
)
export const selectAiMode = createSelector(
    [selectSettings],
    (settings: AppSettings): AiMode => settings.aiMode ?? 'hybrid',
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
export const selectGrowGoal = createSelector(
    [selectSettings],
    (settings: AppSettings): GrowGoal | null => settings.general.growGoal,
)
export const selectDefaultSpaceSize = createSelector(
    [selectSettings],
    (settings: AppSettings): 'small' | 'medium' | 'large' | null =>
        settings.general.defaultSpaceSize,
)
export const selectDefaultBudget = createSelector(
    [selectSettings],
    (settings: AppSettings): 'low' | 'mid' | 'high' | null => settings.general.defaultBudget,
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
    (favorites: FavoritesState): Set<string> => new Set(favorites?.favoriteIds ?? []),
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

// --- Knowledge & Breeding Selectors ---
export const selectKnowledgeProgress = createSelector([selectKnowledge], (k) => k.knowledgeProgress)
export const selectLearningPathProgress = createSelector(
    [selectKnowledge],
    (k) => k.learningPathProgress,
)
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

// --- Nutrient Planner Selectors ---
import type {
    NutrientPlannerState,
    NutrientScheduleEntry,
    EcPhReading,
    NutrientAlert,
} from './slices/nutrientPlannerSlice'

export const selectNutrientSchedule = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): NutrientScheduleEntry[] => np.schedule,
)
export const selectNutrientReadings = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): EcPhReading[] => np.readings,
)
export const selectActiveNutrientAlerts = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): NutrientAlert[] => np.alerts.filter((a) => !a.dismissed),
)
export const selectNutrientMedium = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): 'Soil' | 'Coco' | 'Hydro' => np.medium,
)
export const selectNutrientAutoAdjust = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): boolean => np.autoAdjustEnabled,
)
export const selectNutrientAiLoading = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): boolean => np.isAiLoading,
)
export const selectNutrientAiRecommendation = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): string | null => np.lastAiRecommendation,
)
export const selectNutrientActivePluginId = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): string | null => np.activePluginId,
)
export const selectNutrientAutoAdjustRecommendation = createSelector(
    [selectNutrientPlanner],
    (np: NutrientPlannerState): string | null => np.autoAdjustRecommendation,
)

// --- Environment Analytics Selectors ---
export interface EnvironmentLogEntry {
    timestamp: number
    temp?: number | undefined
    humidity?: number | undefined
    vpd?: number | undefined
    ec?: number | undefined
    ph?: number | undefined
    lightPpfd?: number | undefined
    waterVolumeMl?: number | undefined
    source?: 'manual' | 'iot_sensor' | undefined
}

const envLogCache = new Map<string | null, (state: RootState) => EnvironmentLogEntry[]>()
export const selectEnvironmentLogs = (
    plantId: string | null,
): ((state: RootState) => EnvironmentLogEntry[]) => {
    let selector = envLogCache.get(plantId)
    if (!selector) {
        selector = createSelector(
            [selectSimulation],
            (sim: SimulationState): EnvironmentLogEntry[] => {
                const plant = plantId ? sim.plants.entities[plantId] : null
                if (!plant) return []
                return plant.journal
                    .filter(
                        (
                            entry: JournalEntry,
                        ): entry is JournalEntry & { details: EnvironmentDetails } =>
                            entry.type === JournalEntryType.Environment && entry.details != null,
                    )
                    .map((entry) => {
                        const d = entry.details
                        let vpd: number | undefined
                        if (d.temp != null && d.humidity != null) {
                            // Tetens formula for saturation vapor pressure
                            const svp = 0.6108 * Math.exp((17.27 * d.temp) / (d.temp + 237.3))
                            const avp = svp * (d.humidity / 100)
                            vpd = svp - avp
                        }
                        return {
                            timestamp: entry.createdAt,
                            temp: d.temp,
                            humidity: d.humidity,
                            vpd,
                            ec: d.ec,
                            ph: d.ph,
                            lightPpfd: d.lightPpfd,
                            waterVolumeMl: d.waterVolumeMl,
                            source: d.source,
                        }
                    })
                    .sort((a, b) => a.timestamp - b.timestamp)
            },
        )
        envLogCache.set(plantId, selector)
    }
    return selector
}

// --- Grows Selectors ---
import type { Grow, GrowsState, GrowSummary } from '@/types'
import { growsAdapter } from './slices/growsSlice'

const selectGrowsState = (state: RootState): GrowsState => state.grows

export const selectActiveGrowId = createSelector(
    [selectGrowsState],
    (g: GrowsState): string => g.activeGrowId,
)

export const { selectAll: selectAllGrows, selectById: selectGrowById } =
    growsAdapter.getSelectors<RootState>((state) => state.grows?.grows ?? EMPTY_ENTITY_STATE)

export const selectActiveGrow = createSelector(
    [selectGrowsState],
    (g: GrowsState): Grow | undefined => g.grows.entities[g.activeGrowId],
)

export const selectGrowCount = createSelector(
    [selectGrowsState],
    (g: GrowsState): number => g.grows.ids.length,
)

export const selectNonArchivedGrows = createSelector([selectAllGrows], (grows: Grow[]): Grow[] =>
    grows.filter((g) => !g.archived),
)

// --- Grow-scoped Plant Selectors ---

const plantsForGrowCache = new Map<string, (state: RootState) => Plant[]>()
export const selectPlantsForGrow = (growId: string): ((state: RootState) => Plant[]) => {
    let selector = plantsForGrowCache.get(growId)
    if (!selector) {
        selector = createSelector([selectAllPlants], (plants: Plant[]): Plant[] =>
            plants.filter((p) => p.growId === growId),
        )
        plantsForGrowCache.set(growId, selector)
    }
    return selector
}

export const selectActiveGrowPlants = createSelector(
    [selectAllPlants, selectActiveGrowId],
    (plants: Plant[], activeGrowId: string): Plant[] =>
        plants.filter((p) => p.growId === activeGrowId),
)

// --- Grow-scoped Nutrient Selectors ---

const nutrientScheduleForGrowCache = new Map<
    string,
    (state: RootState) => NutrientScheduleEntry[]
>()
export const selectNutrientScheduleForGrow = (
    growId: string,
): ((state: RootState) => NutrientScheduleEntry[]) => {
    let selector = nutrientScheduleForGrowCache.get(growId)
    if (!selector) {
        selector = createSelector(
            [selectNutrientSchedule],
            (schedule: NutrientScheduleEntry[]): NutrientScheduleEntry[] =>
                schedule.filter((e) => e.growId === growId),
        )
        nutrientScheduleForGrowCache.set(growId, selector)
    }
    return selector
}

// --- Grow Summary Selector ---

const growSummaryCache = new Map<string, (state: RootState) => GrowSummary>()
export const selectGrowSummary = (growId: string): ((state: RootState) => GrowSummary) => {
    let selector = growSummaryCache.get(growId)
    if (!selector) {
        selector = createSelector(
            [selectAllPlants, selectNutrientSchedule],
            (plants: Plant[], schedule: NutrientScheduleEntry[]): GrowSummary => {
                const growPlants = plants.filter((p) => p.growId === growId)
                const activePlants = growPlants.filter(
                    (p) => p.stage !== PlantStage.Harvest && p.stage !== PlantStage.Finished,
                )
                const journalCount = growPlants.reduce((sum, p) => sum + p.journal.length, 0)
                const nutrientCount = schedule.filter((e) => e.growId === growId).length
                const ages = growPlants.map((p) => p.age)
                const healthValues = growPlants.map((p) => p.health)
                return {
                    growId,
                    plantCount: growPlants.length,
                    activePlantCount: activePlants.length,
                    journalEntryCount: journalCount,
                    nutrientEntryCount: nutrientCount,
                    oldestPlantAge: ages.length > 0 ? Math.max(...ages) : 0,
                    averageHealth:
                        healthValues.length > 0
                            ? healthValues.reduce((a, b) => a + b, 0) / healthValues.length
                            : 0,
                }
            },
        )
        growSummaryCache.set(growId, selector)
    }
    return selector
}
