import { Modality } from '@google/genai'
import {
    buildDiagnosePlantContext,
    buildGardenPlantSummaries,
    buildGrowLogRagPrompt,
    buildLocalizedEducationalPrompt,
    buildMentorPrompt,
    buildNutrientPlannerPrompt,
    buildPlantJournalContext,
    buildStrainTipsLocalizedPrompt,
    mapDynamicLoadingMessages,
    type NutrientRecommendationInput,
} from '@/services/ai/geminiContextBuilders'
import {
    createCompactPlantSnapshot,
    createLocalizedPrompt,
    MAX_OUTPUT_TOKENS_JSON,
    MAX_OUTPUT_TOKENS_TEXT,
    truncatePromptForModel,
} from '@/services/ai/geminiPromptUtils'
import {
    buildDeepDiveResponseSchema,
    buildDiagnosePlantResponseSchema,
    buildEquipmentRecommendationResponseSchema,
    buildMentorResponseSchema,
    buildStrainTipsResponseSchema,
} from '@/services/ai/geminiResponseSchemas'
import {
    createGeminiClient,
    generateGeminiTextStreamed,
    generateWithGeminiFallback,
    getEducationalUseOnlyInstruction,
    parseGeminiJsonFromText,
    parseGeminiJsonResponse,
    reportGeminiUsage,
    rethrowKnownGeminiError,
} from '@/services/ai/geminiRuntime'
import {
    buildStrainImagePrompt,
    extractGeneratedImageDataOrThrow,
    resolveStrainImageStyle,
} from '@/services/ai/geminiStrainImagePrompts'

export { isTopicRelevant, sanitizeForPrompt } from '@/services/ai/safetyPipeline'
import {
    Plant,
    Recommendation,
    Strain,
    PlantDiagnosisResponse,
    AIResponse,
    StructuredGrowTips,
    DeepDiveGuide,
    MentorMessage,
    Language,
} from '@/types'
import {
    PlantDiagnosisResponseSchema,
    StructuredGrowTipsSchema,
    DeepDiveGuideSchema,
    MentorMessageContentSchema,
    RecommendationSchema,
} from '@/types/schemas'
import { z } from 'zod'
import { getT } from '@/i18n'
import { aiRateLimiter } from '@/services/aiRateLimiter'
import { aiProviderService, type AiProvider } from '@/services/aiProviderService'
import { localAiPreloadService } from '@/services/local-ai'

export type { ImageStyle, ImageCriteria } from '@/types/aiProvider'
import type { BaseAIProvider, ImageStyle, ImageCriteria } from '@/types/aiProvider'

const getLocalAiService = async () => {
    const module = await import('@/services/local-ai')
    return module.localAiService
}

type LocalAiService = Awaited<ReturnType<typeof getLocalAiService>>

class GeminiService implements BaseAIProvider {
    readonly id = 'gemini' as const

    private shouldUseLocalFallback(error: unknown): boolean {
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false
        if (offline) return true

        // Only fall back to local AI if models are actually pre-loaded
        if (!localAiPreloadService.isReady()) return false

        return (
            error instanceof Error &&
            (error.message === 'ai.error.missingApiKey' || error.message.includes('NetworkError'))
        )
    }

    /** Resolve the active provider. Returns 'gemini' or an alternative. */
    private getActiveProvider(): AiProvider {
        return aiProviderService.getActiveProviderId()
    }

    /** Check if we should route through a non-Gemini provider for text/JSON calls. */
    private isAlternateProvider(): boolean {
        return this.getActiveProvider() !== 'gemini'
    }

    /**
     * Generate text/JSON via the active non-Gemini provider.
     * Handles rate limiting and cost tracking.
     */
    private async generateViaAlternateProvider(
        endpoint: string,
        systemPrompt: string,
        userPrompt: string,
        jsonMode: boolean,
        maxTokens: number,
    ): Promise<string> {
        aiRateLimiter.acquireSlot(endpoint)
        const provider = this.getActiveProvider()
        return aiProviderService.generateTextWithProvider(
            provider,
            systemPrompt,
            userPrompt,
            jsonMode,
            maxTokens,
        )
    }

    private async generateText(
        prompt: string,
        lang: Language,
        endpoint = 'generateText',
    ): Promise<string> {
        // Route to alternate provider if configured
        if (this.isAlternateProvider()) {
            return this.generateViaAlternateProvider(
                endpoint,
                getEducationalUseOnlyInstruction(lang),
                prompt,
                false,
                MAX_OUTPUT_TOKENS_TEXT,
            )
        }

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

    private async getEquipmentRecommendationFromAlternateProvider(
        prompt: string,
        lang: Language,
    ): Promise<Recommendation> {
        const t = getT()
        const systemPrompt = `${getEducationalUseOnlyInstruction(lang)}\n\n${t('ai.prompts.equipmentSystemInstruction')}`
        const jsonInstruction =
            'Respond ONLY with valid JSON matching this exact structure: { "tent": {"name":"...","price":0,"rationale":"..."}, "light": {"name":"...","price":0,"rationale":"...","watts":0}, "ventilation": {"name":"...","price":0,"rationale":"..."}, "circulationFan": {"name":"...","price":0,"rationale":"..."}, "pots": {"name":"...","price":0,"rationale":"..."}, "soil": {"name":"...","price":0,"rationale":"..."}, "nutrients": {"name":"...","price":0,"rationale":"..."}, "extra": {"name":"...","price":0,"rationale":"..."}, "proTip": "..." }'

        const text = await this.generateViaAlternateProvider(
            'getEquipmentRecommendation',
            systemPrompt,
            `${createLocalizedPrompt(prompt, lang)}\n\n${jsonInstruction}`,
            true,
            MAX_OUTPUT_TOKENS_JSON,
        )

        return parseGeminiJsonFromText<Recommendation>(
            text,
            'ai.error.equipment',
            RecommendationSchema,
        )
    }

    private async getEquipmentRecommendationFromGemini(
        prompt: string,
        lang: Language,
    ): Promise<Recommendation> {
        const t = getT()
        aiRateLimiter.acquireSlot('getEquipmentRecommendation')
        const ai = await createGeminiClient()
        const systemInstruction = t('ai.prompts.equipmentSystemInstruction')
        const localizedSystemInstruction = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${systemInstruction}`,
            lang,
        )

        const response = await generateWithGeminiFallback({
            ai,
            model: 'gemini-2.5-flash',
            contents: truncatePromptForModel(
                `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
            ),
            config: {
                systemInstruction: localizedSystemInstruction,
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: buildEquipmentRecommendationResponseSchema(),
            },
        })
        reportGeminiUsage('getEquipmentRecommendation', response)

        return parseGeminiJsonResponse<Recommendation>(
            response,
            'ai.error.equipment',
            RecommendationSchema,
        )
    }

    private async getMentorResponseFromAlternateProvider(
        prompt: string,
        lang: Language,
    ): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT()
        const systemPrompt = `${getEducationalUseOnlyInstruction(lang)}\n\n${t('ai.prompts.mentor.systemInstruction')}`
        const jsonInstruction =
            'Respond ONLY with valid JSON matching: { "title": "...", "content": "...", "uiHighlights": [] }'
        const text = await this.generateViaAlternateProvider(
            'getMentorResponse',
            systemPrompt,
            `${createLocalizedPrompt(`${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`, lang)}\n\n${jsonInstruction}`,
            true,
            MAX_OUTPUT_TOKENS_JSON,
        )

        return parseGeminiJsonFromText<Omit<MentorMessage, 'role'>>(
            text,
            'ai.error.generic',
            MentorMessageContentSchema as z.ZodSchema<Omit<MentorMessage, 'role'>>,
        )
    }

    private async getMentorResponseFromGemini(
        prompt: string,
        lang: Language,
    ): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT()
        aiRateLimiter.acquireSlot('getMentorResponse')
        const ai = await createGeminiClient()
        const systemInstruction = t('ai.prompts.mentor.systemInstruction')
        const localizedSystemInstruction = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${systemInstruction}`,
            lang,
        )
        const localizedPrompt = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
            lang,
        )
        const response = await generateWithGeminiFallback({
            ai,
            model: 'gemini-2.5-flash',
            contents: truncatePromptForModel(localizedPrompt),
            config: {
                systemInstruction: localizedSystemInstruction,
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: buildMentorResponseSchema(),
            },
        })
        reportGeminiUsage('getMentorResponse', response)

        return parseGeminiJsonResponse<Omit<MentorMessage, 'role'>>(
            response,
            'ai.error.generic',
            MentorMessageContentSchema as z.ZodSchema<Omit<MentorMessage, 'role'>>,
        )
    }

    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        try {
            if (this.isAlternateProvider()) {
                return await this.getEquipmentRecommendationFromAlternateProvider(prompt, lang)
            }

            return await this.getEquipmentRecommendationFromGemini(prompt, lang)
        } catch (error) {
            const isAlternateProviderError = this.isAlternateProvider()
            console.debug('Gemini getEquipmentRecommendation Error:', error)
            if (isAlternateProviderError) {
                console.debug('Alt-provider getEquipmentRecommendation Error:', error)
            }
            return rethrowKnownGeminiError(error, 'ai.error.equipment')
        }
    }

    private async diagnosePlantViaGemini(
        base64Image: string,
        mimeType: string,
        localizedPrompt: string,
    ): Promise<PlantDiagnosisResponse> {
        aiRateLimiter.acquireSlot('diagnosePlant')
        const ai = await createGeminiClient()
        const imagePart = { inlineData: { data: base64Image, mimeType } }
        const textPart = { text: localizedPrompt }

        const response = await generateWithGeminiFallback({
            ai,
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: buildDiagnosePlantResponseSchema(),
            },
        })
        reportGeminiUsage('diagnosePlant', response)

        return parseGeminiJsonResponse<PlantDiagnosisResponse>(
            response,
            'ai.error.diagnostics',
            PlantDiagnosisResponseSchema,
        )
    }

    private async getStrainTipsFromAlternateProvider(
        localizedPrompt: string,
        lang: Language,
    ): Promise<StructuredGrowTips> {
        const jsonInstruction =
            'Respond ONLY with valid JSON matching: { "nutrientTip": "...", "trainingTip": "...", "environmentalTip": "...", "proTip": "..." }'
        const text = await this.generateViaAlternateProvider(
            'getStrainTips',
            getEducationalUseOnlyInstruction(lang),
            `${localizedPrompt}\n\n${jsonInstruction}`,
            true,
            MAX_OUTPUT_TOKENS_JSON,
        )
        return parseGeminiJsonFromText<StructuredGrowTips>(
            text,
            'ai.error.tips',
            StructuredGrowTipsSchema,
        )
    }

    private async getStrainTipsFromGemini(localizedPrompt: string): Promise<StructuredGrowTips> {
        aiRateLimiter.acquireSlot('getStrainTips')
        const ai = await createGeminiClient()
        const response = await generateWithGeminiFallback({
            ai,
            model: 'gemini-2.5-flash',
            contents: truncatePromptForModel(localizedPrompt),
            config: {
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: buildStrainTipsResponseSchema(),
            },
        })
        reportGeminiUsage('getStrainTips', response)

        return parseGeminiJsonResponse<StructuredGrowTips>(
            response,
            'ai.error.tips',
            StructuredGrowTipsSchema,
        )
    }

    private async generateDeepDiveFromAlternateProvider(
        localizedPrompt: string,
        lang: Language,
    ): Promise<DeepDiveGuide> {
        const jsonInstruction =
            'Respond ONLY with valid JSON matching: { "introduction": "...", "stepByStep": ["..."], "prosAndCons": { "pros": ["..."], "cons": ["..."] }, "proTip": "..." }'
        const text = await this.generateViaAlternateProvider(
            'generateDeepDive',
            getEducationalUseOnlyInstruction(lang),
            `${localizedPrompt}\n\n${jsonInstruction}`,
            true,
            MAX_OUTPUT_TOKENS_JSON,
        )
        return parseGeminiJsonFromText<DeepDiveGuide>(text, 'ai.error.deepDive', DeepDiveGuideSchema)
    }

    private async generateDeepDiveFromGemini(localizedPrompt: string): Promise<DeepDiveGuide> {
        aiRateLimiter.acquireSlot('generateDeepDive')
        const ai = await createGeminiClient()
        const response = await generateWithGeminiFallback({
            ai,
            model: 'gemini-2.5-pro',
            fallbackModel: 'gemini-2.5-flash',
            contents: truncatePromptForModel(localizedPrompt),
            config: {
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: buildDeepDiveResponseSchema(),
            },
        })
        reportGeminiUsage('generateDeepDive', response)

        return parseGeminiJsonResponse<DeepDiveGuide>(
            response,
            'ai.error.deepDive',
            DeepDiveGuideSchema,
        )
    }

    private async getPlantNarrativeWithFallback(
        plant: Plant,
        lang: Language,
        endpoint: 'getPlantAdvice' | 'getProactiveDiagnosis',
        promptBuilderKey: 'ai.prompts.advisor' | 'ai.prompts.proactiveDiagnosis',
        titleKey: 'ai.advisor' | 'ai.proactiveDiagnosis',
        fallbackGetter: (
            localAiService: LocalAiService,
            p: Plant,
            l: Language,
        ) => Promise<AIResponse>,
    ): Promise<AIResponse> {
        const t = getT()
        const plantContext = buildPlantJournalContext(plant, t)
        const prompt = t(promptBuilderKey, { plant: plantContext })

        return this.runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await this.generateText(prompt, lang, endpoint)
                return { title: t(titleKey), content: responseText }
            },
            async (localAiService) => fallbackGetter(localAiService, plant, lang),
        )
    }

    private async runWithLocalFallback<T>(
        task: () => Promise<T>,
        fallbackTask: (localAiService: LocalAiService) => Promise<T>,
    ): Promise<T> {
        try {
            return await task()
        } catch (error) {
            if (this.shouldUseLocalFallback(error)) {
                const localAiService = await getLocalAiService()
                return fallbackTask(localAiService)
            }
            throw error
        }
    }

    async diagnosePlant(
        base64Image: string,
        mimeType: string,
        plant: Plant,
        userNotes: string,
        lang: Language,
        growName?: string,
    ): Promise<PlantDiagnosisResponse> {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            const localAiService = await getLocalAiService()
            return localAiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
        }

        const t = getT()
        const contextString = buildDiagnosePlantContext(plant, userNotes, t, growName)

        const prompt = `
            Analyze the following image of a cannabis plant.
            ${contextString}
            This is legal educational horticulture support. Do not provide illicit-use guidance.
            Based on the image and the detailed context, provide a comprehensive diagnosis.
            Return only valid JSON with this exact structure:
            { "title": "...", "content": "...", "confidence": 0.0, "immediateActions": "...", "longTermSolution": "...", "prevention": "...", "diagnosis": "..." }
        `

        const localizedPrompt = buildLocalizedEducationalPrompt(prompt, lang)

        try {
            return await this.diagnosePlantViaGemini(base64Image, mimeType, localizedPrompt)
        } catch (error) {
            console.debug('Gemini diagnosePlant Error:', error)
            if (this.shouldUseLocalFallback(error)) {
                const localAiService = await getLocalAiService()
                return localAiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
            }
            return rethrowKnownGeminiError(error, 'ai.error.diagnostics')
        }
    }

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        return this.getPlantNarrativeWithFallback(
            plant,
            lang,
            'getPlantAdvice',
            'ai.prompts.advisor',
            'ai.advisor',
            (localAiService, p, language) => localAiService.getPlantAdvice(p, language),
        )
    }

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        return this.getPlantNarrativeWithFallback(
            plant,
            lang,
            'getProactiveDiagnosis',
            'ai.prompts.proactiveDiagnosis',
            'ai.proactiveDiagnosis',
            (localAiService, p, language) => localAiService.getProactiveDiagnosis(p, language),
        )
    }

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language,
        growId?: string,
        growName?: string,
    ): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT()
        const { prompt, ragContext } = await buildMentorPrompt(
            plant,
            query,
            t,
            growId,
            growName,
        )

        try {
            if (this.isAlternateProvider()) {
                return await this.getMentorResponseFromAlternateProvider(prompt, lang)
            }

            return await this.getMentorResponseFromGemini(prompt, lang)
        } catch (error) {
            console.debug('Gemini getMentorResponse Error:', error)
            if (this.shouldUseLocalFallback(error)) {
                const localAiService = await getLocalAiService()
                return localAiService.getMentorResponse(plant, query, lang, ragContext)
            }
            return rethrowKnownGeminiError(error, 'ai.error.generic')
        }
    }

    async getStrainTips(
        strain: Strain,
        context: { focus: string; stage: string; experienceLevel: string },
        lang: Language,
    ): Promise<StructuredGrowTips> {
        const t = getT()
        const localizedPrompt = buildStrainTipsLocalizedPrompt(strain, context, lang, t)
        try {
            if (this.isAlternateProvider()) {
                return await this.getStrainTipsFromAlternateProvider(localizedPrompt, lang)
            }

            return await this.getStrainTipsFromGemini(localizedPrompt)
        } catch (e) {
            console.debug('Gemini getStrainTips Error:', e)
            if (this.shouldUseLocalFallback(e)) {
                const localAiService = await getLocalAiService()
                return localAiService.getStrainTips(strain, context, lang)
            }
            return rethrowKnownGeminiError(e, 'ai.error.tips')
        }
    }

    async generateStrainImage(
        strain: Strain,
        style: ImageStyle,
        criteria: ImageCriteria,
    ): Promise<string> {
        const selectedStyle = resolveStrainImageStyle(style)
        const prompt = buildStrainImagePrompt(strain, selectedStyle, criteria)

        try {
            aiRateLimiter.acquireSlot('generateStrainImage')
            const ai = await createGeminiClient()
            const response = await generateWithGeminiFallback({
                ai,
                model: 'gemini-2.0-flash-preview-image-generation',
                fallbackModel: 'gemini-2.0-flash-exp-image-generation',
                contents: {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            })
            reportGeminiUsage('generateStrainImage', response)

            return extractGeneratedImageDataOrThrow(response)
        } catch (error) {
            console.debug('Gemini generateStrainImage Error:', error)
            return rethrowKnownGeminiError(error, 'ai.error.generic')
        }
    }

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        const t = getT()
        const compactPlant = createCompactPlantSnapshot(plant)
        const prompt = t('ai.prompts.deepDive', {
            topic,
            plant: JSON.stringify(compactPlant),
        })
        const localizedPrompt = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
            lang,
        )
        try {
            if (this.isAlternateProvider()) {
                return await this.generateDeepDiveFromAlternateProvider(localizedPrompt, lang)
            }

            return await this.generateDeepDiveFromGemini(localizedPrompt)
        } catch (e) {
            console.debug('Gemini generateDeepDive Error:', e)
            if (this.shouldUseLocalFallback(e)) {
                const localAiService = await getLocalAiService()
                return localAiService.generateDeepDive(topic, plant, lang)
            }
            return rethrowKnownGeminiError(e, 'ai.error.deepDive')
        }
    }

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        const t = getT()
        const plantSummaries = buildGardenPlantSummaries(plants, t)

        const prompt = t('ai.prompts.gardenStatus', { summaries: plantSummaries })

        return this.runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await this.generateText(prompt, lang, 'getGardenStatusSummary')
                return { title: t('plantsView.gardenVitals.aiStatusTitle'), content: responseText }
            },
            async (localAiService) => {
                return localAiService.getGardenStatusSummary(plants, lang)
            },
        )
    }

    async getGrowLogRagAnswer(plants: Plant[], query: string, lang: Language): Promise<AIResponse> {
        const prompt = await buildGrowLogRagPrompt(plants, query)

        return this.runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await this.generateText(prompt, lang, 'getGrowLogRagAnswer')
                return {
                    title: lang === 'de' ? 'RAG Grow-Log Analyse' : 'RAG Grow Log Analysis',
                    content: responseText,
                }
            },
            async (localAiService) => {
                return localAiService.getGrowLogRagAnswer(plants, query, lang)
            },
        )
    }

    getDynamicLoadingMessages({
        useCase,
        data,
    }: {
        useCase: string
        data?: Record<string, unknown>
    }): string[] {
        const t = getT()
        const messagesResult = t(`ai.loading.${useCase}`, {
            ...data,
            returnObjects: true,
        })
        return mapDynamicLoadingMessages(messagesResult)
    }

    async getNutrientRecommendation(
        context: NutrientRecommendationInput,
        lang: Language,
    ): Promise<string> {
        const t = getT()
        const prompt = buildNutrientPlannerPrompt(context, t)

        return this.generateText(prompt, lang, 'getNutrientRecommendation')
    }

    async getTrendAnalysis(prompt: string, title: string, lang: Language): Promise<AIResponse> {
        return this.runWithLocalFallback<AIResponse>(
            async () => {
                const text = await this.generateText(prompt, lang, 'getTrendAnalysis')
                return { title, content: text }
            },
            async (localAiService) => {
                const rec = await localAiService.getEquipmentRecommendation(prompt, lang)
                return { title, content: rec.proTip, confidence: 0.7 }
            },
        )
    }
}

export const geminiService = new GeminiService()
