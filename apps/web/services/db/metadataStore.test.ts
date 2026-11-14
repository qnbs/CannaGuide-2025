import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { closeDB, releaseDBAfterErase } from './connection'
import { metadataStore } from './metadataStore'

const TEST_KEY = 'metadataStore-concurrent-update-test'

describe('metadataStore.updateMetadata', () => {
    beforeEach(async () => {
        releaseDBAfterErase()
        await metadataStore.deleteMetadata(TEST_KEY)
    })

    afterEach(async () => {
        await metadataStore.deleteMetadata(TEST_KEY)
        closeDB()
        releaseDBAfterErase()
    })

    it('preserves concurrent updates in serialized IndexedDB readwrite transactions', async () => {
        await Promise.all([
            metadataStore.updateMetadata<Record<string, number[]>>(TEST_KEY, (current) => ({
                ...current,
                first: [1, 2, 3],
            })),
            metadataStore.updateMetadata<Record<string, number[]>>(TEST_KEY, (current) => ({
                ...current,
                second: [4, 5, 6],
            })),
        ])

        await expect(metadataStore.getMetadata(TEST_KEY)).resolves.toEqual({
            first: [1, 2, 3],
            second: [4, 5, 6],
        })
    })
})
