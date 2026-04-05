import { PlantStage, StrainType } from '@/types'
import type { AppSettings, Strain } from '@/types'
import { defaultSettings } from '@/stores/slices/settingsSlice'
import type { RootState } from '@/stores/store'
import {
    APP_VERSION,
    GENEALOGY_STATE_VERSION,
    SLICE_SCHEMA_VERSIONS,
    VersionedSliceName,
} from '@/constants'
import { normalizeImageDataUrl } from '@/utils/imageDataUrl'

// This represents the shape of the persisted state object.
// NOTE: `ui` was migrated to Zustand but may still exist in older persisted snapshots.
//
// Type-safety note: This module intentionally uses `as Record<string, unknown>`
// casts throughout. Persisted state from IndexedDB has unknown shapes, and the
// migration functions must narrow them at runtime via typeof/instanceof checks
// before accessing properties. These casts are the correct pattern for untyped
// deserialization boundaries.
export type PersistedState = Partial<RootState> & {
    version?: number
    /** Per-slice schema versions stamped at persist time. */
    _sliceVersions?: Partial<Record<VersionedSliceName, number>>
    /** Legacy UI state from pre-Zustand migration (may exist in old persisted data). */
    ui?: Record<string, unknown>
}

export type SnapshotDiff = {
    added: string[]
    removed: string[]
    changed: string[]
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

export const createSnapshotDiff = (before: unknown, after: unknown): SnapshotDiff => {
    if (!isPlainObject(before) || !isPlainObject(after)) {
        return { added: [], removed: [], changed: [] }
    }

    const beforeKeys = new Set(Object.keys(before))
    const afterKeys = new Set(Object.keys(after))

    return {
        added: [...afterKeys]
            .filter((key) => !beforeKeys.has(key))
            .toSorted((a, b) => a.localeCompare(b)),
        removed: [...beforeKeys]
            .filter((key) => !afterKeys.has(key))
            .toSorted((a, b) => a.localeCompare(b)),
        changed: [...beforeKeys]
            .filter(
                (key) =>
                    afterKeys.has(key) &&
                    JSON.stringify(before[key]) !== JSON.stringify(after[key]),
            )
            .toSorted((a, b) => a.localeCompare(b)),
    }
}

type LegacyPlant = Record<string, unknown>

const ensureSimulationRootShape = (sim: Record<string, unknown>): void => {
    if (!Array.isArray(sim.plantSlots)) {
        sim.plantSlots = [null, null, null]
    }
    if (typeof sim.selectedPlantId === 'undefined') {
        sim.selectedPlantId = null
    }
    if (Object.prototype.hasOwnProperty.call(sim, 'devSpeedMultiplier')) {
        delete sim.devSpeedMultiplier
    }
    if (!sim.vpdProfiles || typeof sim.vpdProfiles !== 'object') {
        sim.vpdProfiles = {}
    }
}

const resolvePostHarvestStage = (
    plant: LegacyPlant,
): { stage: PlantStage; isPostHarvest: boolean } => {
    const stage = typeof plant.stage === 'string' ? (plant.stage as PlantStage) : PlantStage.Seed
    const isPostHarvest = [
        PlantStage.Harvest,
        PlantStage.Drying,
        PlantStage.Curing,
        PlantStage.Finished,
    ].includes(stage)

    return { stage, isPostHarvest }
}

const ensureLegacyPlantTimestamps = (plant: LegacyPlant): void => {
    if (typeof plant.mediumType !== 'string') {
        plant.mediumType = 'Soil'
    }
    if (typeof plant.createdAt !== 'number') {
        plant.createdAt = typeof plant.lastUpdated === 'number' ? plant.lastUpdated : Date.now()
    }
    if (typeof plant.lastUpdated !== 'number') {
        plant.lastUpdated = typeof plant.createdAt === 'number' ? plant.createdAt : Date.now()
    }
}

const ensureNumeric = (obj: Record<string, unknown>, key: string, fallback: number): void => {
    if (typeof obj[key] !== 'number') obj[key] = fallback
}

const ensureLegacyHarvestData = (plant: LegacyPlant): void => {
    if (typeof plant.harvestData === 'undefined') {
        plant.harvestData = null
        return
    }

    if (!plant.harvestData || typeof plant.harvestData !== 'object') {
        return
    }

    const harvestData = plant.harvestData as Record<string, unknown>
    const terpeneProfile =
        plant.terpeneProfile && typeof plant.terpeneProfile === 'object'
            ? (plant.terpeneProfile as Record<string, unknown>)
            : {}
    const { stage, isPostHarvest } = resolvePostHarvestStage(plant)
    const isCuringOrFinished = stage === PlantStage.Curing || stage === PlantStage.Finished

    ensureNumeric(harvestData, 'wetWeight', 0)
    ensureNumeric(harvestData, 'dryWeight', 0)
    ensureNumeric(harvestData, 'currentDryDay', stage === PlantStage.Drying ? 1 : 0)
    ensureNumeric(harvestData, 'currentCureDay', isCuringOrFinished ? 1 : 0)
    ensureNumeric(harvestData, 'lastBurpDay', 0)
    ensureNumeric(harvestData, 'jarHumidity', isCuringOrFinished ? 62 : 68)
    ensureNumeric(harvestData, 'chlorophyllPercent', isPostHarvest ? 100 : 0)
    ensureNumeric(harvestData, 'terpeneRetentionPercent', isPostHarvest ? 100 : 0)
    ensureNumeric(harvestData, 'moldRiskPercent', 0)
    ensureNumeric(harvestData, 'finalQuality', 0)

    if (!harvestData.cannabinoidProfile || typeof harvestData.cannabinoidProfile !== 'object') {
        harvestData.cannabinoidProfile = { thc: 0, cbn: 0 }
    } else {
        const cannabinoidProfile = harvestData.cannabinoidProfile as Record<string, unknown>
        ensureNumeric(cannabinoidProfile, 'thc', 0)
        ensureNumeric(cannabinoidProfile, 'cbn', 0)
    }

    if (!harvestData.terpeneProfile || typeof harvestData.terpeneProfile !== 'object') {
        harvestData.terpeneProfile = { ...terpeneProfile }
    }
}

const ensureLegacyEnvironment = (plant: LegacyPlant): void => {
    if (!plant.environment || typeof plant.environment !== 'object') {
        plant.environment = {
            internalTemperature: 24,
            internalHumidity: 65,
            vpd: 0,
            co2Level: 400,
        }
        return
    }

    const environment = plant.environment as Record<string, unknown>
    if (typeof environment.internalTemperature !== 'number') environment.internalTemperature = 24
    if (typeof environment.internalHumidity !== 'number') environment.internalHumidity = 65
    if (typeof environment.vpd !== 'number') environment.vpd = 0
    if (typeof environment.co2Level !== 'number') environment.co2Level = 400
}

const ensureLegacyRootSystem = (plant: LegacyPlant): void => {
    if (!plant.rootSystem || typeof plant.rootSystem !== 'object') {
        plant.rootSystem = { health: 100, rootMass: 0.01 }
        return
    }

    const rootSystem = plant.rootSystem as Record<string, unknown>
    if (typeof rootSystem.health !== 'number') rootSystem.health = 100
    if (typeof rootSystem.rootMass !== 'number') rootSystem.rootMass = 0.01
}

const ensureLegacyStressCounters = (plant: LegacyPlant): void => {
    if (!plant.stressCounters || typeof plant.stressCounters !== 'object') {
        plant.stressCounters = { vpd: 0, ph: 0, ec: 0, moisture: 0 }
        return
    }

    const stressCounters = plant.stressCounters as Record<string, unknown>
    if (typeof stressCounters.vpd !== 'number') stressCounters.vpd = 0
    if (typeof stressCounters.ph !== 'number') stressCounters.ph = 0
    if (typeof stressCounters.ec !== 'number') stressCounters.ec = 0
    if (typeof stressCounters.moisture !== 'number') stressCounters.moisture = 0
}

const ensureLegacyCannabinoidProfile = (plant: LegacyPlant): void => {
    if (!plant.cannabinoidProfile || typeof plant.cannabinoidProfile !== 'object') {
        plant.cannabinoidProfile = { thc: 0, cbd: 0, cbn: 0 }
        return
    }

    const cannabinoidProfile = plant.cannabinoidProfile as Record<string, unknown>
    if (typeof cannabinoidProfile.thc !== 'number') cannabinoidProfile.thc = 0
    if (typeof cannabinoidProfile.cbd !== 'number') cannabinoidProfile.cbd = 0
    if (typeof cannabinoidProfile.cbn !== 'number') cannabinoidProfile.cbn = 0
}

const ensureLegacyStructuralModel = (plant: LegacyPlant): void => {
    if (!plant.structuralModel || typeof plant.structuralModel !== 'object') {
        plant.structuralModel = { branches: 1, nodes: 1 }
        return
    }

    const structuralModel = plant.structuralModel as Record<string, unknown>
    if (typeof structuralModel.branches !== 'number') structuralModel.branches = 1
    if (typeof structuralModel.nodes !== 'number') structuralModel.nodes = 1
}

const ensureLegacyMedium = (plant: LegacyPlant): void => {
    if (!plant.medium || typeof plant.medium !== 'object') {
        plant.medium = {
            ph: 6.5,
            ec: 0.8,
            moisture: 80,
            microbeHealth: 80,
            substrateWater: 0,
            nutrientConcentration: { nitrogen: 100, phosphorus: 100, potassium: 100 },
        }
        return
    }

    const medium = plant.medium as Record<string, unknown>
    if (typeof medium.ph !== 'number') medium.ph = 6.5
    if (typeof medium.ec !== 'number') medium.ec = 0.8
    if (typeof medium.moisture !== 'number') medium.moisture = 80
    if (typeof medium.microbeHealth !== 'number') medium.microbeHealth = 80
    if (typeof medium.substrateWater !== 'number') medium.substrateWater = 0
    if (!medium.nutrientConcentration || typeof medium.nutrientConcentration !== 'object') {
        medium.nutrientConcentration = {
            nitrogen: 100,
            phosphorus: 100,
            potassium: 100,
        }
        return
    }

    const nutrientConcentration = medium.nutrientConcentration as Record<string, unknown>
    if (typeof nutrientConcentration.nitrogen !== 'number') nutrientConcentration.nitrogen = 100
    if (typeof nutrientConcentration.phosphorus !== 'number') {
        nutrientConcentration.phosphorus = 100
    }
    if (typeof nutrientConcentration.potassium !== 'number') nutrientConcentration.potassium = 100
}

const ensureLegacyNutrientPool = (plant: LegacyPlant): void => {
    if (!plant.nutrientPool || typeof plant.nutrientPool !== 'object') {
        plant.nutrientPool = { nitrogen: 5, phosphorus: 5, potassium: 5 }
        return
    }

    const nutrientPool = plant.nutrientPool as Record<string, unknown>
    if (typeof nutrientPool.nitrogen !== 'number') nutrientPool.nitrogen = 5
    if (typeof nutrientPool.phosphorus !== 'number') nutrientPool.phosphorus = 5
    if (typeof nutrientPool.potassium !== 'number') nutrientPool.potassium = 5
}

const ensureLegacySimulationClock = (plant: LegacyPlant): void => {
    if (!plant.simulationClock || typeof plant.simulationClock !== 'object') {
        plant.simulationClock = { accumulatedDayMs: 0 }
        return
    }

    const simulationClock = plant.simulationClock as Record<string, unknown>
    if (typeof simulationClock.accumulatedDayMs !== 'number') simulationClock.accumulatedDayMs = 0
}

const ensureLegacyHistory = (plant: LegacyPlant): void => {
    if (!Array.isArray(plant.history)) {
        plant.history = []
    }
}

const ensureLegacyPhenotypeModifiers = (plant: LegacyPlant): void => {
    const legacyStrain = plant.strain as Record<string, unknown> | undefined
    if (!plant.phenotypeModifiers && legacyStrain?.geneticModifiers) {
        plant.phenotypeModifiers = { ...(legacyStrain.geneticModifiers as object) }
    }
}

const patchLegacyPlantShape = (plant: LegacyPlant): void => {
    ensureLegacyPlantTimestamps(plant)
    ensureLegacyHarvestData(plant)
    ensureLegacyEnvironment(plant)
    ensureLegacyRootSystem(plant)
    ensureLegacyStressCounters(plant)
    ensureLegacyCannabinoidProfile(plant)
    if (!plant.terpeneProfile || typeof plant.terpeneProfile !== 'object') {
        plant.terpeneProfile = {}
    }
    ensureLegacyStructuralModel(plant)
    ensureLegacyMedium(plant)
    ensureLegacyNutrientPool(plant)
    ensureLegacySimulationClock(plant)
    ensureLegacyHistory(plant)
    ensureLegacyPhenotypeModifiers(plant)
}

const ensureSimulationShape = (state: PersistedState): void => {
    if (!state.simulation) {
        return
    }

    const sim = state.simulation as unknown as Record<string, unknown>
    ensureSimulationRootShape(sim)

    // Patch any persisted plant objects that are missing fields introduced after
    // the initial simulation build. This prevents the engine from crashing on
    // old localStorage data after an update.
    const entities = (sim.plants as Record<string, unknown>)?.entities
    if (entities && typeof entities === 'object') {
        for (const id in entities as Record<string, unknown>) {
            const plant = (entities as Record<string, LegacyPlant | undefined>)[id]
            if (!plant) continue

            patchLegacyPlantShape(plant)
        }
    }
}

/**
 * Sanitizes the persisted genealogy slice before it hits Redux.
 * This runs on EVERY boot (both migrating and up-to-date paths) so corrupt
 * data from interrupted fetches or schema changes never reaches the renderer.
 *
 * Key invariants enforced:
 *  - status: 'loading'  -> reset to 'idle'          (app crashed mid-fetch)
 *  - _version mismatch  -> wipe computedTrees cache  (schema changed)
 *  - corrupt node       -> silently dropped           (re-fetched on demand)
 *  - invalid zoomTransform -> zeroed out
 */
// GENEALOGY_STATE_VERSION is now imported from @/constants (single source of truth)
const VALID_STRAIN_TYPES = new Set<string>(Object.values(StrainType))

const sanitizeGenealogyNodeMigration = (raw: unknown, depth = 0): boolean => {
    // Returns false when a node is unrecoverable corrupt so the caller can drop it.
    if (depth > 25 || !raw || typeof raw !== 'object') return false
    const n = raw as Record<string, unknown>
    if (typeof n.id !== 'string' || !n.id) return false
    if (typeof n.name !== 'string' || !n.name) return false
    // Coerce type to a valid StrainType in-place
    if (!VALID_STRAIN_TYPES.has(n.type as string)) n.type = StrainType.Hybrid
    if (typeof n.thc !== 'number' || !Number.isFinite(n.thc as number)) n.thc = 0
    if (typeof n.isLandrace !== 'boolean') n.isLandrace = false
    // Recurse into children / _children
    for (const key of ['children', '_children'] as const) {
        if (Array.isArray(n[key])) {
            n[key] = (n[key] as unknown[]).filter((c) =>
                sanitizeGenealogyNodeMigration(c, depth + 1),
            )
        }
    }
    return true
}

/**
 * Ensures entity-adapter slices have the { ids: [], entities: {} } shape
 * that RTK selectors require.  Runs on EVERY boot to guard against
 * corrupt / legacy IndexedDB data.
 */
const ensureEntityAdapterShape = (
    obj: unknown,
): { ids: string[]; entities: Record<string, unknown> } => {
    if (
        obj &&
        typeof obj === 'object' &&
        Array.isArray((obj as Record<string, unknown>).ids) &&
        (obj as Record<string, unknown>).entities &&
        typeof (obj as Record<string, unknown>).entities === 'object'
    ) {
        return obj as { ids: string[]; entities: Record<string, unknown> }
    }
    return { ids: [], entities: {} }
}

const ensureUserStrainsShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    s.userStrains = ensureEntityAdapterShape(s.userStrains)
}

const ensureSavedItemsShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.savedItems || typeof s.savedItems !== 'object') {
        s.savedItems = {
            savedSetups: { ids: [], entities: {} },
            savedStrainTips: { ids: [], entities: {} },
            savedExports: { ids: [], entities: {} },
        }
        return
    }
    const items = s.savedItems as Record<string, unknown>
    items.savedSetups = ensureEntityAdapterShape(items.savedSetups)
    items.savedStrainTips = ensureEntityAdapterShape(items.savedStrainTips)
    items.savedExports = ensureEntityAdapterShape(items.savedExports)
}

const normalizeSavedStrainTipImages = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    const savedItems = s.savedItems as Record<string, unknown> | undefined
    if (!savedItems || typeof savedItems !== 'object') {
        return
    }

    const savedStrainTips = savedItems.savedStrainTips as Record<string, unknown> | undefined
    if (!savedStrainTips || typeof savedStrainTips !== 'object') {
        return
    }

    const entities = savedStrainTips.entities as Record<string, unknown> | undefined
    if (!entities || typeof entities !== 'object') {
        return
    }

    for (const tip of Object.values(entities)) {
        if (!tip || typeof tip !== 'object') {
            continue
        }

        const savedTip = tip as Record<string, unknown>
        if (typeof savedTip.imageUrl !== 'string') {
            continue
        }

        const normalizedImageUrl = normalizeImageDataUrl(savedTip.imageUrl)
        if (normalizedImageUrl) {
            savedTip.imageUrl = normalizedImageUrl
        } else {
            delete savedTip.imageUrl
        }
    }
}

const ensureFavoritesShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.favorites || typeof s.favorites !== 'object') {
        s.favorites = { favoriteIds: [] }
        return
    }
    const favs = s.favorites as Record<string, unknown>
    if (!Array.isArray(favs.favoriteIds)) {
        favs.favoriteIds = []
    }
}

const ensureArchivesShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.archives || typeof s.archives !== 'object') {
        s.archives = { archivedMentorResponses: [], archivedAdvisorResponses: {} }
        return
    }
    const archives = s.archives as Record<string, unknown>
    if (!Array.isArray(archives.archivedMentorResponses)) {
        archives.archivedMentorResponses = []
    }
    if (
        !archives.archivedAdvisorResponses ||
        typeof archives.archivedAdvisorResponses !== 'object'
    ) {
        archives.archivedAdvisorResponses = {}
    }
}

const ensureNotesShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.notes || typeof s.notes !== 'object') {
        s.notes = { strainNotes: {} }
        return
    }
    const notes = s.notes as Record<string, unknown>
    if (!notes.strainNotes || typeof notes.strainNotes !== 'object') {
        notes.strainNotes = {}
    }
}

const ensureKnowledgeShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.knowledge || typeof s.knowledge !== 'object') {
        s.knowledge = { knowledgeProgress: {} }
        return
    }
    const knowledge = s.knowledge as Record<string, unknown>
    if (!knowledge.knowledgeProgress || typeof knowledge.knowledgeProgress !== 'object') {
        knowledge.knowledgeProgress = {}
    }
}

const ensureBreedingShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.breeding || typeof s.breeding !== 'object') {
        s.breeding = { collectedSeeds: [], breedingSlots: { parentA: null, parentB: null } }
        return
    }
    const breeding = s.breeding as Record<string, unknown>
    if (!Array.isArray(breeding.collectedSeeds)) {
        breeding.collectedSeeds = []
    }
    if (!breeding.breedingSlots || typeof breeding.breedingSlots !== 'object') {
        breeding.breedingSlots = { parentA: null, parentB: null }
    }
}

const ensureSandboxShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.sandbox || typeof s.sandbox !== 'object') {
        s.sandbox = { currentExperiment: null, status: 'idle', savedExperiments: [] }
        return
    }
    const sandbox = s.sandbox as Record<string, unknown>
    if (!Array.isArray(sandbox.savedExperiments)) {
        sandbox.savedExperiments = []
    }
}

const ensureStrainsViewShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.strainsView || typeof s.strainsView !== 'object') {
        s.strainsView = {
            strainsViewTab: 'all',
            strainsViewMode: 'list',
            selectedStrainIds: [],
            selectedStrainId: null,
        }
        return
    }
    const sv = s.strainsView as Record<string, unknown>
    if (!Array.isArray(sv.selectedStrainIds)) {
        sv.selectedStrainIds = []
    }
}

const createGenealogyMigrationState = (
    layoutOrientation: 'horizontal' | 'vertical' = 'horizontal',
    selectedStrainId: string | null = null,
): Record<string, unknown> => ({
    _version: GENEALOGY_STATE_VERSION,
    computedTrees: {},
    status: 'idle',
    selectedStrainId,
    zoomTransform: null,
    layoutOrientation,
})

const sanitizeGenealogyZoomTransform = (g: Record<string, unknown>): void => {
    if (g.zoomTransform && typeof g.zoomTransform === 'object') {
        const zt = g.zoomTransform as Record<string, unknown>
        const isInvalid =
            typeof zt.k !== 'number' ||
            !Number.isFinite(zt.k) ||
            (zt.k as number) <= 0 ||
            typeof zt.x !== 'number' ||
            !Number.isFinite(zt.x) ||
            typeof zt.y !== 'number' ||
            !Number.isFinite(zt.y)
        if (isInvalid) {
            g.zoomTransform = null
        }
        return
    }

    g.zoomTransform = null
}

const sanitizeGenealogyComputedTrees = (g: Record<string, unknown>): void => {
    if (!g.computedTrees || typeof g.computedTrees !== 'object' || Array.isArray(g.computedTrees)) {
        g.computedTrees = {}
        return
    }

    const trees = g.computedTrees as Record<string, unknown>
    for (const id of Object.keys(trees)) {
        if (trees[id] !== null && !sanitizeGenealogyNodeMigration(trees[id], 0)) {
            delete trees[id]
            console.debug(`[MigrationLogic] Dropped corrupt genealogy cache entry: ${id}`)
        }
    }
}

const sanitizeGenealogyMetadata = (g: Record<string, unknown>): void => {
    const rawStatus = g.status as string
    if (rawStatus !== 'succeeded' && rawStatus !== 'failed') {
        g.status = 'idle'
    }

    if (g.layoutOrientation !== 'horizontal' && g.layoutOrientation !== 'vertical') {
        g.layoutOrientation = 'horizontal'
    }

    if (typeof g.selectedStrainId !== 'string' && g.selectedStrainId !== null) {
        g.selectedStrainId = null
    }

    g._version = GENEALOGY_STATE_VERSION
}

const ensureGenealogyShape = (state: PersistedState): void => {
    if (!state.genealogy || typeof state.genealogy !== 'object') {
        // No genealogy key -> supply clean initial state
        ;(state as Record<string, unknown>).genealogy = createGenealogyMigrationState()
        return
    }

    const g = state.genealogy as unknown as Record<string, unknown>

    // Version mismatch -> wipe cache, preserve user preferences
    if (g._version !== GENEALOGY_STATE_VERSION) {
        console.debug(
            `[MigrationLogic] Genealogy state version mismatch (stored: ${g._version}, expected: ${GENEALOGY_STATE_VERSION}) – wiping computedTrees.`,
        )
        const layout = g.layoutOrientation === 'vertical' ? 'vertical' : 'horizontal'
        const selectedId = typeof g.selectedStrainId === 'string' ? g.selectedStrainId : null
        ;(state as Record<string, unknown>).genealogy = createGenealogyMigrationState(
            layout,
            selectedId,
        )
        return
    }

    sanitizeGenealogyComputedTrees(g)
    sanitizeGenealogyZoomTransform(g)
    sanitizeGenealogyMetadata(g)
}

const deepMergeSettings = (persisted: Partial<AppSettings>): AppSettings => {
    const blockedMergeKeys = new Set(['__proto__', 'constructor', 'prototype'])
    const isObject = (item: unknown): item is Record<string, unknown> => {
        return !!item && typeof item === 'object' && !Array.isArray(item)
    }
    const isSafeMergeKey = (key: string): boolean => {
        return !blockedMergeKeys.has(key)
    }

    const output = structuredClone(defaultSettings) as unknown as Record<string, unknown>

    function merge(target: Record<string, unknown>, source: Record<string, unknown>) {
        for (const [key, sourceValue] of Object.entries(source)) {
            if (!isSafeMergeKey(key)) continue
            if (!Object.prototype.hasOwnProperty.call(target, key)) continue

            if (isObject(sourceValue)) {
                const currentTargetValue = target[key]
                if (!isObject(currentTargetValue)) {
                    continue
                }
                merge(target[key] as Record<string, unknown>, sourceValue)
            } else if (sourceValue !== undefined) {
                target[key] = sourceValue
            }
        }
    }
    if (isObject(persisted)) {
        merge(output, persisted)
    }

    const simulationSettings = (output as Record<string, unknown>).simulation as
        | Record<string, unknown>
        | undefined
    if (
        simulationSettings &&
        Object.prototype.hasOwnProperty.call(simulationSettings, 'speedMultiplier')
    ) {
        delete simulationSettings.speedMultiplier
    }

    return output as unknown as AppSettings
}

/**
 * Migration from V1 to V2.
 * - Merges new default settings into persisted settings to prevent crashes on new features.
 * - Adds a new setting property `showArchivedInPlantsView`.
 * - Adds `lastUpdated` property to plant objects if missing.
 */
const migrateV1ToV2 = (state: PersistedState): PersistedState => {
    console.debug('[MigrationLogic] Migrating state from v1 to v2...')

    // Note: 'state' is a plain JS object here, it's safe to mutate before it's loaded into Redux.
    const migratedState: PersistedState = state

    if (migratedState.settings?.settings) {
        migratedState.settings.settings = deepMergeSettings(migratedState.settings.settings)
    } else {
        migratedState.settings = { settings: defaultSettings, version: 1 }
    }

    const legacyPlantsView = migratedState.settings.settings.plantsView as unknown as Record<
        string,
        unknown
    >
    if (typeof legacyPlantsView.showArchivedInPlantsView !== 'undefined') {
        migratedState.settings.settings.plantsView.showArchived =
            legacyPlantsView.showArchivedInPlantsView as boolean
        delete legacyPlantsView.showArchivedInPlantsView
    }

    if (migratedState.simulation?.plants?.entities) {
        for (const id in migratedState.simulation.plants.entities) {
            const plant = migratedState.simulation.plants.entities[id]
            if (plant && !plant.lastUpdated) {
                // Use createdAt as a sensible default for the first lastUpdated value
                plant.lastUpdated = plant.createdAt || Date.now()
            }
        }
    }

    return migratedState
}

const migrateV2ToV3 = (state: PersistedState): PersistedState => {
    console.debug('[MigrationLogic] Migrating state from v2 to v3...')

    const migratedState: PersistedState = state

    if (migratedState.simulation?.plants?.entities) {
        for (const id in migratedState.simulation.plants.entities) {
            const plant = migratedState.simulation.plants.entities[id] as unknown as
                | Record<string, unknown>
                | undefined
            if (plant && !plant.mediumType) {
                plant.mediumType = 'Soil'
            }
        }
    }

    return migratedState
}

/**
 * Merges strain catalogs by id and keeps a stable superset during updates.
 * New bundled entries win for overlapping ids, while unknown legacy ids are retained.
 */
export const mergeStrainCatalogForUpdate = (
    legacyStrains: Strain[],
    bundledStrains: Strain[],
): Strain[] => {
    const mergedById = new Map<string, Strain>()
    const bundledIds = new Set<string>()
    const duplicateIds: string[] = []

    const mergeStrainEntry = (legacy: Strain, strain: Strain): Strain => ({
        ...legacy,
        ...strain,
        agronomic: {
            ...(legacy.agronomic ?? {}),
            ...(strain.agronomic ?? {}),
        },
        geneticModifiers: {
            ...(legacy.geneticModifiers ?? {}),
            ...(strain.geneticModifiers ?? {}),
            vpdTolerance: {
                ...(legacy.geneticModifiers?.vpdTolerance ?? {}),
                ...(strain.geneticModifiers?.vpdTolerance ?? {}),
            },
        },
        aromas: strain.aromas ?? legacy.aromas,
        dominantTerpenes: strain.dominantTerpenes ?? legacy.dominantTerpenes,
        terpeneProfile: strain.terpeneProfile ?? legacy.terpeneProfile,
    })

    legacyStrains.forEach((strain) => {
        mergedById.set(strain.id, strain)
    })

    bundledStrains.forEach((strain) => {
        if (bundledIds.has(strain.id)) {
            duplicateIds.push(strain.id)
            return
        }
        bundledIds.add(strain.id)

        const legacy = mergedById.get(strain.id)
        mergedById.set(strain.id, legacy ? mergeStrainEntry(legacy, strain) : strain)
    })

    if (duplicateIds.length > 0) {
        console.debug(
            '[MigrationLogic] Duplicate bundled strain ids detected:',
            duplicateIds.slice(0, 10),
        )
    }

    return Array.from(mergedById.values())
}

/**
 * V3->V4 migration.
 * - Stamps per-slice schema versions (_sliceVersions) so future migrations can
 *   detect and auto-reset individual stale slices without nuking everything.
 * - Deep-merges settings to absorb any new defaults.
 */
const migrateV3ToV4 = (state: PersistedState): PersistedState => {
    console.debug('[MigrationLogic] Migrating state from v3 to v4...')

    // Deep-merge settings so new keys from defaultSettings are picked up
    if (state.settings?.settings) {
        state.settings.settings = deepMergeSettings(state.settings.settings)
    } else {
        state.settings = { settings: defaultSettings, version: 4 }
    }

    // Stamp per-slice schema versions for the first time
    state._sliceVersions = { ...SLICE_SCHEMA_VERSIONS }

    return state
}

/**
 * V4->V5 migration.
 * Keeps the persisted shape intact but stamps the new version so recovery can
 * distinguish V5 snapshots and snapshot diffs can be logged deterministically.
 */
const migrateV4ToV5 = (state: PersistedState): PersistedState => {
    console.debug('[MigrationLogic] Migrating state from v4 to v5...')

    if (state.settings?.settings) {
        state.settings.settings = deepMergeSettings(state.settings.settings)
    }

    return state
}

/**
 * Strips transient / runtime-only state that must never survive a restart.
 * Called on EVERY boot, regardless of version.
 */
const stripTransientState = (state: PersistedState): void => {
    // Sandbox: 'running' status can never resolve after restart
    if (state.sandbox) {
        const sb = state.sandbox as unknown as Record<string, unknown>
        if (sb.status === 'running') {
            sb.status = 'idle'
            sb.currentExperiment = null
        }
    }

    // Genealogy: 'loading' status marks an interrupted fetch
    if (state.genealogy) {
        const g = state.genealogy as unknown as Record<string, unknown>
        if (g.status === 'loading') {
            g.status = 'idle'
        }
    }

    // UI: reset all transient modal/flow state (only essential persisted fields survive via index.tsx)
    if (state.ui) {
        const ui = state.ui as unknown as Record<string, unknown>
        ui.isAppReady = false
        ui.notifications = []
        ui.isCommandPaletteOpen = false
        ui.isAddModalOpen = false
        ui.isExportModalOpen = false
        ui.strainToEdit = null
        ui.actionModal = { isOpen: false, plantId: null, type: null }
        ui.deepDiveModal = { isOpen: false, plantId: null, topic: null }
        ui.isDiagnosticsModalOpen = false
        ui.diagnosticsPlantId = null
        ui.isSaveSetupModalOpen = false
        ui.setupToSave = null
        ui.highlightedElement = null
        if (ui.newGrowFlow && typeof ui.newGrowFlow === 'object') {
            const flow = ui.newGrowFlow as Record<string, unknown>
            flow.status = 'idle'
            flow.slotIndex = null
            flow.strain = null
            flow.setup = null
        }
    }
}

/**
 * Checks each persisted slice against its expected schema version.
 * If a slice version mismatch is detected, that slice is reset to its
 * initial state (from Redux) rather than crashing the whole app.
 *
 * Returns the list of slice names that were auto-reset.
 */
const validateSliceVersions = (state: PersistedState): VersionedSliceName[] => {
    const persistedVersions = state._sliceVersions ?? {}
    const resetSlices: VersionedSliceName[] = []

    for (const [sliceName, expectedVersion] of Object.entries(SLICE_SCHEMA_VERSIONS)) {
        const name = sliceName as VersionedSliceName
        const persistedVersion = persistedVersions[name]

        if (persistedVersion !== undefined && persistedVersion !== expectedVersion) {
            console.debug(
                `[MigrationLogic] Slice "${name}" version mismatch (stored: ${persistedVersion}, expected: ${expectedVersion}) – resetting to initial state.`,
            )
            // Delete the stale slice data so Redux will use its initialState
            delete (state as Record<string, unknown>)[name]
            resetSlices.push(name)
        }
    }

    // Stamp the current schema versions
    state._sliceVersions = { ...SLICE_SCHEMA_VERSIONS }

    return resetSlices
}

/**
 * Orchestrates the migration of a persisted state object to the current app version.
 * @param persistedState The raw state object loaded from storage.
 * @returns The migrated state object, ready to be hydrated into the store.
 */
export const migrateState = (persistedState: PersistedState): PersistedState => {
    const stateVersion = persistedState.version || 1
    const snapshotBeforeMigration = JSON.parse(JSON.stringify(persistedState)) as PersistedState

    let migratedState: PersistedState = persistedState

    // Sequential version migrations via registry
    const migrations: ReadonlyArray<{
        targetVersion: number
        migrate: (s: PersistedState) => PersistedState
    }> = [
        { targetVersion: 2, migrate: migrateV1ToV2 },
        { targetVersion: 3, migrate: migrateV2ToV3 },
        { targetVersion: 4, migrate: migrateV3ToV4 },
        { targetVersion: 5, migrate: migrateV4ToV5 },
    ]

    if (stateVersion < APP_VERSION) {
        console.debug(
            `[MigrationLogic] Migrating from version ${stateVersion} to ${APP_VERSION}...`,
        )
        for (const { targetVersion, migrate } of migrations) {
            if (stateVersion < targetVersion) {
                migratedState = migrate(migratedState)
            }
        }
    } else {
        console.debug('[MigrationLogic] Persisted state is up to date.')
        if (migratedState.settings?.settings) {
            migratedState.settings.settings = deepMergeSettings(migratedState.settings.settings)
        }
    }

    migratedState.version = APP_VERSION
    if (migratedState.settings) {
        migratedState.settings.version = APP_VERSION
    }

    // Per-slice schema validation (auto-resets stale individual slices)
    const resetSlices = validateSliceVersions(migratedState)
    if (resetSlices.length > 0) {
        console.debug(`[MigrationLogic] Auto-reset slices: ${resetSlices.join(', ')}`)
    }

    // Shape-level sanitization (runs every boot)
    const shapeValidators = [
        ensureSimulationShape,
        ensureGenealogyShape,
        ensureUserStrainsShape,
        ensureSavedItemsShape,
        normalizeSavedStrainTipImages,
        ensureFavoritesShape,
        ensureArchivesShape,
        ensureNotesShape,
        ensureKnowledgeShape,
        ensureBreedingShape,
        ensureSandboxShape,
        ensureStrainsViewShape,
    ] as const
    for (const validate of shapeValidators) {
        validate(migratedState)
    }

    // Strip all transient / runtime-only state (runs every boot)
    stripTransientState(migratedState)

    const snapshotDiff = createSnapshotDiff(snapshotBeforeMigration, migratedState)
    if (
        snapshotDiff.added.length > 0 ||
        snapshotDiff.removed.length > 0 ||
        snapshotDiff.changed.length > 0
    ) {
        console.debug('[MigrationLogic] Snapshot diff summary:', snapshotDiff)
    }

    return migratedState
}
