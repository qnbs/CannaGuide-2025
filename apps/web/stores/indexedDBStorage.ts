export interface StateStorage {
    getItem: (name: string) => string | null | Promise<string | null>
    setItem: (name: string, value: string) => void | Promise<void>
    removeItem: (name: string) => void | Promise<void>
}

const DB_NAME = 'CannaGuideStateDB'
const DB_VERSION = 1
const STORE_NAME = 'zustand_state'

let db: IDBDatabase | null = null
// Promise lock – prevents concurrent openDB() calls from opening duplicate connections
let dbPromise: Promise<IDBDatabase> | null = null

const openDB = (): Promise<IDBDatabase> => {
    if (db) return Promise.resolve(db)
    if (dbPromise) return dbPromise

    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME)
            }
        }

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result
            // Handle connection loss (storage pressure, version upgrade from another tab)
            db.onclose = () => {
                db = null
                dbPromise = null
            }
            db.onversionchange = () => {
                db?.close()
                db = null
                dbPromise = null
            }
            resolve(db)
        }

        request.onerror = (event) => {
            dbPromise = null
            console.debug('IndexedDB error:', (event.target as IDBOpenDBRequest).error)
            reject((event.target as IDBOpenDBRequest).error)
        }
    })

    return dbPromise
}

const performTx = async <T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
    const conn = await openDB()
    return new Promise<T>((resolve, reject) => {
        const transaction = conn.transaction(STORE_NAME, mode)
        const store = transaction.objectStore(STORE_NAME)
        let result: T

        const request = action(store)
        request.onsuccess = () => {
            result = request.result
        }
        request.onerror = () => reject(request.error)

        // WebKit/Safari requires waiting for transaction.oncomplete before
        // the result is safe to use. Resolving on request.onsuccess alone
        // can cause WebKit to abort the transaction silently.
        transaction.oncomplete = () => resolve(result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'))
    })
}

export const indexedDBStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const result = await performTx('readonly', (store) => store.get(name))
        return (result as string) || null
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await performTx('readwrite', (store) => store.put(value, name))
    },
    removeItem: async (name: string): Promise<void> => {
        await performTx('readwrite', (store) => store.delete(name))
    },
}
