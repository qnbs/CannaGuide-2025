/**
 * IndexedDB Prune Service
 *
 * Provides selective pruning of IndexedDB object stores when storage
 * approaches quota limits.  Works in tandem with indexedDbMonitorService
 * to read current usage and decide what to remove.
 *
 * All public functions are safe to call at any time and degrade
 * gracefully when the underlying stores do not exist.
 */

import { getQuotaInfo, type StorageQuota } from './indexedDbMonitorService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PruneResult {
    quota: StorageQuota
    prunedEntries: number
    stores: Array<{ db: string; store: string; removed: number }>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IMAGE_STORE_CAP = 500
const SEARCH_STORE_CAP = 5000
const DEFAULT_THRESHOLD_PERCENT = 80

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const openDb = (name: string): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(name)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })

const countStore = (db: IDBDatabase, storeName: string): Promise<number> =>
    new Promise((resolve) => {
        if (!db.objectStoreNames.contains(storeName)) {
            resolve(0)
            return
        }
        const tx = db.transaction(storeName, 'readonly')
        const req = tx.objectStore(storeName).count()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(0)
    })

/**
 * Deletes the oldest `deleteCount` entries from `storeName` using a cursor.
 * Returns the number of entries actually deleted.
 */
const deleteOldest = (db: IDBDatabase, storeName: string, deleteCount: number): Promise<number> =>
    new Promise((resolve) => {
        if (!db.objectStoreNames.contains(storeName) || deleteCount <= 0) {
            resolve(0)
            return
        }
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const req = store.openCursor()
        let deleted = 0
        req.onsuccess = () => {
            const cursor = req.result
            if (cursor && deleted < deleteCount) {
                cursor.delete()
                deleted++
                cursor.continue()
            }
        }
        tx.oncomplete = () => resolve(deleted)
        tx.onerror = () => resolve(deleted)
    })

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Prunes the oldest entries in a given store to bring its count
 * at or below `maxCount`.  Returns the number of entries removed.
 */
export const pruneOldestEntries = async (
    dbName: string,
    storeName: string,
    maxCount: number,
): Promise<number> => {
    let db: IDBDatabase | undefined
    try {
        db = await openDb(dbName)
        const count = await countStore(db, storeName)
        if (count <= maxCount) return 0
        return await deleteOldest(db, storeName, count - maxCount)
    } catch (err) {
        console.debug('[indexedDbPruneService] pruneOldestEntries failed:', err)
        return 0
    } finally {
        db?.close()
    }
}

/**
 * Runs a quota-aware prune pass.  When storage usage exceeds
 * `thresholdPercent`, the images and search stores in CannaGuideDB are
 * trimmed to their respective caps.
 *
 * Always returns a `PruneResult` -- even when nothing was pruned.
 */
export const pruneOnQuotaThreshold = async (
    thresholdPercent: number = DEFAULT_THRESHOLD_PERCENT,
): Promise<PruneResult> => {
    const quota = await getQuotaInfo()
    const stores: PruneResult['stores'] = []
    let prunedEntries = 0

    if (!quota.available || quota.usagePercent < thresholdPercent) {
        return { quota, prunedEntries, stores }
    }

    // Prune images store
    const imgRemoved = await pruneOldestEntries('CannaGuideDB', 'images', IMAGE_STORE_CAP)
    if (imgRemoved > 0) {
        stores.push({ db: 'CannaGuideDB', store: 'images', removed: imgRemoved })
        prunedEntries += imgRemoved
    }

    // Prune search index store
    const searchRemoved = await pruneOldestEntries('CannaGuideDB', 'search', SEARCH_STORE_CAP)
    if (searchRemoved > 0) {
        stores.push({ db: 'CannaGuideDB', store: 'search', removed: searchRemoved })
        prunedEntries += searchRemoved
    }

    return { quota, prunedEntries, stores }
}
