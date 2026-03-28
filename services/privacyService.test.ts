import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { eraseAllData, exportAllUserData } from '@/services/privacyService'

// Mock Sentry to prevent real error tracking
vi.mock('@sentry/browser', () => ({
    captureException: vi.fn(),
}))

// Minimal fake IDBRequest / IDBOpenDBRequest for testing
function createFakeRequest<T>(result: T): IDBRequest<T> {
    const req = {
        result,
        error: null as DOMException | null,
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        onblocked: null as ((ev: Event) => void) | null,
    } as unknown as IDBRequest<T>
    return req
}

describe('privacyService', () => {
    const originalLocalStorage = globalThis.localStorage
    let deleteDbSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        // Reset spies
        vi.restoreAllMocks()

        // Mock indexedDB.deleteDatabase
        deleteDbSpy = vi.fn().mockImplementation(() => {
            const req = createFakeRequest(undefined)
            setTimeout(() => req.onsuccess?.(new Event('success')), 0)
            return req
        })
        vi.stubGlobal('indexedDB', {
            deleteDatabase: deleteDbSpy,
            open: vi.fn().mockImplementation(() => {
                const db = {
                    objectStoreNames: [] as unknown as DOMStringList,
                    close: vi.fn(),
                }
                const req = createFakeRequest(db)
                setTimeout(() => req.onsuccess?.(new Event('success')), 0)
                return req
            }),
        })

        // Mock navigator.serviceWorker
        vi.stubGlobal('navigator', {
            ...navigator,
            serviceWorker: {
                getRegistrations: vi.fn().mockResolvedValue([]),
            },
        })

        // Mock caches
        vi.stubGlobal('caches', {
            keys: vi.fn().mockResolvedValue([]),
            delete: vi.fn().mockResolvedValue(true),
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    describe('eraseAllData', () => {
        it('returns true on successful erasure', async () => {
            const result = await eraseAllData()
            expect(result).toBe(true)
        })

        it('calls deleteDatabase for all 7 databases', async () => {
            await eraseAllData()
            expect(deleteDbSpy).toHaveBeenCalledTimes(7)
            expect(deleteDbSpy).toHaveBeenCalledWith('CannaGuideDB')
            expect(deleteDbSpy).toHaveBeenCalledWith('CannaGuideStateDB')
            expect(deleteDbSpy).toHaveBeenCalledWith('CannaGuideSecureDB')
            expect(deleteDbSpy).toHaveBeenCalledWith('CannaGuideTimeSeriesDB')
            expect(deleteDbSpy).toHaveBeenCalledWith('CannaGuideLocalAiCache')
            expect(deleteDbSpy).toHaveBeenCalledWith('CannaGuideImageGenCache')
            expect(deleteDbSpy).toHaveBeenCalledWith('CannaGuideReminderDB')
        })

        it('clears localStorage and sessionStorage', async () => {
            localStorage.setItem('_test_erase_', '1')
            sessionStorage.setItem('_test_erase_', '1')

            await eraseAllData()

            expect(localStorage.getItem('_test_erase_')).toBeNull()
            expect(sessionStorage.getItem('_test_erase_')).toBeNull()
        })

        it('unregisters service workers', async () => {
            const mockUnregister = vi.fn().mockResolvedValue(true)
            vi.stubGlobal('navigator', {
                ...navigator,
                serviceWorker: {
                    getRegistrations: vi.fn().mockResolvedValue([{ unregister: mockUnregister }]),
                },
            })

            await eraseAllData()
            expect(mockUnregister).toHaveBeenCalled()
        })

        it('deletes all caches', async () => {
            const mockDelete = vi.fn().mockResolvedValue(true)
            vi.stubGlobal('caches', {
                keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
                delete: mockDelete,
            })

            await eraseAllData()
            expect(mockDelete).toHaveBeenCalledWith('cache-v1')
            expect(mockDelete).toHaveBeenCalledWith('cache-v2')
        })

        it('returns false and reports to Sentry when a critical step throws', async () => {
            const { captureException } = await import('@sentry/browser')
            // Force localStorage.clear to throw, which is inside the try/catch
            const clearOrig = Storage.prototype.clear
            Storage.prototype.clear = () => {
                throw new Error('storage error')
            }

            const result = await eraseAllData()
            expect(result).toBe(false)
            expect(captureException).toHaveBeenCalled()

            Storage.prototype.clear = clearOrig
        })
    })

    describe('exportAllUserData', () => {
        it('returns valid JSON with exportedAt timestamp', async () => {
            const result = await exportAllUserData()
            const parsed = JSON.parse(result) as Record<string, unknown>
            expect(parsed).toHaveProperty('exportedAt')
            expect(parsed).toHaveProperty('localStorage')
            expect(parsed).toHaveProperty('databases')
        })

        it('includes localStorage entries', async () => {
            originalLocalStorage.setItem('testKey', 'testValue')

            const result = await exportAllUserData()
            const parsed = JSON.parse(result) as Record<string, Record<string, string>>

            expect(parsed['localStorage']).toHaveProperty('testKey', 'testValue')
            originalLocalStorage.removeItem('testKey')
        })

        it('exports an ISO 8601 date string', async () => {
            const result = await exportAllUserData()
            const parsed = JSON.parse(result) as Record<string, string>
            const dateStr = parsed['exportedAt']
            expect(dateStr).toBeDefined()
            expect(new Date(dateStr as string).toISOString()).toBe(dateStr)
        })
    })
})
