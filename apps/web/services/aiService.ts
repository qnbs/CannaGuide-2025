import type { ImageStyle } from '@/types/aiProvider'
import { localAiFallbackService } from '@/services/localAiFallbackService'
import { growLogRagService } from '@/services/growLogRagService'
import {
    getGeminiService,
    getLocalAiService,
    shouldRouteLocally,
    runRouted,
    withLocalService,
    captureLocalAiError,
} from '@/services/localRoutingService'
import { AIResponseSchema, MentorMessageContentSchema } from '@/types/schemas'
import {
    Language,
    Plant,
    Recommendation,
    Strain,
    PlantDiagnosisResponse,
    AIResponse,
    StructuredGrowTips,
    DeepDiveGuide,
    MentorMessage,
    GeneticTrendCategory,
    GrowSetup,
} from '@/types'

// Re-export routing API so existing consumers keep working
export { setAiMode, getAiMode, isEcoMode } from '@/services/localRoutingService'

type NutrientRecommendationInput = {
    medium: string
    stage: string
    currentEc: number
    currentPh: number
    optimalRange: { ecMin: number; ecMax: number; phMin: number; phMax: number }
    readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>
    plant?:
        | {
              name: string
              strain: { name: string }
              stage: string
              age: number
              health: number
              medium: { ph: number; ec: number }
          }
        | undefined
}

const resolveRagContext = async (
    plants: Plant[],
    query: string,
    growId?: string,
): Promise<string> => {
    try {
        if (growId) {
            return await growLogRagService.retrieveSemanticContextForGrow(plants, query, growId)
        }
        return await growLogRagService.retrieveSemanticContext(plants, query)
    } catch {
        if (growId) {
            return growLogRagService.retrieveRelevantContextForGrow(plants, query, growId)
        }
        return growLogRagService.retrieveRelevantContext(plants, query)
    }
}

const buildMentorStreamPrompt = (
    plant: Plant,
    query: string,
    lang: Language,
    ragContext: string,
    growName?: string,
): string => {
    const isDE = lang === 'de'
    const instruction = isDE
        ? 'Antworte als CannaGuide AI auf Deutsch, sachlich, strukturiert und ohne HTML.'
        : 'Answer as CannaGuide AI in English, structured, factual, and without HTML.'

    return [
        instruction,
        growName ? `Grow: ${growName}` : '',
        `Plant: ${plant.name} | ${plant.strain.name} | stage=${plant.stage}`,
        ragContext ? `Context: ${ragContext}` : '',
        `Question: ${query}`,
        'Return ONLY valid JSON with this exact shape:',
        '{"title":"...","content":"...","uiHighlights":[]}',
    ]
        .filter(Boolean)
        .join('\n\n')
}

const parseMentorStreamResult = (result: string, lang: Language): Omit<MentorMessage, 'role'> => {
    try {
        const parsed: unknown = JSON.parse(result)
        const validated = MentorMessageContentSchema.safeParse(parsed)
        if (validated.success) {
            return validated.data as Omit<MentorMessage, 'role'>
        }
        captureLocalAiError(
            new Error(`Mentor stream validation failed: ${validated.error.message}`),
            { stage: 'response-validation' },
        )
    } catch {
        // Not valid JSON -- fall through to plain text response
    }

    return {
        title: lang === 'de' ? 'KI-Mentor' : 'AI Mentor',
        content: result,
    }
}
const buildAdviceStreamPrompt = (plant: Plant, lang: Language): string => {
    const isDE = lang === 'de'
    const instruction = isDE
        ? 'Gib kurze, strukturierte Anbautipps als CannaGuide AI auf Deutsch. Kein HTML.'
        : 'Give concise, structured growing advice as CannaGuide AI. No HTML.'

    return [
        instruction,
        `Plant: ${plant.name} | ${plant.strain.name} | stage=${plant.stage} | health=${plant.health}`,
        `Environment: temp=${plant.environment.internalTemperature}C, rh=${plant.environment.internalHumidity}%`,
        'Return ONLY valid JSON: {"title":"...","content":"..."}',
    ].join('\n\n')
}

const buildDiagnosisStreamPrompt = (plant: Plant, lang: Language): string => {
    const isDE = lang === 'de'
    const instruction = isDE
        ? 'Analysiere den Pflanzenstatus als CannaGuide AI und identifiziere Probleme. Kein HTML.'
        : 'Analyze plant status as CannaGuide AI and identify issues. No HTML.'

    return [
        instruction,
        `Plant: ${plant.name} | ${plant.strain.name} | stage=${plant.stage}`,
        `Health: ${plant.health} | Stress: ${plant.stressLevel}`,
        `Environment: temp=${plant.environment.internalTemperature}C, rh=${plant.environment.internalHumidity}%, vpd=${plant.environment.vpd}`,
        'Return ONLY valid JSON: {"title":"...","content":"..."}',
    ].join('\n\n')
}

const parseAiStreamResult = (
    result: string,
    lang: Language,
    kind: 'advisor' | 'diagnosis',
): AIResponse => {
    try {
        const parsed: unknown = JSON.parse(result)
        const validated = AIResponseSchema.safeParse(parsed)
        if (validated.success) {
            return validated.data as AIResponse
        }
        captureLocalAiError(
            new Error(`AI stream validation failed (${kind}): ${validated.error.message}`),
            { stage: 'response-validation' },
        )
    } catch {
        // Not valid JSON
    }
    const defaultTitle =
        kind === 'advisor'
            ? lang === 'de'
                ? 'KI-Berater'
                : 'AI Advisor'
            : lang === 'de'
              ? 'KI-Diagnose'
              : 'AI Diagnosis'
    return { title: defaultTitle, content: result }
}
export const aiService = {
    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        return runRouted(
            () => withLocalService((local) => local.getEquipmentRecommendation(prompt, lang)),
            async () => (await getGeminiService()).getEquipmentRecommendation(prompt, lang),
            () => withLocalService((local) => local.getEquipmentRecommendation(prompt, lang)),
        )
    },

    async getNutrientRecommendation(
        context: NutrientRecommendationInput,
        lang: Language,
    ): Promise<string> {
        return runRouted(
            () => withLocalService((local) => local.getNutrientRecommendation(context, lang)),
            async () => (await getGeminiService()).getNutrientRecommendation(context, lang),
            () => withLocalService((local) => local.getNutrientRecommendation(context, lang)),
        )
    },

    async diagnosePlant(
        base64Image: string,
        mimeType: string,
        plant: Plant,
        userNotes: string,
        lang: Language,
        growName?: string,
    ): Promise<PlantDiagnosisResponse> {
        return runRouted(
            () =>
                withLocalService((local) =>
                    local.diagnosePlant(base64Image, mimeType, plant, userNotes, lang),
                ),
            async () =>
                (await getGeminiService()).diagnosePlant(
                    base64Image,
                    mimeType,
                    plant,
                    userNotes,
                    lang,
                    growName,
                ),
            () =>
                withLocalService((local) =>
                    local.diagnosePlant(base64Image, mimeType, plant, userNotes, lang),
                ),
        )
    },

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        return runRouted(
            () => withLocalService((local) => local.getPlantAdvice(plant, lang)),
            async () => (await getGeminiService()).getPlantAdvice(plant, lang),
            () => localAiFallbackService.getPlantAdvice(plant, lang),
        )
    },

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        return runRouted(
            () => withLocalService((local) => local.getProactiveDiagnosis(plant, lang)),
            async () => (await getGeminiService()).getProactiveDiagnosis(plant, lang),
            () => localAiFallbackService.getPlantAdvice(plant, lang),
        )
    },

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language,
        growId?: string,
        growName?: string,
    ): Promise<Omit<MentorMessage, 'role'>> {
        return runRouted(
            async () => {
                const ragContext = await resolveRagContext([plant], query, growId)
                return withLocalService((local) =>
                    local.getMentorResponse(plant, query, lang, ragContext),
                )
            },
            async () =>
                (await getGeminiService()).getMentorResponse(plant, query, lang, growId, growName),
            () => localAiFallbackService.getMentorResponse(plant, query, '', lang),
        )
    },

    /**
     * Streaming mentor response — yields tokens as they arrive.
     * Only streams via local AI (WebLLM). Cloud providers fall back to batch.
     */
    async getMentorResponseStream(
        plant: Plant,
        query: string,
        lang: Language,
        onToken: (token: string, accumulated: string) => void,
        growId?: string,
        growName?: string,
    ): Promise<Omit<MentorMessage, 'role'>> {
        if (shouldRouteLocally()) {
            const ragContext = await resolveRagContext([plant], query, growId)
            const local = await getLocalAiService()

            const prompt = buildMentorStreamPrompt(plant, query, lang, ragContext, growName)

            const result = await local.generateTextStream(prompt, onToken)

            if (result) {
                return parseMentorStreamResult(result, lang)
            }

            return localAiFallbackService.getMentorResponse(plant, query, ragContext, lang)
        }

        // Non-local: standard batch response
        return this.getMentorResponse(plant, query, lang, growId, growName)
    },

    /**
     * Streaming plant advice -- yields tokens as they arrive.
     * Falls back to batch getPlantAdvice when local AI is unavailable.
     */
    async getPlantAdviceStream(
        plant: Plant,
        lang: Language,
        onToken: (token: string, accumulated: string) => void,
    ): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            const prompt = buildAdviceStreamPrompt(plant, lang)
            const result = await local.generateTextStream(prompt, onToken)
            if (result) {
                return parseAiStreamResult(result, lang, 'advisor')
            }
            return localAiFallbackService.getPlantAdvice(plant, lang)
        }
        return this.getPlantAdvice(plant, lang)
    },

    /**
     * Streaming proactive diagnosis -- yields tokens as they arrive.
     * Falls back to batch getProactiveDiagnosis when local AI is unavailable.
     */
    async getProactiveDiagnosisStream(
        plant: Plant,
        lang: Language,
        onToken: (token: string, accumulated: string) => void,
    ): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            const prompt = buildDiagnosisStreamPrompt(plant, lang)
            const result = await local.generateTextStream(prompt, onToken)
            if (result) {
                return parseAiStreamResult(result, lang, 'diagnosis')
            }
            return localAiFallbackService.getPlantAdvice(plant, lang)
        }
        return this.getProactiveDiagnosis(plant, lang)
    },

    async getStrainTips(
        strain: Strain,
        context: { focus: string; stage: string; experienceLevel: string },
        lang: Language,
    ): Promise<StructuredGrowTips> {
        return runRouted(
            () => withLocalService((local) => local.getStrainTips(strain, context, lang)),
            async () => (await getGeminiService()).getStrainTips(strain, context, lang),
            () => localAiFallbackService.getStrainTips(strain, lang),
        )
    },

    async generateStrainImage(
        strain: Strain,
        style: ImageStyle,
        criteria: { focus: string; composition: string; mood: string },
        lang: Language,
    ): Promise<string> {
        return runRouted(
            () =>
                withLocalService((local) =>
                    local.generateStrainImage(strain, style, criteria, lang),
                ),
            async () => (await getGeminiService()).generateStrainImage(strain, style, criteria),
            () =>
                withLocalService((local) =>
                    local.generateStrainImage(strain, style, criteria, lang),
                ),
        )
    },

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        return runRouted(
            () => withLocalService((local) => local.generateDeepDive(topic, plant, lang)),
            async () => (await getGeminiService()).generateDeepDive(topic, plant, lang),
            () => withLocalService((local) => local.generateDeepDive(topic, plant, lang)),
        )
    },

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        return runRouted(
            () => withLocalService((local) => local.getGardenStatusSummary(plants, lang)),
            async () => (await getGeminiService()).getGardenStatusSummary(plants, lang),
            () => localAiFallbackService.getGardenStatusSummary(plants, lang),
        )
    },

    async getGrowLogRagAnswer(
        plants: Plant[],
        query: string,
        lang: Language,
        growId?: string,
    ): Promise<AIResponse> {
        return runRouted(
            async () => {
                const ragContext = await resolveRagContext(plants, query, growId)
                return withLocalService((local) =>
                    local.getGrowLogRagAnswer(plants, query, lang, ragContext),
                )
            },
            async () => (await getGeminiService()).getGrowLogRagAnswer(plants, query, lang),
            () => localAiFallbackService.getGrowLogRagAnswer(query, '', lang),
        )
    },

    /** Analyze sentiment of journal entries for trend tracking. */
    async analyzeJournalSentiment(
        entries: Array<{ notes: string; createdAt: number }>,
    ): Promise<{ overall: string; recentAverage: number; entryCount: number }> {
        try {
            const { analyzeJournalSentimentTrend } = await import('@/services/localAiNlpService')
            return analyzeJournalSentimentTrend(entries)
        } catch {
            return { overall: 'stable', recentAverage: 0.5, entryCount: entries.length }
        }
    },

    /** Summarize long text locally (grow logs, mentor history). */
    async summarizeText(text: string, maxLength?: number): Promise<string> {
        try {
            const { summarizeText } = await import('@/services/localAiNlpService')
            const result = await summarizeText(text, maxLength)
            return result.summary
        } catch {
            return text.slice(0, maxLength ?? 130)
        }
    },

    /** Classify a query into grow topic categories. */
    async classifyQuery(text: string): Promise<{ topLabel: string; topScore: number }> {
        try {
            const { classifyGrowTopic } = await import('@/services/localAiNlpService')
            const result = await classifyGrowTopic(text)
            return { topLabel: result.topLabel, topScore: result.topScore }
        } catch {
            return { topLabel: 'general question', topScore: 1 }
        }
    },

    /** Analyze sentiment of a single text. */
    async analyzeSentiment(
        text: string,
    ): Promise<{ label: string; score: number; normalized: string }> {
        try {
            const { analyzeSentiment } = await import('@/services/localAiNlpService')
            return analyzeSentiment(text)
        } catch {
            return { label: 'POSITIVE', score: 0.5, normalized: 'neutral' }
        }
    },

    /** Get local AI telemetry snapshot. */
    async getTelemetrySnapshot(): Promise<Record<string, unknown> | null> {
        try {
            const { getSnapshot } = await import('@/services/localAiTelemetryService')
            // Safe widening: TelemetrySnapshot -> Record<string, unknown> for facade decoupling
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            return getSnapshot() as unknown as Record<string, unknown>
        } catch {
            return null
        }
    },

    /** Detect the language of a text input (model-based with heuristic fallback). */
    async detectLanguage(
        text: string,
    ): Promise<{ language: 'en' | 'de' | 'unknown'; confidence: number; method: string }> {
        try {
            const { detectLanguage } = await import('@/services/localAiLanguageDetectionService')
            return detectLanguage(text)
        } catch {
            const { detectLanguageHeuristic } =
                await import('@/services/localAiLanguageDetectionService')
            return detectLanguageHeuristic(text)
        }
    },

    /** Compare two plant photos for visual similarity (0–1 score). */
    async compareImages(
        imageA: { base64: string; mimeType: string },
        imageB: { base64: string; mimeType: string },
    ): Promise<number> {
        try {
            const { compareImages } = await import('@/services/localAiImageSimilarityService')
            return compareImages(imageA, imageB)
        } catch {
            return 0
        }
    },

    /** Analyze visual growth progression from chronological plant photos. */
    async analyzeGrowthProgression(
        photos: Array<{ base64: string; mimeType: string; timestamp: number }>,
    ): Promise<{ averageChange: number; trend: string }> {
        try {
            const { analyzeGrowthProgression } =
                await import('@/services/localAiImageSimilarityService')
            const result = await analyzeGrowthProgression(photos)
            return { averageChange: result.averageChange, trend: result.trend }
        } catch {
            return { averageChange: 0, trend: 'stable' }
        }
    },

    /** Get a comprehensive local AI health report. */
    async getHealthReport(): Promise<Record<string, unknown>> {
        try {
            const { generateHealthReport } = await import('@/services/localAiHealthService')
            // Safe widening: HealthReport -> Record<string, unknown> for facade decoupling
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            return (await generateHealthReport()) as unknown as Record<string, unknown>
        } catch {
            return { status: 'unknown', generatedAt: Date.now() }
        }
    },

    /** Quick health check for polling. */
    async getQuickHealthCheck(): Promise<{
        status: string
        memoryPressure: boolean
        modelsReady: boolean
    }> {
        try {
            const { quickHealthCheck } = await import('./localAiHealthService')
            return quickHealthCheck()
        } catch {
            return { status: 'unknown', memoryPressure: false, modelsReady: false }
        }
    },

    /** Analyse a specific Genetic Trend category using AI. */
    async getGeneticTrendAnalysis(
        category: GeneticTrendCategory,
        lang: Language,
    ): Promise<AIResponse> {
        const isDE = lang === 'de'
        const prompt = isDE
            ? `Erklaere den Cannabis-Genetik-Trend 2026 "${category}" in 3-4 Saetzen. Fokus: praktischer Mehrwert fuer Heimanbauer, neue Zuchtfortschritte und welche Sorten am staerksten betroffen sind. Antwort auf Deutsch.`
            : `Explain the 2026 cannabis genetic trend "${category}" in 3-4 sentences. Focus on practical value for home growers, recent breeding advances, and which strain types are most affected.`
        const title = isDE ? `Genetik-Trend: ${category}` : `Genetic Trend: ${category}`
        const fallback: AIResponse = {
            title,
            content: isDE
                ? `${category} ist ein zentraler Genetik-Trend 2026 -- aktuelle Zuechtungen optimieren Terpen- und Cannabinoid-Profile fuer home growers.`
                : `${category} is a key 2026 genetic trend -- modern breeding refines terpene and cannabinoid profiles for home growers.`,
            confidence: 0.5,
        }
        try {
            const gemini = await getGeminiService()
            return await gemini.getTrendAnalysis(prompt, title, lang)
        } catch {
            return fallback
        }
    },

    /** Recommend grow technology based on current grow setup. */
    async getGrowTechRecommendation(setup: GrowSetup, lang: Language): Promise<AIResponse> {
        const isDE = lang === 'de'
        const setupDesc = isDE
            ? `Medium: ${setup.medium}, Beleuchtung: ${setup.lightType} (${setup.lightWattage}W), dynamisch: ${setup.dynamicLighting ? 'ja' : 'nein'}`
            : `Medium: ${setup.medium}, Light: ${setup.lightType} (${setup.lightWattage}W), dynamic: ${setup.dynamicLighting ? 'yes' : 'no'}`
        const prompt = isDE
            ? `Empfehle die beste Cannabis-Grow-Technologie 2026 fuer dieses Setup: ${setupDesc}. Erklaere in 3-4 Saetzen welche Technologien den groessten Mehrwert bringen und warum.`
            : `Recommend the best 2026 cannabis grow technology for this setup: ${setupDesc}. Explain in 3-4 sentences which technologies provide the most value and why.`
        const title = isDE ? 'Grow-Tech-Empfehlung 2026' : 'Grow Tech Recommendation 2026'
        const fallback: AIResponse = {
            title,
            content: isDE
                ? `Fuer dein Setup empfehlen sich IoT-Sensoren zur Echtzeitkontrolle und -- bei LED -- dynamisches Spektrum-Scheduling fuer maximale Effizienz in 2026.`
                : `For your setup, IoT sensors for real-time monitoring and -- with LED -- dynamic spectrum scheduling offer the best 2026 efficiency gains.`,
            confidence: 0.5,
        }
        try {
            const gemini = await getGeminiService()
            return await gemini.getTrendAnalysis(prompt, title, lang)
        } catch {
            return fallback
        }
    },
}
