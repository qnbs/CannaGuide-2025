import { describe, it, expect } from 'vitest'
import breedingReducer, {
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
    MAX_SEED_INVENTORY,
    selectSeedInventoryStats,
    selectLowStockEntries,
    selectOutOfStockEntries,
    selectTotalSeedCount,
    selectPollenRecords,
    selectViablePollenRecords,
} from '@/stores/slices/breedingSlice'
import type { BreedingState } from '@/stores/slices/breedingSlice'
import type { Seed, SeedInventoryEntry, PollenRecord } from '@/types'
import type { RootState } from '@/stores/store'

const initial: BreedingState = {
    collectedSeeds: [],
    breedingSlots: { parentA: null, parentB: null },
    seedInventory: [],
    pollenRecords: [],
}

const mockSeed: Seed = {
    id: 'seed-1',
    strainId: 'strain-1',
    strainName: 'Test Seed',
    quality: 0.8,
    createdAt: Date.now(),
}

function makeSeedEntry(overrides?: Partial<SeedInventoryEntry>): SeedInventoryEntry {
    return {
        id: `entry-${Date.now()}`,
        strainId: 'strain-1',
        strainName: 'White Widow',
        quantity: 10,
        seedType: 'Feminized',
        breeder: 'Test Breeder',
        quality: 4,
        acquiredAt: Date.now(),
        ...overrides,
    }
}

function makePollenRecord(overrides?: Partial<PollenRecord>): PollenRecord {
    return {
        id: `pollen-${Date.now()}`,
        donorStrainId: 'strain-d1',
        donorStrainName: 'Donor Strain',
        collectedAt: Date.now(),
        viable: true,
        ...overrides,
    }
}

function asRoot(breeding: BreedingState): RootState {
     
    return { breeding } as RootState
}

// =========================================================================
// Breeding basics
// =========================================================================

describe('breedingSlice', () => {
    it('returns initial state', () => {
        const state = breedingReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    it('addSeed adds a seed to the collection', () => {
        const state = breedingReducer(initial, addSeed(mockSeed))
        expect(state.collectedSeeds).toHaveLength(1)
        expect(state.collectedSeeds[0]!.id).toBe('seed-1')
    })

    it('setParentA sets parent A slot', () => {
        const state = breedingReducer(initial, setParentA('seed-1'))
        expect(state.breedingSlots.parentA).toBe('seed-1')
    })

    it('setParentB sets parent B slot', () => {
        const state = breedingReducer(initial, setParentB('seed-2'))
        expect(state.breedingSlots.parentB).toBe('seed-2')
    })

    it('clearBreedingSlots resets both slots to null', () => {
        let state = breedingReducer(initial, setParentA('seed-1'))
        state = breedingReducer(state, setParentB('seed-2'))
        state = breedingReducer(state, clearBreedingSlots())
        expect(state.breedingSlots).toEqual({ parentA: null, parentB: null })
    })

    it('setCollectedSeeds replaces entire seed collection', () => {
        let state = breedingReducer(initial, addSeed(mockSeed))
        const newSeeds: Seed[] = [{ ...mockSeed, id: 'seed-new' }]
        state = breedingReducer(state, setCollectedSeeds(newSeeds))
        expect(state.collectedSeeds).toHaveLength(1)
        expect(state.collectedSeeds[0]!.id).toBe('seed-new')
    })
})

// =========================================================================
// Seed Inventory (Seed Vault)
// =========================================================================

describe('breedingSlice -- Seed Inventory', () => {
    const entry1 = makeSeedEntry({ id: 'e1', strainName: 'White Widow', quantity: 10 })
    const entry2 = makeSeedEntry({
        id: 'e2',
        strainName: 'Blue Dream',
        quantity: 2,
        seedType: 'Regular',
    })
    const entry3 = makeSeedEntry({
        id: 'e3',
        strainName: 'OG Kush',
        quantity: 0,
        seedType: 'Autoflowering',
    })

    it('addSeedInventoryEntry adds an entry', () => {
        const state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        expect(state.seedInventory).toHaveLength(1)
        expect(state.seedInventory[0]!.strainName).toBe('White Widow')
    })

    it('FIFO caps at MAX_SEED_INVENTORY', () => {
        let state = initial
        for (let i = 0; i < MAX_SEED_INVENTORY + 5; i++) {
            state = breedingReducer(state, addSeedInventoryEntry(makeSeedEntry({ id: `e-${i}` })))
        }
        expect(state.seedInventory).toHaveLength(MAX_SEED_INVENTORY)
        // earliest entries removed
        expect(state.seedInventory[0]!.id).toBe('e-5')
    })

    it('updateSeedInventoryEntry applies partial changes', () => {
        let state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        state = breedingReducer(
            state,
            updateSeedInventoryEntry({
                entryId: 'e1',
                changes: { strainName: 'Updated Name', quality: 5 },
            }),
        )
        expect(state.seedInventory[0]!.strainName).toBe('Updated Name')
        expect(state.seedInventory[0]!.quality).toBe(5)
        // unchanged field
        expect(state.seedInventory[0]!.quantity).toBe(10)
    })

    it('updateSeedInventoryEntry ignores unknown ID', () => {
        let state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        state = breedingReducer(
            state,
            updateSeedInventoryEntry({
                entryId: 'nonexistent',
                changes: { strainName: 'Nope' },
            }),
        )
        expect(state.seedInventory[0]!.strainName).toBe('White Widow')
    })

    it('removeSeedInventoryEntry removes by id', () => {
        let state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        state = breedingReducer(state, addSeedInventoryEntry(entry2))
        state = breedingReducer(state, removeSeedInventoryEntry('e1'))
        expect(state.seedInventory).toHaveLength(1)
        expect(state.seedInventory[0]!.id).toBe('e2')
    })

    it('removeSeedInventoryEntry is a no-op for unknown ID', () => {
        let state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        state = breedingReducer(state, removeSeedInventoryEntry('nonexistent'))
        expect(state.seedInventory).toHaveLength(1)
    })

    it('adjustSeedQuantity increases quantity', () => {
        let state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        state = breedingReducer(state, adjustSeedQuantity({ entryId: 'e1', delta: 5 }))
        expect(state.seedInventory[0]!.quantity).toBe(15)
    })

    it('adjustSeedQuantity decreases but clamps at 0', () => {
        let state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        state = breedingReducer(state, adjustSeedQuantity({ entryId: 'e1', delta: -999 }))
        expect(state.seedInventory[0]!.quantity).toBe(0)
    })

    it('batchRemoveSeedEntries removes multiple entries', () => {
        let state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        state = breedingReducer(state, addSeedInventoryEntry(entry2))
        state = breedingReducer(state, addSeedInventoryEntry(entry3))
        state = breedingReducer(state, batchRemoveSeedEntries(['e1', 'e3']))
        expect(state.seedInventory).toHaveLength(1)
        expect(state.seedInventory[0]!.id).toBe('e2')
    })

    it('batchUpdateTags adds tags', () => {
        const tagged = makeSeedEntry({ id: 'e-tag', tags: ['organic'] })
        let state = breedingReducer(initial, addSeedInventoryEntry(tagged))
        state = breedingReducer(
            state,
            batchUpdateTags({
                entryIds: ['e-tag'],
                tags: ['indoor', 'organic'],
                mode: 'add',
            }),
        )
        expect(state.seedInventory[0]!.tags).toEqual(expect.arrayContaining(['organic', 'indoor']))
        // no duplicate organic
        expect(state.seedInventory[0]!.tags!.filter((t) => t === 'organic')).toHaveLength(1)
    })

    it('batchUpdateTags removes tags', () => {
        const tagged = makeSeedEntry({ id: 'e-tag', tags: ['indoor', 'organic', 'hydro'] })
        let state = breedingReducer(initial, addSeedInventoryEntry(tagged))
        state = breedingReducer(
            state,
            batchUpdateTags({
                entryIds: ['e-tag'],
                tags: ['organic', 'hydro'],
                mode: 'remove',
            }),
        )
        expect(state.seedInventory[0]!.tags).toEqual(['indoor'])
    })

    it('consumeSeedForGrow decreases quantity', () => {
        let state = breedingReducer(initial, addSeedInventoryEntry(entry1))
        state = breedingReducer(state, consumeSeedForGrow({ entryId: 'e1', quantity: 3 }))
        expect(state.seedInventory[0]!.quantity).toBe(7)
    })

    it('consumeSeedForGrow clamps at zero', () => {
        const low = makeSeedEntry({ id: 'e-low', quantity: 1 })
        let state = breedingReducer(initial, addSeedInventoryEntry(low))
        state = breedingReducer(state, consumeSeedForGrow({ entryId: 'e-low', quantity: 5 }))
        expect(state.seedInventory[0]!.quantity).toBe(0)
    })
})

// =========================================================================
// Pollen Records
// =========================================================================

describe('breedingSlice -- Pollen Records', () => {
    it('addPollenRecord adds a record', () => {
        const record = makePollenRecord({ id: 'p1' })
        const state = breedingReducer(initial, addPollenRecord(record))
        expect(state.pollenRecords).toHaveLength(1)
        expect(state.pollenRecords[0]!.donorStrainName).toBe('Donor Strain')
    })

    it('FIFO caps pollen at 200 records', () => {
        let state = initial
        for (let i = 0; i < 205; i++) {
            state = breedingReducer(state, addPollenRecord(makePollenRecord({ id: `p-${i}` })))
        }
        expect(state.pollenRecords).toHaveLength(200)
        expect(state.pollenRecords[0]!.id).toBe('p-5')
    })

    it('updatePollenRecord applies partial changes', () => {
        const record = makePollenRecord({ id: 'p1', viable: true })
        let state = breedingReducer(initial, addPollenRecord(record))
        state = breedingReducer(
            state,
            updatePollenRecord({ recordId: 'p1', changes: { viable: false, notes: 'expired' } }),
        )
        expect(state.pollenRecords[0]!.viable).toBe(false)
        expect(state.pollenRecords[0]!.notes).toBe('expired')
    })

    it('removePollenRecord removes by id', () => {
        const r1 = makePollenRecord({ id: 'p1' })
        const r2 = makePollenRecord({ id: 'p2' })
        let state = breedingReducer(initial, addPollenRecord(r1))
        state = breedingReducer(state, addPollenRecord(r2))
        state = breedingReducer(state, removePollenRecord('p1'))
        expect(state.pollenRecords).toHaveLength(1)
        expect(state.pollenRecords[0]!.id).toBe('p2')
    })
})

// =========================================================================
// Selectors
// =========================================================================

describe('breedingSlice -- Selectors', () => {
    const e1 = makeSeedEntry({ id: 'e1', strainName: 'A', quantity: 10, seedType: 'Feminized' })
    const e2 = makeSeedEntry({ id: 'e2', strainName: 'B', quantity: 2, seedType: 'Regular' })
    const e3 = makeSeedEntry({ id: 'e3', strainName: 'C', quantity: 0, seedType: 'Autoflowering' })
    const e4 = makeSeedEntry({ id: 'e4', strainName: 'A', quantity: 1, seedType: 'Feminized' })

    const stateWith = (...entries: SeedInventoryEntry[]): BreedingState => ({
        ...initial,
        seedInventory: entries,
    })

    it('selectTotalSeedCount sums all quantities', () => {
        const root = asRoot(stateWith(e1, e2, e3, e4))
        expect(selectTotalSeedCount(root)).toBe(13)
    })

    it('selectSeedInventoryStats computes correct stats', () => {
        const root = asRoot(stateWith(e1, e2, e3, e4))
        const stats = selectSeedInventoryStats(root)
        expect(stats.totalEntries).toBe(4)
        expect(stats.totalSeeds).toBe(13)
        expect(stats.uniqueStrains).toBe(3) // A, B, C
        expect(stats.outOfStockCount).toBe(1) // e3
        expect(stats.lowStockCount).toBe(2) // e2 (qty 2) + e4 (qty 1)
        expect(stats.byType.Feminized).toBe(11) // e1(10) + e4(1)
        expect(stats.byType.Regular).toBe(2)
        expect(stats.byType.Autoflowering).toBe(0) // qty 0
    })

    it('selectLowStockEntries returns entries with qty > 0 and <= threshold', () => {
        const root = asRoot(stateWith(e1, e2, e3, e4))
        const low = selectLowStockEntries(root)
        expect(low).toHaveLength(2)
        expect(low.map((e) => e.id).sort()).toEqual(['e2', 'e4'])
    })

    it('selectOutOfStockEntries returns entries with qty === 0', () => {
        const root = asRoot(stateWith(e1, e2, e3, e4))
        const out = selectOutOfStockEntries(root)
        expect(out).toHaveLength(1)
        expect(out[0]!.id).toBe('e3')
    })

    it('selectPollenRecords returns all pollen records', () => {
        const r1 = makePollenRecord({ id: 'p1', viable: true })
        const r2 = makePollenRecord({ id: 'p2', viable: false })
        const root = asRoot({ ...initial, pollenRecords: [r1, r2] })
        expect(selectPollenRecords(root)).toHaveLength(2)
    })

    it('selectViablePollenRecords filters to viable only', () => {
        const r1 = makePollenRecord({ id: 'p1', viable: true })
        const r2 = makePollenRecord({ id: 'p2', viable: false })
        const r3 = makePollenRecord({ id: 'p3', viable: true })
        const root = asRoot({ ...initial, pollenRecords: [r1, r2, r3] })
        const viable = selectViablePollenRecords(root)
        expect(viable).toHaveLength(2)
        expect(viable.map((r) => r.id)).toEqual(['p1', 'p3'])
    })

    it('selectSeedInventoryStats returns zeros for empty inventory', () => {
        const root = asRoot(initial)
        const stats = selectSeedInventoryStats(root)
        expect(stats.totalEntries).toBe(0)
        expect(stats.totalSeeds).toBe(0)
        expect(stats.uniqueStrains).toBe(0)
        expect(stats.lowStockCount).toBe(0)
        expect(stats.outOfStockCount).toBe(0)
    })
})
