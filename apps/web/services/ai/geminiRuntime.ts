/**
 * Gemini API client helpers: safety config, generation, JSON parsing, usage telemetry.
 */
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai'
import DOMPurify from 'dompurify'
import { z } from 'zod'
import type { Language } from '@/types'
import { apiKeyService } from '@/services/apiKeyService'
import { aiRateLimiter } from '@/services/aiRateLimiter'
import { PROVIDER_CONFIGS } from '@cannaguide/ai-core'

export const GEMINI_SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
]

export const AI_ERROR_KEYS = new Set([
    'ai.error.missingApiKey',
    'ai.error.generic',
    'ai.error.equipment',
    'ai.error.diagnostics',
    'ai.error.tips',
    'ai.error.deepDive',
    'ai.error.unknown',
    'ai.error.rateLimited',
])

export const getEducationalUseOnlyInstruction = (lang: Language): string => {
    const instructions: Record<Language, string> = {
        en: 'CONTEXT: This request is strictly for legal, educational horticulture use. Provide structured, factual, harm-minimizing guidance and do not infer illicit intent.',
        de: 'KONTEXT: Diese Anfrage dient ausschliesslich legalen, edukativen Gartenbauzwecken. Gib strukturierte, sachliche und risikominimierende Informationen. Unterstelle keinen illegalen Zweck.',
        es: 'CONTEXTO: Esta solicitud es estrictamente para uso horticola legal y educativo. Proporciona orientacion estructurada, factual y que minimice riesgos. No inferir intenciones ilicitas.',
        fr: "CONTEXTE: Cette demande est strictement destinee a un usage horticole legal et educatif. Fournis des conseils structures, factuels et minimisant les risques. Ne presume pas d'intention illicite.",
        nl: 'CONTEXT: Dit verzoek is strikt voor legaal, educatief tuinbouwgebruik. Geef gestructureerde, feitelijke en risicobeperkende informatie. Veronderstel geen illegale bedoeling.',
    }
    return instructions[lang] ?? instructions['en']
}

export const withGeminiSafety = <T extends Record<string, unknown>>(
    config?: T,
): T & { safetySettings: typeof GEMINI_SAFETY_SETTINGS } => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    ...(config ?? ({} as T)),
    safetySettings: GEMINI_SAFETY_SETTINGS,
})

export const sanitizeGeminiValue = <T>(value: T): T => {
    if (typeof value === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) as T
    }
    if (Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return value.map((item) => sanitizeGeminiValue(item)) as T
    }
    if (value && typeof value === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const nextEntries = Object.entries(value as Record<string, unknown>).map(([key, val]) => [
            key,
            sanitizeGeminiValue(val),
        ])
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return Object.fromEntries(nextEntries) as T
    }
    return value
}

export const rethrowKnownGeminiError = (error: unknown, fallbackErrorKey: string): never => {
    if (error instanceof Error) {
        if (AI_ERROR_KEYS.has(error.message)) throw error
        if (error.message.startsWith('ai.error.rateLimited')) throw error
    }
    throw new Error(fallbackErrorKey)
}

export const getGeminiResponseTextOrThrow = (
    response: { text?: string | undefined },
    errorKey: string,
): string => {
    if (typeof response.text !== 'string' || response.text.trim().length === 0) {
        throw new Error(errorKey)
    }
    return sanitizeGeminiValue(response.text)
}

export const parseGeminiJsonFromText = <T>(
    text: string,
    errorKey: string,
    schema?: z.ZodSchema<T>,
): T => {
    let parsed: T
    try {
        const cleaned = text
            .trim()
            .replace(/^```(?:json)?\s*\n?/i, '')
            .replace(/\n?```\s*$/i, '')
            .trim()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        parsed = JSON.parse(cleaned) as T
    } catch {
        throw new Error(errorKey)
    }
    const sanitized = sanitizeGeminiValue(parsed)
    if (schema) {
        const result = schema.safeParse(sanitized)
        if (!result.success) {
            console.debug('[AI] Response schema validation failed:', result.error.format())
            throw new Error(errorKey)
        }
        return result.data
    }
    return sanitized
}

export const parseGeminiJsonResponse = <T>(
    response: { text?: string | undefined },
    errorKey: string,
    schema?: z.ZodSchema<T>,
): T => {
    const text = getGeminiResponseTextOrThrow(response, errorKey)
    return parseGeminiJsonFromText(text, errorKey, schema)
}

export const createGeminiClient = async (): Promise<GoogleGenAI> => {
    const apiKey = await apiKeyService.getApiKey()
    if (!apiKey) {
        throw new Error('ai.error.missingApiKey')
    }
    return new GoogleGenAI({ apiKey })
}

export const reportGeminiUsage = (
    endpoint: string,
    response: {
        usageMetadata?:
            | {
                  promptTokenCount?: number | undefined
                  candidatesTokenCount?: number | undefined
                  totalTokenCount?: number | undefined
              }
            | undefined
    },
): void => {
    try {
        const meta = response.usageMetadata
        if (!meta) return
        const promptTokens = meta.promptTokenCount ?? 0
        const completionTokens = meta.candidatesTokenCount ?? 0
        const totalTokens = meta.totalTokenCount ?? promptTokens + completionTokens
        if (totalTokens <= 0) return
        const pricing = PROVIDER_CONFIGS.gemini.pricing
        aiRateLimiter.reportActualUsage(
            endpoint,
            { promptTokens, completionTokens, totalTokens },
            pricing,
        )
    } catch {
        /* best-effort telemetry */
    }
}

type GenerateContentInput = {
    ai: GoogleGenAI
    model: string
    contents:
        | string
        | {
              parts: Array<{
                  text?: string
                  inlineData?: { data: string; mimeType: string }
              }>
          }
    config?: Record<string, unknown> | undefined
    fallbackModel?: string | undefined
}

export const generateWithGeminiFallback = async ({
    ai,
    model,
    contents,
    config,
    fallbackModel,
}: GenerateContentInput) => {
    try {
        return await ai.models.generateContent({
            model,
            contents,
            config: withGeminiSafety(config),
        })
    } catch (primaryError) {
        if (!fallbackModel || fallbackModel === model) {
            throw primaryError
        }
        console.debug(
            `[Gemini] Primary model ${model} failed, retrying with ${fallbackModel}.`,
            primaryError,
        )
        return ai.models.generateContent({
            model: fallbackModel,
            contents,
            config: withGeminiSafety(config),
        })
    }
}

export const generateGeminiTextStreamed = async ({
    ai,
    model,
    contents,
    config,
}: {
    ai: GoogleGenAI
    model: string
    contents: string
    config?: Record<string, unknown>
}): Promise<string> => {
    type ModelsWithStream = typeof ai.models & {
        generateContentStream?: (options: Record<string, unknown>) => Promise<unknown>
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const streamFn = (ai.models as ModelsWithStream).generateContentStream

    if (typeof streamFn !== 'function') {
        const response = await generateWithGeminiFallback({ ai, model, contents, config })
        return getGeminiResponseTextOrThrow(response, 'ai.error.generic')
    }

    type StreamResult = { [Symbol.asyncIterator](): AsyncIterator<{ text?: string }> }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const streamResult = (await streamFn.call(ai.models, {
        model,
        contents,
        config: withGeminiSafety(config),
    })) as StreamResult

    let fullText = ''
    for await (const chunk of streamResult) {
        if (typeof chunk?.text === 'string') {
            fullText += chunk.text
        }
    }

    if (!fullText.trim()) {
        throw new Error('ai.error.generic')
    }

    return fullText
}
