import { geminiService, type ImageStyle } from '@/services/geminiService'
import { Language, Plant, Recommendation, Strain, PlantDiagnosisResponse, AIResponse, StructuredGrowTips, DeepDiveGuide, MentorMessage } from '@/types'

export const aiService = {
    getEquipmentRecommendation: (prompt: string, lang: Language): Promise<Recommendation> =>
        geminiService.getEquipmentRecommendation(prompt, lang),
    diagnosePlant: (base64Image: string, mimeType: string, plant: Plant, userNotes: string, lang: Language): Promise<PlantDiagnosisResponse> =>
        geminiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang),
    getPlantAdvice: (plant: Plant, lang: Language): Promise<AIResponse> =>
        geminiService.getPlantAdvice(plant, lang),
    getProactiveDiagnosis: (plant: Plant, lang: Language): Promise<AIResponse> =>
        geminiService.getProactiveDiagnosis(plant, lang),
    getMentorResponse: (plant: Plant, query: string, lang: Language): Promise<Omit<MentorMessage, 'role'>> =>
        geminiService.getMentorResponse(plant, query, lang),
    getStrainTips: (strain: Strain, context: { focus: string; stage: string; experienceLevel: string }, lang: Language): Promise<StructuredGrowTips> =>
        geminiService.getStrainTips(strain, context, lang),
    generateStrainImage: (strain: Strain, style: ImageStyle, criteria: { focus: string; composition: string; mood: string }): Promise<string> =>
        geminiService.generateStrainImage(strain, style, criteria),
    generateDeepDive: (topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> =>
        geminiService.generateDeepDive(topic, plant, lang),
    getGardenStatusSummary: (plants: Plant[], lang: Language): Promise<AIResponse> =>
        geminiService.getGardenStatusSummary(plants, lang),
    getGrowLogRagAnswer: (plants: Plant[], query: string, lang: Language): Promise<AIResponse> =>
        geminiService.getGrowLogRagAnswer(plants, query, lang),
}
