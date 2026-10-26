import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    generateGeminiPlainText,
    isAlternateProvider,
    shouldUseLocalFallback,
} from '@/services/ai/geminiProviderRouting'

const mocks = vi.hoisted(() => {
    const reservation = {
        endpoint: 'getStrainTips',
        month: '2025-01',
        date: '2025-01-31',
        estimatedTokens: 1600,
    }
    return {
        isReady: vi.fn(() => false),
        getActiveProviderId: vi.fn(() => 'gemini'),
        reservation,
        acquireSlot: vi.fn(() => reservation),
        createGeminiClient: vi.fn(async () => ({})),
        generateGeminiTextStreamed: vi.fn(async () => 'answer'),
        getEducationalUseOnlyInstruction: vi.fn(() => 'education only'),
        createLocalizedPrompt: vi.fn((prompt: string) => prompt),
        truncatePromptForModel: vi.fn((prompt: string) => prompt),
        rethrowKnownGeminiError: vi.fn((error: unknown) => {
            throw error
        }),
    }
})

vi.mock('@/services/local-ai', () => ({
    localAiPreloadService: {
        isReady: () => mocks.isReady(),
    },
}))

vi.mock('@/services/aiProviderService', () => ({
    aiProviderService: {
        getActiveProviderId: () => mocks.getActiveProviderId(),
    },
}))

vi.mock('@/services/aiRateLimiter', () => ({
    aiRateLimiter: {
        acquireSlot: mocks.acquireSlot,
    },
}))

vi.mock('@/services/ai/geminiRuntime', () => ({
    createGeminiClient: mocks.createGeminiClient,
    generateGeminiTextStreamed: mocks.generateGeminiTextStreamed,
    getEducationalUseOnlyInstruction: mocks.getEducationalUseOnlyInstruction,
    rethrowKnownGeminiError: mocks.rethrowKnownGeminiError,
}))

vi.mock('@/services/ai/geminiPromptUtils', () => ({
    createLocalizedPrompt: mocks.createLocalizedPrompt,
    MAX_OUTPUT_TOKENS_TEXT: 900,
    truncatePromptForModel: mocks.truncatePromptForModel,
}))

describe('geminiProviderRouting', () => {
    beforeEach(() => {
        mocks.isReady.mockReturnValue(false)
        mocks.getActiveProviderId.mockReturnValue('gemini')
        mocks.acquireSlot.mockReset()
        mocks.createGeminiClient.mockClear()
        mocks.generateGeminiTextStreamed.mockClear()
    })

    it('shouldUseLocalFallback when offline', () => {
        vi.stubGlobal('navigator', { onLine: false })
        expect(shouldUseLocalFallback(new Error('anything'))).toBe(true)
        vi.unstubAllGlobals()
    })

    it('shouldUseLocalFallback for missing API key when local AI is ready', () => {
        mocks.isReady.mockReturnValue(true)
        expect(shouldUseLocalFallback(new Error('ai.error.missingApiKey'))).toBe(true)
    })

    it('shouldUseLocalFallback returns false when local AI is not ready', () => {
        expect(shouldUseLocalFallback(new Error('ai.error.missingApiKey'))).toBe(false)
    })

    it('isAlternateProvider reflects active provider', () => {
        expect(isAlternateProvider()).toBe(false)
        mocks.getActiveProviderId.mockReturnValue('openai')
        expect(isAlternateProvider()).toBe(true)
    })

    it('passes the acquired reservation into the Gemini plain-text stream', async () => {
        mocks.acquireSlot.mockReturnValue(mocks.reservation)

        await expect(generateGeminiPlainText('prompt', 'en', 'getStrainTips')).resolves.toBe(
            'answer',
        )

        expect(mocks.generateGeminiTextStreamed).toHaveBeenCalledWith(
            expect.objectContaining({ reservation: mocks.reservation }),
        )
    })
})
