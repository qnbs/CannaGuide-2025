import { beforeEach, describe, expect, it, vi } from 'vitest'

const reportActualUsage = vi.hoisted(() => vi.fn())

vi.mock('@google/genai', () => ({
    GoogleGenAI: class {},
    HarmCategory: { HARM_CATEGORY_DANGEROUS_CONTENT: 'dangerous-content' },
    HarmBlockThreshold: { BLOCK_NONE: 'block-none' },
}))

vi.mock('dompurify', () => ({
    default: { sanitize: (value: string) => value },
}))

vi.mock('@/services/apiKeyService', () => ({
    apiKeyService: { getApiKey: vi.fn() },
}))

vi.mock('@/services/aiRateLimiter', () => ({
    aiRateLimiter: { reportActualUsage },
}))

vi.mock('@cannaguide/ai-core', () => ({
    PROVIDER_CONFIGS: {
        gemini: {
            pricing: { inputPer1MTokens: 1, outputPer1MTokens: 2 },
        },
    },
}))

import { generateGeminiTextStreamed } from '@/services/ai/geminiRuntime'

type GeminiClient = Parameters<typeof generateGeminiTextStreamed>[0]['ai']

const reservation = {
    endpoint: 'getStrainTips',
    month: '2025-01',
    date: '2025-01-31',
    estimatedTokens: 1600,
}

describe('generateGeminiTextStreamed usage reconciliation', () => {
    beforeEach(() => {
        reportActualUsage.mockClear()
    })

    it('reports usage metadata collected from the completed stream once', async () => {
        const chunks = [
            { text: 'hello ' },
            {
                text: 'world',
                usageMetadata: {
                    promptTokenCount: 20,
                    candidatesTokenCount: 8,
                    totalTokenCount: 28,
                },
            },
        ]
        const ai = {
            models: {
                generateContentStream: vi.fn(async () => ({
                    async *[Symbol.asyncIterator]() {
                        yield* chunks
                    },
                })),
            },
        } as unknown as GeminiClient

        await expect(
            generateGeminiTextStreamed({
                ai,
                model: 'gemini-test',
                contents: 'prompt',
                reservation,
            }),
        ).resolves.toBe('hello world')

        expect(reportActualUsage).toHaveBeenCalledTimes(1)
        expect(reportActualUsage).toHaveBeenCalledWith(
            reservation.endpoint,
            { promptTokens: 20, completionTokens: 8, totalTokens: 28 },
            { inputPer1MTokens: 1, outputPer1MTokens: 2 },
            reservation,
        )
    })

    it('reports usage from the non-streaming fallback response once', async () => {
        const ai = {
            models: {
                generateContent: vi.fn(async () => ({
                    text: 'fallback answer',
                    usageMetadata: {
                        promptTokenCount: 12,
                        candidatesTokenCount: 6,
                        totalTokenCount: 18,
                    },
                })),
            },
        } as unknown as GeminiClient

        await expect(
            generateGeminiTextStreamed({
                ai,
                model: 'gemini-test',
                contents: 'prompt',
                reservation,
            }),
        ).resolves.toBe('fallback answer')

        expect(reportActualUsage).toHaveBeenCalledTimes(1)
        expect(reportActualUsage).toHaveBeenCalledWith(
            reservation.endpoint,
            { promptTokens: 12, completionTokens: 6, totalTokens: 18 },
            { inputPer1MTokens: 1, outputPer1MTokens: 2 },
            reservation,
        )
    })
})
