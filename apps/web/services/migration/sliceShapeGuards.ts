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
    }
}

export const ensureKnowledgeShape = (state: PersistedState): void => {
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

export const ensureBreedingShape = (state: PersistedState): void => {
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
