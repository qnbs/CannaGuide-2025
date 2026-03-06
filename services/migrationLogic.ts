import { AppSettings, Strain, StrainType } from '@/types'
import { defaultSettings } from '@/stores/slices/settingsSlice'
import { RootState } from '@/stores/store'
import { APP_VERSION, GENEALOGY_STATE_VERSION, SLICE_SCHEMA_VERSIONS, VersionedSliceName } from '@/constants'

// This represents the shape of the persisted state object.
export type PersistedState = Partial<RootState> & {
    version?: number
    /** Per-slice schema versions stamped at persist time. */
    _sliceVersions?: Partial<Record<VersionedSliceName, number>>
}

const ensureSimulationShape = (state: PersistedState): void => {
    if (!state.simulation) {
        return
    }

    const sim = state.simulation as unknown as Record<string, unknown>
    if (!Array.isArray(sim.plantSlots)) {
        sim.plantSlots = [null, null, null]
    }
    if (typeof sim.selectedPlantId === 'undefined') {
        sim.selectedPlantId = null
    }
    if (typeof sim.devSpeedMultiplier !== 'number') {
        sim.devSpeedMultiplier = 1
    }
    if (!sim.vpdProfiles || typeof sim.vpdProfiles !== 'object') {
        sim.vpdProfiles = {}
    }

    // Patch any persisted plant objects that are missing fields introduced after
    // the initial simulation build. This prevents the engine from crashing on
    // old localStorage data after an update.
    type LegacyPlant = Record<string, unknown>
    const entities = (sim.plants as Record<string, unknown>)?.entities
    if (entities && typeof entities === 'object') {
        for (const id in entities as Record<string, unknown>) {
            const plant = (entities as Record<string, LegacyPlant | undefined>)[id]
            if (!plant) continue

            if (!plant.rootSystem || typeof plant.rootSystem !== 'object') {
                plant.rootSystem = { health: 100, rootMass: 0.01 }
            }
            if (!plant.stressCounters || typeof plant.stressCounters !== 'object') {
                plant.stressCounters = { vpd: 0, ph: 0, ec: 0, moisture: 0 }
            }
            if (!plant.cannabinoidProfile || typeof plant.cannabinoidProfile !== 'object') {
                plant.cannabinoidProfile = { thc: 0, cbd: 0, cbn: 0 }
            }
            if (!plant.terpeneProfile || typeof plant.terpeneProfile !== 'object') {
                plant.terpeneProfile = {}
            }
            if (!plant.structuralModel || typeof plant.structuralModel !== 'object') {
                plant.structuralModel = { branches: 1, nodes: 1 }
            }
            if (!plant.medium || typeof plant.medium !== 'object') {
                plant.medium = { ph: 6.5, ec: 0.8, moisture: 80, microbeHealth: 80, substrateWater: 0, nutrientConcentration: { nitrogen: 100, phosphorus: 100, potassium: 100 } }
            } else {
                const medium = plant.medium as Record<string, unknown>
                if (typeof medium.microbeHealth !== 'number') medium.microbeHealth = 80
                if (typeof medium.substrateWater !== 'number') medium.substrateWater = 0
                if (!medium.nutrientConcentration) medium.nutrientConcentration = { nitrogen: 100, phosphorus: 100, potassium: 100 }
            }
            if (!plant.nutrientPool || typeof plant.nutrientPool !== 'object') {
                plant.nutrientPool = { nitrogen: 5, phosphorus: 5, potassium: 5 }
            }
            // phenotypeModifiers is optional – fill it from strain defaults so the
            // engine can use per-plant modifiers without crashing on old saves.
            const legacyStrain = plant.strain as Record<string, unknown> | undefined
            if (!plant.phenotypeModifiers && legacyStrain?.geneticModifiers) {
                plant.phenotypeModifiers = { ...(legacyStrain.geneticModifiers as object) }
            }
        }
    }
}

/**
 * Sanitizes the persisted genealogy slice before it hits Redux.
 * This runs on EVERY boot (both migrating and up-to-date paths) so corrupt
 * data from interrupted fetches or schema changes never reaches the renderer.
 *
 * Key invariants enforced:
 *  - status: 'loading'  → reset to 'idle'          (app crashed mid-fetch)
 *  - _version mismatch  → wipe computedTrees cache  (schema changed)
 *  - corrupt node       → silently dropped           (re-fetched on demand)
 *  - invalid zoomTransform → zeroed out
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
    if (typeof n.thc !== 'number' || !isFinite(n.thc as number)) n.thc = 0
    if (typeof n.isLandrace !== 'boolean') n.isLandrace = false
    // Recurse into children / _children
    for (const key of ['children', '_children'] as const) {
        if (Array.isArray(n[key])) {
            n[key] = (n[key] as unknown[]).filter((c) => sanitizeGenealogyNodeMigration(c, depth + 1))
        }
    }
    return true
}

const ensureGenealogyShape = (state: PersistedState): void => {
    if (!state.genealogy || typeof state.genealogy !== 'object') {
        // No genealogy key → supply clean initial state
        ;(state as Record<string, unknown>).genealogy = {
            _version: GENEALOGY_STATE_VERSION,
            computedTrees: {},
            status: 'idle',
            selectedStrainId: null,
            zoomTransform: null,
            layoutOrientation: 'horizontal',
        }
        return
    }

    const g = (state.genealogy as unknown) as Record<string, unknown>

    // Version mismatch → wipe cache, preserve user preferences
    if (g._version !== GENEALOGY_STATE_VERSION) {
        console.warn(
            `[MigrationLogic] Genealogy state version mismatch (stored: ${g._version}, expected: ${GENEALOGY_STATE_VERSION}) – wiping computedTrees.`,
        )
        const layout = g.layoutOrientation === 'vertical' ? 'vertical' : 'horizontal'
        const selectedId = typeof g.selectedStrainId === 'string' ? g.selectedStrainId : null
        ;(state as Record<string, unknown>).genealogy = {
            _version: GENEALOGY_STATE_VERSION,
            computedTrees: {},
            status: 'idle',
            selectedStrainId: selectedId,
            zoomTransform: null,
            layoutOrientation: layout,
        }
        return
    }

    // status: never keep 'loading' across a restart
    const rawStatus = g.status as string
    if (rawStatus !== 'succeeded' && rawStatus !== 'failed') {
        g.status = 'idle'
    }

    // computedTrees: validate + repair each cached node tree in-place
    if (!g.computedTrees || typeof g.computedTrees !== 'object' || Array.isArray(g.computedTrees)) {
        g.computedTrees = {}
    } else {
        const trees = g.computedTrees as Record<string, unknown>
        for (const id of Object.keys(trees)) {
            if (trees[id] !== null && !sanitizeGenealogyNodeMigration(trees[id], 0)) {
                // Un-salvageable node – drop so it's re-fetched on demand
                delete trees[id]
                console.warn(`[MigrationLogic] Dropped corrupt genealogy cache entry: ${id}`)
            }
        }
    }

    // zoomTransform: validate or null-out
    if (g.zoomTransform && typeof g.zoomTransform === 'object') {
        const zt = g.zoomTransform as Record<string, unknown>
        if (
            typeof zt.k !== 'number' || !isFinite(zt.k) || (zt.k as number) <= 0 ||
            typeof zt.x !== 'number' || !isFinite(zt.x) ||
            typeof zt.y !== 'number' || !isFinite(zt.y)
        ) {
            g.zoomTransform = null
        }
    } else {
        g.zoomTransform = null
    }

    // layoutOrientation
    if (g.layoutOrientation !== 'horizontal' && g.layoutOrientation !== 'vertical') {
        g.layoutOrientation = 'horizontal'
    }

    // selectedStrainId
    if (typeof g.selectedStrainId !== 'string' && g.selectedStrainId !== null) {
        g.selectedStrainId = null
    }

    // Stamp current version
    g._version = GENEALOGY_STATE_VERSION
}

const deepMergeSettings = (persisted: Partial<AppSettings>): AppSettings => {
    const isObject = (item: unknown): item is Record<string, unknown> => {
        return !!item && typeof item === 'object' && !Array.isArray(item)
    }

    const output = JSON.parse(JSON.stringify(defaultSettings)) // Deep clone defaults

    function merge(target: Record<string, unknown>, source: Record<string, unknown>) {
        for (const key of Object.keys(source)) {
            const sourceValue = source[key]
            if (isObject(sourceValue)) {
                if (!target[key] || !isObject(target[key])) {
                    target[key] = {}
                }
                merge(target[key] as Record<string, unknown>, sourceValue as Record<string, unknown>)
            } else if (sourceValue !== undefined) {
                target[key] = sourceValue
            }
        }
    }
    if (isObject(persisted)) {
        merge(output, persisted)
    }
    return output
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

    const legacyPlantsView = migratedState.settings.settings.plantsView as unknown as Record<string, unknown>
    if (typeof legacyPlantsView.showArchivedInPlantsView !== 'undefined') {
        migratedState.settings.settings.plantsView.showArchived = legacyPlantsView.showArchivedInPlantsView as boolean
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
            const plant = migratedState.simulation.plants.entities[id] as unknown as Record<string, unknown> | undefined
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
export const mergeStrainCatalogForUpdate = (legacyStrains: Strain[], bundledStrains: Strain[]): Strain[] => {
    const mergedById = new Map<string, Strain>()

    legacyStrains.forEach((strain) => {
        mergedById.set(strain.id, strain)
    })

    bundledStrains.forEach((strain) => {
        const legacy = mergedById.get(strain.id)
        mergedById.set(strain.id, legacy ? { ...legacy, ...strain } : strain)
    })

    return Array.from(mergedById.values())
}

/**
 * V3→V4 migration.
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
 * Strips transient / runtime-only state that must never survive a restart.
 * Called on EVERY boot, regardless of version.
 */
const stripTransientState = (state: PersistedState): void => {
    // TTS: always starts idle — queue and speaking state are runtime only
    if (state.tts) {
        const tts = state.tts as unknown as Record<string, unknown>
        tts.ttsQueue = []
        tts.isTtsSpeaking = false
        tts.isTtsPaused = false
        tts.currentlySpeakingId = null
    }

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
            console.warn(
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

    let migratedState: PersistedState = persistedState

    if (stateVersion < APP_VERSION) {
        console.debug(`[MigrationLogic] Migrating from version ${stateVersion} to ${APP_VERSION}...`)

        if (stateVersion < 2) {
            migratedState = migrateV1ToV2(migratedState)
        }
        if (stateVersion < 3) {
            migratedState = migrateV2ToV3(migratedState)
        }
        if (stateVersion < 4) {
            migratedState = migrateV3ToV4(migratedState)
        }
    } else {
        console.debug('[MigrationLogic] Persisted state is up to date.')
        // Even on current version, merge settings to catch new defaults from minor updates
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
    ensureSimulationShape(migratedState)
    ensureGenealogyShape(migratedState)

    // Strip all transient / runtime-only state (runs every boot)
    stripTransientState(migratedState)

    return migratedState
}
