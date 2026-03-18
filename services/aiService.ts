import { geminiService, type ImageStyle } from '@/services/geminiService'
import { localAiPreloadService } from '@/services/localAiPreloadService'
import { Language, Plant, Recommendation, Strain, PlantDiagnosisResponse, AIResponse, StructuredGrowTips, DeepDiveGuide, MentorMessage } from '@/types'

const getLocalAiService = async () => {
    const module = await import('@/services/localAI')
    return module.localAiService
}

/** True when the device is offline or has no usable network. */
const isOffline = (): boolean =>
    typeof navigator !== 'undefined' && navigator.onLine === false

/**
 * Determines whether to use the local AI stack instead of the cloud API.
 * Uses local AI when: (a) device is offline, or (b) local models are pre-loaded and ready.
 * This lets the app serve instant local responses when models are warm.
 */
const shouldRouteLocally = (): boolean =>
    isOffline() || localAiPreloadService.isReady()

export const aiService = {
    getEquipmentRecommendation: (prompt: string, lang: Language): Promise<Recommendation> =>
        geminiService.getEquipmentRecommendation(prompt, lang),

    async diagnosePlant(base64Image: string, mimeType: string, plant: Plant, userNotes: string, lang: Language): Promise<PlantDiagnosisResponse> {
        if (isOffline()) {
            const local = await getLocalAiService()
            return local.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
        }
        return geminiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
    },

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getPlantAdvice(plant, lang)
        }
        return geminiService.getPlantAdvice(plant, lang)
    },

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getProactiveDiagnosis(plant, lang)
        }
        return geminiService.getProactiveDiagnosis(plant, lang)
    },

    async getMentorResponse(plant: Plant, query: string, lang: Language): Promise<Omit<MentorMessage, 'role'>> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getMentorResponse(plant, query, '', lang)
        }
        return geminiService.getMentorResponse(plant, query, lang)
    },

    async getStrainTips(strain: Strain, context: { focus: string; stage: string; experienceLevel: string }, lang: Language): Promise<StructuredGrowTips> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getStrainTips(strain, context, lang)
        }
        return geminiService.getStrainTips(strain, context, lang)
    },

    generateStrainImage: (strain: Strain, style: ImageStyle, criteria: { focus: string; composition: string; mood: string }): Promise<string> =>
        geminiService.generateStrainImage(strain, style, criteria),

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.generateDeepDive(topic, plant, lang)
        }
        return geminiService.generateDeepDive(topic, plant, lang)
    },

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getGardenStatusSummary(plants, lang)
        }
        return geminiService.getGardenStatusSummary(plants, lang)
    },

    async getGrowLogRagAnswer(plants: Plant[], query: string, lang: Language): Promise<AIResponse> {
        if (shouldRouteLocally()) {
            const local = await getLocalAiService()
            return local.getGrowLogRagAnswer(plants, query, lang)
        }
        return geminiService.getGrowLogRagAnswer(plants, query, lang)
    },
}
