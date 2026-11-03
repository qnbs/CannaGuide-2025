import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getItem: vi.fn(),
    getMetadata: vi.fn(),
    getReduxSnapshot: vi.fn(),
}))

vi.mock('@/stores/indexedDBStorage', () => ({ indexedDBStorage: { getItem: mocks.getItem } }))
vi.mock('./metadataStore', () => ({ metadataStore: { getMetadata: mocks.getMetadata } }))
vi.mock('@/services/uiStateBridge', () => ({ getReduxSnapshot: mocks.getReduxSnapshot }))

import { REDUX_STATE_KEY, REDUX_STATE_QUARANTINE_KEY } from '@/constants'
import { collectReferencedImageIds } from './imageReferences'

const snapshotWithImage = (imageId: string): string =>
    JSON.stringify({
        simulation: {
            plants: {
                ids: ['p1'],
                entities: { p1: { journal: [{ id: 'j1', details: { imageId } }] } },
            },
        },
    })

/** Backs the mocked storage with a plain object. */
const useStorage = (stored: Record<string, string>): void => {
    mocks.getItem.mockImplementation((key: string) => Promise.resolve(stored[key] ?? null))
}

describe('collectReferencedImageIds', () => {
    beforeEach(() => {
        // No live simulation and no archived journals: the mocks return undefined.
        vi.clearAllMocks()
    })

    it('collects the image ids of the primary snapshot', async () => {
        useStorage({ [REDUX_STATE_KEY]: snapshotWithImage('img-primary') })

        await expect(collectReferencedImageIds()).resolves.toEqual(new Set(['img-primary']))
    })

    it('keeps the photos of a quarantined snapshot that is not valid JSON', async () => {
        // Cut off in the middle, as an unreadable snapshot often is.
        const truncated =
            '{"simulation":{"plants":{"entities":{"p1":{"journal":[' +
            '{"details":{"imageId":"img-lost-1"}},{"details":{"imageId":"img-lost-2"}},{"det'
        expect(() => JSON.parse(truncated)).toThrow()
        useStorage({ [REDUX_STATE_QUARANTINE_KEY]: truncated })

        await expect(collectReferencedImageIds()).resolves.toEqual(
            new Set(['img-lost-1', 'img-lost-2']),
        )
    })

    it('reads the quarantine in addition to the primary snapshot', async () => {
        useStorage({
            [REDUX_STATE_KEY]: snapshotWithImage('img-primary'),
            [REDUX_STATE_QUARANTINE_KEY]: '{"details":{"imageId":"img-old"}',
        })

        await expect(collectReferencedImageIds()).resolves.toEqual(
            new Set(['img-primary', 'img-old']),
        )
    })

    it('adds nothing when there is no quarantine or it names no image', async () => {
        useStorage({ [REDUX_STATE_QUARANTINE_KEY]: '{"version":5' })

        await expect(collectReferencedImageIds()).resolves.toEqual(new Set())
    })
})
