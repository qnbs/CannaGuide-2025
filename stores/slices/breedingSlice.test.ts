import { describe, it, expect } from 'vitest'
import breedingReducer, {
    addSeed,
    setParentA,
    setParentB,
    clearBreedingSlots,
    setCollectedSeeds,
} from '@/stores/slices/breedingSlice'

const initial = { collectedSeeds: [], breedingSlots: { parentA: null, parentB: null } }

const mockSeed = {
    id: 'seed-1',
    name: 'Test Seed',
    strainId: 'strain-1',
    generation: 1,
    parentAId: 'pa',
    parentBId: 'pb',
}

describe('breedingSlice', () => {
    it('returns initial state', () => {
        const state = breedingReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    it('addSeed adds a seed to the collection', () => {
        const state = breedingReducer(initial, addSeed(mockSeed as any))
        expect(state.collectedSeeds).toHaveLength(1)
        expect(state.collectedSeeds[0].id).toBe('seed-1')
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
        let state = breedingReducer(initial, addSeed(mockSeed as any))
        const newSeeds = [{ ...mockSeed, id: 'seed-new' }]
        state = breedingReducer(state, setCollectedSeeds(newSeeds as any))
        expect(state.collectedSeeds).toHaveLength(1)
        expect(state.collectedSeeds[0].id).toBe('seed-new')
    })
})
