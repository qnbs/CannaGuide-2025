import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

const { mockCaptureException, mockRunRouted } = vi.hoisted(() => ({
    mockCaptureException: vi.fn(),
    mockRunRouted: vi.fn(
        async <T>(
            local: () => Promise<T>,
            _cloud: () => Promise<T>,
            _fallback: () => Promise<T> | T,
        ) => local(),
    ),
}))

vi.mock('@/services/sentryService', () => ({
    Sentry: { captureException: mockCaptureException },
}))

vi.mock('@/services/localRoutingService', () => ({
    runRouted: mockRunRouted,
}))

const TestSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
})

describe('validateAiResponse', () => {
    let validateAiResponse: typeof import('./aiResponseValidation').validateAiResponse
    let AiResponseValidationError: typeof import('./aiResponseValidation').AiResponseValidationError

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()
        const mod = await import('./aiResponseValidation')
        validateAiResponse = mod.validateAiResponse
        AiResponseValidationError = mod.AiResponseValidationError
    })

    it('returns parsed data when schema matches', () => {
        const data = validateAiResponse(TestSchema, { title: 'Ok', content: 'Body' }, 'test')
        expect(data.title).toBe('Ok')
    })

    it('throws AiResponseValidationError when schema fails', () => {
        expect(() => validateAiResponse(TestSchema, { title: '' }, 'test')).toThrow(
            AiResponseValidationError,
        )
        expect(mockCaptureException).toHaveBeenCalledTimes(1)
    })
})

describe('runRoutedValidated', () => {
    let runRoutedValidated: typeof import('./aiResponseValidation').runRoutedValidated
    let AiResponseValidationError: typeof import('./aiResponseValidation').AiResponseValidationError

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()
        const mod = await import('./aiResponseValidation')
        runRoutedValidated = mod.runRoutedValidated
        AiResponseValidationError = mod.AiResponseValidationError
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

        expect(mockCaptureException).toHaveBeenCalledTimes(1)
        expect(mockCaptureException).toHaveBeenCalledWith(
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
