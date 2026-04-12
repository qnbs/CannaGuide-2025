import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/services/localAiInfrastructureService', () => ({
    localAiPreloadService: { isReady: vi.fn(() => false) },
}))

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: vi.fn(() => false),
}))

vi.mock('@/services/aiEcoModeService', () => ({
    setEcoModeExplicit: vi.fn(),
    registerModeAccessors: vi.fn(),
    isEcoMode: vi.fn(() => false),
}))

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

vi.mock('@/services/geminiService', () => ({
    geminiService: { test: vi.fn() },
}))

vi.mock('@/services/localAI', () => ({
    localAiService: { test: vi.fn() },
}))

describe('localRoutingService', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it('exports setAiMode and getAiMode', async () => {
        const { setAiMode, getAiMode } = await import('./localRoutingService')
        expect(getAiMode()).toBe('hybrid')
        setAiMode('local')
        expect(getAiMode()).toBe('local')
    })

    it('shouldRouteLocally returns true in local mode', async () => {
        const { shouldRouteLocally, setAiMode } = await import('./localRoutingService')
        setAiMode('local')
        expect(shouldRouteLocally()).toBe(true)
    })

    it('shouldRouteLocally returns true in eco mode', async () => {
        const { shouldRouteLocally, setAiMode } = await import('./localRoutingService')
        setAiMode('eco')
        expect(shouldRouteLocally()).toBe(true)
    })

    it('shouldRouteLocally returns false in cloud mode when online', async () => {
        const { shouldRouteLocally, setAiMode } = await import('./localRoutingService')
        setAiMode('cloud')
        // jsdom navigator.onLine defaults to true
        expect(shouldRouteLocally()).toBe(false)
    })

    it('runRouted calls localCall when routing locally', async () => {
        const { runRouted, setAiMode } = await import('./localRoutingService')
        setAiMode('local')
        const localCall = vi.fn().mockResolvedValue('local-result')
        const cloudCall = vi.fn().mockResolvedValue('cloud-result')
        const fallback = vi.fn().mockReturnValue('fallback-result')

        const result = await runRouted(localCall, cloudCall, fallback)
        expect(result).toBe('local-result')
        expect(localCall).toHaveBeenCalledOnce()
        expect(cloudCall).not.toHaveBeenCalled()
    })

    it('runRouted calls cloudCall when in cloud mode and online', async () => {
        const { runRouted, setAiMode } = await import('./localRoutingService')
        setAiMode('cloud')
        const localCall = vi.fn().mockResolvedValue('local-result')
        const cloudCall = vi.fn().mockResolvedValue('cloud-result')
        const fallback = vi.fn().mockReturnValue('fallback-result')

        const result = await runRouted(localCall, cloudCall, fallback)
        expect(result).toBe('cloud-result')
        expect(cloudCall).toHaveBeenCalledOnce()
        expect(localCall).not.toHaveBeenCalled()
    })

    it('withLocalFallback skips cloud in local mode', async () => {
        const { withLocalFallback, setAiMode } = await import('./localRoutingService')
        setAiMode('local')
        const cloudFn = vi.fn().mockResolvedValue('cloud')
        const fallbackFn = vi.fn().mockReturnValue('fallback')

        const result = await withLocalFallback(cloudFn, fallbackFn)
        expect(result).toBe('fallback')
        expect(cloudFn).not.toHaveBeenCalled()
    })

    it('withLocalFallback catches cloud errors and falls back', async () => {
        const { withLocalFallback, setAiMode } = await import('./localRoutingService')
        setAiMode('hybrid')
        const cloudFn = vi.fn().mockRejectedValue(new Error('network error'))
        const fallbackFn = vi.fn().mockReturnValue('fallback-value')

        const result = await withLocalFallback(cloudFn, fallbackFn)
        expect(result).toBe('fallback-value')
        expect(fallbackFn).toHaveBeenCalledOnce()
    })

    it('getGeminiService dynamically imports geminiService', async () => {
        const { getGeminiService } = await import('./localRoutingService')
        const gemini = await getGeminiService()
        expect(gemini).toBeDefined()
    })

    it('getLocalAiService dynamically imports localAiService', async () => {
        const { getLocalAiService } = await import('./localRoutingService')
        const localAi = await getLocalAiService()
        expect(localAi).toBeDefined()
    })

    it('withLocalService passes local service to callback', async () => {
        const { withLocalService } = await import('./localRoutingService')
        const callback = vi.fn().mockResolvedValue('result')
        const result = await withLocalService(callback)
        expect(result).toBe('result')
        expect(callback).toHaveBeenCalledOnce()
    })
})
