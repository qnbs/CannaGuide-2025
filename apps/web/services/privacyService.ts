// ---------------------------------------------------------------------------
// DSGVO / GDPR Privacy Service -- Right to be Forgotten
// ---------------------------------------------------------------------------
// Provides complete data export and full erasure of all user data.
// Database names live in privacyDatabaseRegistry.ts. A blocked delete is a
// failure, not a success.
// ---------------------------------------------------------------------------

import * as Sentry from '@sentry/browser'
import {
    APPLICATION_DATABASE_NAMES,
    DELETE_DATABASE_TIMEOUT_MS,
    EXPORT_DATABASE_NAMES,
    isApplicationDatabaseName,
    type ApplicationDatabaseName,
} from './privacyDatabaseRegistry'

type DeleteOutcome = 'deleted' | 'blocked' | 'error'

/**
 * Delete one IndexedDB database.
 * `onblocked` stays pending until success, error, or the timeout.
 * A missing IndexedDB implementation counts as deleted (nothing to erase).
 */
const deleteDatabase = (name: string): Promise<DeleteOutcome> =>
    new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
            resolve('deleted')
            return
        }

        let settled = false
        let timer: ReturnType<typeof setTimeout> | undefined
        const finish = (outcome: DeleteOutcome): void => {
            if (settled) return
            settled = true
            if (timer !== undefined) clearTimeout(timer)
            resolve(outcome)
        }

        try {
            const req = indexedDB.deleteDatabase(name)
            req.onsuccess = (): void => finish('deleted')
            req.onerror = (): void => finish('error')
            req.onblocked = (): void => {
                if (settled || timer !== undefined) return
                timer = setTimeout(() => {
                    finish('blocked')
                }, DELETE_DATABASE_TIMEOUT_MS)
            }
        } catch {
            finish('error')
        }
    })

const logCloserError = (error: unknown): undefined => {
    console.debug('[privacyService] connection close failed:', error)
    return undefined
}

/** Close page-owned connections so deleteDatabase is not blocked by this tab. */
const closeOwnedConnections = async (): Promise<void> => {
    const closers: Array<Promise<unknown>> = [
        import('./crdtService').then((mod) => mod.crdtService.destroy()).catch(logCloserError),
        import('./db/connection')
            .then((mod) => {
                mod.closeDB()
            })
            .catch(logCloserError),
        import('@/stores/indexedDBStorage')
            .then((mod) => {
                mod.closeIndexedDBStorage()
            })
            .catch(logCloserError),
        import('./cryptoService')
            .then((mod) => {
                mod.closeSecureDb()
            })
            .catch(logCloserError),
        import('./timeSeriesService')
            .then((mod) => {
                mod.holdTimeSeriesForErase()
            })
            .catch(logCloserError),
        import('./local-ai/cache/cacheService')
            .then((mod) => mod.closeLocalAiCache())
            .catch(logCloserError),
        import('./imageGenerationCacheService')
            .then((mod) => mod.closeImageGenCache())
            .catch(logCloserError),
        import('./local-ai/nlp/ragEmbeddingCacheService')
            .then((mod) => mod.closeEmbeddingCache())
            .catch(logCloserError),
    ]
    await Promise.all(closers)
}

/** Re-open is allowed only when erase did not finish. A full success reloads. */
const releaseOwnedConnections = async (): Promise<void> => {
    const releasers: Array<Promise<unknown>> = [
        import('./db/connection')
            .then((mod) => {
                mod.releaseDBAfterErase()
            })
            .catch(logCloserError),
        import('@/stores/indexedDBStorage')
            .then((mod) => {
                mod.releaseIndexedDBStorageAfterErase()
            })
            .catch(logCloserError),
        import('./cryptoService')
            .then((mod) => {
                mod.releaseSecureDbAfterErase()
            })
            .catch(logCloserError),
        import('./timeSeriesService')
            .then((mod) => {
                mod.releaseTimeSeriesAfterErase()
            })
            .catch(logCloserError),
        import('./local-ai/cache/cacheService')
            .then((mod) => {
                mod.resumeLocalAiCache()
            })
            .catch(logCloserError),
        import('./imageGenerationCacheService')
            .then((mod) => {
                mod.resumeImageGenCache()
            })
            .catch(logCloserError),
        import('./local-ai/nlp/ragEmbeddingCacheService')
            .then((mod) => {
                mod.resumeEmbeddingCache()
            })
            .catch(logCloserError),
    ]
    await Promise.all(releasers)
}

/**
 * True when indexedDB.databases() still lists one of `names`.
 * Browsers without databases() cannot confirm leftovers, so this returns false
 * and erase then depends on deleteDatabase outcomes alone.
 */
const namedDatabasesStillPresent = async (names: readonly string[]): Promise<boolean> => {
    if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
        return false
    }
    try {
        const present = await indexedDB.databases()
        const known = new Set<string>(names)
        return present.some((entry) => entry.name !== undefined && known.has(entry.name))
    } catch {
        return false
    }
}

/**
 * Get the list of all known IndexedDB database names.
 */
export const getKnownDatabaseNames = (): readonly ApplicationDatabaseName[] =>
    APPLICATION_DATABASE_NAMES

/**
 * Delete a single IndexedDB database by name.
 * Only allows deletion of known application databases (whitelist).
 *
 * Implements selective DSGVO Art. 17 partial erasure.
 *
 * @returns true if deletion succeeded (or DB did not exist)
 */
export const eraseSingleDatabase = async (dbName: string): Promise<boolean> => {
    if (!isApplicationDatabaseName(dbName)) {
        return false
    }

    let deleted = false
    try {
        await closeOwnedConnections()
        const outcome = await deleteDatabase(dbName)
        deleted = outcome === 'deleted' && !(await namedDatabasesStillPresent([dbName]))
        return deleted
    } catch (error) {
        Sentry.captureException(error)
        return false
    } finally {
        await releaseOwnedConnections()
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
    let databasesDeleted = false
    try {
        await closeOwnedConnections()

        // 1. Delete every registered IndexedDB database
        const outcomes = await Promise.all(APPLICATION_DATABASE_NAMES.map(deleteDatabase))
        databasesDeleted =
            outcomes.every((outcome) => outcome === 'deleted') &&
            !(await namedDatabasesStillPresent(APPLICATION_DATABASE_NAMES))

        if (!databasesDeleted) return false

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
        databasesDeleted = false
        Sentry.captureException(error)
        console.debug('[privacyService] eraseAllData failed:', error)
        return false
    } finally {
        if (!databasesDeleted) {
            await releaseOwnedConnections()
        }
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
    for (const dbName of EXPORT_DATABASE_NAMES) {
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
            req.onupgradeneeded = (event): void => {
                // open() without a version creates a missing database at version 1
                // and then skips the real service upgrade. Abort that creation.
                if (event.oldVersion !== 0) return
                req.transaction?.abort()
            }

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
