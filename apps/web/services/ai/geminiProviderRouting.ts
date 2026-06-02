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

export const getLocalAiService = async () => {
    const module = await import('@/services/local-ai')
    return module.localAiService
}

export type LocalAiService = Awaited<ReturnType<typeof getLocalAiService>>

export function shouldUseLocalFallback(error: unknown): boolean {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    if (offline) return true

    if (!localAiPreloadService.isReady()) return false

    return (
        error instanceof Error &&
        (error.message === 'ai.error.missingApiKey' || error.message.includes('NetworkError'))
    )
}

export function getActiveProvider(): AiProvider {
    return aiProviderService.getActiveProviderId()
}

export function isAlternateProvider(): boolean {
    return getActiveProvider() !== 'gemini'
}

export async function generateViaAlternateProvider(
    endpoint: string,
    systemPrompt: string,
    userPrompt: string,
    jsonMode: boolean,
    maxTokens: number,
): Promise<string> {
    aiRateLimiter.acquireSlot(endpoint)
    const provider = getActiveProvider()
    return aiProviderService.generateTextWithProvider(
        provider,
        systemPrompt,
        userPrompt,
        jsonMode,
        maxTokens,
    )
}

export async function generateGeminiPlainText(
    prompt: string,
    lang: Language,
    endpoint = 'generateText',
): Promise<string> {
    try {
        aiRateLimiter.acquireSlot(endpoint)
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
        })
    } catch (error) {
        console.debug('Gemini API Error:', error)
        return rethrowKnownGeminiError(error, 'ai.error.generic')
    }
}

export async function generateTextWithProviderRouting(
    prompt: string,
    lang: Language,
    endpoint = 'generateText',
): Promise<string> {
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

export async function runWithLocalFallback<T>(
    task: () => Promise<T>,
    fallbackTask: (localAiService: LocalAiService) => Promise<T>,
): Promise<T> {
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
