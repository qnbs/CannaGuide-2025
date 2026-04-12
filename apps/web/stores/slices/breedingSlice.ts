import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import { Seed } from '@/types'
import type { SeedInventoryEntry, PollenRecord, SeedType } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_SEED_INVENTORY = 500
const MAX_POLLEN_RECORDS = 200

/** Seed quantity at or below which an entry is considered low-stock */
export const LOW_STOCK_THRESHOLD = 2

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
        batchRemoveSeedEntries: (state, action: PayloadAction<string[]>) => {
            const ids = new Set(action.payload)
            state.seedInventory = state.seedInventory.filter((e) => !ids.has(e.id))
        },
        batchUpdateTags: (
            state,
            action: PayloadAction<{
                entryIds: string[]
                tags: string[]
                mode: 'add' | 'remove'
            }>,
        ) => {
            const ids = new Set(action.payload.entryIds)
            for (const entry of state.seedInventory) {
                if (!ids.has(entry.id)) continue
                const current = entry.tags ?? []
                if (action.payload.mode === 'add') {
                    const merged = new Set([...current, ...action.payload.tags])
                    entry.tags = [...merged]
                } else {
                    const toRemove = new Set(action.payload.tags)
                    entry.tags = current.filter((t) => !toRemove.has(t))
                }
            }
        },
        consumeSeedForGrow: (
            state,
            action: PayloadAction<{ entryId: string; quantity: number }>,
        ) => {
            const entry = state.seedInventory.find((e) => e.id === action.payload.entryId)
            if (entry) {
                entry.quantity = Math.max(0, entry.quantity - Math.max(0, action.payload.quantity))
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
    batchRemoveSeedEntries,
    batchUpdateTags,
    consumeSeedForGrow,
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

/** Inventory statistics for the dashboard */
export interface SeedInventoryStats {
    totalEntries: number
    totalSeeds: number
    uniqueStrains: number
    lowStockCount: number
    outOfStockCount: number
    byType: Record<SeedType, number>
}

export const selectSeedInventoryStats = createSelector(
    (state: RootState) => state.breeding.seedInventory,
    (inventory): SeedInventoryStats => {
        const strainNames = new Set<string>()
        const byType: Record<SeedType, number> = {
            Regular: 0,
            Feminized: 0,
            Autoflowering: 0,
            Clone: 0,
        }
        let totalSeeds = 0
        let lowStockCount = 0
        let outOfStockCount = 0
        for (const e of inventory) {
            strainNames.add(e.strainName)
            totalSeeds += e.quantity
            byType[e.seedType] += e.quantity
            if (e.quantity === 0) outOfStockCount++
            else if (e.quantity <= LOW_STOCK_THRESHOLD) lowStockCount++
        }
        return {
            totalEntries: inventory.length,
            totalSeeds,
            uniqueStrains: strainNames.size,
            lowStockCount,
            outOfStockCount,
            byType,
        }
    },
)

export const selectLowStockEntries = createSelector(
    (state: RootState) => state.breeding.seedInventory,
    (inventory) => inventory.filter((e) => e.quantity > 0 && e.quantity <= LOW_STOCK_THRESHOLD),
)

export const selectOutOfStockEntries = createSelector(
    (state: RootState) => state.breeding.seedInventory,
    (inventory) => inventory.filter((e) => e.quantity === 0),
)

export const selectPollenRecords = (state: RootState): PollenRecord[] =>
    state.breeding.pollenRecords

export const selectViablePollenRecords = createSelector(
    (state: RootState) => state.breeding.pollenRecords,
    (records) => records.filter((r) => r.viable),
)

export default breedingSlice.reducer
