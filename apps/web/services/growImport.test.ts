import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { DEFAULT_GROW_ID } from '@/constants'
import growsReducer, { addGrow } from '@/stores/slices/growsSlice'
import simulationReducer, { addPlant } from '@/stores/slices/simulationSlice'
import { plantSimulationService } from '@/services/plantSimulationService'
import { StrainType } from '@/types'
import type { GrowSetup, Plant, Strain } from '@/types'
import { createAppStoreSync } from '@/stores/store'
import { importGrowFile, planGrowImport, type GrowImportTarget } from './growImport'

const strain = {
    id: 'strain-import-test',
    name: 'Import Strain',
    type: StrainType.Hybrid,
    floweringType: 'Photoperiod',
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
} as Strain

const setup: GrowSetup = {
    lightType: 'LED',
    lightWattage: 300,
    lightHours: 18,
    ventilation: 'medium',
    hasCirculationFan: true,
    potSize: 11,
    potType: 'Fabric',
    medium: 'Soil',
    dynamicLighting: false,
}

const plant = (id: string, growId = DEFAULT_GROW_ID): Plant => ({
    ...plantSimulationService.createPlant(strain, setup, `Plant ${id}`),
    id,
    growId,
})

/** What a fresh profile exports: its default grow and the plants in it. */
const exportOf = (plants: Plant[], growId = DEFAULT_GROW_ID) => ({
    version: '2.0',
    exportedAt: 1,
    grow: { id: growId, name: 'Balcony 2026', isActive: true, createdAt: 1, updatedAt: 1 },
    plants,
})

/** A fresh profile: its own default grow, no plants, three free slots. */
const freshProfile: GrowImportTarget = {
    growIds: [DEFAULT_GROW_ID],
    plantIds: [],
    plantSlots: [null, null, null],
}

const options = { now: 1000, newGrowId: () => 'grow-new' }

describe('planGrowImport (GH #674)', () => {
    it('restores the plants, not only the grow, into a fresh profile', () => {
        const plan = planGrowImport(exportOf([plant('p1'), plant('p2')]), freshProfile, options)

        expect(plan.ok).toBe(true)
        if (!plan.ok) return
        // The fresh profile's own default grow has the same id: the import gets a new one.
        expect(plan.grow).toMatchObject({ id: 'grow-new', name: 'Balcony 2026' })
        expect(plan.plants.map(({ plant: p, slotIndex }) => [p.id, p.growId, slotIndex])).toEqual([
            ['p1', 'grow-new', 0],
            ['p2', 'grow-new', 1],
        ])
    })

    it('keeps the grow id when it is free', () => {
        const plan = planGrowImport(
            exportOf([plant('p1', 'grow-a')], 'grow-a'),
            freshProfile,
            options,
        )

        expect(plan.ok && plan.grow.id).toBe('grow-a')
    })

    it('uses only free slots', () => {
        const target = { ...freshProfile, plantIds: ['other'], plantSlots: ['other', null, null] }

        const plan = planGrowImport(exportOf([plant('p1')]), target, options)

        expect(plan.ok && plan.plants.map(({ slotIndex }) => slotIndex)).toEqual([1])
    })

    it('refuses the whole import when the plants do not fit the three-plant cap', () => {
        const target = { ...freshProfile, plantIds: ['a', 'b'], plantSlots: ['a', 'b', null] }

        expect(planGrowImport(exportOf([plant('p1'), plant('p2')]), target, options)).toEqual({
            ok: false,
            reason: 'plantLimit',
        })
    })

    it('refuses at the grow limit instead of reporting success', () => {
        const target = { ...freshProfile, growIds: ['g1', 'g2', 'g3'] }

        expect(planGrowImport(exportOf([]), target, options)).toEqual({
            ok: false,
            reason: 'growLimit',
        })
    })

    it('refuses a second import of the same plants', () => {
        const target = { ...freshProfile, plantIds: ['p1'], plantSlots: ['p1', null, null] }

        expect(planGrowImport(exportOf([plant('p1')]), target, options)).toEqual({
            ok: false,
            reason: 'alreadyPresent',
        })
    })

    it.each([
        ['not an object', 'x'],
        ['another version', { ...exportOf([]), version: '1.0' }],
        ['no plants array', { ...exportOf([]), plants: undefined }],
        ['a grow without a name', { ...exportOf([]), grow: { id: 'g' } }],
        [
            'a plant without a cultivar',
            exportOf([{ ...plant('p1'), strain: undefined } as unknown as Plant]),
        ],
        [
            'a plant with an unknown stage',
            exportOf([{ ...plant('p1'), stage: 'BLOOMING' } as unknown as Plant]),
        ],
        ['two plants with the same id', exportOf([plant('p1'), plant('p1')])],
        [
            'a task list with a null entry',
            exportOf([{ ...plant('p1'), tasks: [null] } as unknown as Plant]),
        ],
        [
            'a problem list with a null entry',
            exportOf([{ ...plant('p1'), problems: [null] } as unknown as Plant]),
        ],
    ])('refuses %s as invalid', (_case, raw) => {
        expect(planGrowImport(raw, freshProfile, options)).toEqual({ ok: false, reason: 'invalid' })
    })

    it('applied to the real reducers, leaves the grow and its plants in the store', () => {
        const plan = planGrowImport(exportOf([plant('p1'), plant('p2')]), freshProfile, options)
        if (!plan.ok) throw new Error(`unexpected refusal: ${plan.reason}`)

        const grows = growsReducer(undefined, addGrow(plan.grow))
        let simulation = simulationReducer(undefined, { type: 'init' })
        for (const placement of plan.plants)
            simulation = simulationReducer(simulation, addPlant(placement))

        expect(grows.grows.ids).toEqual([DEFAULT_GROW_ID, 'grow-new'])
        expect(simulation.plants.ids).toEqual(['p1', 'p2'])
        expect(simulation.plantSlots).toEqual(['p1', 'p2', null])
    })

    it('importGrowFile plans against the store as it is when the file is read', () => {
        const store = createAppStoreSync()

        const first = store.dispatch(importGrowFile(exportOf([plant('p1'), plant('p2')]), options))
        // A second file read later sees the slots the first one took.
        const second = store.dispatch(
            importGrowFile(exportOf([plant('q1'), plant('q2')], 'grow-other'), options),
        )

        expect(first.ok).toBe(true)
        expect(second).toEqual({ ok: false, reason: 'plantLimit' })
        const { grows, simulation } = store.getState()
        expect(grows.grows.ids).toEqual([DEFAULT_GROW_ID, 'grow-new'])
        expect(simulation.plantSlots).toEqual(['p1', 'p2', null])
    })
})
