import { describe, it, expect } from 'vitest'
import breedingReducer, {
    addSeed,
    setParentA,
    setParentB,
    clearBreedingSlots,
    setCollectedSeeds,
} from '@/stores/slices/breedingSlice'
import type { Seed } from '@/types'

const initial = { collectedSeeds: [], breedingSlots: { parentA: null, parentB: null } }

const mockSeed: Seed = {
    id: 'seed-1',
    strainId: 'strain-1',
    strainName: 'Test Seed',
    quality: 0.8,
    createdAt: Date.now(),
}

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
