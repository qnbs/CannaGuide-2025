import { Modality } from '@google/genai'
import {
    buildDiagnosePlantContext,
    buildGardenPlantSummaries,
    buildGrowLogRagPrompt,
    buildMentorPrompt,
    buildNutrientPlannerPrompt,
    buildPlantJournalContext,
    buildStrainTipsLocalizedPrompt,
    mapDynamicLoadingMessages,
    type NutrientRecommendationInput,
} from '@/services/ai/geminiContextBuilders'
import { createCompactPlantSnapshot, createLocalizedPrompt } from '@/services/ai/geminiPromptUtils'
import {
    createGeminiClient,
    generateWithGeminiFallback,
    getEducationalUseOnlyInstruction,
    rethrowKnownGeminiError,
    reportGeminiUsage,
} from '@/services/ai/geminiRuntime'
import {
    buildStrainImagePrompt,
    extractGeneratedImageDataOrThrow,
    resolveStrainImageStyle,
} from '@/services/ai/geminiStrainImagePrompts'
import {
    getLocalAiService,
    isAlternateProvider,
    runWithLocalFallback,
    shouldUseLocalFallback,
    generateTextWithProviderRouting,
    type LocalAiService,
} from '@/services/ai/geminiProviderRouting'
import {
    buildLocalizedEducationalPrompt,
    diagnosePlantViaGemini,
    generateDeepDiveFromAlternateProvider,
    generateDeepDiveFromGemini,
    getEquipmentRecommendationFromAlternateProvider,
    getEquipmentRecommendationFromGemini,
    getMentorResponseFromAlternateProvider,
    getMentorResponseFromGemini,
    getStrainTipsFromAlternateProvider,
    getStrainTipsFromGemini,
} from '@/services/ai/geminiStructuredHandlers'
import { sanitizeForPrompt } from '@/services/ai/safetyPipeline'

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
import { getT } from '@/i18n'
import { aiRateLimiter } from '@/services/aiRateLimiter'

export type { ImageStyle, ImageCriteria } from '@/types/aiProvider'
import type { BaseAIProvider, ImageStyle, ImageCriteria } from '@/types/aiProvider'

class GeminiService implements BaseAIProvider {
    readonly id = 'gemini' as const

    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        try {
            if (isAlternateProvider()) {
                return await getEquipmentRecommendationFromAlternateProvider(prompt, lang)
            }
            return await getEquipmentRecommendationFromGemini(prompt, lang)
        } catch (error) {
            if (isAlternateProvider()) {
                console.debug('Alt-provider getEquipmentRecommendation Error:', error)
            } else {
                console.debug('Gemini getEquipmentRecommendation Error:', error)
            }
            return rethrowKnownGeminiError(error, 'ai.error.equipment')
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
            return await diagnosePlantViaGemini(base64Image, mimeType, localizedPrompt)
        } catch (error) {
            console.debug('Gemini diagnosePlant Error:', error)
            if (shouldUseLocalFallback(error)) {
                const localAiService = await getLocalAiService()
                return localAiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
            }
            return rethrowKnownGeminiError(error, 'ai.error.diagnostics')
        }
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

        return runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await generateTextWithProviderRouting(prompt, lang, endpoint)
                return { title: t(titleKey), content: responseText }
            },
            async (localAiService) => fallbackGetter(localAiService, plant, lang),
        )
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
        const { prompt, ragContext } = await buildMentorPrompt(plant, query, t, growId, growName)

        try {
            if (isAlternateProvider()) {
                return await getMentorResponseFromAlternateProvider(prompt, lang)
            }
            return await getMentorResponseFromGemini(prompt, lang)
        } catch (error) {
            console.debug('Gemini getMentorResponse Error:', error)
            if (shouldUseLocalFallback(error)) {
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
            if (isAlternateProvider()) {
                return await getStrainTipsFromAlternateProvider(localizedPrompt, lang)
            }
            return await getStrainTipsFromGemini(localizedPrompt)
        } catch (e) {
            console.debug('Gemini getStrainTips Error:', e)
            if (shouldUseLocalFallback(e)) {
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
                    parts: [{ text: prompt }],
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
            topic: sanitizeForPrompt(topic, 400),
            plant: JSON.stringify(compactPlant),
        })
        const localizedPrompt = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
            lang,
        )
        try {
            if (isAlternateProvider()) {
                return await generateDeepDiveFromAlternateProvider(localizedPrompt, lang)
            }
            return await generateDeepDiveFromGemini(localizedPrompt)
        } catch (e) {
            console.debug('Gemini generateDeepDive Error:', e)
            if (shouldUseLocalFallback(e)) {
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

        return runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await generateTextWithProviderRouting(
                    prompt,
                    lang,
                    'getGardenStatusSummary',
                )
                return { title: t('plantsView.gardenVitals.aiStatusTitle'), content: responseText }
            },
            async (localAiService) => localAiService.getGardenStatusSummary(plants, lang),
        )
    }

    async getGrowLogRagAnswer(plants: Plant[], query: string, lang: Language): Promise<AIResponse> {
        const prompt = await buildGrowLogRagPrompt(plants, query)

        return runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await generateTextWithProviderRouting(
                    prompt,
                    lang,
                    'getGrowLogRagAnswer',
                )
                return {
                    title: lang === 'de' ? 'RAG Grow-Log Analyse' : 'RAG Grow Log Analysis',
                    content: responseText,
                }
            },
            async (localAiService) => localAiService.getGrowLogRagAnswer(plants, query, lang),
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
        return generateTextWithProviderRouting(prompt, lang, 'getNutrientRecommendation')
    }

    async getTrendAnalysis(prompt: string, title: string, lang: Language): Promise<AIResponse> {
        return runWithLocalFallback<AIResponse>(
            async () => {
                const text = await generateTextWithProviderRouting(
                    prompt,
                    lang,
                    'getTrendAnalysis',
                )
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
