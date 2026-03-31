import { describe, it, expect } from 'vitest'

describe('LocalAIInfrastructure', () => {
    it('exports a singleton instance with all subsystem methods', async () => {
        const { localAIInfrastructure } = await import('@/services/LocalAIInfrastructure')

        // Preload subsystem
        expect(localAIInfrastructure.preload).toBeDefined()
        expect(typeof localAIInfrastructure.preload.getStatus).toBe('function')
        expect(typeof localAIInfrastructure.preload.isReady).toBe('function')
        expect(typeof localAIInfrastructure.ensurePersistentStorage).toBe('function')

        // Cache subsystem
        expect(typeof localAIInfrastructure.getCachedInference).toBe('function')
        expect(typeof localAIInfrastructure.setCachedInference).toBe('function')
        expect(typeof localAIInfrastructure.clearPersistentCache).toBe('function')
        expect(typeof localAIInfrastructure.getCacheSize).toBe('function')
        expect(typeof localAIInfrastructure.getCacheBreakdown).toBe('function')
        expect(typeof localAIInfrastructure.applyCacheSettings).toBe('function')
        expect(typeof localAIInfrastructure.resetCacheDb).toBe('function')

        // Telemetry subsystem
        expect(typeof localAIInfrastructure.createInferenceTimer).toBe('function')
        expect(typeof localAIInfrastructure.recordInference).toBe('function')
        expect(typeof localAIInfrastructure.measureInference).toBe('function')
        expect(typeof localAIInfrastructure.recordCacheHit).toBe('function')
        expect(typeof localAIInfrastructure.recordCacheMiss).toBe('function')
        expect(typeof localAIInfrastructure.getSnapshot).toBe('function')
        expect(typeof localAIInfrastructure.persistSnapshot).toBe('function')
        expect(typeof localAIInfrastructure.debouncedPersistSnapshot).toBe('function')
        expect(typeof localAIInfrastructure.loadPersistedSnapshot).toBe('function')
        expect(typeof localAIInfrastructure.checkPerformanceDegradation).toBe('function')
        expect(typeof localAIInfrastructure.resetTelemetry).toBe('function')

        // Cross-cutting
        expect(typeof localAIInfrastructure.getCachedWithTelemetry).toBe('function')
        expect(typeof localAIInfrastructure.cacheAndTrack).toBe('function')
        expect(typeof localAIInfrastructure.resetAll).toBe('function')
    })

    it('getCachedWithTelemetry records cache miss for unknown key', async () => {
        const { localAIInfrastructure } = await import('@/services/LocalAIInfrastructure')

        // Reset telemetry state
        localAIInfrastructure.resetTelemetry()

        const result = await localAIInfrastructure.getCachedWithTelemetry('nonexistent-prompt')

        expect(result).toBeNull()

        const snap = localAIInfrastructure.getSnapshot()
        // Should have recorded at least 1 cache miss via the cross-cutting method
        expect(snap.cacheHitRate).toBe(0)
    })
})

describe('AIService facade', () => {
    it('re-exports all expected members', async () => {
        const facade = await import('@/services/aiFacade')

        // Core routing
        expect(facade.aiService).toBeDefined()
        expect(typeof facade.setAiMode).toBe('function')
        expect(typeof facade.getAiMode).toBe('function')
        expect(typeof facade.isEcoMode).toBe('function')

        // Provider management
        expect(facade.aiProviderService).toBeDefined()
        expect(typeof facade.aiProviderService.getActiveProviderId).toBe('function')

        // Infrastructure
        expect(facade.localAIInfrastructure).toBeDefined()
        expect(typeof facade.localAIInfrastructure.getSnapshot).toBe('function')
    })
})
