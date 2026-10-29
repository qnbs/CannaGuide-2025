import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeDB, openDB, performTx, releaseDBAfterErase } from './connection'

describe('performTx (#724, #747 review)', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        closeDB()
        releaseDBAfterErase()
    })

    it('rejects when the transaction aborts without an error event', async () => {
        // Open (and upgrade) the real database first; only the transaction
        // performTx starts afterwards is replaced.
        await openDB()
        // A write that fails at commit (quota) aborts the transaction and fires
        // only "abort" -- no request or transaction error event.
        const transaction = {
            error: new DOMException('Quota exceeded', 'QuotaExceededError'),
            onerror: null as (() => void) | null,
            oncomplete: null as (() => void) | null,
            onabort: null as (() => void) | null,
            objectStore: () => ({ get: () => ({ onsuccess: null, result: undefined }) }),
        }
        vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(() => {
            queueMicrotask(() => transaction.onabort?.())
            return transaction as unknown as IDBTransaction
        })

        const outcome = await Promise.race([
            performTx('images', 'readonly', (store) => store.get('photo-1')).then(
                () => 'resolved',
                () => 'rejected',
            ),
            new Promise((resolve) => setTimeout(() => resolve('pending'), 200)),
        ])
        expect(outcome).toBe('rejected')
    })
})
