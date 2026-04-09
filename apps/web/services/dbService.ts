/**
 * @file dbService.ts
 * @description A world-class, robust, and performant IndexedDB service for CannaGuide 2025.
 * This service provides a complete data persistence layer with the following advanced features:
 * - Singleton, promise-based connection management with robust schema migration.
 * - Bulletproof, atomic transaction patterns to ensure data integrity.
 * - Memory-efficient data retrieval using cursors for large datasets.
 * - High-performance indexed queries for fast, database-native filtering.
 * - Sophisticated prefix-based full-text search implementation.
 * - Comprehensive type safety and JSDoc documentation.
 */

import { StoredImageData, Strain, SimulationState, Plant, JournalEntry } from '@/types'
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
import { resizeImage } from '@/services/imageService'
import { createStrainObject } from '@/services/strainFactory'

// --- TYPE DEFINITIONS ---

/** Represents a key-value pair in the metadata store. */
interface MetadataItem<T = unknown> {
    key: string
    value: T
}

/** Represents a snapshot of storage estimate data. */
interface StorageEstimateSnapshot {
    usage: number
    quota: number
    usageRatio: number
}

type ArchivedJournalMap = Record<string, JournalEntry[]>

/** A single calculator computation saved to IndexedDB for history recall. */
export interface CalculatorHistoryEntry {
    id: string
    calculatorId: string
    inputs: Record<string, number | string>
    result: Record<string, number | string>
    timestamp: number
    label?: string
}

const MAX_CALCULATOR_HISTORY_PER_CALCULATOR = 20

const ARCHIVED_LOGS_METADATA_KEY = 'archived_plant_logs_v1'
const STORAGE_USAGE_WARNING_RATIO = 0.78
const STORAGE_USAGE_CRITICAL_RATIO = 0.9
const DEFAULT_JOURNAL_KEEP_PER_PLANT = 350
const WARNING_JOURNAL_KEEP_PER_PLANT = 220
const CRITICAL_JOURNAL_KEEP_PER_PLANT = 120
const MAX_ARCHIVED_LOGS_PER_PLANT = 1200
const IMAGE_PRUNE_BATCH_SIZE = 20

// --- CONNECTION MANAGEMENT ---

const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 500

let db: IDBDatabase | null = null
// Promise lock – prevents concurrent openDB() calls from opening duplicate connections
let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Retries an async operation with exponential backoff.
 * Used for write operations that may fail under storage pressure or transient errors.
 */
const withRetry = async <T>(
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
            // Reset connection on retry in case it was lost
            db = null
            dbPromise = null
        }
    }
    // Unreachable, but TypeScript needs it
    throw new Error(`[dbService] ${context} exhausted retries`)
}

const toIndexedDbError = (error: DOMException | null, fallbackMessage: string): Error =>
    error ?? new Error(fallbackMessage)

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

/**
 * Opens and initializes the IndexedDB database.
 * Uses a promise lock so concurrent callers share a single connection attempt.
 * Handles connection loss (storage pressure, version upgrade from another tab).
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database connection.
 */
const openDB = (): Promise<IDBDatabase> => {
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const idbError = (event.target as IDBOpenDBRequest).error
            console.debug('[dbService] IndexedDB connection error:', idbError)
            reject(toIndexedDbError(idbError, '[dbService] Failed to open IndexedDB connection.'))
        }
    })

    return dbPromise
}

/**
 * A generic, promisified helper for executing a single request within a transaction.
 * This ensures the transaction lifecycle is managed correctly by capturing the request's
 * result on its `onsuccess` event and only resolving the promise when the entire
 * transaction successfully completes via its `oncomplete` event. This robustly prevents
 * `TransactionInactiveError` race conditions.
 * @template T The expected result type of the IDBRequest.
 * @param {string} storeName The name of the object store.
 * @param {IDBTransactionMode} mode The transaction mode ('readonly' or 'readwrite').
 * @param {(store: IDBObjectStore) => IDBRequest<T>} action A callback that receives the store and should return an IDBRequest.
 * @returns {Promise<T>} A promise that resolves with the result of the request upon transaction completion.
 */
const performTx = async <T>(
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

const getStorageEstimateSnapshot = async (): Promise<StorageEstimateSnapshot> => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
        return {
            usage: 0,
            quota: Number.MAX_SAFE_INTEGER,
            usageRatio: 0,
        }
    }

    try {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage ?? 0
        const quota = estimate.quota ?? Number.MAX_SAFE_INTEGER
        const usageRatio = quota > 0 ? usage / quota : 0
        return { usage, quota, usageRatio }
    } catch (error) {
        console.debug(
            '[dbService] navigator.storage.estimate() failed, using fallback values.',
            error,
        )
        return {
            usage: 0,
            quota: Number.MAX_SAFE_INTEGER,
            usageRatio: 0,
        }
    }
}

const compactArchivedEntry = (entry: JournalEntry): JournalEntry => {
    if (!entry.details) {
        return entry
    }

    const details = { ...entry.details } as Record<string, unknown>
    delete details.imageUrl

    return {
        ...entry,
        notes: typeof entry.notes === 'string' ? entry.notes.slice(0, 300) : entry.notes,
        details: details as JournalEntry['details'],
    }
}

const chooseJournalRetentionLimit = (usageRatio: number): number => {
    if (usageRatio >= STORAGE_USAGE_CRITICAL_RATIO) {
        return CRITICAL_JOURNAL_KEEP_PER_PLANT
    }
    if (usageRatio >= STORAGE_USAGE_WARNING_RATIO) {
        return WARNING_JOURNAL_KEEP_PER_PLANT
    }
    return DEFAULT_JOURNAL_KEEP_PER_PLANT
}

const isQuotaExceededError = (error: unknown): boolean => {
    if (!(error instanceof DOMException)) {
        return false
    }
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
}

const stripSimulationDerivedData = (simulationState: SimulationState): SimulationState => {
    const { vpdProfiles: _vp, ...rest } = simulationState
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return rest as SimulationState
}

const replaceStoreAtomically = async (
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

const collectIdsForToken = (
    store: IDBObjectStore,
    token: string,
    onComplete: (idsForToken: Set<string>) => void,
): void => {
    const range = IDBKeyRange.bound(token, token + '\uffff')
    const request = store.openCursor(range)
    const idsForToken = new Set<string>()

    request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const value = cursor.value as { ids?: unknown }
            if (Array.isArray(value.ids)) {
                value.ids.forEach((id) => {
                    if (typeof id === 'string') {
                        idsForToken.add(id)
                    }
                })
            }
            cursor.continue()
            return
        }

        onComplete(idsForToken)
    }

    request.onerror = () => {
        console.debug(`[dbService] Search index request failed for token: ${token}`)
        onComplete(new Set())
    }
}

const intersectResultSets = (resultSets: Set<string>[]): Set<string> => {
    if (resultSets.length === 0) {
        return new Set()
    }

    const [firstSet, ...otherSets] = resultSets
    return otherSets.reduce(
        (left, right) => new Set([...left].filter((id) => right.has(id))),
        new Set(firstSet),
    )
}

export const dbService = {
    async getStorageEstimate(): Promise<StorageEstimateSnapshot> {
        return getStorageEstimateSnapshot()
    },

    // --- Metadata Store ---
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

    // --- Strains Store ---

    /**
     * Atomically clears the entire strains store and populates it with a new list of strains.
     * This is designed for initial data loads and updates.
     * @param {Strain[]} strains The array of strains to add.
     * @returns {Promise<void>} A promise that resolves on successful completion or rejects on error.
     */
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

    /**
     * Retrieves all strains from the database in a memory-efficient way using a cursor.
     * This is superior to `getAll()` for large datasets.
     * @returns {Promise<Strain[]>} A promise that resolves with an array of all strains.
     */
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
                    // Cursor is exhausted, all data has been read.
                    resolve(results)
                }
            }
        })
    },

    async getStrainsCount(): Promise<number> {
        return performTx<number>(STRAINS_STORE, 'readonly', (store) => store.count())
    },

    /**
     * Performs a high-performance query on the strains store using a specified index.
     * @param {string} indexName The name of the index to query (e.g., 'by_thc').
     * @param {IDBValidKey | IDBKeyRange} query The key or key range for the query.
     * @returns {Promise<Strain[]>} A promise that resolves with the matching strains.
     */
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

    // --- Images Store ---
    async addImage(imageData: StoredImageData): Promise<void> {
        const estimateBeforeWrite = await getStorageEstimateSnapshot()
        if (estimateBeforeWrite.usageRatio >= STORAGE_USAGE_WARNING_RATIO) {
            await this.pruneOldImages(IMAGE_PRUNE_BATCH_SIZE)
        }

        let normalizedImageData = imageData
        try {
            const compressedData = await resizeImage(imageData.data)
            normalizedImageData = {
                ...imageData,
                data: compressedData,
            }
        } catch (compressionError) {
            console.debug(
                '[dbService] Could not compress image before storing. Using original payload.',
                compressionError,
            )
        }

        try {
            await performTx<IDBValidKey>(IMAGES_STORE, 'readwrite', (store) =>
                store.put(normalizedImageData),
            )
        } catch (error) {
            if (!isQuotaExceededError(error)) {
                throw error
            }

            console.debug(
                '[dbService] Quota exceeded while storing image. Pruning old images and retrying once.',
            )
            await this.pruneOldImages(IMAGE_PRUNE_BATCH_SIZE * 2)
            await performTx<IDBValidKey>(IMAGES_STORE, 'readwrite', (store) =>
                store.put(normalizedImageData),
            )
        }
    },

    async pruneOldImages(maxToDelete = IMAGE_PRUNE_BATCH_SIZE): Promise<number> {
        const conn = await openDB()

        const allImages = await new Promise<StoredImageData[]>((resolve, reject) => {
            const tx = conn.transaction(IMAGES_STORE, 'readonly')
            const req = tx.objectStore(IMAGES_STORE).getAll()
            req.onsuccess = () => resolve(req.result)
            tx.onerror = () =>
                reject(toIndexedDbError(tx.error, '[dbService] Failed to load images for pruning.'))
        })

        if (allImages.length === 0) {
            return 0
        }

        const sortedByAge = allImages.toSorted((a, b) => a.createdAt - b.createdAt)
        const imagesToDelete = sortedByAge.slice(0, Math.min(maxToDelete, sortedByAge.length))

        await new Promise<void>((resolve, reject) => {
            const transaction = conn.transaction(IMAGES_STORE, 'readwrite')
            const store = transaction.objectStore(IMAGES_STORE)

            transaction.oncomplete = () => resolve()
            transaction.onerror = () =>
                reject(
                    toIndexedDbError(
                        transaction.error,
                        '[dbService] Failed to delete old images during prune operation.',
                    ),
                )

            imagesToDelete.forEach((image) => {
                store.delete(image.id)
            })
        })

        return imagesToDelete.length
    },

    async getImage(id: string): Promise<StoredImageData | undefined> {
        return performTx<StoredImageData | undefined>(IMAGES_STORE, 'readonly', (store) =>
            store.get(id),
        )
    },

    async getAllImages(): Promise<StoredImageData[]> {
        return performTx<StoredImageData[]>(IMAGES_STORE, 'readonly', (store) => store.getAll())
    },

    // --- Search Index Store ---

    /**
     * Atomically clears and rebuilds the full-text search index.
     * @param {Record<string, string[]>} index A map where keys are words and values are arrays of strain IDs.
     * @returns {Promise<void>} A promise that resolves on completion.
     */
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

    /**
     * Performs a sophisticated prefix-based "AND" search across multiple tokens.
     * For each token, it finds all index words starting with that token, collects all associated
     * strain IDs, and then computes the intersection of the ID sets from all tokens.
     * @param {string[]} tokens An array of search tokens.
     * @returns {Promise<Set<string>>} A promise resolving with a Set of matching strain IDs.
     */
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

    // --- Offline Action Queue ---
    /**
     * Adds an action to the offline queue for later syncing by the service worker.
     * @param action The Redux action object to queue.
     * @returns {Promise<void>}
     */
    async addOfflineAction(action: Record<string, unknown>): Promise<void> {
        const entry = {
            ...action,
            idempotencyKey: action.idempotencyKey ?? crypto.randomUUID(),
        }
        await performTx<IDBValidKey>(OFFLINE_ACTIONS_STORE, 'readwrite', (store) =>
            store.add(entry),
        )
    },

    async optimizeSimulationForPersistence(
        simulationState: SimulationState,
    ): Promise<SimulationState> {
        const estimate = await getStorageEstimateSnapshot()
        const keepPerPlant = chooseJournalRetentionLimit(estimate.usageRatio)

        const entityIds = simulationState.plants.ids.filter(
            (id): id is string => typeof id === 'string',
        )
        const archivedByPlant: ArchivedJournalMap = {}
        const nextEntities: Record<string, Plant> = {}
        let hasChanges = false

        for (const plantId of entityIds) {
            const plant = simulationState.plants.entities[plantId]
            if (!plant) {
                continue
            }

            if (plant.journal.length <= keepPerPlant) {
                nextEntities[plantId] = plant
                continue
            }

            hasChanges = true
            const archiveCutoff = plant.journal.length - keepPerPlant
            const archivedEntries = plant.journal.slice(0, archiveCutoff).map(compactArchivedEntry)
            const keptEntries = plant.journal.slice(-keepPerPlant)

            archivedByPlant[plantId] = archivedEntries
            nextEntities[plantId] = {
                ...plant,
                journal: keptEntries,
            }
        }

        if (Object.keys(archivedByPlant).length > 0) {
            const existingArchive =
                (await this.getMetadata<ArchivedJournalMap>(ARCHIVED_LOGS_METADATA_KEY)) ?? {}
            const mergedArchive: ArchivedJournalMap = { ...existingArchive }

            Object.entries(archivedByPlant).forEach(([plantId, entries]) => {
                const current = mergedArchive[plantId] ?? []
                const combined = [...current, ...entries]
                mergedArchive[plantId] = combined.slice(-MAX_ARCHIVED_LOGS_PER_PLANT)
            })

            await this.setMetadata(ARCHIVED_LOGS_METADATA_KEY, mergedArchive)
        }

        if (!hasChanges) {
            return stripSimulationDerivedData(simulationState)
        }

        const rest = stripSimulationDerivedData(simulationState)
        return {
            ...rest,
            plants: {
                ...simulationState.plants,
                entities: nextEntities,
            },
        } as SimulationState
    },

    async getArchivedPlantLogs(plantId: string): Promise<JournalEntry[]> {
        const archive =
            (await this.getMetadata<ArchivedJournalMap>(ARCHIVED_LOGS_METADATA_KEY)) ?? {}
        return archive[plantId] ?? []
    },

    // --- Calculator History Store ---

    async saveCalculatorHistoryEntry(entry: CalculatorHistoryEntry): Promise<void> {
        await performTx<IDBValidKey>(CALCULATOR_HISTORY_STORE, 'readwrite', (store) =>
            store.put(entry),
        )

        // Enforce FIFO cap of MAX_CALCULATOR_HISTORY_PER_CALCULATOR
        const all = await this.getCalculatorHistory(entry.calculatorId)
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
        const entries = await this.getCalculatorHistory(calculatorId)
        for (const entry of entries) {
            await performTx(CALCULATOR_HISTORY_STORE, 'readwrite', (store) =>
                store.delete(entry.id),
            )
        }
    },
}
