import { afterEach, describe, expect, it, vi } from 'vitest'

import { APP_VERSION, SLICE_SCHEMA_VERSIONS } from '@/constants'
import { parseAndMigratePersistedSnapshot } from '@/services/migration/persistedSnapshot'
import { migrateState } from '@/services/migrationLogic'
import { PlantStage } from '@/types'

/**
 * A stored slice whose schema version differs from the current one used to be
 * deleted outright (GH #666): the next save then wrote an empty initial slice
 * over the user's data. User-data slices are now kept and repaired by the shape
 * guards; only the transient `ui` slice may still be dropped.
 */

const legacyPlant = () => ({
    id: 'plant-1',
    name: 'Legacy Plant',
    stage: PlantStage.Vegetative,
    createdAt: 1,
    lastUpdated: 1,
    strain: {
        id: 'strain-1',
        name: 'Legacy Strain',
        type: 'Hybrid',
        thc: 20,
        cbd: 1,
        floweringTime: 56,
        floweringType: 'Photoperiod',
        agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        geneticModifiers: {
            pestResistance: 1,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1,
            vpdTolerance: { min: 0.8, max: 1.6 },
            transpirationFactor: 1,
            stomataSensitivity: 1,
        },
    },
})

const populatedSimulation = () => ({
    plants: { ids: ['plant-1'], entities: { 'plant-1': legacyPlant() } },
    plantSlots: ['plant-1', null, null],
    selectedPlantId: null,
    vpdProfiles: {},
    isCatchingUp: false,
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('migrateState slice version mismatch', () => {
    it('keeps a populated simulation slice stored under an older schema version', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        const migrated = migrateState({
            version: 5,
            _sliceVersions: { simulation: SLICE_SCHEMA_VERSIONS.simulation - 1 },
            simulation: populatedSimulation(),
        } as never)

        expect(migrated.simulation?.plants.ids).toEqual(['plant-1'])
        expect(migrated.simulation?.plants.entities['plant-1']?.name).toBe('Legacy Plant')
        expect(migrated._sliceVersions).toEqual(SLICE_SCHEMA_VERSIONS)
    })

    it('still holds the plants after a second start on the restamped snapshot', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        const first = migrateState({
            version: 5,
            _sliceVersions: { simulation: SLICE_SCHEMA_VERSIONS.simulation - 1 },
            simulation: populatedSimulation(),
        } as never)
        const second = migrateState(JSON.parse(JSON.stringify(first)))

        expect(second.simulation?.plants.ids).toEqual(['plant-1'])
        expect(second.simulation?.plants.entities['plant-1']?.name).toBe('Legacy Plant')
    })

    it('keeps other user-data slices whose stored version differs', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        const migrated = migrateState({
            version: 5,
            _sliceVersions: { favorites: 0, userStrains: 0 },
            favorites: { favoriteIds: ['strain-a', 'strain-b'] },
            userStrains: {
                ids: ['mine-1'],
                entities: { 'mine-1': { id: 'mine-1', name: 'My Cross' } },
            },
        } as never)

        expect(migrated.favorites).toEqual({ favoriteIds: ['strain-a', 'strain-b'] })
        expect(migrated.userStrains?.ids).toEqual(['mine-1'])
        expect(migrated.userStrains?.entities['mine-1']).toMatchObject({ name: 'My Cross' })
    })

    it('warns about a retained slice instead of announcing a reset', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        migrateState({
            version: 5,
            _sliceVersions: { simulation: SLICE_SCHEMA_VERSIONS.simulation - 1 },
            simulation: populatedSimulation(),
        } as never)

        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"simulation"'))
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('keeping the stored data'))
    })

    it('does not warn when every stored slice version matches', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        migrateState({
            version: 5,
            _sliceVersions: { ...SLICE_SCHEMA_VERSIONS },
            simulation: populatedSimulation(),
        } as never)

        expect(warn).not.toHaveBeenCalled()
    })

    it('keeps a slice stored under a newer schema version for the shape guards', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        const migrated = migrateState({
            version: 5,
            _sliceVersions: { simulation: SLICE_SCHEMA_VERSIONS.simulation + 1 },
            simulation: populatedSimulation(),
        } as never)

        // A snapshot written by a newer build is not emptied by an older one.
        // The stamp is rewritten to the current version on the next save
        // (bootstrap/persistence.ts), so a later newer build revalidates it.
        expect(migrated.simulation?.plants.ids).toEqual(['plant-1'])
    })

    it('still drops the transient ui slice on a version mismatch', () => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)

        const migrated = migrateState({
            version: 5,
            _sliceVersions: { ui: 0 },
            ui: { isAppReady: true },
        } as never)

        expect(migrated.ui).toBeUndefined()
    })
})

describe('persisted snapshot hydration with a slice version mismatch', () => {
    const snapshotWith = (simulation: unknown) =>
        JSON.stringify({
            version: APP_VERSION,
            _sliceVersions: { simulation: SLICE_SCHEMA_VERSIONS.simulation - 1 },
            simulation,
        })

    it('hydrates the stored plants and keeps them across a save and reload', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        const first = parseAndMigratePersistedSnapshot(snapshotWith(populatedSimulation()))
        expect(first.simulation?.plants.ids).toEqual(['plant-1'])

        // What bootstrap/persistence.ts saves is parsed again on the next start.
        const reloaded = parseAndMigratePersistedSnapshot(JSON.stringify(first))
        expect(reloaded.simulation?.plants.ids).toEqual(['plant-1'])
        expect(reloaded.simulation?.plants.entities['plant-1']?.name).toBe('Legacy Plant')
    })

    it('fails loudly when the stored slice cannot be repaired, instead of emptying it', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        // createAppStore catches this error and recovers from the pre-migration
        // backup (stores/store.ts). Before the fix the mismatched slice was
        // deleted first, the validator saw nothing wrong, and an empty
        // simulation was hydrated and saved over the original.
        expect(() => parseAndMigratePersistedSnapshot(snapshotWith({ plants: [] }))).toThrow(
            'Persisted simulation.plants must be an entity collection.',
        )
    })
})
