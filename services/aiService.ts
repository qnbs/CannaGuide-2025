import type { ImageStyle } from '@/types/aiProvider'
import { localAiPreloadService } from '@/services/localAiPreloadService'
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
} from '@/types'

const DYNAMIC_IMPORT_TIMEOUT_MS = 15_000

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
        console.warn(
            '[AI] Cloud call failed, falling back to local AI:',
            error instanceof Error ? error.message : error,
        )
        return localFallback()
    }
}

export const aiService = {
    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getEquipmentRecommendation(prompt, lang)
        }

        return withLocalFallback(
            async () => (await getGeminiService()).getEquipmentRecommendation(prompt, lang),
            async () => {
                const local = await getLocalAiService()
                return local.getEquipmentRecommendation(prompt, lang)
            },
        )
    },

    async getNutrientRecommendation(
        context: {
            medium: string
            stage: string
            currentEc: number
            currentPh: number
            optimalRange: { ecMin: number; ecMax: number; phMin: number; phMax: number }
            readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>
            plant?: {
                name: string
                strain: { name: string }
                stage: string
                age: number
                health: number
                medium: { ph: number; ec: number }
            }
        },
        lang: Language,
    ): Promise<string> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getNutrientRecommendation(context, lang)
        }

        return withLocalFallback(
            async () => (await getGeminiService()).getNutrientRecommendation(context, lang),
            async () => {
                const local = await getLocalAiService()
                return local.getNutrientRecommendation(context, lang)
            },
        )
    },

    async diagnosePlant(
        base64Image: string,
        mimeType: string,
        plant: Plant,
        userNotes: string,
        lang: Language,
    ): Promise<PlantDiagnosisResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
        }
        return withLocalFallback(
            async () =>
                (await getGeminiService()).diagnosePlant(
                    base64Image,
                    mimeType,
                    plant,
                    userNotes,
                    lang,
                ),
            async () => {
                const local = await getLocalAiService()
                return local.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
            },
        )
    },

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getPlantAdvice(plant, lang)
        }
        return withLocalFallback(
            async () => (await getGeminiService()).getPlantAdvice(plant, lang),
            () => localAiFallbackService.getPlantAdvice(plant, lang),
        )
    },

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getProactiveDiagnosis(plant, lang)
        }
        return withLocalFallback(
            async () => (await getGeminiService()).getProactiveDiagnosis(plant, lang),
            () => localAiFallbackService.getPlantAdvice(plant, lang),
        )
    },

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language,
    ): Promise<Omit<MentorMessage, 'role'>> {
        if (shouldRouteLocally()) {
            let ragContext = ''
            try {
                ragContext = await growLogRagService.retrieveSemanticContext([plant], query)
            } catch {
                ragContext = growLogRagService.retrieveRelevantContext([plant], query)
            }
            const local = await getLocalAiService()
            return local.getMentorResponse(plant, query, lang, ragContext)
        }
        return withLocalFallback(
            async () => (await getGeminiService()).getMentorResponse(plant, query, lang),
            () => localAiFallbackService.getMentorResponse(plant, query, '', lang),
        )
    },

    async getStrainTips(
        strain: Strain,
        context: { focus: string; stage: string; experienceLevel: string },
        lang: Language,
    ): Promise<StructuredGrowTips> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getStrainTips(strain, context, lang)
        }
        return withLocalFallback(
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
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.generateStrainImage(strain, style, criteria, lang)
        }

        return withLocalFallback(
            async () => (await getGeminiService()).generateStrainImage(strain, style, criteria),
            async () => {
                const local = await getLocalAiService()
                return local.generateStrainImage(strain, style, criteria, lang)
            },
        )
    },

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.generateDeepDive(topic, plant, lang)
        }
        return withLocalFallback(
            async () => (await getGeminiService()).generateDeepDive(topic, plant, lang),
            async () => {
                const local = await getLocalAiService()
                return local.generateDeepDive(topic, plant, lang)
            },
        )
    },

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getGardenStatusSummary(plants, lang)
        }
        return withLocalFallback(
            async () => (await getGeminiService()).getGardenStatusSummary(plants, lang),
            () => localAiFallbackService.getGardenStatusSummary(plants, lang),
        )
    },

    async getGrowLogRagAnswer(plants: Plant[], query: string, lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            let ragContext = ''
            try {
                ragContext = await growLogRagService.retrieveSemanticContext(plants, query)
            } catch {
                ragContext = growLogRagService.retrieveRelevantContext(plants, query)
            }
            const local = await getLocalAiService()
            return local.getGrowLogRagAnswer(plants, query, lang, ragContext)
        }
        return withLocalFallback(
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
}
