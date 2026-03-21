/**
 * Image Generation Cache Service — IndexedDB-backed LRU cache specifically
 * for generated images (base64 data URLs). Separate from the text inference
 * cache due to the larger entry sizes.
 */

import { captureLocalAiError } from './sentryService'

const DB_NAME = 'CannaGuideImageGenCache'
const DB_VERSION = 1
const STORE_NAME = 'images'
/** Maximum cached images — images are large so keep this small. */
const MAX_ENTRIES = 64
/** Cache entries expire after 30 days. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000

interface ImageCacheEntry {
    key: string
    dataUrl: string
    accessedAt: number
    createdAt: number
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

/** Generate a collision-resistant cache key from the prompt. */
const hashKey = (prompt: string): string => {
    let djb2 = 5381
    let fnv = 0x811c9dc5
    for (let i = 0; i < prompt.length; i++) {
        const c = prompt.charCodeAt(i)
        djb2 = ((djb2 << 5) + djb2 + c) | 0
        fnv = ((fnv ^ c) * 0x01000193) | 0
    }
    return `img_${djb2}_${fnv}_${prompt.length}`
}

/** Retrieve a cached generated image by prompt. */
export const getCachedGeneratedImage = async (
    prompt: string,
): Promise<{ dataUrl: string } | null> => {
    try {
        const db = await openDb()
        const key = hashKey(prompt)
        return new Promise<{ dataUrl: string } | null>((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            const getReq = store.get(key)
            getReq.onsuccess = () => {
                const entry = getReq.result as ImageCacheEntry | undefined
                if (entry) {
                    if (Date.now() - entry.createdAt > TTL_MS) {
                        store.delete(key)
                        resolve(null)
                        return
                    }
                    entry.accessedAt = Date.now()
                    store.put(entry)
                    resolve({ dataUrl: entry.dataUrl })
                } else {
                    resolve(null)
                }
            }
            getReq.onerror = () => resolve(null)
        })
    } catch (error) {
        captureLocalAiError(error, { stage: 'image-cache-read' })
        return null
    }
}

/** Store a generated image in the persistent cache. */
export const setCachedGeneratedImage = async (prompt: string, dataUrl: string): Promise<void> => {
    try {
        const db = await openDb()
        const key = hashKey(prompt)
        const entry: ImageCacheEntry = {
            key,
            dataUrl,
            accessedAt: Date.now(),
            createdAt: Date.now(),
        }

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)

            const countReq = store.count()
            countReq.onsuccess = () => {
                if (countReq.result >= MAX_ENTRIES) {
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
                    cursor.onerror = () => store.put(entry)
                } else {
                    store.put(entry)
                }
            }
            countReq.onerror = () => store.put(entry)

            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        })
    } catch (error) {
        captureLocalAiError(error, { stage: 'image-cache-write' })
    }
}

/** Clear all cached generated images. */
export const clearImageGenCache = async (): Promise<void> => {
    try {
        const db = await openDb()
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            store.clear()
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        })
    } catch (error) {
        captureLocalAiError(error, { stage: 'image-cache-clear' })
    }
}

/** Get the number of cached images. */
export const getImageGenCacheCount = async (): Promise<number> => {
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
