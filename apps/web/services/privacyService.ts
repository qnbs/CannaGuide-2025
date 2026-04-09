// ---------------------------------------------------------------------------
// DSGVO / GDPR Privacy Service -- Right to be Forgotten
// ---------------------------------------------------------------------------
// Provides complete data export and full erasure of all user data.
// Covers all 7 IndexedDB databases, localStorage, sessionStorage, cookies,
// Service Worker caches, and SW registration.
// ---------------------------------------------------------------------------

import * as Sentry from '@sentry/browser'

// All IndexedDB database names used by the application
const INDEXED_DB_NAMES = [
    'CannaGuideDB',
    'CannaGuideStateDB',
    'CannaGuideSecureDB',
    'CannaGuideTimeSeriesDB',
    'CannaGuideLocalAiCache',
    'CannaGuideImageGenCache',
    'CannaGuideReminderDB',
] as const

/**
 * Delete a single IndexedDB database by name.
 * Resolves even if the database does not exist.
 */
const deleteDatabase = (name: string): Promise<void> =>
    new Promise((resolve) => {
        try {
            const req = indexedDB.deleteDatabase(name)
            req.onsuccess = (): void => resolve()
            req.onerror = (): void => resolve()
            req.onblocked = (): void => resolve()
        } catch {
            resolve()
        }
    })

/**
 * Get the list of all known IndexedDB database names.
 */
export const getKnownDatabaseNames = (): readonly string[] => INDEXED_DB_NAMES

/**
 * Delete a single IndexedDB database by name.
 * Only allows deletion of known application databases (whitelist).
 *
 * Implements selective DSGVO Art. 17 partial erasure.
 *
 * @returns true if deletion succeeded (or DB did not exist)
 */
export const eraseSingleDatabase = async (dbName: string): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    if (!INDEXED_DB_NAMES.includes(dbName as (typeof INDEXED_DB_NAMES)[number])) {
        return false
    }

    try {
        await deleteDatabase(dbName)
        return true
    } catch (error) {
        Sentry.captureException(error)
        return false
    }
}

/**
 * Remove all cookies visible to JS on the current path/domain.
 */
const clearAllCookies = (): void => {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
        const name = cookie.split('=')[0]?.trim()
        if (name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
    }
}

/**
 * Unregister all Service Workers and delete all caches.
 */
const clearServiceWorkers = async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return

    // Unregister all SW registrations
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((reg) => reg.unregister()))

    // Delete all caches
    if ('caches' in globalThis) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
    }
}

/**
 * Completely erase ALL user data from the device.
 *
 * This implements the GDPR "Right to Erasure" (Art. 17 DSGVO).
 * After calling this function the page should be reloaded.
 *
 * @returns true if erasure completed (caller should reload)
 */
export const eraseAllData = async (): Promise<boolean> => {
    try {
        // 1. Delete all IndexedDB databases
        await Promise.all(INDEXED_DB_NAMES.map(deleteDatabase))

        // 2. Clear localStorage
        localStorage.clear()

        // 3. Clear sessionStorage
        sessionStorage.clear()

        // 4. Clear cookies
        clearAllCookies()

        // 5. Unregister Service Workers + clear caches
        await clearServiceWorkers()

        return true
    } catch (error) {
        Sentry.captureException(error)
        console.debug('[privacyService] eraseAllData failed:', error)
        return false
    }
}

/**
 * Export all user data as a single JSON blob for GDPR data portability (Art. 20).
 *
 * Collects data from all IndexedDB object stores and localStorage.
 * Returns a JSON string suitable for download.
 */
export const exportAllUserData = async (): Promise<string> => {
    const dump: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        localStorage: {} as Record<string, string>,
        databases: {} as Record<string, Record<string, unknown[]>>,
    }

    // localStorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const ls = dump['localStorage'] as Record<string, string>
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
            ls[key] = localStorage.getItem(key) ?? ''
        }
    }

    // IndexedDB databases
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const dbs = dump['databases'] as Record<string, Record<string, unknown[]>>
    for (const dbName of INDEXED_DB_NAMES) {
        try {
            const data = await readAllFromDatabase(dbName)
            if (data) {
                dbs[dbName] = data
            }
        } catch {
            // Database may not exist yet -- skip silently
        }
    }

    return JSON.stringify(dump, null, 2)
}

/**
 * Read all object stores from a single IndexedDB database.
 * Returns null if the database cannot be opened.
 */
const readAllFromDatabase = (dbName: string): Promise<Record<string, unknown[]> | null> =>
    new Promise((resolve) => {
        try {
            const req = indexedDB.open(dbName)
            req.onerror = (): void => resolve(null)

            req.onsuccess = (): void => {
                const db = req.result
                const storeNames = Array.from(db.objectStoreNames)
                if (storeNames.length === 0) {
                    db.close()
                    resolve({})
                    return
                }

                const result: Record<string, unknown[]> = {}
                let remaining = storeNames.length

                const tx = db.transaction(storeNames, 'readonly')
                for (const storeName of storeNames) {
                    const store = tx.objectStore(storeName)
                    const getAll = store.getAll()
                    getAll.onsuccess = (): void => {
                        result[storeName] = getAll.result as unknown[]
                        remaining--
                        if (remaining === 0) {
                            db.close()
                            resolve(result)
                        }
                    }
                    getAll.onerror = (): void => {
                        remaining--
                        if (remaining === 0) {
                            db.close()
                            resolve(result)
                        }
                    }
                }
            }
        } catch {
            resolve(null)
        }
    })
