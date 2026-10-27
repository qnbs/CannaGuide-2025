import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { indexedDB } from 'fake-indexeddb'

import { DB_NAME, REDUX_STATE_KEY } from '@/constants'
import type { StoredImageData } from '@/types'

// Photo pruning must never delete an image that any copy of the journal
// references. Images and metadata use the real (fake-indexeddb) image database;
// the live Redux state and the persisted snapshots are injected.

const mocks = vi.hoisted(() => ({
    liveSimulation: undefined as unknown,
    liveStateError: null as Error | null,
    snapshots: new Map<string, string>(),
}))

vi.mock('@/services/uiStateBridge', () => ({
    getReduxSnapshot: (selector: (state: { simulation: unknown }) => unknown) => {
        if (mocks.liveStateError) throw mocks.liveStateError
        return selector({ simulation: mocks.liveSimulation })
    },
}))
vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: async (key: string) => mocks.snapshots.get(key) ?? null,
    },
}))
vi.mock('@/services/imageService', () => ({
    resizeImage: async (data: string) => data,
}))

const DAY_MS = 24 * 60 * 60 * 1000
const ARCHIVE_KEY = 'archived_plant_logs_v1'

const simulationReferencing = (...imageIds: string[]) => ({
    plants: {
        ids: ['plant-1'],
        entities: {
            'plant-1': {
                id: 'plant-1',
                journal: imageIds.map((imageId, index) => ({
                    id: `entry-${index}`,
                    details: { imageId },
                })),
            },
        },
    },
})

const photo = (id: string, ageDays: number): StoredImageData => ({
    id,
    data: 'data:image/png;base64,ZmFrZQ==',
    createdAt: Date.now() - ageDays * DAY_MS,
})

const deleteMainDb = (): Promise<void> =>
    new Promise((resolve) => {
        const request = indexedDB.deleteDatabase(DB_NAME)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
        request.onblocked = () => resolve()
    })

const setStorageUsage = (ratio: number) => {
    Object.defineProperty(globalThis.navigator, 'storage', {
        configurable: true,
        value: { estimate: vi.fn(async () => ({ usage: ratio * 100, quota: 100 })) },
    })
}

const loadDbService = async () => (await import('@/services/dbService')).dbService

const seed = async (images: StoredImageData[]) => {
    const dbService = await loadDbService()
    setStorageUsage(0)
    for (const image of images) await dbService.addImage(image)
    return dbService
}

const storedIds = async (dbService: Awaited<ReturnType<typeof loadDbService>>) =>
    (await dbService.getAllImages()).map((image) => image.id).sort()

describe('imageStore pruning', () => {
    beforeEach(async () => {
        vi.resetModules()
        await deleteMainDb()
        mocks.liveSimulation = simulationReferencing()
        mocks.liveStateError = null
        mocks.snapshots.clear()
        vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    afterEach(async () => {
        vi.restoreAllMocks()
        setStorageUsage(0)
        await deleteMainDb()
    })

    it('keeps every referenced photo when a save hits the storage warning threshold', async () => {
        const dbService = await seed([
            photo('photo-live', 30),
            photo('photo-primary', 29),
            photo('photo-backup', 28),
            photo('photo-archived', 27),
            photo('photo-orphan-old', 26),
            photo('photo-orphan-fresh', 0),
        ])
        mocks.liveSimulation = simulationReferencing('photo-live')
        mocks.snapshots.set(
            REDUX_STATE_KEY,
            JSON.stringify({ simulation: simulationReferencing('photo-primary') }),
        )
        mocks.snapshots.set(
            `${REDUX_STATE_KEY}-backup`,
            JSON.stringify({ simulation: simulationReferencing('photo-backup') }),
        )
        await dbService.setMetadata(ARCHIVE_KEY, {
            'plant-1': [{ id: 'archived-1', details: { imageId: 'photo-archived' } }],
        })

        setStorageUsage(0.8)
        await dbService.addImage(photo('photo-new', 0))

        // Only the old unreferenced image is reclaimed; the fresh one may still be
        // waiting for its journal entry.
        expect(await storedIds(dbService)).toEqual([
            'photo-archived',
            'photo-backup',
            'photo-live',
            'photo-new',
            'photo-orphan-fresh',
            'photo-primary',
        ])
    })

    it('reclaims unreferenced images oldest first, up to the limit', async () => {
        const dbService = await seed([
            photo('orphan-a', 40),
            photo('orphan-b', 30),
            photo('orphan-c', 20),
            photo('kept', 50),
        ])
        mocks.liveSimulation = simulationReferencing('kept')

        await expect(dbService.pruneOldImages(2)).resolves.toBe(2)
        expect(await storedIds(dbService)).toEqual(['kept', 'orphan-c'])
        // The manual storage cleanup uses the same path with a larger limit.
        await expect(dbService.pruneOldImages(80)).resolves.toBe(1)
        expect(await storedIds(dbService)).toEqual(['kept'])
    })

    it('fails the save visibly on quota instead of evicting referenced photos', async () => {
        const dbService = await seed([photo('photo-1', 30), photo('photo-2', 20)])
        mocks.liveSimulation = simulationReferencing('photo-1', 'photo-2')
        const originalPut = IDBObjectStore.prototype.put
        vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
            this: IDBObjectStore,
            ...args: Parameters<IDBObjectStore['put']>
        ) {
            const [value] = args
            if ((value as StoredImageData).id === 'photo-new') {
                throw new DOMException('Quota exceeded', 'QuotaExceededError')
            }
            return originalPut.apply(this, args)
        })

        await expect(dbService.addImage(photo('photo-new', 0))).rejects.toMatchObject({
            name: 'QuotaExceededError',
        })
        expect(await storedIds(dbService)).toEqual(['photo-1', 'photo-2'])
    })

    it.each([
        ['a corrupt persisted snapshot', () => mocks.snapshots.set(REDUX_STATE_KEY, '{corrupt')],
        [
            'an uninitialised Redux bridge',
            () => {
                mocks.liveStateError = new Error('[uiStateBridge] Bridge not initialised.')
            },
        ],
        [
            'an unexpected simulation shape',
            () => {
                mocks.liveSimulation = { plants: 'not-a-collection' }
            },
        ],
    ])('deletes nothing when references cannot be proven (%s)', async (_case, breakSource) => {
        const dbService = await seed([photo('maybe-referenced', 30)])
        breakSource()

        await expect(dbService.pruneOldImages(80)).rejects.toThrow()
        setStorageUsage(0.8)
        // Saving still works; pruning is best effort.
        await dbService.addImage(photo('photo-new', 0))
        expect(await storedIds(dbService)).toEqual(['maybe-referenced', 'photo-new'])
    })

    it('does not prune while a backup restore holds the persistence fence', async () => {
        const dbService = await seed([photo('restored-not-yet-referenced', 400)])
        const { suspendPersistenceForRecovery } = await import('@/bootstrap/persistenceCoordinator')

        const resume = await suspendPersistenceForRecovery()
        await expect(dbService.pruneOldImages(80)).resolves.toBe(0)
        expect(await storedIds(dbService)).toEqual(['restored-not-yet-referenced'])

        resume?.()
        await expect(dbService.pruneOldImages(80)).resolves.toBe(1)
    })
})
