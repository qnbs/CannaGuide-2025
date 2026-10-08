import { describe, it, expect, vi, beforeEach } from 'vitest'

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
            vi.stubGlobal('indexedDB', blockedDb)
            try {
                const { eraseAllData } = await import('./privacyService')
                await expect(eraseAllData()).resolves.toBe(false)
            } finally {
                vi.stubGlobal('indexedDB', realIndexedDb)
            }
        }, 15000)

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
