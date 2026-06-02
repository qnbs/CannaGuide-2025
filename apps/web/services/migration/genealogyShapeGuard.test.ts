import { describe, expect, it } from 'vitest'
import { GENEALOGY_STATE_VERSION } from '@/constants'
import { ensureGenealogyShape } from '@/services/migration/genealogyShapeGuard'
import type { PersistedState } from '@/services/migration/migrationTypes'

describe('ensureGenealogyShape', () => {
    it('creates genealogy state when missing', () => {
        const state = {} as PersistedState
        ensureGenealogyShape(state)
        const genealogy = (state as Record<string, unknown>).genealogy as Record<string, unknown>
        expect(genealogy._version).toBe(GENEALOGY_STATE_VERSION)
        expect(genealogy.status).toBe('idle')
    })

    it('resets genealogy on version mismatch but keeps layout preference', () => {
        const state = {
            genealogy: {
                _version: 0,
                layoutOrientation: 'vertical',
                selectedStrainId: 'strain-42',
                computedTrees: { stale: true },
                zoomTransform: { k: 0, x: 1, y: 1 },
            },
        } as unknown as PersistedState
        ensureGenealogyShape(state)
        const genealogy = (state as Record<string, unknown>).genealogy as Record<string, unknown>
        expect(genealogy._version).toBe(GENEALOGY_STATE_VERSION)
        expect(genealogy.layoutOrientation).toBe('vertical')
        expect(genealogy.selectedStrainId).toBe('strain-42')
        expect(genealogy.computedTrees).toEqual({})
        expect(genealogy.zoomTransform).toBeNull()
    })

    it('sanitizes invalid zoom transform on current version', () => {
        const state = {
            genealogy: {
                _version: GENEALOGY_STATE_VERSION,
                computedTrees: {},
                status: 'idle',
                selectedStrainId: null,
                zoomTransform: { k: -1, x: NaN, y: 0 },
                layoutOrientation: 'horizontal',
            },
        } as PersistedState
        ensureGenealogyShape(state)
        const genealogy = (state as Record<string, unknown>).genealogy as Record<string, unknown>
        expect(genealogy.zoomTransform).toBeNull()
    })
})
