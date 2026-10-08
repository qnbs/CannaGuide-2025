import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
