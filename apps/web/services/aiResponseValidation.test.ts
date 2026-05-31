import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { Sentry } from '@/services/sentryService'
import {
    AiResponseValidationError,
    validateAiResponse,
    runRoutedValidated,
} from './aiResponseValidation'

vi.mock('@/services/sentryService', () => ({
    Sentry: { captureException: vi.fn() },
}))

vi.mock('@/services/localRoutingService', () => ({
    runRouted: vi.fn(
        async <T>(
            local: () => Promise<T>,
            _cloud: () => Promise<T>,
            _fallback: () => Promise<T> | T,
        ) => local(),
    ),
}))

const TestSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
})

describe('validateAiResponse', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns parsed data when schema matches', () => {
        const data = validateAiResponse(TestSchema, { title: 'Ok', content: 'Body' }, 'test')
        expect(data.title).toBe('Ok')
    })

    it('throws AiResponseValidationError when schema fails', () => {
        expect(() => validateAiResponse(TestSchema, { title: '' }, 'test')).toThrow(
            AiResponseValidationError,
        )
    })
})

describe('runRoutedValidated', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uses fallback when primary response fails validation', async () => {
        const result = await runRoutedValidated(
            TestSchema,
            'mentor',
            async () => ({ title: '', content: '' }),
            async () => ({ title: '', content: '' }),
            () => ({ title: 'Fallback', content: 'Safe' }),
        )
        expect(result.content).toBe('Safe')
    })

    it('captures Sentry once when both primary and fallback fail validation', async () => {
        await expect(
            runRoutedValidated(
                TestSchema,
                'mentor',
                async () => ({ title: '', content: '' }),
                async () => ({ title: '', content: '' }),
                () => ({ title: '', content: '' }),
            ),
        ).rejects.toThrow(AiResponseValidationError)

        expect(Sentry.captureException).toHaveBeenCalledTimes(1)
        expect(Sentry.captureException).toHaveBeenCalledWith(
            expect.any(AiResponseValidationError),
            expect.objectContaining({
                extra: expect.objectContaining({
                    context: 'mentor',
                    fallbackAlsoFailed: true,
                }),
                fingerprint: ['ai-validation-mentor'],
            }),
        )
    })
})
