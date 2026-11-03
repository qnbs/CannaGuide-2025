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

    it('stores a token of its own when none exists, so "no token" is never expected', async () => {
        const tab = await openTab()

        await tab.revision.rememberStoredRevision()

        await expect(tab.storage.getItem(REDUX_STATE_REVISION_KEY)).resolves.not.toBeNull()
    })

    it('refuses a tab that saved nothing yet when the data and the token are erased', async () => {
        const first = await openTab()
        const second = await openTab()
        await first.revision.rememberStoredRevision()
        await second.revision.rememberStoredRevision()

        await first.storage.removeItem(REDUX_STATE_KEY)
        await first.storage.removeItem(REDUX_STATE_REVISION_KEY)

        await expect(second.revision.writeSnapshot('after the erase')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(first.storage.getItem(REDUX_STATE_KEY)).resolves.toBeNull()
    })

    it('refuses the other tab after a deliberate replacement, such as an import', async () => {
        const importing = await openTab()
        const other = await openTab()
        await importing.revision.rememberStoredRevision()
        await other.revision.rememberStoredRevision()

        await importing.revision.replaceSnapshot('imported')

        await expect(
            other.revision.writeSnapshot('old state of the other tab'),
        ).rejects.toMatchObject({ name: 'StaleSnapshotError' })
        await expect(importing.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('imported')
    })

    it('refuses the replacing tab too, so its pagehide save cannot undo the replacement', async () => {
        const tab = await openTab()
        await tab.revision.rememberStoredRevision()

        await tab.revision.replaceSnapshot('imported')

        await expect(tab.revision.writeSnapshot('old state saved on reload')).rejects.toMatchObject(
            { name: 'StaleSnapshotError' },
        )
        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('imported')
    })

    it('lets the replacing tab go on saving when it keeps running after the replacement', async () => {
        const tab = await openTab()
        await tab.revision.rememberStoredRevision()

        await tab.revision.replaceSnapshot('repaired', true)
        await tab.revision.writeSnapshot('saved after the repair')

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('saved after the repair')
    })

    it('starts checking after a repair that wrote a token, even if the first read failed', async () => {
        const repairing = await openTab()
        const other = await openTab()
        vi.spyOn(repairing.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))
        await repairing.revision.rememberStoredRevision()
        await repairing.revision.replaceSnapshot('repaired', true)
        await other.revision.rememberStoredRevision()
        await other.revision.writeSnapshot('saved by the other tab')

        await expect(repairing.revision.writeSnapshot('older state')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(other.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('saved by the other tab')
    })

    it('does not let a page that is already stale adopt the token of a replacement it keeps running after', async () => {
        const stale = await openTab()
        const other = await openTab()
        await stale.revision.rememberStoredRevision()
        await other.revision.rememberStoredRevision()
        await other.revision.writeSnapshot('newer save of the other tab')

        await stale.revision.replaceSnapshot('rolled back', true)

        await expect(stale.revision.writeSnapshot('old state')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(stale.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('rolled back')
    })

    it('repairs while the page is current and goes on saving', async () => {
        const tab = await openTab()
        await tab.revision.rememberStoredRevision()

        await tab.revision.repairSnapshot('repaired from the backup')
        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('repaired from the backup')
        await tab.revision.writeSnapshot('saved after the repair')

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('saved after the repair')
    })

    it('refuses to repair over a save another tab made since the page started', async () => {
        const repairing = await openTab()
        const other = await openTab()
        await repairing.revision.rememberStoredRevision()
        await other.revision.rememberStoredRevision()
        await other.revision.writeSnapshot('valid save of the other tab')

        await expect(repairing.revision.repairSnapshot('older backup')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(repairing.storage.getItem(REDUX_STATE_KEY)).resolves.toBe(
            'valid save of the other tab',
        )
        await expect(repairing.revision.writeSnapshot('empty start')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
    })

    it('repairs unconditionally on a writer page that started without the check, then checks', async () => {
        const tab = await openTab()
        const other = await openTab()
        vi.spyOn(tab.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))
        await tab.revision.rememberStoredRevision()
        tab.revision.setUncheckedWritePermit(() => true)
        await other.revision.rememberStoredRevision()

        await tab.revision.repairSnapshot('repaired')
        await other.revision.rememberStoredRevision()
        await other.revision.writeSnapshot('saved by the other tab')

        await expect(tab.revision.writeSnapshot('older state')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('saved by the other tab')
    })

    it('removes the primary while the page is current and goes on saving', async () => {
        const tab = await openTab()
        await tab.revision.rememberStoredRevision()
        await tab.revision.writeSnapshot('unreadable')

        await expect(tab.revision.removeSnapshotIfCurrent()).resolves.toBe(true)
        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBeNull()
        await tab.revision.writeSnapshot('fresh start')

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('fresh start')
    })

    it('keeps a save another tab made since the page started when it would remove the primary', async () => {
        const tab = await openTab()
        const other = await openTab()
        await tab.revision.rememberStoredRevision()
        await other.revision.rememberStoredRevision()
        await other.revision.writeSnapshot('valid save of the other tab')

        await expect(tab.revision.removeSnapshotIfCurrent()).resolves.toBe(false)

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe(
            'valid save of the other tab',
        )
    })

    it('arms the check after a replacement on a page that started without it', async () => {
        const tab = await openTab()
        vi.spyOn(tab.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))
        await tab.revision.rememberStoredRevision()

        await tab.revision.replaceSnapshot('imported')

        await expect(tab.revision.writeSnapshot('old state saved on reload')).rejects.toMatchObject(
            { name: 'StaleSnapshotError' },
        )
        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('imported')
    })

    it('arms the check after an update on a page that started without it', async () => {
        const tab = await openTab()
        await tab.storage.setItem(REDUX_STATE_KEY, 'before')
        vi.spyOn(tab.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))
        await tab.revision.rememberStoredRevision()

        await tab.revision.updateSnapshot((current) => `${current}+updated`)

        await expect(tab.revision.writeSnapshot('old state saved on reload')).rejects.toMatchObject(
            { name: 'StaleSnapshotError' },
        )
        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('before+updated')
    })

    it('refuses the other tab after the snapshot was removed through replaceSnapshot', async () => {
        const removing = await openTab()
        const other = await openTab()
        await removing.revision.rememberStoredRevision()
        await other.revision.rememberStoredRevision()

        await removing.revision.replaceSnapshot(null)

        await expect(other.revision.writeSnapshot('written back')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(removing.storage.getItem(REDUX_STATE_KEY)).resolves.toBeNull()
    })

    it('updates the snapshot and refuses the other tab afterwards', async () => {
        const updating = await openTab()
        const other = await openTab()
        await updating.revision.rememberStoredRevision()
        await updating.revision.writeSnapshot('before')
        await other.revision.rememberStoredRevision()

        await updating.revision.updateSnapshot((current) => `${current}+updated`)

        await expect(updating.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('before+updated')
        await expect(other.revision.writeSnapshot('old state')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
    })

    it('refuses an update when another tab saved between its read and its write', async () => {
        const updating = await openTab()
        const other = await openTab()
        await updating.revision.rememberStoredRevision()
        await other.revision.rememberStoredRevision()
        await updating.revision.writeSnapshot('before')
        await other.revision.rememberStoredRevision()

        await expect(
            updating.revision.updateSnapshot(async (current) => {
                await other.revision.writeSnapshot('saved in between')
                return `${current}+updated`
            }),
        ).rejects.toMatchObject({ name: 'StaleSnapshotError' })

        await expect(updating.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('saved in between')
    })

    it('leaves the snapshot and the revision alone when the update has nothing to change', async () => {
        const tab = await openTab()
        await tab.revision.rememberStoredRevision()
        await tab.revision.writeSnapshot('kept')
        const revisionBefore = await tab.storage.getItem(REDUX_STATE_REVISION_KEY)

        await tab.revision.updateSnapshot(() => null)

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('kept')
        await expect(tab.storage.getItem(REDUX_STATE_REVISION_KEY)).resolves.toBe(revisionBefore)
    })

    it('does not report success for an update with nothing to change when another tab saved meanwhile', async () => {
        const updating = await openTab()
        const other = await openTab()
        const onStale = vi.fn()
        updating.revision.setStaleSnapshotHandler(onStale)
        await updating.revision.rememberStoredRevision()
        await other.revision.rememberStoredRevision()

        await expect(
            updating.revision.updateSnapshot(async () => {
                await other.revision.writeSnapshot('saved in between')
                return null
            }),
        ).rejects.toMatchObject({ name: 'StaleSnapshotError' })
        expect(onStale).toHaveBeenCalledOnce()
    })

    it('tells the page when an update is refused, so it can stop and ask for a reload', async () => {
        const updating = await openTab()
        const other = await openTab()
        const onStale = vi.fn()
        updating.revision.setStaleSnapshotHandler(onStale)
        await updating.revision.rememberStoredRevision()
        await other.revision.rememberStoredRevision()
        await other.revision.writeSnapshot('saved by the other tab')

        await expect(
            updating.revision.updateSnapshot((current) => `${current}+x`),
        ).resolves.toBeUndefined()
        expect(onStale).not.toHaveBeenCalled()
        await other.revision.rememberStoredRevision()

        await expect(
            updating.revision.updateSnapshot(async (current) => {
                await other.revision.writeSnapshot('saved in between')
                return `${current}+y`
            }),
        ).rejects.toMatchObject({ name: 'StaleSnapshotError' })
        expect(onStale).toHaveBeenCalledOnce()
    })

    it('saves as before on the writer page when no revision was loaded, and writes no revision', async () => {
        const tab = await openTab()
        tab.revision.setUncheckedWritePermit(() => true)

        await tab.revision.writeSnapshot('without a revision')

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('without a revision')
        await expect(tab.storage.getItem(REDUX_STATE_REVISION_KEY)).resolves.toBeNull()
    })

    it('does not stop the start when a token cannot be stored', async () => {
        const tab = await openTab()
        vi.spyOn(tab.storage, 'setItem').mockRejectedValueOnce(new Error('QuotaExceededError'))

        await expect(tab.revision.rememberStoredRevision()).resolves.toBeUndefined()
        expect(tab.revision.isRevisionChecked()).toBe(false)
        await expect(tab.revision.writeSnapshot('not without the lock')).rejects.toMatchObject({
            name: 'UnverifiedSnapshotError',
        })

        tab.revision.setUncheckedWritePermit(() => true)
        await tab.revision.writeSnapshot('saved under the lock')
        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('saved under the lock')
    })

    it('does not stop the start when the revision cannot be read', async () => {
        const tab = await openTab()
        vi.spyOn(tab.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))

        await expect(tab.revision.rememberStoredRevision()).resolves.toBeUndefined()
        expect(tab.revision.isRevisionChecked()).toBe(false)
    })

    it('refuses a save without the check unless this page holds the writer lock', async () => {
        const other = await openTab()
        await other.storage.setItem(REDUX_STATE_KEY, 'from another tab')
        const tab = await openTab()
        vi.spyOn(tab.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))
        await tab.revision.rememberStoredRevision()

        await expect(tab.revision.writeSnapshot('unchecked')).rejects.toMatchObject({
            name: 'UnverifiedSnapshotError',
        })
        tab.revision.setUncheckedWritePermit(() => false)
        const refusal = tab.revision.writeSnapshot('unchecked')
        await expect(refusal).rejects.toBeInstanceOf(tab.revision.StaleSnapshotError)
        await expect(refusal).rejects.toMatchObject({ name: 'UnverifiedSnapshotError' })

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('from another tab')
    })

    it('saves without the check while this page holds the writer lock', async () => {
        const tab = await openTab()
        vi.spyOn(tab.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))
        await tab.revision.rememberStoredRevision()
        tab.revision.setUncheckedWritePermit(() => true)

        await tab.revision.writeSnapshot('saved under the lock')

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('saved under the lock')
    })

    it('neither repairs nor removes the snapshot at start without the check or the lock', async () => {
        const other = await openTab()
        await other.storage.setItem(REDUX_STATE_KEY, 'from another tab')
        const tab = await openTab()
        vi.spyOn(tab.storage, 'getItem').mockRejectedValueOnce(new Error('read failed'))
        await tab.revision.rememberStoredRevision()

        await expect(tab.revision.repairSnapshot('backup')).rejects.toMatchObject({
            name: 'StaleSnapshotError',
        })
        await expect(tab.revision.removeSnapshotIfCurrent()).resolves.toBe(false)

        await expect(tab.storage.getItem(REDUX_STATE_KEY)).resolves.toBe('from another tab')
    })
})
