import { describe, it, expect } from 'vitest'
import reducer, {
    addGrow,
    updateGrow,
    removeGrow,
    setActiveGrowId,
    setGrowsState,
    createDefaultGrow,
    growsAdapter,
} from './growsSlice'
import type { GrowsState, Grow } from '@/types'
import { DEFAULT_GROW_ID, MAX_GROWS } from '@/constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInitialState = (): GrowsState => ({
    grows: growsAdapter.addOne(growsAdapter.getInitialState(), createDefaultGrow()),
    activeGrowId: DEFAULT_GROW_ID,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('growsSlice', () => {
    it('has default grow in initial state', () => {
        const state = reducer(undefined, { type: '@@INIT' })
        expect(state.grows.ids).toContain(DEFAULT_GROW_ID)
        expect(state.activeGrowId).toBe(DEFAULT_GROW_ID)
        const defaultGrow = state.grows.entities[DEFAULT_GROW_ID]
        expect(defaultGrow).toBeDefined()
        expect(defaultGrow?.isActive).toBe(true)
    })

    it('addGrow adds a new grow', () => {
        const state = reducer(
            getInitialState(),
            addGrow({ id: 'grow-2', name: 'Tent B', isActive: true }),
        )
        expect(state.grows.ids).toHaveLength(2)
        expect(state.grows.entities['grow-2']).toBeDefined()
        expect(state.grows.entities['grow-2']?.name).toBe('Tent B')
        expect(state.grows.entities['grow-2']?.createdAt).toBeGreaterThan(0)
    })

    it('addGrow refuses more than MAX_GROWS', () => {
        let state = getInitialState()
        // Add grows up to MAX_GROWS
        for (let i = 1; i < MAX_GROWS; i++) {
            state = reducer(state, addGrow({ id: `grow-${i}`, name: `Grow ${i}`, isActive: true }))
        }
        expect(state.grows.ids).toHaveLength(MAX_GROWS)

        // Attempt to add one more -- should be rejected
        state = reducer(state, addGrow({ id: 'grow-overflow', name: 'Overflow', isActive: true }))
        expect(state.grows.ids).toHaveLength(MAX_GROWS)
        expect(state.grows.entities['grow-overflow']).toBeUndefined()
    })

    it('updateGrow modifies grow properties', () => {
        const state = reducer(
            getInitialState(),
            updateGrow({ id: DEFAULT_GROW_ID, changes: { name: 'Updated Name' } }),
        )
        expect(state.grows.entities[DEFAULT_GROW_ID]?.name).toBe('Updated Name')
        expect(state.grows.entities[DEFAULT_GROW_ID]?.updatedAt).toBeGreaterThan(0)
    })

    it('removeGrow prevents removing the last grow', () => {
        const state = reducer(getInitialState(), removeGrow(DEFAULT_GROW_ID))
        // Should still have the default grow
        expect(state.grows.ids).toHaveLength(1)
        expect(state.grows.entities[DEFAULT_GROW_ID]).toBeDefined()
    })

    it('removeGrow removes a non-last grow and switches active', () => {
        let state = getInitialState()
        state = reducer(state, addGrow({ id: 'grow-2', name: 'Tent B', isActive: true }))
        state = reducer(state, setActiveGrowId('grow-2'))
        expect(state.activeGrowId).toBe('grow-2')

        state = reducer(state, removeGrow('grow-2'))
        expect(state.grows.ids).toHaveLength(1)
        expect(state.grows.entities['grow-2']).toBeUndefined()
        expect(state.activeGrowId).toBe(DEFAULT_GROW_ID)
    })

    it('setActiveGrowId changes the active grow', () => {
        let state = getInitialState()
        state = reducer(state, addGrow({ id: 'grow-2', name: 'Tent B', isActive: true }))
        state = reducer(state, setActiveGrowId('grow-2'))
        expect(state.activeGrowId).toBe('grow-2')
    })

    it('setActiveGrowId ignores non-existent grow IDs', () => {
        const state = reducer(getInitialState(), setActiveGrowId('non-existent'))
        expect(state.activeGrowId).toBe(DEFAULT_GROW_ID)
    })

    it('setGrowsState replaces entire state', () => {
        const newGrow: Grow = {
            id: 'custom-grow',
            name: 'Custom',
            createdAt: 1000,
            updatedAt: 2000,
            isActive: true,
        }
        const newState: GrowsState = {
            grows: growsAdapter.addOne(growsAdapter.getInitialState(), newGrow),
            activeGrowId: 'custom-grow',
        }

        const state = reducer(getInitialState(), setGrowsState(newState))
        expect(state.grows.ids).toEqual(['custom-grow'])
        expect(state.activeGrowId).toBe('custom-grow')
    })
})
