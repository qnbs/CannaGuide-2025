import { DEFAULT_GROW_ID, DEFAULT_GROW_NAME } from '@/constants'
import { normalizeImageDataUrl } from '@/utils/imageDataUrl'
import type { PersistedState } from '@/services/migration/migrationTypes'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

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

export const ensureUserStrainsShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    s.userStrains = ensureEntityAdapterShape(s.userStrains)
}

export const ensureSavedItemsShape = (state: PersistedState): void => {
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

export const normalizeSavedStrainTipImages = (state: PersistedState): void => {
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

export const ensureFavoritesShape = (state: PersistedState): void => {
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

export const ensureArchivesShape = (state: PersistedState): void => {
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
    } else {
        const advisorResponses = archives.archivedAdvisorResponses as Record<string, unknown>
        for (const plantId of Object.keys(advisorResponses)) {
            if (!Array.isArray(advisorResponses[plantId])) advisorResponses[plantId] = []
        }
    }
}

export const ensureNotesShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.notes || typeof s.notes !== 'object') {
        s.notes = { strainNotes: {} }
        return
    }
    const notes = s.notes as Record<string, unknown>
    if (!notes.strainNotes || typeof notes.strainNotes !== 'object') {
        notes.strainNotes = {}
        return
    }
    const histories = notes.strainNotes as Record<string, unknown>
    for (const strainId of Object.keys(histories)) {
        const history = histories[strainId]
        if (!history || typeof history !== 'object') {
            histories[strainId] = { past: [], present: '', future: [] }
            continue
        }
        const note = history as Record<string, unknown>
        if (!Array.isArray(note.past)) note.past = []
        if (typeof note.present !== 'string') note.present = ''
        if (!Array.isArray(note.future)) note.future = []
    }
}

export const ensureKnowledgeShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.knowledge || typeof s.knowledge !== 'object') {
        s.knowledge = { knowledgeProgress: {}, learningPathProgress: {} }
        return
    }
    const knowledge = s.knowledge as Record<string, unknown>
    if (!knowledge.knowledgeProgress || typeof knowledge.knowledgeProgress !== 'object') {
        knowledge.knowledgeProgress = {}
    }
    if (!knowledge.learningPathProgress || typeof knowledge.learningPathProgress !== 'object') {
        knowledge.learningPathProgress = {}
    }
    for (const progressKey of ['knowledgeProgress', 'learningPathProgress'] as const) {
        const progress = knowledge[progressKey] as Record<string, unknown>
        for (const itemId of Object.keys(progress)) {
            if (!Array.isArray(progress[itemId])) progress[itemId] = []
        }
    }
}

export const ensureBreedingShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.breeding || typeof s.breeding !== 'object') {
        s.breeding = {
            collectedSeeds: [],
            breedingSlots: { parentA: null, parentB: null },
            seedInventory: [],
            pollenRecords: [],
        }
        return
    }
    const breeding = s.breeding as Record<string, unknown>
    if (!Array.isArray(breeding.collectedSeeds)) {
        breeding.collectedSeeds = []
    }
    if (!breeding.breedingSlots || typeof breeding.breedingSlots !== 'object') {
        breeding.breedingSlots = { parentA: null, parentB: null }
    }
    if (!Array.isArray(breeding.seedInventory)) breeding.seedInventory = []
    if (!Array.isArray(breeding.pollenRecords)) breeding.pollenRecords = []
}

export const ensureSandboxShape = (state: PersistedState): void => {
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

/**
 * Ensures the grows slice has a valid shape with at least the default grow.
 * Runs on every boot to guard against corrupt / missing grow data.
 */
export const ensureGrowsShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.grows || typeof s.grows !== 'object') {
        const now = Date.now()
        s.grows = {
            grows: {
                ids: [DEFAULT_GROW_ID],
                entities: {
                    [DEFAULT_GROW_ID]: {
                        id: DEFAULT_GROW_ID,
                        name: DEFAULT_GROW_NAME,
                        createdAt: now,
                        updatedAt: now,
                        isActive: true,
                    },
                },
            },
            activeGrowId: DEFAULT_GROW_ID,
        }
        return
    }
    const grows = s.grows as Record<string, unknown>
    if (!grows.grows || typeof grows.grows !== 'object') {
        const now = Date.now()
        grows.grows = {
            ids: [DEFAULT_GROW_ID],
            entities: {
                [DEFAULT_GROW_ID]: {
                    id: DEFAULT_GROW_ID,
                    name: DEFAULT_GROW_NAME,
                    createdAt: now,
                    updatedAt: now,
                    isActive: true,
                },
            },
        }
    } else {
        const inner = grows.grows as Record<string, unknown>
        inner.ids = Array.isArray(inner.ids) ? inner.ids : [DEFAULT_GROW_ID]
        inner.entities = inner.entities && typeof inner.entities === 'object' ? inner.entities : {}
    }
    if (typeof grows.activeGrowId !== 'string') {
        grows.activeGrowId = DEFAULT_GROW_ID
    }

    // Ensure all plants have a growId
    const sim = s.simulation as Record<string, unknown> | undefined
    if (sim) {
        const plants = sim.plants as Record<string, unknown> | undefined
        const entities = plants?.entities as Record<string, Record<string, unknown>> | undefined
        if (entities) {
            for (const id in entities) {
                const plant = entities[id]
                if (plant && typeof plant.growId !== 'string') {
                    plant.growId = DEFAULT_GROW_ID
                }
            }
        }
    }

    // Ensure all nutrient schedule entries have a growId
    const np = s.nutrientPlanner as Record<string, unknown> | undefined
    if (np && Array.isArray(np.schedule)) {
        for (const entry of np.schedule as Record<string, unknown>[]) {
            if (entry && typeof entry.growId !== 'string') {
                entry.growId = DEFAULT_GROW_ID
            }
        }
    }
}

const migrateArrayToEntityCollection = <T extends { id: string }>(
    value: unknown,
): { ids: string[]; entities: Record<string, T> } => {
    if (Array.isArray(value)) {
        const items = value as T[]
        return {
            ids: items.map((item) => item.id),
            entities: Object.fromEntries(items.map((item) => [item.id, item])),
        }
    }
    return ensureEntityAdapterShape(value) as { ids: string[]; entities: Record<string, T> }
}

export const ensureProblemTrackerShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.problemTracker || typeof s.problemTracker !== 'object') {
        s.problemTracker = { issues: { ids: [], entities: {} } }
        return
    }
    const pt = s.problemTracker as Record<string, unknown>
    pt.issues = migrateArrayToEntityCollection(pt.issues)
}

export const ensureDiagnosisHistoryShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (!s.diagnosisHistory || typeof s.diagnosisHistory !== 'object') {
        s.diagnosisHistory = { records: { ids: [], entities: {} } }
        return
    }
    const dh = s.diagnosisHistory as Record<string, unknown>
    dh.records = migrateArrayToEntityCollection(dh.records)
}

export const ensureNutrientPlannerShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (s.nutrientPlanner === undefined) return
    if (
        !s.nutrientPlanner ||
        typeof s.nutrientPlanner !== 'object' ||
        Array.isArray(s.nutrientPlanner)
    ) {
        delete s.nutrientPlanner
        return
    }
    const planner = s.nutrientPlanner as Record<string, unknown>
    if (!Array.isArray(planner.schedule)) planner.schedule = []
    if (!Array.isArray(planner.readings)) planner.readings = []
    if (!Array.isArray(planner.alerts)) planner.alerts = []
    if (typeof planner.autoAdjustEnabled !== 'boolean') planner.autoAdjustEnabled = false
    if (!['Soil', 'Coco', 'Hydro'].includes(String(planner.medium))) planner.medium = 'Soil'
    planner.isAiLoading = false
    for (const key of [
        'lastAiRecommendation',
        'activePluginId',
        'activeBrandId',
        'autoAdjustRecommendation',
    ] as const) {
        if (typeof planner[key] !== 'string') planner[key] = null
    }
}

export const ensureHydroShape = (state: PersistedState): void => {
    const s = state as Record<string, unknown>
    if (s.hydro === undefined) return
    if (!s.hydro || typeof s.hydro !== 'object' || Array.isArray(s.hydro)) {
        delete s.hydro
        return
    }
    const hydro = s.hydro as Record<string, unknown>
    if (!Array.isArray(hydro.readings)) hydro.readings = []
    if (!Array.isArray(hydro.alerts)) hydro.alerts = []
    if (typeof hydro.systemType !== 'string') hydro.systemType = 'DWC'
    if (
        !hydro.thresholds ||
        typeof hydro.thresholds !== 'object' ||
        Array.isArray(hydro.thresholds)
    ) {
        hydro.thresholds = {
            phMin: 5.5,
            phMax: 6.5,
            ecMin: 0.8,
            ecMax: 2.4,
            waterTempMin: 18,
            waterTempMax: 24,
        }
    }
}

export const ensureMetricsShape = (state: PersistedState): void => {
    const metrics = (state as Record<string, unknown>).metrics
    if (metrics === undefined) return
    if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
        ;(state as Record<string, unknown>).metrics = { readings: [] }
        return
    }
    if (!Array.isArray((metrics as Record<string, unknown>).readings)) {
        ;(metrics as Record<string, unknown>).readings = []
    }
}

export const ensureGrowPlannerShape = (state: PersistedState): void => {
    const planner = (state as Record<string, unknown>).growPlanner
    if (planner === undefined) return
    if (!planner || typeof planner !== 'object' || Array.isArray(planner)) {
        ;(state as Record<string, unknown>).growPlanner = { tasks: [] }
        return
    }
    if (!Array.isArray((planner as Record<string, unknown>).tasks)) {
        ;(planner as Record<string, unknown>).tasks = []
    }
}

export const ensureStrainsViewShape = (state: PersistedState): void => {
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
