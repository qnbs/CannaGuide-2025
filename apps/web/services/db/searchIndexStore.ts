import { STRAIN_SEARCH_INDEX_STORE } from '@/constants'
import { openDB, replaceStoreAtomically, toIndexedDbError } from './connection'
import { collectIdsForToken, intersectResultSets } from './searchHelpers'

export const searchIndexStore = {
    async updateSearchIndex(index: Record<string, string[]>): Promise<void> {
        await replaceStoreAtomically(
            STRAIN_SEARCH_INDEX_STORE,
            '[dbService] Failed to clear search index:',
            (store, transaction) => {
                Object.entries(index).forEach(([word, ids]) => {
                    const putRequest = store.put({ word, ids })
                    putRequest.onerror = () => {
                        console.debug(
                            `[dbService] Failed to add index for word "${word}". Aborting.`,
                            putRequest.error,
                        )
                        transaction.abort()
                    }
                })
            },
        )
    },

    async searchIndex(tokens: string[]): Promise<Set<string>> {
        if (tokens.length === 0) return new Set()
        const conn = await openDB()

        return new Promise((resolve, reject) => {
            const transaction = conn.transaction(STRAIN_SEARCH_INDEX_STORE, 'readonly')
            const store = transaction.objectStore(STRAIN_SEARCH_INDEX_STORE)
            const resultSets: Set<string>[] = []

            transaction.onerror = () =>
                reject(
                    toIndexedDbError(
                        transaction.error,
                        '[dbService] Search index transaction failed.',
                    ),
                )

            transaction.oncomplete = () => {
                if (resultSets.length === 0 || resultSets.length < tokens.length) {
                    return resolve(new Set())
                }
                resolve(intersectResultSets(resultSets))
            }

            tokens.forEach((token) => {
                collectIdsForToken(store, token, (idsForToken) => {
                    resultSets.push(idsForToken)
                })
            })
        })
    },
}
