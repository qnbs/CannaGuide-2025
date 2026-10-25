import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getItem: vi.fn(async () => 'test-api-key'),
    reportActualUsage: vi.fn(),
}))

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: mocks.getItem,
    },
}))

vi.mock('@/services/cryptoService', () => ({
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    isEncryptedPayload: vi.fn(() => false),
    ensureEncrypted: vi.fn(),
}))

vi.mock('@/services/aiRateLimiter', () => ({
    aiRateLimiter: {
        reportActualUsage: mocks.reportActualUsage,
    },
}))

import { aiProviderService } from '@/services/aiProviderService'

const reservation = {
    endpoint: 'getStrainTips',
    month: '2025-01',
    date: '2025-01-15',
    estimatedTokens: 1600,
}

describe('aiProviderService usage reporting', () => {
    beforeEach(() => {
        localStorage.clear()
        mocks.getItem.mockClear()
        mocks.reportActualUsage.mockClear()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it.each([
        ['openai', { choices: [{ message: { content: 'answer' } }], usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 } }],
        ['anthropic', { content: [{ type: 'text', text: 'answer' }], usage: { input_tokens: 3, output_tokens: 4 } }],
    ] as const)('reports usage against the reservation endpoint for %s', async (provider, payload) => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => payload,
            }),
        )

        await expect(
            aiProviderService.generateTextWithProvider(
                provider,
                'system prompt',
                'user prompt',
                false,
                128,
                reservation,
            ),
        ).resolves.toBe('answer')

        expect(mocks.reportActualUsage).toHaveBeenCalledWith(
            reservation.endpoint,
            expect.objectContaining({ totalTokens: 7 }),
            expect.any(Object),
            reservation,
        )
    })
})
