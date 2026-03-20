/**
 * Persistent Inference Cache — IndexedDB-backed LRU cache for local AI
 * inference results that survives page reloads.
 *
 * Falls back to the in-memory cache when IndexedDB is unavailable.
 */

import { captureLocalAiError } from './sentryService'

const DB_NAME = 'CannaGuideLocalAiCache'
const DB_VERSION = 1
const STORE_NAME = 'inferences'
const MAX_ENTRIES = 256
/** Maximum value size in characters to prevent storage bloat. */
const MAX_VALUE_SIZE = 50_000
/** Cache entries expire after 7 days. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000

interface CacheEntry {
    key: string
    value: string
    accessedAt: number
    createdAt: number
    model: string
    task: string
}

let dbPromise: Promise<IDBDatabase> | null = null

const openDb = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB unavailable'))
            return
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
                store.createIndex('accessedAt', 'accessedAt', { unique: false })
            }
        }
        request.onsuccess = () => {
            const db = request.result
            // Auto-recover on unexpected close (e.g. IDB eviction)
            db.onclose = () => {
                dbPromise = null
            }
            resolve(db)
        }
        request.onerror = () => {
            dbPromise = null
            reject(request.error)
        }
    })
    return dbPromise
}

/** Generate a collision-resistant cache key from the prompt string. */
const hashKey = (prompt: string): string => {
    // Use two independent hashes (djb2 + FNV-1a) plus length for collision resistance
    let djb2 = 5381
    let fnv = 0x811c9dc5
    for (let i = 0; i < prompt.length; i++) {
        const c = prompt.charCodeAt(i)
        djb2 = ((djb2 << 5) + djb2 + c) | 0
        fnv = ((fnv ^ c) * 0x01000193) | 0
    }
    return `${djb2}_${fnv}_${prompt.length}`
}

/**
 * Retrieve a cached inference result by prompt.
 * Returns null on miss or if the DB is unavailable.
 */
export const getCachedInference = async (prompt: string): Promise<string | null> => {
    try {
        const db = await openDb()
        const key = hashKey(prompt)
        return new Promise<string | null>((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            const getReq = store.get(key)
            getReq.onsuccess = () => {
                const entry = getReq.result as CacheEntry | undefined
                if (entry) {
                    // Check TTL expiry
                    if (Date.now() - entry.createdAt > TTL_MS) {
                        store.delete(key)
                        resolve(null)
                        return
                    }
                    // Touch the entry (update accessedAt for LRU)
                    entry.accessedAt = Date.now()
                    store.put(entry)
                    resolve(entry.value)
                } else {
                    resolve(null)
                }
            }
            getReq.onerror = () => resolve(null)
        })
    } catch {
        return null
    }
}

/**
 * Store an inference result in the persistent cache.
 * Automatically evicts the oldest entries when the cache is full.
 */
export const setCachedInference = async (
    prompt: string,
    value: string,
    meta: { model: string; task: string },
): Promise<void> => {
    // Reject oversized values to prevent storage bloat
    if (value.length > MAX_VALUE_SIZE) return
    try {
        const db = await openDb()
        const key = hashKey(prompt)
        const entry: CacheEntry = {
            key,
            value,
            accessedAt: Date.now(),
            createdAt: Date.now(),
            model: meta.model,
            task: meta.task,
        }

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)

            // Check count and evict if needed
            const countReq = store.count()
            countReq.onsuccess = () => {
                const count = countReq.result
                if (count >= MAX_ENTRIES) {
                    // Evict oldest by accessedAt
                    const evictCount = Math.max(1, Math.floor(MAX_ENTRIES * 0.1))
                    const index = store.index('accessedAt')
                    let evicted = 0
                    const cursor = index.openCursor()
                    cursor.onsuccess = () => {
                        const c = cursor.result
                        if (c && evicted < evictCount) {
                            c.delete()
                            evicted++
                            c.continue()
                        } else {
                            store.put(entry)
                        }
                    }
                    cursor.onerror = () => {
                        store.put(entry)
                    }
                } else {
                    store.put(entry)
                }
            }
            countReq.onerror = () => store.put(entry)

            tx.oncomplete = () => resolve()
            tx.onerror = () => {
                captureLocalAiError(tx.error, { stage: 'cache-persist' })
                reject(tx.error)
            }
        })
    } catch {
        // Silently ignore — fall back to in-memory cache
    }
}

/**
 * Clear all entries from the persistent cache.
 */
export const clearPersistentCache = async (): Promise<void> => {
    try {
        const db = await openDb()
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            store.clear()
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        })
    } catch {
        // Ignore
    }
}

/**
 * Get the number of cached inference entries.
 */
export const getCacheSize = async (): Promise<number> => {
    try {
        const db = await openDb()
        return new Promise<number>((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly')
            const store = tx.objectStore(STORE_NAME)
            const countReq = store.count()
            countReq.onsuccess = () => resolve(countReq.result)
            countReq.onerror = () => resolve(0)
        })
    } catch {
        return 0
    }
}

/**
 * Get breakdown of cached entries by model.
 */
export const getCacheBreakdown = async (): Promise<Record<string, number>> => {
    try {
        const db = await openDb()
        return new Promise<Record<string, number>>((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly')
            const store = tx.objectStore(STORE_NAME)
            const breakdown: Record<string, number> = {}
            const cursor = store.openCursor()
            cursor.onsuccess = () => {
                const c = cursor.result
                if (c) {
                    const entry = c.value as CacheEntry
                    breakdown[entry.model] = (breakdown[entry.model] ?? 0) + 1
                    c.continue()
                } else {
                    resolve(breakdown)
                }
            }
            cursor.onerror = () => resolve({})
        })
    } catch {
        return {}
    }
}

/** Reset DB promise (tests). */
export const resetCacheDb = (): void => {
    dbPromise = null
}
