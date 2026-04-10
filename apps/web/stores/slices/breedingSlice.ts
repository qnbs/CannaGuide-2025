import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import { Seed } from '@/types'
import type { SeedInventoryEntry, PollenRecord } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SEED_INVENTORY = 500
const MAX_POLLEN_RECORDS = 200

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface BreedingState {
    collectedSeeds: Seed[]
    breedingSlots: {
        parentA: string | null // seed ID
        parentB: string | null // seed ID
    }
    seedInventory: SeedInventoryEntry[]
    pollenRecords: PollenRecord[]
}

const initialState: BreedingState = {
    collectedSeeds: [],
    breedingSlots: {
        parentA: null,
        parentB: null,
    },
    seedInventory: [],
    pollenRecords: [],
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const breedingSlice = createSlice({
    name: 'breeding',
    initialState,
    reducers: {
        addSeed: (state, action: PayloadAction<Seed>) => {
            state.collectedSeeds.push(action.payload)
        },
        setParentA: (state, action: PayloadAction<string | null>) => {
            state.breedingSlots.parentA = action.payload
        },
        setParentB: (state, action: PayloadAction<string | null>) => {
            state.breedingSlots.parentB = action.payload
        },
        clearBreedingSlots: (state) => {
            state.breedingSlots.parentA = null
            state.breedingSlots.parentB = null
        },
        setCollectedSeeds: (state, action: PayloadAction<Seed[]>) => {
            state.collectedSeeds = action.payload
        },

        // --- Seed Inventory (Seed Vault) ---
        addSeedInventoryEntry: (state, action: PayloadAction<SeedInventoryEntry>) => {
            state.seedInventory.push(action.payload)
            if (state.seedInventory.length > MAX_SEED_INVENTORY) {
                state.seedInventory = state.seedInventory.slice(
                    state.seedInventory.length - MAX_SEED_INVENTORY,
                )
            }
        },
        updateSeedInventoryEntry: (
            state,
            action: PayloadAction<{
                entryId: string
                changes: Partial<Omit<SeedInventoryEntry, 'id'>>
            }>,
        ) => {
            const entry = state.seedInventory.find((e) => e.id === action.payload.entryId)
            if (entry) {
                Object.assign(entry, action.payload.changes)
            }
        },
        removeSeedInventoryEntry: (state, action: PayloadAction<string>) => {
            state.seedInventory = state.seedInventory.filter((e) => e.id !== action.payload)
        },
        adjustSeedQuantity: (state, action: PayloadAction<{ entryId: string; delta: number }>) => {
            const entry = state.seedInventory.find((e) => e.id === action.payload.entryId)
            if (entry) {
                entry.quantity = Math.max(0, entry.quantity + action.payload.delta)
            }
        },

        // --- Pollen Records ---
        addPollenRecord: (state, action: PayloadAction<PollenRecord>) => {
            state.pollenRecords.push(action.payload)
            if (state.pollenRecords.length > MAX_POLLEN_RECORDS) {
                state.pollenRecords = state.pollenRecords.slice(
                    state.pollenRecords.length - MAX_POLLEN_RECORDS,
                )
            }
        },
        updatePollenRecord: (
            state,
            action: PayloadAction<{
                recordId: string
                changes: Partial<Omit<PollenRecord, 'id'>>
            }>,
        ) => {
            const record = state.pollenRecords.find((r) => r.id === action.payload.recordId)
            if (record) {
                Object.assign(record, action.payload.changes)
            }
        },
        removePollenRecord: (state, action: PayloadAction<string>) => {
            state.pollenRecords = state.pollenRecords.filter((r) => r.id !== action.payload)
        },
    },
})

export const {
    addSeed,
    setParentA,
    setParentB,
    clearBreedingSlots,
    setCollectedSeeds,
    addSeedInventoryEntry,
    updateSeedInventoryEntry,
    removeSeedInventoryEntry,
    adjustSeedQuantity,
    addPollenRecord,
    updatePollenRecord,
    removePollenRecord,
} = breedingSlice.actions

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectSeedInventory = (state: RootState): SeedInventoryEntry[] =>
    state.breeding.seedInventory

export const selectSeedInventoryByStrain = (
    strainId: string,
): ((state: RootState) => SeedInventoryEntry[]) =>
    createSelector(
        (state: RootState) => state.breeding.seedInventory,
        (inventory) => inventory.filter((e) => e.strainId === strainId),
    )

export const selectTotalSeedCount = createSelector(
    (state: RootState) => state.breeding.seedInventory,
    (inventory) => inventory.reduce((sum, e) => sum + e.quantity, 0),
)

export const selectPollenRecords = (state: RootState): PollenRecord[] =>
    state.breeding.pollenRecords

export const selectViablePollenRecords = createSelector(
    (state: RootState) => state.breeding.pollenRecords,
    (records) => records.filter((r) => r.viable),
)

export default breedingSlice.reducer
