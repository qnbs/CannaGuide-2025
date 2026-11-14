import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { closeDB, releaseDBAfterErase } from './connection'
import { DELETE_METADATA, metadataStore } from './metadataStore'

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

    it('deletes the metadata key when an atomic update returns DELETE_METADATA', async () => {
        await metadataStore.setMetadata(TEST_KEY, { keep: false })

        await metadataStore.updateMetadata(TEST_KEY, () => DELETE_METADATA)

        await expect(metadataStore.getMetadata(TEST_KEY)).resolves.toBeUndefined()
    })

    it('does not retry when the update callback throws', async () => {
        const failure = new Error('invalid metadata')
        let calls = 0

        await expect(
            metadataStore.updateMetadata(TEST_KEY, () => {
                calls += 1
                throw failure
            }),
        ).rejects.toBe(failure)

        expect(calls).toBe(1)
    })
})
