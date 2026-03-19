import { describe, expect, it, beforeEach } from 'vitest'

describe('localAiCacheService', () => {
    beforeEach(async () => {
        const { resetCacheDb } = await import('@/services/localAiCacheService')
        resetCacheDb()
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

    it('getCacheSize returns a number when IndexedDB is unavailable', async () => {
        const { getCacheSize, resetCacheDb } = await import('@/services/localAiCacheService')
        resetCacheDb()
        const size = await getCacheSize()
        expect(typeof size).toBe('number')
    })

    it('getCachedInference returns null for unknown prompts', async () => {
        const { getCachedInference } = await import('@/services/localAiCacheService')
        const result = await getCachedInference('unknown-prompt-that-does-not-exist')
        expect(result).toBeNull()
    })

    it('clearPersistentCache does not throw when DB is unavailable', async () => {
        const { clearPersistentCache, resetCacheDb } =
            await import('@/services/localAiCacheService')
        resetCacheDb()
        await expect(clearPersistentCache()).resolves.toBeUndefined()
    })

    it('getCacheBreakdown returns an object when DB is unavailable', async () => {
        const { getCacheBreakdown, resetCacheDb } = await import('@/services/localAiCacheService')
        resetCacheDb()
        const breakdown = await getCacheBreakdown()
        expect(typeof breakdown).toBe('object')
    })
})
