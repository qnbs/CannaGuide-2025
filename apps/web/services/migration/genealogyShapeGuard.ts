import { StrainType } from '@/types'
import { GENEALOGY_STATE_VERSION } from '@/constants'
import type { PersistedState } from '@/services/migration/migrationTypes'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

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

export const ensureGenealogyShape = (state: PersistedState): void => {
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
