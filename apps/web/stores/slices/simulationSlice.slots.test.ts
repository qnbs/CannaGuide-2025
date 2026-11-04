import { describe, expect, it } from 'vitest'
import simulationReducer, { addPlant, upsertPlant } from '@/stores/slices/simulationSlice'
import type { Plant, SimulationState } from '@/types'

const plant = (id: string): Plant =>
    ({ id, growId: 'default-grow', name: id, journal: [] }) as unknown as Plant

/** A simulation with the given plants in slots 0, 1, 2 in order. */
const withPlants = (...ids: string[]): SimulationState => {
    let state = simulationReducer(undefined, { type: 'init' })
    ids.forEach((id, index) => {
        state = simulationReducer(state, addPlant({ plant: plant(id), slotIndex: index }))
    })
    return state
}

const plantCount = (state: SimulationState): number => state.plants.ids.length

describe('plant slots enforce the three-plant cap (KCanG Section 9 (1))', () => {
    it('refuses to add a plant into a slot that is taken, which would orphan its plant', () => {
        const state = simulationReducer(
            withPlants('a'),
            addPlant({ plant: plant('b'), slotIndex: 0 }),
        )

        expect(state.plantSlots).toEqual(['a', null, null])
        expect(state.plants.ids).toEqual(['a'])
    })

    it.each([-1, 3, 1.5])('refuses a slot index that does not exist (%s)', (slotIndex) => {
        const state = simulationReducer(withPlants('a'), addPlant({ plant: plant('b'), slotIndex }))

        expect(plantCount(state)).toBe(1)
    })

    it('refuses a second plant with an id that is already present', () => {
        const state = simulationReducer(
            withPlants('a'),
            addPlant({ plant: plant('a'), slotIndex: 1 }),
        )

        expect(state.plantSlots).toEqual(['a', null, null])
    })

    it('does not let a synced plant in when all three slots are taken', () => {
        const state = simulationReducer(
            withPlants('a', 'b', 'c'),
            upsertPlant(plant('d'), { fromCrdt: true }),
        )

        expect(state.plants.ids).toEqual(['a', 'b', 'c'])
        expect(state.plantSlots).toEqual(['a', 'b', 'c'])
    })

    it('still updates a plant that already has a slot', () => {
        const renamed = { ...plant('b'), name: 'renamed' }

        const state = simulationReducer(withPlants('a', 'b', 'c'), upsertPlant(renamed))

        expect(state.plants.entities.b?.name).toBe('renamed')
        expect(plantCount(state)).toBe(3)
    })

    it('puts a new synced plant into the first free slot', () => {
        const state = simulationReducer(withPlants('a'), upsertPlant(plant('d')))

        expect(state.plantSlots).toEqual(['a', 'd', null])
    })
})
