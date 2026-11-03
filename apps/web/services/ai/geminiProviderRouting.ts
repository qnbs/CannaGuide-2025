import {
    createGeminiClient,
    generateGeminiTextStreamed,
    getEducationalUseOnlyInstruction,
    rethrowKnownGeminiError,
} from '@/services/ai/geminiRuntime'
import {
    createLocalizedPrompt,
    MAX_OUTPUT_TOKENS_TEXT,
    truncatePromptForModel,
} from '@/services/ai/geminiPromptUtils'
import type { Language } from '@/types'
import { aiRateLimiter } from '@/services/aiRateLimiter'
import { aiProviderService, type AiProvider } from '@/services/aiProviderService'
import { localAiPreloadService } from '@/services/local-ai'
import { EgressBlockedError } from '@/services/net/egress'

export const getLocalAiService = async () => {
    const module = await import('@/services/local-ai')
    return module.localAiService
}

export type LocalAiService = Awaited<ReturnType<typeof getLocalAiService>>

/** No key, no network, or Local-Only Mode refused the request (services/net/egress.ts). */
const isMissingKeyOrNetworkBlock = (error: unknown): boolean => {
    if (error instanceof EgressBlockedError) return true
    return (
        error instanceof Error &&
        (error.message === 'ai.error.missingApiKey' || error.message.includes('NetworkError'))
    )
}

export const shouldUseLocalFallback = (error: unknown): boolean => {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    if (offline) return true

    if (!localAiPreloadService.isReady()) return false

    return isMissingKeyOrNetworkBlock(error)
}

export const getActiveProvider = (): AiProvider => {
    return aiProviderService.getActiveProviderId()
}

export const isAlternateProvider = (): boolean => {
    return getActiveProvider() !== 'gemini'
}

export const generateViaAlternateProvider = async (
    endpoint: string,
    systemPrompt: string,
    userPrompt: string,
    jsonMode: boolean,
    maxTokens: number,
): Promise<string> => {
    const reservation = aiRateLimiter.acquireSlot(endpoint)
    const provider = getActiveProvider()
    return aiProviderService.generateTextWithProvider(
        provider,
        systemPrompt,
        userPrompt,
        jsonMode,
        maxTokens,
        reservation,
    )
}

export const generateGeminiPlainText = async (
    prompt: string,
    lang: Language,
    endpoint = 'generateText',
): Promise<string> => {
    try {
        const reservation = aiRateLimiter.acquireSlot(endpoint)
        const ai = await createGeminiClient()
        const localizedPrompt = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
            lang,
        )
        const guardedPrompt = truncatePromptForModel(localizedPrompt)

        return await generateGeminiTextStreamed({
            ai,
            model: 'gemini-2.5-flash',
            contents: guardedPrompt,
            config: {
                maxOutputTokens: MAX_OUTPUT_TOKENS_TEXT,
            },
            reservation,
        })
    } catch (error) {
        console.debug('Gemini API Error:', error)
        return rethrowKnownGeminiError(error, 'ai.error.generic')
    }
}

export const generateTextWithProviderRouting = async (
    prompt: string,
    lang: Language,
    endpoint = 'generateText',
): Promise<string> => {
    if (isAlternateProvider()) {
        return generateViaAlternateProvider(
            endpoint,
            getEducationalUseOnlyInstruction(lang),
            prompt,
            false,
            MAX_OUTPUT_TOKENS_TEXT,
        )
    }
    return generateGeminiPlainText(prompt, lang, endpoint)
}

export const runWithLocalFallback = async <T>(
    task: () => Promise<T>,
    fallbackTask: (localAiService: LocalAiService) => Promise<T>,
): Promise<T> => {
    try {
        return await task()
    } catch (error) {
        if (shouldUseLocalFallback(error)) {
            const localAiService = await getLocalAiService()
            return fallbackTask(localAiService)
        }
        throw error
    }
}
