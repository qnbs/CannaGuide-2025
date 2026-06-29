import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/localRoutingService', () => ({
    setAiMode: vi.fn(),
    getAiMode: vi.fn(() => 'hybrid'),
    isEcoMode: vi.fn(() => false),
    shouldRouteLocally: vi.fn(() => false),
    runRouted: vi.fn(),
    withLocalFallback: vi.fn(),
    withLocalService: vi.fn(),
    getGeminiService: vi.fn(),
    getLocalAiService: vi.fn(),
    captureLocalAiError: vi.fn(),
}))

describe('aiOrchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('re-exports routing helpers from localRoutingService', async () => {
        const orchestrator = await import('./aiOrchestrator')
        expect(orchestrator.getAiMode()).toBe('hybrid')
        expect(orchestrator.shouldRouteLocally).toBeDefined()
        expect(orchestrator.runRouted).toBeDefined()
    })

    it('delegates setAiMode to localRoutingService', async () => {
        const { setAiMode } = await import('@/services/localRoutingService')
        const orchestrator = await import('./aiOrchestrator')
        orchestrator.setAiMode('eco')
        expect(setAiMode).toHaveBeenCalledWith('eco')
    })
})
