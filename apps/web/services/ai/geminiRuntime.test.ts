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

import {
    createGeminiClient,
    generateGeminiTextStreamed,
    generateWithGeminiFallback,
    rethrowKnownGeminiError,
} from '@/services/ai/geminiRuntime'
import { apiKeyService } from '@/services/apiKeyService'
import { setLocalOnlyMode } from '@/services/localOnlyModeService'
import { EgressBlockedError } from '@/services/net/egress'

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

describe('createGeminiClient (the request boundary of every Gemini SDK call)', () => {
    beforeEach(() => {
        setLocalOnlyMode(false)
        vi.mocked(apiKeyService.getApiKey).mockReset()
    })

    it('creates a client when Local-Only Mode is off', async () => {
        vi.mocked(apiKeyService.getApiKey).mockResolvedValue('key')
        await expect(createGeminiClient()).resolves.toBeDefined()
    })

    it('refuses in Local-Only Mode', async () => {
        vi.mocked(apiKeyService.getApiKey).mockResolvedValue('key')
        setLocalOnlyMode(true)
        await expect(createGeminiClient()).rejects.toBeInstanceOf(EgressBlockedError)
        setLocalOnlyMode(false)
    })

    it('refuses when Local-Only Mode is switched on while the key is read', async () => {
        vi.mocked(apiKeyService.getApiKey).mockImplementation(async () => {
            setLocalOnlyMode(true)
            return 'key'
        })
        await expect(createGeminiClient()).rejects.toBeInstanceOf(EgressBlockedError)
        setLocalOnlyMode(false)
    })
})

describe('Local-Only refusals of Gemini requests', () => {
    beforeEach(() => setLocalOnlyMode(false))

    it('keeps an EgressBlockedError instead of replacing it with a generic error key', () => {
        const refusal = new EgressBlockedError('https://generativelanguage.googleapis.com')
        expect(() => rethrowKnownGeminiError(refusal, 'ai.error.generic')).toThrow(refusal)
        expect(() => rethrowKnownGeminiError(new Error('boom'), 'ai.error.generic')).toThrow(
            'ai.error.generic',
        )
    })

    it('checks the gate again before the fallback model retry', async () => {
        const generateContent = vi.fn().mockImplementationOnce(async () => {
            // Local-Only is switched on while the primary request fails.
            setLocalOnlyMode(true)
            throw new Error('overloaded')
        })
        const ai = { models: { generateContent } } as unknown as Parameters<
            typeof generateWithGeminiFallback
        >[0]['ai']

        await expect(
            generateWithGeminiFallback({
                ai,
                model: 'gemini-2.5-pro',
                contents: 'x',
                fallbackModel: 'gemini-2.5-flash',
            }),
        ).rejects.toBeInstanceOf(EgressBlockedError)
        expect(generateContent).toHaveBeenCalledTimes(1)
        setLocalOnlyMode(false)
    })

    it('still retries with the fallback model when Local-Only stays off', async () => {
        const generateContent = vi
            .fn()
            .mockRejectedValueOnce(new Error('overloaded'))
            .mockResolvedValueOnce({ text: 'ok' })
        const ai = { models: { generateContent } } as unknown as Parameters<
            typeof generateWithGeminiFallback
        >[0]['ai']

        await expect(
            generateWithGeminiFallback({
                ai,
                model: 'gemini-2.5-pro',
                contents: 'x',
                fallbackModel: 'gemini-2.5-flash',
            }),
        ).resolves.toEqual({ text: 'ok' })
        expect(generateContent).toHaveBeenCalledTimes(2)
    })
})

describe('the request-time gate of every Gemini request', () => {
    beforeEach(() => setLocalOnlyMode(false))

    it('refuses the first request in Local-Only Mode, after the client was created', async () => {
        const generateContent = vi.fn()
        const ai = { models: { generateContent } } as unknown as Parameters<
            typeof generateWithGeminiFallback
        >[0]['ai']
        setLocalOnlyMode(true)
        await expect(
            generateWithGeminiFallback({ ai, model: 'gemini-2.5-flash', contents: 'x' }),
        ).rejects.toBeInstanceOf(EgressBlockedError)
        expect(generateContent).not.toHaveBeenCalled()
        setLocalOnlyMode(false)
    })

    it('refuses a streamed request in Local-Only Mode', async () => {
        const generateContentStream = vi.fn()
        const ai = {
            models: { generateContent: vi.fn(), generateContentStream },
        } as unknown as GeminiClient
        setLocalOnlyMode(true)
        await expect(
            generateGeminiTextStreamed({
                ai,
                model: 'gemini-2.5-flash',
                contents: 'x',
                reservation,
            }),
        ).rejects.toBeInstanceOf(EgressBlockedError)
        expect(generateContentStream).not.toHaveBeenCalled()
        setLocalOnlyMode(false)
    })
})
