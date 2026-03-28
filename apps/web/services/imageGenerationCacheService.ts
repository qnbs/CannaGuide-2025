/**
 * Image Generation Cache Service — IndexedDB-backed LRU cache specifically
 * for generated images (base64 data URLs). Separate from the text inference
 * cache due to the larger entry sizes.
 */

import { createIndexedDbLruCache } from './indexedDbLruCache'

interface ImageCacheEntry {
    key: string
    dataUrl: string
    accessedAt: number
    createdAt: number
}

const cache = createIndexedDbLruCache<ImageCacheEntry>({
    dbName: 'CannaGuideImageGenCache',
    storeName: 'images',
    maxEntries: 64,
    ttlMs: 30 * 24 * 60 * 60 * 1000,
    hashPrefix: 'img',
    stages: {
        read: 'image-cache-read',
        write: 'image-cache-write',
        persist: 'image-cache-write',
        clear: 'image-cache-clear',
    },
})

/** Retrieve a cached generated image by prompt. */
export const getCachedGeneratedImage = async (
    prompt: string,
): Promise<{ dataUrl: string } | null> => {
    const entry = await cache.get(cache.hashKey(prompt))
    return entry ? { dataUrl: entry.dataUrl } : null
}

/** Store a generated image in the persistent cache. */
export const setCachedGeneratedImage = async (prompt: string, dataUrl: string): Promise<void> => {
    const now = Date.now()
    await cache.set({
        key: cache.hashKey(prompt),
        dataUrl,
        accessedAt: now,
        createdAt: now,
    })
}

/** Clear all cached generated images. */
export const clearImageGenCache = async (): Promise<void> => {
    await cache.clear()
}

/** Get the number of cached images. */
export const getImageGenCacheCount = async (): Promise<number> => {
    return cache.count()
}
