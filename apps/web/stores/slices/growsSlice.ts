import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit'
import type { Grow, GrowsState } from '@/types'
import { DEFAULT_GROW_ID, DEFAULT_GROW_NAME, MAX_GROWS } from '@/constants'

// ---------------------------------------------------------------------------
// Entity Adapter
// ---------------------------------------------------------------------------

export const growsAdapter = createEntityAdapter<Grow>()

// ---------------------------------------------------------------------------
// Default grow (created on first launch and by migration)
// ---------------------------------------------------------------------------

export const createDefaultGrow = (): Grow => ({
    id: DEFAULT_GROW_ID,
    name: DEFAULT_GROW_NAME,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isActive: true,
})

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: GrowsState = {
    grows: growsAdapter.addOne(growsAdapter.getInitialState(), createDefaultGrow()),
    activeGrowId: DEFAULT_GROW_ID,
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const growsSlice = createSlice({
    name: 'grows',
    initialState,
    reducers: {
        addGrow: {
            reducer(state, action: PayloadAction<Grow>) {
                const currentCount = state.grows.ids.length
                if (currentCount >= MAX_GROWS) {
                    return
                }
                growsAdapter.addOne(state.grows, action.payload)
            },
            prepare(grow: Omit<Grow, 'createdAt' | 'updatedAt'>) {
                const now = Date.now()
                return {
                    payload: {
                        ...grow,
                        createdAt: now,
                        updatedAt: now,
                    } as Grow,
                }
            },
        },

        updateGrow(
            state,
            action: PayloadAction<{ id: string; changes: Partial<Omit<Grow, 'id'>> }>,
        ) {
            const { id, changes } = action.payload
            growsAdapter.updateOne(state.grows, {
                id,
                changes: { ...changes, updatedAt: Date.now() },
            })
        },

        removeGrow(state, action: PayloadAction<string>) {
            const growId = action.payload
            // Never remove the last grow
            if (state.grows.ids.length <= 1) {
                return
            }
            growsAdapter.removeOne(state.grows, growId)
            // If active grow was removed, switch to the first remaining
            if (state.activeGrowId === growId) {
                const firstId = state.grows.ids[0]
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- EntityAdapter ID narrowing
                state.activeGrowId = (firstId as string) ?? DEFAULT_GROW_ID
            }
        },

        setActiveGrowId(state, action: PayloadAction<string>) {
            const growId = action.payload
            if (state.grows.entities[growId]) {
                state.activeGrowId = growId
            }
        },

        archiveGrow(state, action: PayloadAction<string>) {
            const growId = action.payload
            growsAdapter.updateOne(state.grows, {
                id: growId,
                changes: { archived: true, updatedAt: Date.now() },
            })
            // If the archived grow was active, switch to first non-archived
            if (state.activeGrowId === growId) {
                const firstNonArchived = state.grows.ids.find((id) => {
                    const g = state.grows.entities[id as string]
                    return g && !g.archived && g.id !== growId
                })
                state.activeGrowId =
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- EntityAdapter ID narrowing
                    (firstNonArchived as string) ?? state.grows.ids[0] ?? DEFAULT_GROW_ID
            }
        },

        /** Restore full grows state (e.g. from migration or import) */
        setGrowsState(_state, action: PayloadAction<GrowsState>) {
            return action.payload
        },
    },
})

export const { addGrow, updateGrow, removeGrow, setActiveGrowId, archiveGrow, setGrowsState } =
    growsSlice.actions
export default growsSlice.reducer
