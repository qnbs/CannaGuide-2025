import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    IDBDatabase as FakeIDBDatabase,
    IDBFactory,
    IDBObjectStore as FakeIDBObjectStore,
} from 'fake-indexeddb'
import { DELETE_DATABASE_TIMEOUT_MS } from './privacyDatabaseRegistry'

// Mock Sentry before importing the service
vi.mock('@sentry/browser', () => ({
    captureException: vi.fn(),
}))

describe('privacyService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        sessionStorage.clear()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('eraseAllData', () => {
        it('should clear localStorage', async () => {
            localStorage.setItem('test-key', 'test-value')
            const { eraseAllData } = await import('./privacyService')
            const result = await eraseAllData()
            expect(result).toBe(true)
            expect(localStorage.length).toBe(0)
        })

        it('should clear sessionStorage', async () => {
            sessionStorage.setItem('session-key', 'session-value')
            const { eraseAllData } = await import('./privacyService')
            const result = await eraseAllData()
            expect(result).toBe(true)
            expect(sessionStorage.length).toBe(0)
        })

        it('should return true on success', async () => {
            const { eraseAllData } = await import('./privacyService')
            const result = await eraseAllData()
            expect(result).toBe(true)
        })

        it('returns false when a delete stays blocked', async () => {
            const realIndexedDb = globalThis.indexedDB
            const blockedDb = {
                deleteDatabase: () => {
                    const request = {
                        onsuccess: null as (() => void) | null,
                        onerror: null as (() => void) | null,
                        onblocked: null as (() => void) | null,
                    }
                    queueMicrotask(() => {
                        request.onblocked?.()
                    })
                    return request
                },
            }
            vi.useFakeTimers()
            vi.stubGlobal('indexedDB', blockedDb)
            try {
                const { eraseAllData } = await import('./privacyService')
                const pending = eraseAllData()
                await vi.advanceTimersByTimeAsync(DELETE_DATABASE_TIMEOUT_MS)
                await expect(pending).resolves.toBe(false)
            } finally {
                vi.useRealTimers()
                vi.stubGlobal('indexedDB', realIndexedDb)
            }
        })

        it('does not fail an unblocked delete when the blocked timeout elapses', async () => {
            const realIndexedDb = globalThis.indexedDB
            const requests: Array<{
                onsuccess: (() => void) | null
                onerror: (() => void) | null
                onblocked: (() => void) | null
            }> = []
            const slowDb = {
                deleteDatabase: () => {
                    const request = {
                        onsuccess: null,
                        onerror: null,
                        onblocked: null,
                    }
                    requests.push(request)
                    return request
                },
                databases: async () => [],
            }
            vi.useFakeTimers()
            vi.stubGlobal('indexedDB', slowDb)
            try {
                const { eraseAllData } = await import('./privacyService')
                const pending = eraseAllData()
                await vi.advanceTimersByTimeAsync(DELETE_DATABASE_TIMEOUT_MS)
                let settled = false
                void pending.then(() => {
                    settled = true
                })
                await Promise.resolve()
                expect(settled).toBe(false)
                expect(requests.length).toBeGreaterThan(0)
                for (const request of requests) request.onsuccess?.()
                await expect(pending).resolves.toBe(true)
            } finally {
                vi.useRealTimers()
                vi.stubGlobal('indexedDB', realIndexedDb)
            }
        })

        it('returns false when a registered database is still listed', async () => {
            const realIndexedDb = globalThis.indexedDB
            const leftoverDb = {
                deleteDatabase: () => {
                    const request = {
                        onsuccess: null as (() => void) | null,
                        onerror: null as (() => void) | null,
                        onblocked: null as (() => void) | null,
                    }
                    queueMicrotask(() => {
                        request.onsuccess?.()
                    })
                    return request
                },
                databases: async () => [{ name: 'cannaguide-crdt-v1', version: 1 }],
            }
            vi.stubGlobal('indexedDB', leftoverDb)
            try {
                const { eraseAllData } = await import('./privacyService')
                await expect(eraseAllData()).resolves.toBe(false)
            } finally {
                vi.stubGlobal('indexedDB', realIndexedDb)
            }
        })
    })

    describe('exportAllUserData', () => {
        it('should include localStorage data in export', async () => {
            localStorage.setItem('api-key', 'encrypted-value')
            localStorage.setItem('settings', '{"theme":"dark"}')
            const { exportAllUserData } = await import('./privacyService')

            const json = await exportAllUserData()
            const data = JSON.parse(json)
            expect(data.exportedAt).toBeDefined()
            expect(data.localStorage['api-key']).toBe('encrypted-value')
            expect(data.localStorage['settings']).toBe('{"theme":"dark"}')
        })

        it('exports the stored snapshot without the Cloud TTS key (#654)', async () => {
            // A synthetic canary, never a real key.
            const canary = 'sk_canary_0000000000000000000000000000'
            const factory = new IDBFactory()
            await new Promise<void>((resolve, reject) => {
                const open = factory.open('CannaGuideStateDB', 1)
                open.onupgradeneeded = () => open.result.createObjectStore('zustand_state')
                open.onerror = () => reject(open.error)
                open.onsuccess = () => {
                    const tx = open.result.transaction('zustand_state', 'readwrite')
                    tx.objectStore('zustand_state').put(
                        JSON.stringify({
                            settings: {
                                settings: {
                                    tts: { cloudTtsApiKey: canary },
                                    voiceControl: {
                                        porcupineAccessKey:
                                            'pv_canary_0000000000000000000000000000',
                                    },
                                },
                                version: 5,
                            },
                            simulation: { marker: 'plants-kept' },
                        }),
                        'cannaguide-redux-storage',
                    )
                    tx.oncomplete = () => {
                        open.result.close()
                        resolve()
                    }
                    tx.onerror = () => reject(tx.error)
                }
            })
            vi.stubGlobal('indexedDB', factory)
            try {
                const { exportAllUserData } = await import('./privacyService')
                const json = await exportAllUserData()
                expect(json).not.toContain(canary)
                expect(json).not.toContain('pv_canary_0000000000000000000000000000')
                expect(json).toContain('plants-kept')
            } finally {
                vi.unstubAllGlobals()
            }
        })

        it('should include exportedAt timestamp', async () => {
            const { exportAllUserData } = await import('./privacyService')
            const json = await exportAllUserData()
            const data = JSON.parse(json)
            expect(data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
        })

        it('should return valid JSON', async () => {
            const { exportAllUserData } = await import('./privacyService')
            const json = await exportAllUserData()
            expect(() => JSON.parse(json)).not.toThrow()
            const data = JSON.parse(json)
            expect(data.databases).toBeDefined()
        })

        it('aborts export opens that would create a missing database', async () => {
            const realIndexedDb = globalThis.indexedDB
            let abortCount = 0
            const fakeIndexedDb = {
                open: () => {
                    const request = {
                        onerror: null as (() => void) | null,
                        onsuccess: null as (() => void) | null,
                        onupgradeneeded: null as ((event: { oldVersion: number }) => void) | null,
                        transaction: {
                            abort: () => {
                                abortCount += 1
                            },
                        },
                    }
                    queueMicrotask(() => {
                        request.onupgradeneeded?.({ oldVersion: 0 })
                        if (abortCount > 0) request.onerror?.()
                        else request.onsuccess?.()
                    })
                    return request
                },
            }
            vi.stubGlobal('indexedDB', fakeIndexedDb)
            try {
                const { exportAllUserData } = await import('./privacyService')
                const data = JSON.parse(await exportAllUserData()) as {
                    databases: Record<string, unknown>
                }
                expect(abortCount).toBeGreaterThan(0)
                expect(data.databases).toEqual({})
            } finally {
                vi.stubGlobal('indexedDB', realIndexedDb)
            }
        })
    })

    describe('exportAllUserData completeness (#670)', () => {
        type Rows = Record<string, Array<[string, unknown]>>
        const seed = (factory: IDBFactory, name: string, stores: Rows): Promise<void> =>
            new Promise((resolve, reject) => {
                const open = factory.open(name, 1)
                open.onupgradeneeded = () => {
                    for (const store of Object.keys(stores)) open.result.createObjectStore(store)
                }
                open.onerror = () => reject(open.error)
                open.onsuccess = () => {
                    const db = open.result
                    const tx = db.transaction(Object.keys(stores), 'readwrite')
                    for (const [store, rows] of Object.entries(stores)) {
                        for (const [key, value] of rows) tx.objectStore(store).put(value, key)
                    }
                    tx.oncomplete = () => {
                        db.close()
                        resolve()
                    }
                    tx.onerror = () => reject(tx.error)
                }
            })

        const seededFactory = async (): Promise<IDBFactory> => {
            const factory = new IDBFactory()
            await seed(factory, 'CannaGuideStateDB', {
                zustand_state: [['cannaguide-redux-storage', 'state-sentinel']],
            })
            await seed(factory, 'CannaGuideDB', {
                images: [['photo-1', { id: 'photo-1', data: 'image-sentinel' }]],
                metadata: [],
            })
            vi.stubGlobal('indexedDB', factory)
            return factory
        }

        const exportFails = async (databaseName: string): Promise<void> => {
            const { exportAllUserData, PrivacyExportError } = await import('./privacyService')
            const failure = await exportAllUserData().then(
                () => null,
                (error: unknown) => error,
            )
            expect(failure).toBeInstanceOf(PrivacyExportError)
            expect(failure).toMatchObject({ databaseName })
            // The error names the database, never its records.
            expect(String((failure as Error).message)).not.toContain('sentinel')
        }

        afterEach(() => {
            vi.restoreAllMocks()
            vi.unstubAllGlobals()
        })

        it('exports every populated database and leaves absent ones out', async () => {
            await seededFactory()
            const { exportAllUserData } = await import('./privacyService')
            const data = JSON.parse(await exportAllUserData()) as {
                databases: Record<string, Record<string, unknown[]>>
            }
            expect(Object.keys(data.databases).sort()).toEqual([
                'CannaGuideDB',
                'CannaGuideStateDB',
            ])
            expect(data.databases['CannaGuideStateDB']!['zustand_state']).toEqual([
                'state-sentinel',
            ])
            expect(data.databases['CannaGuideDB']!['images']).toEqual([
                { id: 'photo-1', data: 'image-sentinel' },
            ])
            // An empty store is exported as empty, not dropped.
            expect(data.databases['CannaGuideDB']!['metadata']).toEqual([])
        })

        it('fails the whole export when one store cannot be read', async () => {
            await seededFactory()
            const originalGetAll = FakeIDBObjectStore.prototype.getAll
            vi.spyOn(FakeIDBObjectStore.prototype, 'getAll').mockImplementation(function (
                this: FakeIDBObjectStore,
                ...args: Parameters<FakeIDBObjectStore['getAll']>
            ) {
                if (this.name !== 'images') return originalGetAll.apply(this, args)
                const request = {
                    error: new DOMException('Read failed', 'UnknownError'),
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                }
                queueMicrotask(() => request.onerror?.())
                return request as unknown as ReturnType<FakeIDBObjectStore['getAll']>
            })
            await exportFails('CannaGuideDB')
        })

        it('fails the whole export when a read transaction aborts', async () => {
            await seededFactory()
            const originalTransaction = FakeIDBDatabase.prototype.transaction
            vi.spyOn(FakeIDBDatabase.prototype, 'transaction').mockImplementation(function (
                this: FakeIDBDatabase,
                ...args: Parameters<FakeIDBDatabase['transaction']>
            ) {
                const tx = originalTransaction.apply(this, args)
                if (this.name === 'CannaGuideStateDB') queueMicrotask(() => tx.abort())
                return tx
            })
            await exportFails('CannaGuideStateDB')
        })

        it('fails the whole export when a read transaction cannot be started', async () => {
            await seededFactory()
            const originalTransaction = FakeIDBDatabase.prototype.transaction
            vi.spyOn(FakeIDBDatabase.prototype, 'transaction').mockImplementation(function (
                this: FakeIDBDatabase,
                ...args: Parameters<FakeIDBDatabase['transaction']>
            ) {
                if (this.name === 'CannaGuideDB') {
                    throw new DOMException('The connection is closing', 'InvalidStateError')
                }
                return originalTransaction.apply(this, args)
            })
            await exportFails('CannaGuideDB')
        })

        it('fails the whole export when an existing database cannot be opened', async () => {
            vi.stubGlobal('indexedDB', {
                open: () => {
                    const request = {
                        onerror: null as (() => void) | null,
                        onsuccess: null as (() => void) | null,
                        onupgradeneeded: null as (() => void) | null,
                    }
                    // An error without an upgrade: the database exists, it just will not open.
                    queueMicrotask(() => request.onerror?.())
                    return request
                },
            })
            await exportFails('CannaGuideDB')
        })
    })

    describe('getKnownDatabaseNames', () => {
        it('should return every registered database name', async () => {
            const { getKnownDatabaseNames } = await import('./privacyService')
            const names = getKnownDatabaseNames()
            expect(names).toHaveLength(10)
            expect(names).toContain('CannaGuideDB')
            expect(names).toContain('CannaGuideStateDB')
            expect(names).toContain('CannaGuideSecureDB')
            expect(names).toContain('cannaguide-crdt-v1')
            expect(names).toContain('CannaGuideRagEmbeddingCache')
            expect(names).toContain('plantDiseaseModel')
        })
    })

    describe('eraseSingleDatabase', () => {
        it('should return false for unknown database names', async () => {
            const { eraseSingleDatabase } = await import('./privacyService')
            const result = await eraseSingleDatabase('UnknownDB')
            expect(result).toBe(false)
        })

        it('should return true for a valid known database name', async () => {
            const { eraseSingleDatabase } = await import('./privacyService')
            const result = await eraseSingleDatabase('CannaGuideLocalAiCache')
            expect(result).toBe(true)
        })

        it('should reject empty string', async () => {
            const { eraseSingleDatabase } = await import('./privacyService')
            const result = await eraseSingleDatabase('')
            expect(result).toBe(false)
        })
    })
})
