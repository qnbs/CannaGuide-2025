import { describe, expect, it } from 'vitest'
import simulationReducer, {
    addPlant,
    newPlantRefusal,
    upsertPlant,
} from '@/stores/slices/simulationSlice'
import { PlantStage, type Plant, type SimulationState } from '@/types'

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

    it('never uses a slot beyond the legal cap, even when a stored array is longer', () => {
        // A persisted or imported state whose plantSlots array has more than three entries.
        const longer = { ...withPlants('a', 'b', 'c'), plantSlots: ['a', 'b', 'c', null, null] }

        const added = simulationReducer(longer, addPlant({ plant: plant('d'), slotIndex: 3 }))
        const synced = simulationReducer(longer, upsertPlant(plant('e')))

        expect(plantCount(added)).toBe(3)
        expect(plantCount(synced)).toBe(3)
        expect(synced.plantSlots).toEqual(['a', 'b', 'c', null, null])
    })

    it('applies an update to a plant an older sync left without a slot', () => {
        // Three plants in the slots, and a fourth entity without one (legacy state).
        const full = withPlants('a', 'b', 'c')
        const orphan = {
            ...full,
            plants: {
                ids: [...full.plants.ids, 'o'],
                entities: { ...full.plants.entities, o: plant('o') },
            },
        }
        const renamed = { ...plant('o'), name: 'renamed' }

        const updated = simulationReducer(orphan, upsertPlant(renamed))
        const withRoom = simulationReducer(
            { ...orphan, plantSlots: ['a', null, 'c'] },
            upsertPlant(renamed),
        )

        expect(updated.plants.entities['o']?.name).toBe('renamed')
        expect(updated.plantSlots).toEqual(['a', 'b', 'c'])
        expect(plantCount(updated)).toBe(plantCount(orphan))
        expect(withRoom.plantSlots).toEqual(['a', 'o', 'c'])
    })

    it('counts a plant without a slot toward the cap, so a free slot alone is not room', () => {
        // Two slotted plants, one free slot, and a legacy plant without a slot.
        const twoSlotted = withPlants('a', 'b')
        const withLegacy = {
            ...twoSlotted,
            plants: {
                ids: [...twoSlotted.plants.ids, 'legacy'],
                entities: { ...twoSlotted.plants.entities, legacy: plant('legacy') },
            },
        }

        const added = simulationReducer(withLegacy, addPlant({ plant: plant('d'), slotIndex: 2 }))
        const synced = simulationReducer(withLegacy, upsertPlant(plant('e')))

        expect(plantCount(added)).toBe(3)
        expect(plantCount(synced)).toBe(3)
        expect(added.plantSlots).toEqual(['a', 'b', null])
    })

    it('accepts a finished plant into a free slot even when the count is full', () => {
        // The import plans a finished plant into this state; the reducer must agree.
        const twoSlotted = withPlants('a', 'b')
        const withLegacy = {
            ...twoSlotted,
            plants: {
                ids: [...twoSlotted.plants.ids, 'legacy'],
                entities: { ...twoSlotted.plants.entities, legacy: plant('legacy') },
            },
        }
        const finished = { ...plant('f'), stage: PlantStage.Finished }

        const added = simulationReducer(withLegacy, addPlant({ plant: finished, slotIndex: 2 }))

        expect(added.plantSlots).toEqual(['a', 'b', 'f'])
    })

    it('tells starting a grow why it cannot add a plant, before anything is reported', () => {
        const seed = { stage: PlantStage.Seed }
        const twoSlotted = withPlants('a', 'b')
        const withLegacy = {
            ...twoSlotted,
            plants: {
                ids: [...twoSlotted.plants.ids, 'legacy'],
                entities: { ...twoSlotted.plants.entities, legacy: plant('legacy') },
            },
        }

        expect(newPlantRefusal(withPlants('a', 'b', 'c'), -1, seed)).toBe('slots')
        expect(newPlantRefusal(withPlants('a'), 0, seed)).toBe('slots')
        expect(newPlantRefusal(withLegacy, 2, seed)).toBe('cap')
        expect(newPlantRefusal(withPlants('a', 'b'), 2, seed)).toBeNull()
    })

    it('does not let a synced update turn a finished plant active past the cap', () => {
        // Three plants count; a finished one without a slot is kept alongside.
        const full = withPlants('a', 'b', 'c')
        const withFinished = {
            ...full,
            plants: {
                ids: [...full.plants.ids, 'done'],
                entities: {
                    ...full.plants.entities,
                    done: { ...plant('done'), stage: PlantStage.Finished },
                },
            },
        }

        const reactivated = simulationReducer(
            withFinished,
            upsertPlant({ ...plant('done'), stage: PlantStage.Vegetative }),
        )
        const renamed = simulationReducer(
            withFinished,
            upsertPlant({ ...plant('done'), stage: PlantStage.Finished, name: 'kept' }),
        )

        expect(reactivated.plants.entities['done']?.stage).toBe(PlantStage.Finished)
        expect(renamed.plants.entities['done']?.name).toBe('kept')
    })

    it('does not count finished plants toward the cap', () => {
        const twoSlotted = withPlants('a', 'b')
        const withFinished = {
            ...twoSlotted,
            plants: {
                ids: [...twoSlotted.plants.ids, 'done'],
                entities: {
                    ...twoSlotted.plants.entities,
                    done: { ...plant('done'), stage: PlantStage.Finished },
                },
            },
        }

        const added = simulationReducer(withFinished, addPlant({ plant: plant('c'), slotIndex: 2 }))

        expect(added.plantSlots).toEqual(['a', 'b', 'c'])
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
