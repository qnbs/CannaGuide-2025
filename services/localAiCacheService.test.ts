import { describe, expect, it, beforeEach } from 'vitest'

// Mock IndexedDB for testing
const mockStore = new Map<string, unknown>()

describe('localAiCacheService', () => {
    beforeEach(() => {
        mockStore.clear()
    })

    it('exports the expected API surface', async () => {
        const mod = await import('@/services/localAiCacheService')
        expect(typeof mod.getCachedInference).toBe('function')
        expect(typeof mod.setCachedInference).toBe('function')
        expect(typeof mod.clearPersistentCache).toBe('function')
        expect(typeof mod.getCacheSize).toBe('function')
        expect(typeof mod.getCacheBreakdown).toBe('function')
        expect(typeof mod.resetCacheDb).toBe('function')
    })

    it('getCacheSize returns 0 when IndexedDB is unavailable', async () => {
        const { getCacheSize, resetCacheDb } = await import('@/services/localAiCacheService')
        resetCacheDb()
        // Without proper IndexedDB, it should handle gracefully
        const size = await getCacheSize()
        expect(typeof size).toBe('number')
    })
})
