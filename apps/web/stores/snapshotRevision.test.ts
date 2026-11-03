import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { REDUX_STATE_KEY, REDUX_STATE_REVISION_KEY } from '@/constants'

/**
 * Each call returns a fresh copy of the storage and revision modules over the
 * same fake IndexedDB, which is what a second browser tab is: its own module
 * state and its own connection to the same database.
 */
const openTab = async () => {
    vi.resetModules()
    const storage = await import('@/stores/indexedDBStorage')
    const revision = await import('@/stores/snapshotRevision')
    return { storage: storage.indexedDBStorage, revision }
}

const deleteStateDatabase = async () => {
    vi.resetModules()
    const { closeIndexedDBStorage } = await import('@/stores/indexedDBStorage')
    closeIndexedDBStorage()
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('CannaGuideStateDB')
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
    })
}

describe('snapshot revision (GH #669)', () => {
    beforeEach(async () => {
        await deleteStateDatabase()
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    })

    it('lets one tab save again and again', async () => {
        const tab = await openTab()
        await tab.revision.rememberStoredRevision()

        await tab.revision.writeSnapshot('first')
        await tab.revision.writeSnapshot('second')

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('second')
    })

    it('refuses a tab that loaded the state before another tab saved', async () => {
        const first = await openTab()
        const second = await openTab()
        await first.revision.rememberStoredRevision()
        await second.revision.rememberStoredRevision()

        await first.revision.writeSnapshot('from the first tab')

        await expect(second.revision.writeSnapshot('from the second tab')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(first.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('from the first tab')
    })

    it('keeps refusing the stale tab, so it cannot win on a later try', async () => {
        const first = await openTab()
        const second = await openTab()
        await first.revision.rememberStoredRevision()
        await second.revision.rememberStoredRevision()
        await first.revision.writeSnapshot('from the first tab')

        await expect(second.revision.writeSnapshot('one')).rejects.toThrow()
        await expect(second.revision.writeSnapshot('two')).rejects.toThrow()

        await expect(first.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('from the first tab')
    })

    it("lets a tab save after it has loaded the other tab's revision", async () => {
        const first = await openTab()
        const second = await openTab()
        await first.revision.rememberStoredRevision()
        await first.revision.writeSnapshot('from the first tab')

        await second.revision.rememberStoredRevision()
        await second.revision.writeSnapshot('from the second tab')

        await expect(first.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('from the second tab')
    })

    it('lets exactly one of two overlapping saves win', async () => {
        const first = await openTab()
        const second = await openTab()
        await first.revision.rememberStoredRevision()
        await second.revision.rememberStoredRevision()

        const outcomes = await Promise.allSettled([
            first.revision.writeSnapshot('from the first tab'),
            second.revision.writeSnapshot('from the second tab'),
        ])

        expect(outcomes.map((outcome) => outcome.status).sort()).toEqual(['fulfilled', 'rejected'])
        const winner = outcomes[0]?.status === 'fulfilled' ? 'first' : 'second'
        await expect(first.storage.getItem(REDUX_STATE_KEY)).resolves.toBe(`from the ${winner} tab`)
    })

    it('refuses a tab whose data was erased by another tab', async () => {
        const first = await openTab()
        await first.revision.rememberStoredRevision()
        await first.revision.writeSnapshot('before the erase')
        const second = await openTab()
        await second.revision.rememberStoredRevision()

        await first.storage.removeItem(REDUX_STATE_KEY)
        await first.storage.removeItem(REDUX_STATE_REVISION_KEY)

        await expect(second.revision.writeSnapshot('after the erase')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(first.storage.getItem(REDUX_STATE_KEY)).resolves.toBeNull()
    })

    it('saves as before when no revision was loaded, and writes no revision', async () => {
        const tab = await openTab()

        await tab.revision.writeSnapshot('without a revision')

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('without a revision')
        await expect(tab.storage.getItem(REDUX_STATE_REVISION_KEY)).resolves.toBeNull()
    })

    it('does not stop the start when the revision cannot be read', async () => {
        const tab = await openTab()
        vi.spyOn(tab.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))

        await expect(tab.revision.rememberStoredRevision()).resolves.toBeUndefined()
        await tab.revision.writeSnapshot('saved anyway')

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('saved anyway')
    })
})
