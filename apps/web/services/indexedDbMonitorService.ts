/**
 * IndexedDB Monitor Service
 *
 * Provides health monitoring, storage quota inspection, and maintenance
 * utilities for the three CannaGuide IndexedDB databases:
 *   - CannaGuideStateDB  (Redux persistence)
 *   - CannaGuideDB       (strains + images + search index)
 *   - CannaGuideSecureDB (crypto keys)
 *
 * All functions are safe to call in any order and will degrade gracefully
 * when the Storage API is unavailable (e.g., private browsing, old browsers).
 */

export interface DbStoreStats {
    db: string
    store: string
    count: number
}

export interface StorageQuota {
    usageBytes: number
    quotaBytes: number
    usagePercent: number
    available: boolean
}

export interface DbHealthStatus {
    healthy: boolean
    usagePercent: number
    storeStats: DbStoreStats[]
    quota: StorageQuota
    warnings: string[]
}

const USAGE_WARN_THRESHOLD = 70
const USAGE_CRITICAL_THRESHOLD = 90

const DB_DEFINITIONS: Array<{ name: string; stores: string[] }> = [
    { name: 'CannaGuideStateDB', stores: ['keyval'] },
    { name: 'CannaGuideDB', stores: ['strains', 'images', 'search'] },
    { name: 'CannaGuideSecureDB', stores: ['crypto_keys'] },
]

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const openDb = (name: string, stores: string[]): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(name)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        req.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            for (const store of stores) {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store)
                }
            }
        }
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns entry counts per object store across all CannaGuide databases.
 * Errors on individual stores are swallowed -- the store is reported as 0.
 */
export const getDbStats = async (): Promise<DbStoreStats[]> => {
    const results: DbStoreStats[] = []
    for (const { name, stores } of DB_DEFINITIONS) {
        let db: IDBDatabase | null = null
        try {
            db = await openDb(name, stores)
            for (const store of stores) {
                const count = await countStore(db, store)
                results.push({ db: name, store, count })
            }
        } catch {
            for (const store of stores) {
                results.push({ db: name, store, count: 0 })
            }
        } finally {
            db?.close()
        }
    }
    return results
}

/**
 * Queries the StorageManager API for quota and usage information.
 * Returns a fallback object with `available: false` when unsupported.
 */
export const getQuotaInfo = async (): Promise<StorageQuota> => {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
        return { usageBytes: 0, quotaBytes: 0, usagePercent: 0, available: false }
    }
    try {
        const { usage = 0, quota = 0 } = await navigator.storage.estimate()
        const usagePercent = quota > 0 ? Math.round((usage / quota) * 100) : 0
        return { usageBytes: usage, quotaBytes: quota, usagePercent, available: true }
    } catch {
        return { usageBytes: 0, quotaBytes: 0, usagePercent: 0, available: false }
    }
}

/**
 * Requests persistent storage from the browser.
 * Returns `true` if the browser grants the persistence grant.
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
    if (!('storage' in navigator && 'persist' in navigator.storage)) return false
    try {
        return await navigator.storage.persist()
    } catch {
        return false
    }
}

/**
 * Returns a composite health assessment including quota usage, store counts,
 * and actionable warning strings.
 */
export const monitorStorageHealth = async (): Promise<DbHealthStatus> => {
    const [storeStats, quota] = await Promise.all([getDbStats(), getQuotaInfo()])
    const warnings: string[] = []

    if (quota.available) {
        if (quota.usagePercent >= USAGE_CRITICAL_THRESHOLD) {
            warnings.push(
                `Storage critically full: ${quota.usagePercent}% used. Export and clear old data.`,
            )
        } else if (quota.usagePercent >= USAGE_WARN_THRESHOLD) {
            warnings.push(
                `Storage at ${quota.usagePercent}% capacity. Consider exporting grow logs.`,
            )
        }
    }

    const imageStore = storeStats.find((s) => s.store === 'images')
    if (imageStore && imageStore.count > 500) {
        warnings.push(
            `Image store contains ${imageStore.count} entries. Auto-pruning may help performance.`,
        )
    }

    const healthy = warnings.length === 0 || quota.usagePercent < USAGE_WARN_THRESHOLD

    return {
        healthy,
        usagePercent: quota.usagePercent,
        storeStats,
        quota,
        warnings,
    }
}

/**
 * Formats bytes as a human-readable string (KB / MB / GB).
 */
export const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
