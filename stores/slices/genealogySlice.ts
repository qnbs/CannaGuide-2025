import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { GenealogyNode, Strain, StrainType } from '@/types'
import { geneticsService } from '@/services/geneticsService'
import { GENEALOGY_STATE_VERSION } from '@/constants'
import type { RootState } from '../store'

// Re-export so existing consumers (GenealogyView etc.) keep working
export { GENEALOGY_STATE_VERSION }

interface SerializableZoomTransform {
    k: number
    x: number
    y: number
}

export interface GenealogyState {
    /** Schema version – used to detect stale persisted state. */
    _version: number
    computedTrees: { [strainId: string]: GenealogyNode | null }
    /** Never persisted as 'loading' – reset to 'idle' on rehydration. */
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    selectedStrainId: string | null
    zoomTransform: SerializableZoomTransform | null
    layoutOrientation: 'horizontal' | 'vertical'
}

export const initialGenealogyState: GenealogyState = {
    _version: GENEALOGY_STATE_VERSION,
    computedTrees: {},
    status: 'idle',
    selectedStrainId: null,
    zoomTransform: null,
    layoutOrientation: 'horizontal',
}

// Use the exported constant internally
const initialState: GenealogyState = initialGenealogyState

// ---------------------------------------------------------------------------
// Node-level validation
// ---------------------------------------------------------------------------
const VALID_STRAIN_TYPES = new Set<string>(Object.values(StrainType))

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && isFinite(value)

const toZoomTransform = (raw: unknown): SerializableZoomTransform | null => {
    if (!raw || typeof raw !== 'object') {
        return null
    }

    const zt = raw as Record<string, unknown>
    if (!isFiniteNumber(zt.k) || zt.k <= 0) {
        return null
    }
    if (!isFiniteNumber(zt.x) || !isFiniteNumber(zt.y)) {
        return null
    }

    return { k: zt.k, x: zt.x, y: zt.y }
}

const isValidCachedTreeRoot = (tree: unknown): boolean => {
    if (!tree || typeof tree !== 'object') {
        return false
    }
    const t = tree as Record<string, unknown>
    if (typeof t.id !== 'string' || typeof t.name !== 'string') {
        return false
    }
    return VALID_STRAIN_TYPES.has(t.type as string)
}

const sanitizeNode = (raw: unknown, depth = 0): GenealogyNode | null => {
    // Guard: max depth 25 prevents stack overflow on circular-looking data
    if (depth > 25 || !raw || typeof raw !== 'object') return null
    const n = raw as Record<string, unknown>

    if (typeof n.id !== 'string' || !n.id) return null
    if (typeof n.name !== 'string' || !n.name) return null

    const type: StrainType = VALID_STRAIN_TYPES.has(n.type as string)
        ? (n.type as StrainType)
        : StrainType.Hybrid
    const thc = typeof n.thc === 'number' && isFinite(n.thc) ? n.thc : 0
    const isLandrace = typeof n.isLandrace === 'boolean' ? n.isLandrace : false

    const node: GenealogyNode = { id: n.id, name: n.name, type, thc, isLandrace }

    if (n.isPlaceholder === true) node.isPlaceholder = true

    if (Array.isArray(n.children) && n.children.length > 0) {
        const children = n.children
            .map((c: unknown) => sanitizeNode(c, depth + 1))
            .filter((c): c is GenealogyNode => c !== null)
        if (children.length > 0) node.children = children
    }

    if (Array.isArray(n._children) && n._children.length > 0) {
        const collapsed = n._children
            .map((c: unknown) => sanitizeNode(c, depth + 1))
            .filter((c): c is GenealogyNode => c !== null)
        if (collapsed.length > 0) node._children = collapsed
    }

    return node
}

// ---------------------------------------------------------------------------
// sanitizeGenealogyState
// Called by migrationLogic before state is loaded into Redux.
// Guarantees a structurally valid GenealogyState on every boot:
//   - Resets status: 'loading' → 'idle'  (app may have crashed mid-fetch)
//   - Version mismatch            → wipes computedTrees cache, keeps prefs
//   - Corrupt node entries        → silently dropped (re-fetched on demand)
//   - Invalid zoom / layout       → fallback to defaults
// ---------------------------------------------------------------------------
export const sanitizeGenealogyState = (raw: unknown): GenealogyState => {
    if (!raw || typeof raw !== 'object') {
        console.warn('[GenealogySlice] No genealogy state in storage – using initial state.')
        return { ...initialGenealogyState }
    }

    const s = raw as Record<string, unknown>

    // Extract preferences first so we can preserve them on version mismatch
    const layoutOrientation: GenealogyState['layoutOrientation'] =
        s.layoutOrientation === 'vertical' ? 'vertical' : 'horizontal'
    const selectedStrainId = typeof s.selectedStrainId === 'string' ? s.selectedStrainId : null

    // Version mismatch → wipe cache, preserve user prefs
    if (s._version !== GENEALOGY_STATE_VERSION) {
        console.warn(
            `[GenealogySlice] State version mismatch (stored: ${s._version}, expected: ${GENEALOGY_STATE_VERSION}) – wiping computedTrees cache.`,
        )
        return {
            ...initialGenealogyState,
            layoutOrientation,
            selectedStrainId,
        }
    }

    // Validate and sanitize computedTrees (pure cache – corrupt entries are dropped)
    const computedTrees: GenealogyState['computedTrees'] = {}
    const rawTrees = s.computedTrees
    if (rawTrees && typeof rawTrees === 'object' && !Array.isArray(rawTrees)) {
        for (const [id, tree] of Object.entries(rawTrees as Record<string, unknown>)) {
            if (typeof id !== 'string') continue
            if (tree === null) {
                // null = "fetched, strain not found" – preserve so we don't re-fetch
                computedTrees[id] = null
            } else {
                const sanitized = sanitizeNode(tree)
                // Corrupt entry is silently dropped → re-fetched on demand
                if (sanitized !== null) computedTrees[id] = sanitized
            }
        }
    }

    // status: NEVER rehydrate 'loading' (marks an interrupted fetch)
    const rawStatus = s.status
    const status: GenealogyState['status'] =
        rawStatus === 'succeeded' || rawStatus === 'failed' ? rawStatus : 'idle'

    const zoomTransform = toZoomTransform(s.zoomTransform)

    return {
        _version: GENEALOGY_STATE_VERSION,
        computedTrees,
        status,
        selectedStrainId,
        zoomTransform,
        layoutOrientation,
    }
}

// ---------------------------------------------------------------------------
// Runtime corruption check – used by GenealogyView on mount to detect
// persisted state that slipped past sanitize (e.g. Service Worker serving
// an old bundle with a different schema, or IndexedDB write race).
// Returns true if the state is structurally corrupt and must be reset.
// ---------------------------------------------------------------------------
export const isGenealogyStateCorrupt = (state: unknown): boolean => {
    if (!state || typeof state !== 'object') return true
    const s = state as Record<string, unknown>

    // Version mismatch → stale cache from old bundle
    if (s._version !== GENEALOGY_STATE_VERSION) return true

    // status stuck on 'loading' → interrupted fetch, will never resolve
    if (s.status === 'loading') return true

    // computedTrees must be a plain object (not null, not array)
    if (
        s.computedTrees == null ||
        typeof s.computedTrees !== 'object' ||
        Array.isArray(s.computedTrees)
    )
        return true

    // Spot-check: any cached tree root must have id+name+type
    const trees = s.computedTrees as Record<string, unknown>
    for (const tree of Object.values(trees)) {
        if (tree === null) continue // null = "strain not found" sentinel
        if (!isValidCachedTreeRoot(tree)) return true
    }

    return false
}

// ---------------------------------------------------------------------------
// AsyncThunk
// ---------------------------------------------------------------------------
export const fetchAndBuildGenealogy = createAsyncThunk<
    { strainId: string; tree: GenealogyNode | null },
    { strainId: string; allStrains: Strain[] },
    { state: RootState }
>('genealogy/fetchAndBuild', async ({ strainId, allStrains }, { getState }) => {
    const { genealogy } = getState()
    // `in` check: null (strain not found) is a valid cached result
    if (strainId in genealogy.computedTrees) {
        return { strainId, tree: genealogy.computedTrees[strainId] ?? null }
    }
    const tree = geneticsService.buildGenealogyTree(strainId, allStrains)
    return { strainId, tree }
})

// ---------------------------------------------------------------------------
// Node toggle helper
// ---------------------------------------------------------------------------
const findAndToggleNode = (node: GenealogyNode, nodeId: string): boolean => {
    if (node.id === nodeId) {
        if (node.children) {
            node._children = node.children
            delete node.children
        } else if (node._children) {
            node.children = node._children
            delete node._children
        }
        return true
    }
    const children = node.children || node._children
    if (children) {
        for (const child of children) {
            if (findAndToggleNode(child, nodeId)) return true
        }
    }
    return false
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------
const genealogySlice = createSlice({
    name: 'genealogy',
    initialState,
    reducers: {
        setGenealogyState: (_state, action: PayloadAction<GenealogyState>) => {
            // Always sanitize before applying external state
            return sanitizeGenealogyState(action.payload)
        },
        setSelectedGenealogyStrain: (state, action: PayloadAction<string | null>) => {
            const id = typeof action.payload === 'string' ? action.payload : null
            if (state.selectedStrainId !== id) {
                state.selectedStrainId = id
                state.zoomTransform = null
            }
        },
        setGenealogyZoom: (state, action: PayloadAction<SerializableZoomTransform>) => {
            const { k, x, y } = action.payload
            // Reject NaN / Infinity values that would corrupt the persisted state
            if (
                typeof k === 'number' &&
                isFinite(k) &&
                k > 0 &&
                typeof x === 'number' &&
                isFinite(x) &&
                typeof y === 'number' &&
                isFinite(y)
            ) {
                state.zoomTransform = { k, x, y }
            }
        },
        resetGenealogyZoom: (state) => {
            state.zoomTransform = null
        },
        setGenealogyLayout: (state, action: PayloadAction<'horizontal' | 'vertical'>) => {
            state.layoutOrientation = action.payload === 'vertical' ? 'vertical' : 'horizontal'
            state.zoomTransform = null
        },
        toggleGenealogyNode: (
            state,
            action: PayloadAction<{ strainId: string; nodeId: string }>,
        ) => {
            const { strainId, nodeId } = action.payload
            if (typeof strainId !== 'string' || typeof nodeId !== 'string') return
            const tree = state.computedTrees[strainId]
            if (tree) {
                try {
                    findAndToggleNode(tree, nodeId)
                } catch {
                    // Corrupt tree – drop cache entry so it's re-fetched cleanly
                    delete state.computedTrees[strainId]
                }
            }
        },
        /** Wipes the computed-trees cache. Trees are rebuilt on next selection. */
        resetGenealogyCache: (state) => {
            state.computedTrees = {}
            state.status = 'idle'
        },
        resetGenealogy: () => ({ ...initialGenealogyState }),
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAndBuildGenealogy.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchAndBuildGenealogy.fulfilled, (state, action) => {
                state.status = 'succeeded'
                if (action.payload) {
                    state.computedTrees[action.payload.strainId] = action.payload.tree
                }
            })
            .addCase(fetchAndBuildGenealogy.rejected, (state) => {
                state.status = 'failed'
            })
    },
})

export const {
    setGenealogyState,
    setSelectedGenealogyStrain,
    setGenealogyZoom,
    resetGenealogyZoom,
    setGenealogyLayout,
    toggleGenealogyNode,
    resetGenealogyCache,
    resetGenealogy,
} = genealogySlice.actions

export default genealogySlice.reducer
