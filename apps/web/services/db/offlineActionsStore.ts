import { OFFLINE_ACTIONS_STORE } from '@/constants'
import { openDB, performTx, toIndexedDbError } from './connection'
import { isPlainObjectRecord } from './searchHelpers'

export const offlineActionsStore = {
    async addOfflineAction(action: Record<string, unknown>): Promise<void> {
        const entry = {
            ...action,
            queuedAt: typeof action.queuedAt === 'number' ? action.queuedAt : Date.now(),
            idempotencyKey: action.idempotencyKey ?? crypto.randomUUID(),
        }
        await performTx<IDBValidKey>(OFFLINE_ACTIONS_STORE, 'readwrite', (store) =>
            store.add(entry),
        )
    },

    async listOfflineActions(): Promise<Array<Record<string, unknown> & { id: number }>> {
        const conn = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = conn.transaction(OFFLINE_ACTIONS_STORE, 'readonly')
            const store = transaction.objectStore(OFFLINE_ACTIONS_STORE)
            const request = store.openCursor()
            const results: Array<Record<string, unknown> & { id: number }> = []
            let settled = false

            const rejectOnce = (error: Error): void => {
                if (settled) {
                    return
                }
                settled = true
                reject(error)
            }

            const resolveOnce = (): void => {
                if (settled) {
                    return
                }
                settled = true
                resolve(results)
            }

            transaction.onerror = () => {
                rejectOnce(
                    toIndexedDbError(
                        transaction.error,
                        `[dbService] Transaction failed on store "${OFFLINE_ACTIONS_STORE}".`,
                    ),
                )
            }
            transaction.onabort = () => {
                rejectOnce(
                    toIndexedDbError(
                        transaction.error,
                        `[dbService] Transaction aborted on store "${OFFLINE_ACTIONS_STORE}".`,
                    ),
                )
            }

            request.onerror = () =>
                rejectOnce(
                    toIndexedDbError(
                        request.error,
                        '[dbService] Failed to read offline actions cursor.',
                    ),
                )
            request.onsuccess = () => {
                const cursor = request.result
                if (cursor) {
                    const rawId = cursor.key
                    const id = typeof rawId === 'number' ? rawId : Number(rawId)
                    if (Number.isFinite(id)) {
                        results.push({
                            ...(isPlainObjectRecord(cursor.value) ? cursor.value : {}),
                            id,
                        })
                    }
                    cursor.continue()
                } else {
                    resolveOnce()
                }
            }
        })
    },

    async countOfflineActions(): Promise<number> {
        return performTx<number>(OFFLINE_ACTIONS_STORE, 'readonly', (store) => store.count())
    },

    async clearOfflineActions(): Promise<void> {
        await performTx(OFFLINE_ACTIONS_STORE, 'readwrite', (store) => store.clear())
    },

    async deleteOfflineAction(id: number): Promise<void> {
        await performTx(OFFLINE_ACTIONS_STORE, 'readwrite', (store) => store.delete(id))
    },
}
