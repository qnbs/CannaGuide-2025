/**
 * Persistent Inference Cache — IndexedDB-backed LRU cache for local AI
 * inference results that survives page reloads.
 *
 * Falls back to the in-memory cache when IndexedDB is unavailable.
 */

import { createIndexedDbLruCache } from './indexedDbLruCache'

/** Maximum value size in characters to prevent storage bloat. */
const MAX_VALUE_SIZE = 50_000

interface CacheEntry {
    key: string
    value: string
    accessedAt: number
    createdAt: number
    model: string
    task: string
}

const cache = createIndexedDbLruCache<CacheEntry>({
    dbName: 'CannaGuideLocalAiCache',
    storeName: 'inferences',
    maxEntries: 256,
    ttlMs: 30 * 24 * 60 * 60 * 1000,
    hashPrefix: '',
    stages: {
        read: 'cache-read',
        write: 'cache-write',
        persist: 'cache-persist',
        clear: 'cache-clear',
    },
})

/**
 * Apply user settings to the cache (maxEntries + TTL).
 * Called from settings listener middleware when localAi settings change.
 */
export const applyCacheSettings = (maxEntries: number): void => {
    cache.updateConfig({ maxEntries: Math.max(32, Math.min(maxEntries, 2048)) })
}

/**
 * Retrieve a cached inference result by prompt.
 * Returns null on miss or if the DB is unavailable.
 */
export const getCachedInference = async (prompt: string): Promise<string | null> => {
    const entry = await cache.get(cache.hashKey(prompt))
    return entry?.value ?? null
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
    if (value.length > MAX_VALUE_SIZE) return
    const now = Date.now()
    await cache.set({
        key: cache.hashKey(prompt),
        value,
        accessedAt: now,
        createdAt: now,
        model: meta.model,
        task: meta.task,
    })
}

/**
 * Clear all entries from the persistent cache.
 */
export const clearPersistentCache = async (): Promise<void> => {
    await cache.clear()
}

/**
 * Get the number of cached inference entries.
 */
export const getCacheSize = async (): Promise<number> => {
    return cache.count()
}

/**
 * Get breakdown of cached entries by model.
 * Throttled to at most one full scan every 30 seconds.
 */
let _breakdownCache: Record<string, number> | null = null
let _breakdownTimestamp = 0
const BREAKDOWN_THROTTLE_MS = 30_000

export const getCacheBreakdown = async (): Promise<Record<string, number>> => {
    const now = Date.now()
    if (_breakdownCache && now - _breakdownTimestamp < BREAKDOWN_THROTTLE_MS) {
        return _breakdownCache
    }
    try {
        const db = await cache.openDb()
        return new Promise<Record<string, number>>((resolve) => {
            const tx = db.transaction('inferences', 'readonly')
            const store = tx.objectStore('inferences')
            const breakdown: Record<string, number> = {}
            const cursor = store.openCursor()
            cursor.onsuccess = () => {
                const c = cursor.result
                if (c) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const entry = c.value as CacheEntry
                    breakdown[entry.model] = (breakdown[entry.model] ?? 0) + 1
                    c.continue()
                } else {
                    _breakdownCache = breakdown
                    _breakdownTimestamp = Date.now()
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
    cache.resetDbPromise()
}
