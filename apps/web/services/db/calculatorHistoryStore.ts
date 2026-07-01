import { CALCULATOR_HISTORY_STORE } from '@/constants'
import { openDB, performTx } from './connection'
import {
    MAX_CALCULATOR_HISTORY_PER_CALCULATOR,
    type CalculatorHistoryEntry,
} from './types'

export const calculatorHistoryStore = {
    async saveCalculatorHistoryEntry(entry: CalculatorHistoryEntry): Promise<void> {
        await performTx<IDBValidKey>(CALCULATOR_HISTORY_STORE, 'readwrite', (store) =>
            store.put(entry),
        )

        const all = await calculatorHistoryStore.getCalculatorHistory(entry.calculatorId)
        if (all.length > MAX_CALCULATOR_HISTORY_PER_CALCULATOR) {
            const toDelete = all
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(0, all.length - MAX_CALCULATOR_HISTORY_PER_CALCULATOR)
            for (const old of toDelete) {
                await performTx(CALCULATOR_HISTORY_STORE, 'readwrite', (store) =>
                    store.delete(old.id),
                )
            }
        }
    },

    async getCalculatorHistory(calculatorId: string): Promise<CalculatorHistoryEntry[]> {
        const conn = await openDB()
        return new Promise<CalculatorHistoryEntry[]>((resolve, reject) => {
            const transaction = conn.transaction(CALCULATOR_HISTORY_STORE, 'readonly')
            const store = transaction.objectStore(CALCULATOR_HISTORY_STORE)
            const request = store.getAll()
            transaction.onerror = () => reject(transaction.error)
            request.onsuccess = () => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const all = (request.result as CalculatorHistoryEntry[]).filter(
                    (e) => e.calculatorId === calculatorId,
                )
                all.sort((a, b) => b.timestamp - a.timestamp)
                resolve(all)
            }
        })
    },

    async clearCalculatorHistory(calculatorId: string): Promise<void> {
        const entries = await calculatorHistoryStore.getCalculatorHistory(calculatorId)
        for (const entry of entries) {
            await performTx(CALCULATOR_HISTORY_STORE, 'readwrite', (store) =>
                store.delete(entry.id),
            )
        }
    },
}
