import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { indexedDB } from 'fake-indexeddb'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DB_NAME = 'CannaGuideDB'
const DB_VERSION = 1

const deleteDb = async (): Promise<void> =>
    new Promise((resolve) => {
        const req = indexedDB.deleteDatabase(DB_NAME)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
    })

const createDbWithEntries = async (storeName: string, count: number): Promise<void> =>
    new Promise((resolve) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images', { autoIncrement: true })
            }
            if (!db.objectStoreNames.contains('search')) {
                db.createObjectStore('search', { autoIncrement: true })
            }
            if (!db.objectStoreNames.contains('strains')) {
                db.createObjectStore('strains', { autoIncrement: true })
            }
        }
        req.onsuccess = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(storeName)) {
                db.close()
                resolve()
                return
            }
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            for (let i = 0; i < count; i++) {
                store.put({ data: `entry-${i}` })
            }
            tx.oncomplete = () => {
                db.close()
                resolve()
            }
        }
    })

const countEntries = async (storeName: string): Promise<number> =>
    new Promise((resolve) => {
        const req = indexedDB.open(DB_NAME)
        req.onsuccess = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(storeName)) {
                db.close()
                resolve(0)
                return
            }
            const tx = db.transaction(storeName, 'readonly')
            const countReq = tx.objectStore(storeName).count()
            countReq.onsuccess = () => {
                db.close()
                resolve(countReq.result)
            }
            countReq.onerror = () => {
                db.close()
                resolve(0)
            }
        }
        req.onerror = () => resolve(0)
    })

const loadService = async () => import('./indexedDbPruneService')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('indexedDbPruneService', () => {
    beforeEach(async () => {
        await deleteDb()
    })
    afterEach(async () => {
        await deleteDb()
    })

    describe('pruneOldestEntries', () => {
        it('removes entries above maxCount', async () => {
            await createDbWithEntries('images', 10)
            const { pruneOldestEntries } = await loadService()

            const removed = await pruneOldestEntries(DB_NAME, 'images', 5)
            expect(removed).toBe(5)

            const remaining = await countEntries('images')
            expect(remaining).toBe(5)
        })

        it('returns 0 when count is within limit', async () => {
            await createDbWithEntries('images', 3)
            const { pruneOldestEntries } = await loadService()

            const removed = await pruneOldestEntries(DB_NAME, 'images', 10)
            expect(removed).toBe(0)
        })

        it('returns 0 for non-existent store', async () => {
            const { pruneOldestEntries } = await loadService()
            const removed = await pruneOldestEntries(DB_NAME, 'nonexistent', 5)
            expect(removed).toBe(0)
        })

        it('returns 0 for non-existent database gracefully', async () => {
            const { pruneOldestEntries } = await loadService()
            const removed = await pruneOldestEntries('NoSuchDB', 'store', 5)
            expect(removed).toBe(0)
        })
    })

    describe('pruneOnQuotaThreshold', () => {
        it('returns empty result when quota is unavailable', async () => {
            const { pruneOnQuotaThreshold } = await loadService()
            const result = await pruneOnQuotaThreshold()
            // In test env, Storage API is typically unavailable
            expect(result).toHaveProperty('prunedEntries')
            expect(result).toHaveProperty('stores')
            expect(result).toHaveProperty('quota')
        })

        it('result has correct shape', async () => {
            const { pruneOnQuotaThreshold } = await loadService()
            const result = await pruneOnQuotaThreshold(0)
            expect(typeof result.prunedEntries).toBe('number')
            expect(Array.isArray(result.stores)).toBe(true)
            expect(typeof result.quota.usagePercent).toBe('number')
        })
    })
})
