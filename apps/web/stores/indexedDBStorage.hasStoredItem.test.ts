import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REDUX_STATE_KEY } from '@/constants'

// hasStoredItem backs the desktop startup report's "saved snapshot present" flag,
// which the runtime smoke test uses to prove that a restart finds the first run's
// data. It must count, not read the multi-megabyte snapshot.

const load = async () => import('@/stores/indexedDBStorage')

const deleteDatabase = async (): Promise<void> => {
    const { closeIndexedDBStorage } = await load()
    closeIndexedDBStorage()
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('CannaGuideStateDB')
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
        request.onblocked = () => resolve()
    })
}

describe('hasStoredItem', () => {
    beforeEach(async () => {
        vi.resetModules()
        await deleteDatabase()
        vi.resetModules()
    })

    afterEach(async () => {
        await deleteDatabase()
    })

    it('is false before a save and true after it, without reading the value', async () => {
        const { hasStoredItem, indexedDBStorage } = await load()
        expect(await hasStoredItem(REDUX_STATE_KEY)).toBe(false)

        await indexedDBStorage.setItem(REDUX_STATE_KEY, '{"settings":{}}')
        const get = vi.spyOn(IDBObjectStore.prototype, 'get')
        expect(await hasStoredItem(REDUX_STATE_KEY)).toBe(true)
        expect(get).not.toHaveBeenCalled()
        get.mockRestore()
    })

    it('is false again once the item is removed', async () => {
        const { hasStoredItem, indexedDBStorage } = await load()
        await indexedDBStorage.setItem(REDUX_STATE_KEY, 'x')
        await indexedDBStorage.removeItem(REDUX_STATE_KEY)
        expect(await hasStoredItem(REDUX_STATE_KEY)).toBe(false)
    })
})
