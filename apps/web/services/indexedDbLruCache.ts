/**
 * IndexedDB-backed LRU cache factory — shared infrastructure for
 * localAiCacheService and imageGenerationCacheService.
 */

import { captureLocalAiError } from './sentryService'

interface BaseCacheEntry {
    key: string
    accessedAt: number
    createdAt: number
}

interface CacheConfig {
    dbName: string
    storeName: string
    maxEntries: number
    ttlMs: number
    hashPrefix: string
    stages: {
        read: Parameters<typeof captureLocalAiError>[1]['stage']
        write: Parameters<typeof captureLocalAiError>[1]['stage']
        persist: Parameters<typeof captureLocalAiError>[1]['stage']
        clear: Parameters<typeof captureLocalAiError>[1]['stage']
    }
}

interface CacheOps<T extends BaseCacheEntry> {
    openDb: () => Promise<IDBDatabase>
    hashKey: (input: string) => string
    get: (key: string) => Promise<T | null>
    set: (entry: T) => Promise<void>
    clear: () => Promise<void>
    count: () => Promise<number>
    resetDbPromise: () => void
    /** Update maxEntries and/or ttlMs at runtime. */
    updateConfig: (patch: { maxEntries?: number; ttlMs?: number }) => void
}

export function createIndexedDbLruCache<T extends BaseCacheEntry>(
    config: CacheConfig,
): CacheOps<T> {
    let dbPromise: Promise<IDBDatabase> | null = null

    const openDb = (): Promise<IDBDatabase> => {
        if (dbPromise) return dbPromise
        dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('IndexedDB unavailable'))
                return
            }
            const request = indexedDB.open(config.dbName, 1)
            request.onupgradeneeded = () => {
                const db = request.result
                if (!db.objectStoreNames.contains(config.storeName)) {
                    const store = db.createObjectStore(config.storeName, { keyPath: 'key' })
                    store.createIndex('accessedAt', 'accessedAt', { unique: false })
                }
            }
            request.onsuccess = () => {
                const db = request.result
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

    const hashKey = (input: string): string => {
        let djb2 = 5381
        let fnv = 0x811c9dc5
        for (let i = 0; i < input.length; i++) {
            const c = input.charCodeAt(i)
            djb2 = Math.trunc((djb2 << 5) + djb2 + c)
            fnv = Math.trunc((fnv ^ c) * 0x01000193)
        }
        const prefix = config.hashPrefix ? `${config.hashPrefix}_` : ''
        return `${prefix}${djb2}_${fnv}_${input.length}`
    }

    const get = async (key: string): Promise<T | null> => {
        try {
            const db = await openDb()
            return new Promise<T | null>((resolve) => {
                const tx = db.transaction(config.storeName, 'readwrite')
                const store = tx.objectStore(config.storeName)
                const getReq = store.get(key)
                getReq.onsuccess = () => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const entry = getReq.result as T | undefined
                    if (entry) {
                        if (Date.now() - entry.createdAt > config.ttlMs) {
                            store.delete(key)
                            resolve(null)
                            return
                        }
                        entry.accessedAt = Date.now()
                        store.put(entry)
                        resolve(entry)
                    } else {
                        resolve(null)
                    }
                }
                getReq.onerror = () => resolve(null)
            })
        } catch (error) {
            captureLocalAiError(error, { stage: config.stages.read })
            return null
        }
    }

    const set = async (entry: T): Promise<void> => {
        try {
            const db = await openDb()
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction(config.storeName, 'readwrite')
                const store = tx.objectStore(config.storeName)

                const countReq = store.count()
                countReq.onsuccess = () => {
                    if (countReq.result >= config.maxEntries) {
                        const evictCount = Math.max(1, Math.floor(config.maxEntries * 0.1))
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
                        cursor.onerror = () => store.put(entry)
                    } else {
                        store.put(entry)
                    }
                }
                countReq.onerror = () => store.put(entry)

                tx.oncomplete = () => resolve()
                tx.onerror = () => {
                    captureLocalAiError(tx.error, { stage: config.stages.persist })
                    reject(tx.error)
                }
            })
        } catch (error) {
            captureLocalAiError(error, { stage: config.stages.write })
        }
    }

    const clear = async (): Promise<void> => {
        try {
            const db = await openDb()
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction(config.storeName, 'readwrite')
                const store = tx.objectStore(config.storeName)
                store.clear()
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error)
            })
        } catch (error) {
            captureLocalAiError(error, { stage: config.stages.clear })
        }
    }

    const count = async (): Promise<number> => {
        try {
            const db = await openDb()
            return new Promise<number>((resolve) => {
                const tx = db.transaction(config.storeName, 'readonly')
                const store = tx.objectStore(config.storeName)
                const countReq = store.count()
                countReq.onsuccess = () => resolve(countReq.result)
                countReq.onerror = () => resolve(0)
            })
        } catch {
            return 0
        }
    }

    return {
        openDb,
        hashKey,
        get,
        set,
        clear,
        count,
        resetDbPromise: () => {
            dbPromise = null
        },
        updateConfig: (patch: { maxEntries?: number; ttlMs?: number }) => {
            if (patch.maxEntries !== undefined && patch.maxEntries > 0) {
                config.maxEntries = patch.maxEntries
            }
            if (patch.ttlMs !== undefined && patch.ttlMs > 0) {
                config.ttlMs = patch.ttlMs
            }
        },
    }
}
