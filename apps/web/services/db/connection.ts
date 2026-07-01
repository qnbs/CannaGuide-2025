import {
    DB_NAME,
    DB_VERSION,
    STRAINS_STORE,
    IMAGES_STORE,
    METADATA_STORE,
    STRAIN_SEARCH_INDEX_STORE,
    OFFLINE_ACTIONS_STORE,
    CALCULATOR_HISTORY_STORE,
    STRAIN_INDEX_TYPE,
    STRAIN_INDEX_THC,
    STRAIN_INDEX_CBD,
    STRAIN_INDEX_FLOWERING,
} from '@/constants'

const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 500

let db: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

export const toIndexedDbError = (error: DOMException | null, fallbackMessage: string): Error =>
    error ?? new Error(fallbackMessage)

export const withRetry = async <T>(
    operation: () => Promise<T>,
    context: string,
    retries: number = MAX_RETRIES,
): Promise<T> => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await operation()
        } catch (error) {
            const isLastAttempt = attempt === retries - 1
            if (isLastAttempt) {
                console.debug(`[dbService] ${context} failed after ${retries} attempts:`, error)
                throw error
            }
            const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt)
            console.debug(
                `[dbService] ${context} attempt ${attempt + 1} failed, retrying in ${delay}ms`,
            )
            await new Promise((resolve) => setTimeout(resolve, delay))
            db = null
            dbPromise = null
        }
    }
    throw new Error(`[dbService] ${context} exhausted retries`)
}

const ensureObjectStore = (dbInstance: IDBDatabase, storeName: string, keyPath: string): void => {
    if (!dbInstance.objectStoreNames.contains(storeName)) {
        dbInstance.createObjectStore(storeName, { keyPath })
    }
}

const ensureOfflineActionsStore = (dbInstance: IDBDatabase): void => {
    if (!dbInstance.objectStoreNames.contains(OFFLINE_ACTIONS_STORE)) {
        dbInstance.createObjectStore(OFFLINE_ACTIONS_STORE, { autoIncrement: true })
    }
}

const ensureStrainIndexes = (transaction: IDBTransaction | null): void => {
    if (!transaction) return

    const strainStore = transaction.objectStore(STRAINS_STORE)
    if (!strainStore.indexNames.contains(STRAIN_INDEX_TYPE)) {
        strainStore.createIndex(STRAIN_INDEX_TYPE, 'type', { unique: false })
    }
    if (!strainStore.indexNames.contains(STRAIN_INDEX_THC)) {
        strainStore.createIndex(STRAIN_INDEX_THC, 'thc', { unique: false })
    }
    if (!strainStore.indexNames.contains(STRAIN_INDEX_CBD)) {
        strainStore.createIndex(STRAIN_INDEX_CBD, 'cbd', { unique: false })
    }
    if (!strainStore.indexNames.contains(STRAIN_INDEX_FLOWERING)) {
        strainStore.createIndex(STRAIN_INDEX_FLOWERING, 'floweringTime', { unique: false })
    }
}

const runMigrations = (
    dbInstance: IDBDatabase,
    transaction: IDBTransaction | null,
    oldVersion: number,
): void => {
    if (oldVersion < 1) {
        ensureObjectStore(dbInstance, STRAINS_STORE, 'id')
        ensureObjectStore(dbInstance, IMAGES_STORE, 'id')
        ensureObjectStore(dbInstance, METADATA_STORE, 'key')
    }

    if (oldVersion < 2) {
        ensureObjectStore(dbInstance, STRAIN_SEARCH_INDEX_STORE, 'word')
    }

    if (oldVersion < 3) {
        ensureStrainIndexes(transaction)
    }

    if (oldVersion < 4) {
        ensureOfflineActionsStore(dbInstance)
    }

    if (oldVersion < 5) {
        ensureObjectStore(dbInstance, CALCULATOR_HISTORY_STORE, 'id')
    }
}

export const openDB = (): Promise<IDBDatabase> => {
    if (db) return Promise.resolve(db)
    if (dbPromise) return dbPromise

    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = (event) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const dbInstance = (event.target as IDBOpenDBRequest).result
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const transaction = (event.target as IDBOpenDBRequest).transaction
            runMigrations(dbInstance, transaction, event.oldVersion)
        }

        request.onsuccess = (event) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            db = (event.target as IDBOpenDBRequest).result
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const idbError = (event.target as IDBOpenDBRequest).error
            console.debug('[dbService] IndexedDB connection error:', idbError)
            reject(toIndexedDbError(idbError, '[dbService] Failed to open IndexedDB connection.'))
        }
    })

    return dbPromise
}

export const performTx = async <T>(
    storeName: string,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
    const execute = async (): Promise<T> => {
        const conn = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = conn.transaction(storeName, mode)
            let requestResult: T

            transaction.onerror = () => {
                console.debug(`[dbService] Transaction error on ${storeName}:`, transaction.error)
                reject(
                    toIndexedDbError(
                        transaction.error,
                        `[dbService] Transaction failed on store "${storeName}".`,
                    ),
                )
            }

            transaction.oncomplete = () => {
                resolve(requestResult)
            }

            const store = transaction.objectStore(storeName)
            const request = action(store)

            request.onsuccess = () => {
                requestResult = request.result
            }
        })
    }

    if (mode === 'readwrite') {
        return withRetry(execute, `performTx(${storeName}, readwrite)`)
    }
    return execute()
}

export const replaceStoreAtomically = async (
    storeName: string,
    clearErrorMessage: string,
    populate: (store: IDBObjectStore, transaction: IDBTransaction) => void,
): Promise<void> => {
    return withRetry(async () => {
        const conn = await openDB()

        return new Promise<void>((resolve, reject) => {
            const transaction = conn.transaction(storeName, 'readwrite')
            const store = transaction.objectStore(storeName)

            transaction.oncomplete = () => resolve()
            transaction.onerror = () =>
                reject(
                    toIndexedDbError(
                        transaction.error,
                        `[dbService] Atomic replace failed on store "${storeName}".`,
                    ),
                )

            const clearRequest = store.clear()
            clearRequest.onerror = () => {
                console.debug(clearErrorMessage, clearRequest.error)
                transaction.abort()
            }

            clearRequest.onsuccess = () => {
                populate(store, transaction)
            }
        })
    }, `replaceStoreAtomically(${storeName})`)
}
