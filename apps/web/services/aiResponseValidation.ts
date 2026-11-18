import type { z } from 'zod'
import { runRouted } from '@/services/localRoutingService'

export class AiResponseValidationError extends Error {
    readonly context: string

    constructor(message: string, context: string) {
        super(message)
        this.name = 'AiResponseValidationError'
        this.context = context
    }
}

/**
 * Validates structured AI output before it reaches Redux or persistence.
 * Records schema failures in the debug console without storing invalid payloads.
 */
export const validateAiResponse = <T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context: string,
): T => {
    const result = schema.safeParse(data)
    if (result.success) {
        return result.data
    }

    const error = new AiResponseValidationError(
        `AI response validation failed (${context})`,
        context,
    )
    console.debug('[ai-validation]', context, result.error.format())
    throw error
}

/**
 * Routes cloud/local AI calls and validates the payload on every path (including local ML).
 */
export const runRoutedValidated = async <T>(
    schema: z.ZodSchema<T>,
    context: string,
    localCall: () => Promise<T>,
    cloudCall: () => Promise<T>,
    fallbackCall: () => Promise<T> | T,
): Promise<T> => {
    const raw = await runRouted(localCall, cloudCall, fallbackCall)
    const primaryResult = schema.safeParse(raw)
    if (primaryResult.success) {
        return primaryResult.data
    }

    const fallback = await Promise.resolve(fallbackCall())
    const fallbackResult = schema.safeParse(fallback)
    if (fallbackResult.success) {
        return fallbackResult.data
    }

    console.debug('[ai-validation] primary and fallback failed', context, {
        primary: primaryResult.error.format(),
        fallback: fallbackResult.error.format(),
    })
    throw new AiResponseValidationError(`AI validation failed on all paths (${context})`, context)
}
