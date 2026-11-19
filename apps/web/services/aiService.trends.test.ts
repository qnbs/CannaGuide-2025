import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GrowSetup } from '@/types'

// The trend and grow-tech helpers used to call Gemini directly, past the routing
// that every other cloud call takes: Local-Only Mode, the local/eco AI modes and
// the provider consent did not stop them. They now go through withLocalFallback.

const mocks = vi.hoisted(() => ({
    getTrendAnalysis: vi.fn(),
    hasProviderConsent: vi.fn(() => true),
    requestProviderConsent: vi.fn(async () => false),
}))

vi.mock('@/services/local-ai', () => ({
    localAiFallbackService: {},
    localizeStr: (lang: string, strings: Record<string, string>) => strings[lang] ?? strings.en,
    localAiPreloadService: { isReady: () => false },
    setEcoModeExplicit: vi.fn(),
    registerModeAccessors: vi.fn(),
    isEcoMode: () => false,
    isCriticalBattery: () => false,
}))

vi.mock('@/services/geminiService', () => ({
    geminiService: { getTrendAnalysis: mocks.getTrendAnalysis },
}))

vi.mock('@/services/aiConsentService', () => ({
    aiConsentService: {
        hasProviderConsent: mocks.hasProviderConsent,
        grantProviderConsent: vi.fn(),
    },
}))

vi.mock('@/services/aiProviderService', () => ({
    aiProviderService: { getActiveProviderId: () => 'gemini' },
}))

vi.mock('@/stores/useUIStore', () => ({
    useUIStore: {
        getState: () => ({
            requestProviderConsent: mocks.requestProviderConsent,
            addNotification: vi.fn(),
        }),
    },
}))

vi.mock('@/services/growLogRagService', () => ({
    growLogRagService: {
        retrieveSemanticContext: vi.fn().mockResolvedValue(''),
        retrieveRelevantContext: vi.fn().mockResolvedValue(''),
    },
}))

const setup = {
    medium: 'soil',
    lightType: 'LED',
    lightWattage: 240,
    dynamicLighting: true,
} as unknown as GrowSetup

const cloudAnswer = { title: 'Cloud', content: 'From the provider' }

const load = async () => {
    const { aiService } = await import('@/services/aiService')
    const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
    const { setAiMode } = await import('@/services/localRoutingService')
    return { aiService, setLocalOnlyMode, setAiMode }
}

const callBoth = async (aiService: Awaited<ReturnType<typeof load>>['aiService']) => [
    await aiService.getGeneticTrendAnalysis('autofloweringRevolution', 'en'),
    await aiService.getGrowTechRecommendation(setup, 'en'),
]

describe('aiService trend helpers honour the cloud routing', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        mocks.hasProviderConsent.mockReturnValue(true)
        mocks.getTrendAnalysis.mockResolvedValue(cloudAnswer)
    })

    afterEach(async () => {
        const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
        setLocalOnlyMode(false)
    })

    it('sends nothing in Local-Only Mode and answers with the fallback', async () => {
        const { aiService, setLocalOnlyMode, setAiMode } = await load()
        setAiMode('cloud')
        setLocalOnlyMode(true)

        const [trend, tech] = await callBoth(aiService)

        expect(mocks.getTrendAnalysis).not.toHaveBeenCalled()
        expect(trend?.title).toBe('Genetic Trend: autofloweringRevolution')
        expect(trend?.confidence).toBe(0.5)
        expect(tech?.title).toBe('Grow Tech Recommendation 2026')
        expect(tech?.confidence).toBe(0.5)
    })

    it.each(['local', 'eco'] as const)('sends nothing in the %s AI mode', async (mode) => {
        const { aiService, setAiMode } = await load()
        setAiMode(mode)

        await callBoth(aiService)

        expect(mocks.getTrendAnalysis).not.toHaveBeenCalled()
    })

    it('sends nothing when the provider consent is declined', async () => {
        const { aiService, setAiMode } = await load()
        setAiMode('cloud')
        mocks.hasProviderConsent.mockReturnValue(false)

        const [trend] = await callBoth(aiService)

        expect(mocks.requestProviderConsent).toHaveBeenCalled()
        expect(mocks.getTrendAnalysis).not.toHaveBeenCalled()
        expect(trend?.confidence).toBe(0.5)
    })

    it('asks the provider with consent, and falls back when it fails', async () => {
        const { aiService, setAiMode } = await load()
        setAiMode('cloud')

        const [trend, tech] = await callBoth(aiService)
        expect(mocks.getTrendAnalysis).toHaveBeenCalledTimes(2)
        expect(trend).toEqual(cloudAnswer)
        expect(tech).toEqual(cloudAnswer)

        mocks.getTrendAnalysis.mockRejectedValue(new Error('network down'))
        const [failedTrend] = await callBoth(aiService)
        expect(failedTrend?.title).toBe('Genetic Trend: autofloweringRevolution')
    })
})
