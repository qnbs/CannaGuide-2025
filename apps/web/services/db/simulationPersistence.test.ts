import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JournalEntry, Plant, SimulationState } from '@/types'
import { ARCHIVED_LOGS_METADATA_KEY, MAX_ARCHIVED_LOGS_PER_PLANT } from './types'

const store = vi.hoisted(() => ({ data: new Map<string, unknown>(), writes: 0 }))

vi.mock('./metadataStore', () => ({
    metadataStore: {
        getMetadata: vi.fn((key: string) => Promise.resolve(store.data.get(key))),
        setMetadata: vi.fn((key: string, value: unknown) => {
            store.writes += 1
            store.data.set(key, structuredClone(value))
            return Promise.resolve()
        }),
    },
}))

/** Keep 3 journal entries per plant in the saved copy, so overflow is easy to see. */
vi.mock('./storageHelpers', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./storageHelpers')>()),
    getStorageEstimateSnapshot: vi.fn(() => Promise.resolve({ usageRatio: 0 })),
    chooseJournalRetentionLimit: vi.fn(() => 3),
}))

import { simulationPersistence } from './simulationPersistence'

const entry = (index: number): JournalEntry =>
    ({
        id: `e${String(index)}`,
        createdAt: index,
        type: 'OBSERVATION',
        notes: `n${String(index)}`,
    }) as unknown as JournalEntry

/** A simulation whose one plant has `count` journal entries, oldest first. */
const simulationWith = (count: number, from = 0): SimulationState =>
    ({
        plants: {
            ids: ['p1'],
            entities: {
                p1: {
                    id: 'p1',
                    journal: Array.from({ length: count }, (_, index) => entry(from + index)),
                } as unknown as Plant,
            },
        },
        plantSlots: ['p1', null, null],
        vpdProfiles: {},
    }) as unknown as SimulationState

const archivedIds = (): string[] =>
    (
        (store.data.get(ARCHIVED_LOGS_METADATA_KEY) as Record<string, JournalEntry[]> | undefined)
            ?.p1 ?? []
    ).map(({ id }) => id)

describe('journal overflow archive (GH #668)', () => {
    beforeEach(() => {
        store.data.clear()
        store.writes = 0
    })

    it('archives the overflow once, however often the same state is saved', async () => {
        const state = simulationWith(10)

        for (let save = 0; save < 100; save += 1) {
            await simulationPersistence.optimizeSimulationForPersistence(state)
        }

        // 10 entries, 3 kept in the saved copy: the 7 oldest are archived, once.
        expect(archivedIds()).toEqual(['e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6'])
        expect(store.writes).toBe(1)
    })

    it('adds only the new overflow when the journal grows', async () => {
        await simulationPersistence.optimizeSimulationForPersistence(simulationWith(10))
        await simulationPersistence.optimizeSimulationForPersistence(simulationWith(12))

        expect(archivedIds()).toEqual(['e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'])
    })

    it('keeps distinct old entries at the cap instead of filling it with copies', async () => {
        const full = Array.from({ length: MAX_ARCHIVED_LOGS_PER_PLANT }, (_, index) =>
            entry(1000 + index),
        )
        store.data.set(ARCHIVED_LOGS_METADATA_KEY, { p1: full })
        const state = simulationWith(5)

        await simulationPersistence.optimizeSimulationForPersistence(state)
        const afterFirst = archivedIds()
        await simulationPersistence.optimizeSimulationForPersistence(state)
        await simulationPersistence.optimizeSimulationForPersistence(state)

        // The second and third save change nothing: no old entry is pushed out.
        expect(archivedIds()).toEqual(afterFirst)
        expect(new Set(afterFirst).size).toBe(afterFirst.length)
        expect(afterFirst).toHaveLength(MAX_ARCHIVED_LOGS_PER_PLANT)
    })

    it('still trims the saved copy to the kept entries', async () => {
        const saved = await simulationPersistence.optimizeSimulationForPersistence(
            simulationWith(10),
        )

        expect(saved.plants.entities.p1?.journal.map(({ id }) => id)).toEqual(['e7', 'e8', 'e9'])
    })
})
