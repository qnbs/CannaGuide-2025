import type { z } from 'zod'
import { Sentry } from '@/services/sentryService'
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
 * Logs schema failures to Sentry without storing invalid payloads.
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
    Sentry.captureException(error, {
        extra: { zodError: result.error.format() },
    })
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
    try {
        return validateAiResponse(schema, raw, context)
    } catch {
        const fallback = await Promise.resolve(fallbackCall())
        return validateAiResponse(schema, fallback, `${context}:fallback`)
    }
}
