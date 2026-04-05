import type { ImageStyle } from '@/types/aiProvider'
import { localAiPreloadService } from '@/services/localAiInfrastructureService'
import { localAiFallbackService } from '@/services/localAiFallbackService'
import { growLogRagService } from '@/services/growLogRagService'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { setEcoModeExplicit, registerModeAccessors } from '@/services/aiEcoModeService'
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
    AiMode,
    GeneticTrendCategory,
    GrowSetup,
} from '@/types'

const DYNAMIC_IMPORT_TIMEOUT_MS = 15_000

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

const getGeminiService = async () => {
    const { geminiService } = await import('@/services/geminiService')
    return geminiService
}

const getLocalAiService = async () => {
    const importPromise = import('@/services/localAI').then((m) => m.localAiService)
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
            () => reject(new Error('Local AI dynamic import timeout')),
            DYNAMIC_IMPORT_TIMEOUT_MS,
        ),
    )
    return Promise.race([importPromise, timeoutPromise])
}

/** True when the device is offline or has no usable network. */
const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false

// ── Configurable AI mode ──────────────────────────────────
let _aiMode: AiMode = 'hybrid'

// Register accessors so the eco module can read/write mode without circular deps
registerModeAccessors(
    () => _aiMode,
    (mode: string) => {
        _aiMode = mode as AiMode
    },
)

/** Called from the listener middleware whenever the setting changes. */
export const setAiMode = (mode: AiMode): void => {
    _aiMode = mode
    setEcoModeExplicit(mode === 'eco')
}

/** Returns the current AI execution mode. */
export const getAiMode = (): AiMode => _aiMode

/**
 * Determines whether to use the local AI stack instead of the cloud API.
 *
 * - **localOnlyMode**: always route locally (privacy mode — no outbound traffic)
 * - **local**:  always route locally (device-only)
 * - **eco**:    always route locally, but only 0.5B model + rule-based heuristics
 * - **cloud**:  only route locally when the device is offline
 * - **hybrid**: route locally when offline OR when local models are pre-loaded
 */
const shouldRouteLocally = (): boolean => {
    if (isLocalOnlyMode()) return true
    if (_aiMode === 'local' || _aiMode === 'eco') return true
    if (_aiMode === 'cloud') return isOffline()
    // hybrid: original smart-routing logic
    return isOffline() || localAiPreloadService.isReady()
}

/** Re-export for convenience. */
export { isEcoMode } from '@/services/aiEcoModeService'

/**
 * Wraps a cloud AI call with an automatic fallback to the local AI stack.
 * If the cloud call throws (network error, quota, invalid key, …) the
 * `localFallback` callback is invoked instead so the user always gets a
 * response.
 *
 * In **local** or **localOnlyMode** the cloud call is never attempted.
 */
async function withLocalFallback<T>(
    cloudFn: () => Promise<T>,
    localFallback: () => T | Promise<T>,
): Promise<T> {
    if (_aiMode === 'local' || _aiMode === 'eco' || isLocalOnlyMode()) return localFallback()
    try {
        return await cloudFn()
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (msg.startsWith('ai.error.rateLimited')) {
            const seconds = msg.split(':')[1] ?? '60'
            const { useUIStore } = await import('@/stores/useUIStore')
            const { getT } = await import('@/i18n')
            useUIStore.getState().addNotification({
                message: getT()('common.ai.rateLimited', { seconds }),
                type: 'error',
            })
        }
        console.debug('[AI] Cloud call failed, falling back to local AI:', msg)
        return localFallback()
    }
}

const resolveRagContext = async (plants: Plant[], query: string): Promise<string> => {
    try {
        return await growLogRagService.retrieveSemanticContext(plants, query)
    } catch {
        return growLogRagService.retrieveRelevantContext(plants, query)
    }
}

const runRouted = async <T>(
    localCall: () => Promise<T>,
    cloudCall: () => Promise<T>,
    fallbackCall: () => Promise<T> | T,
): Promise<T> => {
    if (shouldRouteLocally()) {
        return localCall()
    }

    return withLocalFallback(cloudCall, fallbackCall)
}

const withLocalService = async <T>(
    fn: (local: Awaited<ReturnType<typeof getLocalAiService>>) => Promise<T>,
): Promise<T> => {
    const local = await getLocalAiService()
    return fn(local)
}

const buildMentorStreamPrompt = (
    plant: Plant,
    query: string,
    lang: Language,
    ragContext: string,
): string => {
    const isDE = lang === 'de'
    const instruction = isDE
        ? 'Antworte als CannaGuide AI auf Deutsch, sachlich, strukturiert und ohne HTML.'
        : 'Answer as CannaGuide AI in English, structured, factual, and without HTML.'

    return [
        instruction,
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
        const parsed = JSON.parse(result) as {
            title?: string | undefined
            content?: string | undefined
            uiHighlights?: string[] | undefined
        }
        if (typeof parsed.title === 'string' && typeof parsed.content === 'string') {
            return parsed as unknown as Omit<MentorMessage, 'role'>
        }
    } catch {
        // Not valid JSON — fall through to plain text response
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
        const parsed = JSON.parse(result) as { title?: string; content?: string }
        if (typeof parsed.title === 'string' && typeof parsed.content === 'string') {
            return parsed as AIResponse
        }
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
    ): Promise<Omit<MentorMessage, 'role'>> {
        return runRouted(
            async () => {
                const ragContext = await resolveRagContext([plant], query)
                return withLocalService((local) =>
                    local.getMentorResponse(plant, query, lang, ragContext),
                )
            },
            async () => (await getGeminiService()).getMentorResponse(plant, query, lang),
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
    ): Promise<Omit<MentorMessage, 'role'>> {
        if (shouldRouteLocally()) {
            const ragContext = await resolveRagContext([plant], query)
            const local = await getLocalAiService()

            const prompt = buildMentorStreamPrompt(plant, query, lang, ragContext)

            const result = await local.generateTextStream(prompt, onToken)

            if (result) {
                return parseMentorStreamResult(result, lang)
            }

            return localAiFallbackService.getMentorResponse(plant, query, ragContext, lang)
        }

        // Non-local: standard batch response
        return this.getMentorResponse(plant, query, lang)
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

    async getGrowLogRagAnswer(plants: Plant[], query: string, lang: Language): Promise<AIResponse> {
        return runRouted(
            async () => {
                const ragContext = await resolveRagContext(plants, query)
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
