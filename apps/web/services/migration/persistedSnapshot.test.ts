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
        ).toThrow('Persisted simulation plants must be an entity collection.')
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
