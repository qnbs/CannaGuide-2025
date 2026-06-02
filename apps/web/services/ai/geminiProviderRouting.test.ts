import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    isAlternateProvider,
    shouldUseLocalFallback,
} from '@/services/ai/geminiProviderRouting'

const isReady = vi.fn(() => false)
const getActiveProviderId = vi.fn(() => 'gemini')

vi.mock('@/services/local-ai', () => ({
    localAiPreloadService: {
        isReady: () => isReady(),
    },
}))

vi.mock('@/services/aiProviderService', () => ({
    aiProviderService: {
        getActiveProviderId: () => getActiveProviderId(),
    },
}))

describe('geminiProviderRouting', () => {
    beforeEach(() => {
        isReady.mockReturnValue(false)
        getActiveProviderId.mockReturnValue('gemini')
    })

    it('shouldUseLocalFallback when offline', () => {
        vi.stubGlobal('navigator', { onLine: false })
        expect(shouldUseLocalFallback(new Error('anything'))).toBe(true)
        vi.unstubAllGlobals()
    })

    it('shouldUseLocalFallback for missing API key when local AI is ready', () => {
        isReady.mockReturnValue(true)
        expect(shouldUseLocalFallback(new Error('ai.error.missingApiKey'))).toBe(true)
    })

    it('shouldUseLocalFallback returns false when local AI is not ready', () => {
        expect(shouldUseLocalFallback(new Error('ai.error.missingApiKey'))).toBe(false)
    })

    it('isAlternateProvider reflects active provider', () => {
        expect(isAlternateProvider()).toBe(false)
        getActiveProviderId.mockReturnValue('openai')
        expect(isAlternateProvider()).toBe(true)
    })
})
