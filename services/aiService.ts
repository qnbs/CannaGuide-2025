import { geminiService, type ImageStyle } from '@/services/geminiService'
import { localAiPreloadService } from '@/services/localAiPreloadService'
import { localAiFallbackService } from '@/services/localAiFallbackService'
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
} from '@/types'

const getLocalAiService = async () => {
    const module = await import('@/services/localAI')
    return module.localAiService
}

/** True when the device is offline or has no usable network. */
const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false

/**
 * Determines whether to use the local AI stack instead of the cloud API.
 * Uses local AI when: (a) device is offline, or (b) local models are pre-loaded and ready.
 * This lets the app serve instant local responses when models are warm.
 */
const shouldRouteLocally = (): boolean => isOffline() || localAiPreloadService.isReady()

/**
 * Wraps a cloud AI call with an automatic fallback to the local AI stack.
 * If the cloud call throws (network error, quota, invalid key, …) the
 * `localFallback` callback is invoked instead so the user always gets a
 * response.
 */
async function withLocalFallback<T>(
    cloudFn: () => Promise<T>,
    localFallback: () => T | Promise<T>,
): Promise<T> {
    try {
        return await cloudFn()
    } catch {
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
            () => geminiService.getEquipmentRecommendation(prompt, lang),
            async () => {
                const local = await getLocalAiService()
                return local.getEquipmentRecommendation(prompt, lang)
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
        if (isOffline()) {
            const local = await getLocalAiService()
            return local.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
        }
        return withLocalFallback(
            () => geminiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang),
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
            () => geminiService.getPlantAdvice(plant, lang),
            () => localAiFallbackService.getPlantAdvice(plant, lang),
        )
    },

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getProactiveDiagnosis(plant, lang)
        }
        return withLocalFallback(
            () => geminiService.getProactiveDiagnosis(plant, lang),
            () => localAiFallbackService.getPlantAdvice(plant, lang),
        )
    },

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language,
    ): Promise<Omit<MentorMessage, 'role'>> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getMentorResponse(plant, query, '', lang)
        }
        return withLocalFallback(
            () => geminiService.getMentorResponse(plant, query, lang),
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
            () => geminiService.getStrainTips(strain, context, lang),
            () => localAiFallbackService.getStrainTips(strain, lang),
        )
    },

    generateStrainImage: (
        strain: Strain,
        style: ImageStyle,
        criteria: { focus: string; composition: string; mood: string },
    ): Promise<string> => geminiService.generateStrainImage(strain, style, criteria),

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.generateDeepDive(topic, plant, lang)
        }
        return withLocalFallback(
            () => geminiService.generateDeepDive(topic, plant, lang),
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
            () => geminiService.getGardenStatusSummary(plants, lang),
            () => localAiFallbackService.getGardenStatusSummary(plants, lang),
        )
    },

    async getGrowLogRagAnswer(plants: Plant[], query: string, lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getGrowLogRagAnswer(plants, query, lang)
        }
        return withLocalFallback(
            () => geminiService.getGrowLogRagAnswer(plants, query, lang),
            () => localAiFallbackService.getGrowLogRagAnswer(query, '', lang),
        )
    },
}
