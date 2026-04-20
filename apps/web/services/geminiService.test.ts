import { describe, it, expect, vi } from 'vitest'

vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn(),
    Type: { STRING: 'STRING', NUMBER: 'NUMBER', BOOLEAN: 'BOOLEAN', ARRAY: 'ARRAY', OBJECT: 'OBJECT' },
    Modality: { TEXT: 'TEXT', IMAGE: 'IMAGE' },
    HarmCategory: { HARM_CATEGORY_HATE_SPEECH: 'HATE_SPEECH' },
    HarmBlockThreshold: { BLOCK_NONE: 'BLOCK_NONE' },
}))

vi.mock('@/services/apiKeyService', () => ({
    apiKeyService: { getApiKey: vi.fn(), setApiKey: vi.fn() },
}))

vi.mock('@/services/growLogRagService', () => ({
    growLogRagService: { retrieveContext: vi.fn() },
}))

vi.mock('@/services/aiRateLimiter', () => ({
    aiRateLimiter: { canMakeRequest: vi.fn().mockReturnValue(true), recordRequest: vi.fn(), estimateCost: vi.fn() },
}))

vi.mock('@/services/aiProviderService', () => ({
    aiProviderService: { getActiveProvider: vi.fn(), getApiKey: vi.fn() },
}))

vi.mock('@cannaguide/ai-core', () => ({
    PROVIDER_CONFIGS: new Map(),
}))

vi.mock('@/services/local-ai', () => ({
    localAiPreloadService: { preloadPriority: vi.fn() },
}))

import { isTopicRelevant } from '@/services/geminiService'

describe('isTopicRelevant', () => {
    it('returns true for short input under 20 chars', () => {
        expect(isTopicRelevant('hi there')).toBe(true)
        expect(isTopicRelevant('help')).toBe(true)
    })

    it('returns true for cannabis-related input', () => {
        expect(isTopicRelevant('How do I grow cannabis indoors with LED lights?')).toBe(true)
        expect(isTopicRelevant('What nutrients should I use during flowering stage?')).toBe(true)
        expect(isTopicRelevant('My plant has a nitrogen deficiency what should I do')).toBe(true)
    })

    it('returns true for environmental queries', () => {
        expect(isTopicRelevant('What is the ideal temperature and humidity for seedlings?')).toBe(true)
        expect(isTopicRelevant('How to calculate VPD for indoor growing')).toBe(true)
    })

    it('returns true for strain questions', () => {
        expect(isTopicRelevant('Is Blue Dream an indica or sativa hybrid strain?')).toBe(true)
        expect(isTopicRelevant('Best autoflower strains for beginners with high THC content')).toBe(true)
    })

    it('returns true for equipment questions', () => {
        expect(isTopicRelevant('What size fabric pot should I use for growing in a tent')).toBe(true)
        expect(isTopicRelevant('How to set up a carbon filter exhaust system properly')).toBe(true)
    })

    it('returns false for completely off-topic input', () => {
        expect(isTopicRelevant('Tell me about the history of the Roman Empire in detail')).toBe(false)
        expect(isTopicRelevant('Write me a poem about the ocean and the stars above')).toBe(false)
    })

    it('returns true for greetings with questions', () => {
        expect(isTopicRelevant('Hello, can you help me with my growing setup please?')).toBe(true)
    })

    it('returns true for pest and disease queries', () => {
        expect(isTopicRelevant('I found spider mites on my plant leaves what should I do about it')).toBe(true)
        expect(isTopicRelevant('How to prevent powdery mildew in indoor grow operations')).toBe(true)
    })
})
