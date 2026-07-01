import type { Strain } from '@/types'
import { STRAINS_STORE } from '@/constants'
import { createStrainObject } from '@/services/strainFactory'
import { openDB, performTx, replaceStoreAtomically, toIndexedDbError } from './connection'

export const strainStore = {
    async addStrains(strains: Strain[]): Promise<void> {
        await replaceStoreAtomically(
            STRAINS_STORE,
            '[dbService] Failed to clear store during atomic transaction:',
            (store, transaction) => {
                strains.forEach((strain) => {
                    const putRequest = store.put(strain)
                    putRequest.onerror = () => {
                        console.debug(
                            `[dbService] Failed to add strain "${strain.name}" during bulk operation. Aborting transaction.`,
                            putRequest.error,
                        )
                        transaction.abort()
                    }
                })
            },
        )

        console.debug('[dbService] Atomically replaced all strains in IndexedDB.')
    },

    async getAllStrains(): Promise<Strain[]> {
        const conn = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = conn.transaction(STRAINS_STORE, 'readonly')
            const store = transaction.objectStore(STRAINS_STORE)
            const request = store.openCursor()
            const results: Strain[] = []
            const seenIds = new Set<string>()

            request.onerror = () =>
                reject(
                    toIndexedDbError(request.error, '[dbService] Failed to read strains cursor.'),
                )
            request.onsuccess = () => {
                const cursor = request.result
                if (cursor) {
                    if (cursor.value && typeof cursor.value === 'object') {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        const normalized = createStrainObject(cursor.value as Partial<Strain>)
                        if (!seenIds.has(normalized.id)) {
                            seenIds.add(normalized.id)
                            results.push(normalized)
                        } else {
                            console.debug(
                                `[dbService] Skipping duplicate strain id "${normalized.id}" while reading IndexedDB.`,
                            )
                        }
                    }
                    cursor.continue()
                } else {
                    resolve(results)
                }
            }
        })
    },

    async getStrainsCount(): Promise<number> {
        return performTx<number>(STRAINS_STORE, 'readonly', (store) => store.count())
    },

    async queryStrainsByIndex(
        indexName: string,
        query: IDBValidKey | IDBKeyRange,
    ): Promise<Strain[]> {
        const conn = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = conn.transaction(STRAINS_STORE, 'readonly')
            const store = transaction.objectStore(STRAINS_STORE)

            if (!store.indexNames.contains(indexName)) {
                resolve([])
                return
            }

            const index = store.index(indexName)
            const request = index.getAll(query)

            request.onerror = () =>
                reject(
                    toIndexedDbError(
                        request.error,
                        `[dbService] IndexedDB query request failed for index "${indexName}".`,
                    ),
                )

            transaction.oncomplete = () => resolve(request.result ?? [])
            transaction.onerror = () =>
                reject(
                    toIndexedDbError(
                        transaction.error,
                        `[dbService] IndexedDB query failed for index "${indexName}".`,
                    ),
                )
        })
    },
}
