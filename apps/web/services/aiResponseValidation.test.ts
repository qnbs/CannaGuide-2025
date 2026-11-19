import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

const { mockRunRouted } = vi.hoisted(() => ({
    mockRunRouted: vi.fn(
        async <T>(
            local: () => Promise<T>,
            _cloud: () => Promise<T>,
            _fallback: () => Promise<T> | T,
        ) => local(),
    ),
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

    it('throws AiResponseValidationError when schema fails and records it locally', () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        expect(() => validateAiResponse(TestSchema, { title: '' }, 'test')).toThrow(
            AiResponseValidationError,
        )
        expect(debug).toHaveBeenCalledExactlyOnceWith('[ai-validation]', 'test', expect.anything())
        debug.mockRestore()
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

    it('records one local entry when both primary and fallback fail validation', async () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        await expect(
            runRoutedValidated(
                TestSchema,
                'mentor',
                async () => ({ title: '', content: '' }),
                async () => ({ title: '', content: '' }),
                () => ({ title: '', content: '' }),
            ),
        ).rejects.toThrow(AiResponseValidationError)

        expect(debug).toHaveBeenCalledExactlyOnceWith(
            '[ai-validation] primary and fallback failed',
            'mentor',
            expect.objectContaining({ primary: expect.anything(), fallback: expect.anything() }),
        )
        debug.mockRestore()
    })
})
