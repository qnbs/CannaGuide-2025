import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JournalEntry, Plant, SimulationState } from '@/types'
import { ARCHIVED_LOGS_METADATA_KEY, MAX_ARCHIVED_LOGS_PER_PLANT } from './types'

const store = vi.hoisted(() => ({ data: new Map<string, unknown>(), writes: 0 }))

vi.mock('./metadataStore', () => ({
    metadataStore: {
        getMetadata: vi.fn((key: string) => Promise.resolve(store.data.get(key))),
        updateMetadata: vi.fn((key: string, update: (current: unknown) => unknown) => {
            const next = update(store.data.get(key))
            if (next !== undefined) {
                store.writes += 1
                store.data.set(key, structuredClone(next))
            }
            return Promise.resolve()
        }),
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

/** A simulation with one plant `plantId` whose journal has `count` entries from `from` on. */
const simulationFor = (plantId: string, count: number, from = 0): SimulationState =>
    ({
        plants: {
            ids: [plantId],
            entities: {
                [plantId]: {
                    id: plantId,
                    journal: Array.from({ length: count }, (_, index) => entry(from + index)),
                } as unknown as Plant,
            },
        },
        plantSlots: [plantId, null, null],
        vpdProfiles: {},
    }) as unknown as SimulationState

const archivedIdsOf = (plantId: string): string[] =>
    (
        (
            store.data.get(ARCHIVED_LOGS_METADATA_KEY) as Record<string, JournalEntry[]> | undefined
        )?.[plantId] ?? []
    ).map(({ id }) => id)

const range = (from: number, to: number): string[] =>
    Array.from({ length: to - from }, (_, index) => `e${String(from + index)}`)

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
        expect(archivedIds()).toEqual(range(0, 7))
        expect(store.writes).toBe(1)
        // Saving never changes the state in memory, which is why the overflow repeats.
        expect(state.plants.entities.p1?.journal).toHaveLength(10)
    })

    it('adds only the new overflow when the journal grows', async () => {
        await simulationPersistence.optimizeSimulationForPersistence(simulationWith(10))
        await simulationPersistence.optimizeSimulationForPersistence(simulationWith(12))

        expect(archivedIds()).toEqual(range(0, 9))
    })

    it('preserves archive updates from concurrent tabs (GH #669)', async () => {
        await Promise.all([
            simulationPersistence.optimizeSimulationForPersistence(simulationFor('p1', 10, 0)),
            simulationPersistence.optimizeSimulationForPersistence(simulationFor('p2', 10, 10)),
        ])

        expect(archivedIdsOf('p1')).toEqual(range(0, 7))
        expect(archivedIdsOf('p2')).toEqual(range(10, 17))
    })

    it('at the cap, adds the newer overflow and then stands still', async () => {
        // The archive holds older history than the current journal's overflow.
        const older = Array.from({ length: MAX_ARCHIVED_LOGS_PER_PLANT }, (_, index) =>
            entry(index - MAX_ARCHIVED_LOGS_PER_PLANT),
        )
        store.data.set(ARCHIVED_LOGS_METADATA_KEY, { p1: older })
        const state = simulationWith(5)

        await simulationPersistence.optimizeSimulationForPersistence(state)
        const afterFirst = archivedIds()
        await simulationPersistence.optimizeSimulationForPersistence(state)
        await simulationPersistence.optimizeSimulationForPersistence(state)

        // e0 and e1 are archived; the two oldest entries make room for them.
        expect(afterFirst.slice(-3)).toEqual(['e-1', 'e0', 'e1'])
        expect(afterFirst[0]).toBe(`e${String(2 - MAX_ARCHIVED_LOGS_PER_PLANT)}`)
        expect(afterFirst).toHaveLength(MAX_ARCHIVED_LOGS_PER_PLANT)
        expect(archivedIds()).toEqual(afterFirst)
        expect(store.writes).toBe(1)
    })

    it('keeps the newest entries and stands still when the overflow alone exceeds the cap', async () => {
        const state = simulationWith(MAX_ARCHIVED_LOGS_PER_PLANT + 103)

        await simulationPersistence.optimizeSimulationForPersistence(state)
        const afterFirst = archivedIds()
        await simulationPersistence.optimizeSimulationForPersistence(state)

        // Overflow e0..e1299, cap 1200: e100..e1299 stay, and the next save changes nothing.
        expect(afterFirst).toEqual(range(100, MAX_ARCHIVED_LOGS_PER_PLANT + 100))
        expect(archivedIds()).toEqual(afterFirst)
        expect(store.writes).toBe(1)
    })

    it('removes copies the old code left in an archive', async () => {
        store.data.set(ARCHIVED_LOGS_METADATA_KEY, {
            p1: [entry(0), entry(0), entry(1), entry(1), entry(1)],
        })

        await simulationPersistence.optimizeSimulationForPersistence(simulationWith(10))

        expect(archivedIds()).toEqual(range(0, 7))
    })

    it('archives an id only once when the overflow itself repeats it', async () => {
        const state = simulationWith(10)
        const journal = state.plants.entities.p1?.journal ?? []
        journal.splice(1, 0, entry(0), entry(0))

        await simulationPersistence.optimizeSimulationForPersistence(state)

        expect(archivedIds().filter((id) => id === 'e0')).toHaveLength(1)
    })

    it('handles a plant whose id is also an Object.prototype name', async () => {
        await simulationPersistence.optimizeSimulationForPersistence(
            simulationFor('constructor', 10),
        )

        expect(archivedIdsOf('constructor')).toEqual(range(0, 7))
    })

    it('returns no archived entries for an inherited plant id', async () => {
        await expect(simulationPersistence.getArchivedPlantLogs('constructor')).resolves.toEqual([])

        store.data.set(
            ARCHIVED_LOGS_METADATA_KEY,
            Object.fromEntries([['constructor', [entry(7)]]]),
        )

        await expect(simulationPersistence.getArchivedPlantLogs('constructor')).resolves.toEqual([
            entry(7),
        ])
    })

    it('still trims the saved copy to the kept entries', async () => {
        const saved = await simulationPersistence.optimizeSimulationForPersistence(
            simulationWith(10),
        )

        expect(saved.plants.entities.p1?.journal.map(({ id }) => id)).toEqual(['e7', 'e8', 'e9'])
    })
})
