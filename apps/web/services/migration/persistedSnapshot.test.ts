import { describe, expect, it } from 'vitest'
import { APP_VERSION } from '@/constants'
import { migratePersistedSnapshot, parseAndMigratePersistedSnapshot } from './persistedSnapshot'

describe('persistedSnapshot', () => {
    it.each(['null', '[]', '"state"'])('rejects a non-object snapshot (%s)', (snapshot) => {
        expect(() => parseAndMigratePersistedSnapshot(snapshot)).toThrow(TypeError)
    })

    it('rejects a structurally invalid settings slice', () => {
        expect(() =>
            parseAndMigratePersistedSnapshot(
                JSON.stringify({ version: APP_VERSION, settings: 'not-an-object' }),
            ),
        ).toThrow()
    })

    it('rejects a simulation array that cannot hydrate as an entity collection', () => {
        expect(() =>
            parseAndMigratePersistedSnapshot(
                JSON.stringify({ version: APP_VERSION, simulation: { plants: [] } }),
            ),
        ).toThrow('Persisted simulation.plants must be an entity collection.')
    })

    it('repairs malformed collection fields in current-version persisted slices', () => {
        const migrated = parseAndMigratePersistedSnapshot(
            JSON.stringify({
                version: APP_VERSION,
                nutrientPlanner: { schedule: {}, readings: {}, alerts: null },
                hydro: { readings: {}, alerts: {}, thresholds: null },
                metrics: { readings: {} },
                growPlanner: { tasks: {} },
            }),
        )

        expect(migrated.nutrientPlanner).toEqual(
            expect.objectContaining({ schedule: [], readings: [], alerts: [] }),
        )
        expect(migrated.hydro).toEqual(
            expect.objectContaining({ readings: [], alerts: [], thresholds: expect.any(Object) }),
        )
        expect(migrated.metrics?.readings).toEqual([])
        expect(migrated.growPlanner?.tasks).toEqual([])
    })

    it('repairs a current-version plant entity missing tasks/problems', () => {
        // selectOpenTasksSummary/selectActiveProblemsSummary call .filter()
        // directly on every active plant's tasks/problems -- an entity
        // collection that passes requireEntityCollection's ids/entities check
        // but omits these fields on an entry crashes the app on next render.
        // The migration pipeline's per-entity repair (legacyPlantPatches.ts)
        // backfills both regardless of declared version, so this now succeeds
        // rather than throwing -- requirePlantEntityFields is a backstop for
        // whatever repair can't fix (see the next test).
        const migrated = parseAndMigratePersistedSnapshot(
            JSON.stringify({
                version: APP_VERSION,
                simulation: {
                    plants: { ids: ['p1'], entities: { p1: {} } },
                    plantSlots: ['p1'],
                    vpdProfiles: {},
                },
            }),
        )
        const plant = migrated.simulation?.plants.entities['p1'] as
            | { tasks?: unknown; problems?: unknown }
            | undefined
        expect(plant?.tasks).toEqual([])
        expect(plant?.problems).toEqual([])
    })

    it('rejects a non-object plant entity that repair cannot patch', () => {
        expect(() =>
            parseAndMigratePersistedSnapshot(
                JSON.stringify({
                    version: APP_VERSION,
                    simulation: {
                        plants: { ids: ['p1'], entities: { p1: 'not-an-object' } },
                        plantSlots: ['p1'],
                        vpdProfiles: {},
                    },
                }),
            ),
        ).toThrow('Persisted simulation.plants.entities.p1 must be an object.')
    })

    it('runs the canonical migration and shape-repair pipeline', () => {
        const migrated = JSON.parse(
            migratePersistedSnapshot(
                JSON.stringify({
                    version: 1,
                    simulation: {
                        plants: {
                            ids: ['plant-1'],
                            entities: { 'plant-1': { id: 'plant-1' } },
                        },
                    },
                }),
            ),
        ) as {
            version: number
            simulation: { plants: { ids: string[]; entities: Record<string, unknown> } }
        }

        expect(migrated.version).toBe(APP_VERSION)
        expect(migrated.simulation.plants.ids).toContain('plant-1')
        expect(migrated.simulation.plants.entities['plant-1']).toEqual(
            expect.objectContaining({ id: 'plant-1', terpeneProfile: {} }),
        )
    })
})
