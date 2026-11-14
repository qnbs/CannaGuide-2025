import { METADATA_STORE } from '@/constants'
import { openDB, performTx, toIndexedDbError, withRetry } from './connection'
import type { MetadataItem } from './types'

export const DELETE_METADATA = Symbol('DELETE_METADATA')

export const metadataStore = {
    async getMetadata<T = unknown>(key: string): Promise<T | undefined> {
        const result = await performTx<MetadataItem<T> | undefined>(
            METADATA_STORE,
            'readonly',
            (store) => store.get(key),
        )
        return result?.value
    },

    async setMetadata<T>(key: string, value: T): Promise<void> {
        const item: MetadataItem<T> = { key, value }
        await performTx<IDBValidKey>(METADATA_STORE, 'readwrite', (store) => store.put(item))
    },

    /**
     * Atomically update one metadata value. The callback must be synchronous
     * and side-effect-free;
     * IndexedDB serializes readwrite transactions for this store across tabs,
     * so concurrent read-modify-write updates cannot overwrite one another.
     * Return undefined to leave the value unchanged.
     */
    async updateMetadata<T>(
        key: string,
        update: (current: T | undefined) => T | undefined | typeof DELETE_METADATA,
    ): Promise<void> {
        let updateCallbackFailed = false
        await withRetry(
            async () => {
                const conn = await openDB()
                await new Promise<void>((resolve, reject) => {
                    const transaction = conn.transaction(METADATA_STORE, 'readwrite')
                    const store = transaction.objectStore(METADATA_STORE)
                    let updateFailed = false
                    let updateError: unknown

                    transaction.oncomplete = () => resolve()
                    transaction.onerror = () =>
                        reject(
                            toIndexedDbError(
                                transaction.error,
                                `[dbService] Transaction failed on store "${METADATA_STORE}".`,
                            ),
                        )
                    transaction.onabort = () =>
                        reject(
                            updateFailed
                                ? updateError
                                : toIndexedDbError(
                                      transaction.error,
                                      `[dbService] Transaction aborted on store "${METADATA_STORE}".`,
                                  ),
                        )

                    const request: IDBRequest<MetadataItem<T> | undefined> = store.get(key)
                    request.onsuccess = () => {
                        try {
                            const next = update(request.result?.value)
                            if (next === DELETE_METADATA) store.delete(key)
                            else if (next !== undefined) store.put({ key, value: next })
                        } catch (error) {
                            updateFailed = true
                            updateCallbackFailed = true
                            updateError = error
                            transaction.abort()
                        }
                    }
                })
            },
            `updateMetadata(${key})`,
            undefined,
            () => !updateCallbackFailed,
        )
    },

    async deleteMetadata(key: string): Promise<void> {
        await performTx<undefined>(METADATA_STORE, 'readwrite', (store) => store.delete(key))
    },
}
