import { createApi, fakeBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { geminiService } from '@/services/geminiService'
import {
    Recommendation,
    Plant,
    PlantDiagnosisResponse,
    AIResponse,
    MentorMessage,
    Strain,
    StructuredGrowTips,
    DeepDiveGuide,
    Language,
} from '@/types'

interface ApiError {
    message: string
}

export const geminiApi = createApi({
    reducerPath: 'geminiApi',
    baseQuery: fakeBaseQuery<ApiError>(),
    endpoints: (builder) => ({
        getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string; lang: Language }>({
            queryFn: async (
                { prompt, lang }
            ): Promise<{ data: Recommendation } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getEquipmentRecommendation(prompt, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        diagnosePlant: builder.mutation<
            PlantDiagnosisResponse,
            { base64Image: string; mimeType: string; plant: Plant; userNotes: string, lang: Language }
        >({
            queryFn: async (
                args
            ): Promise<{ data: PlantDiagnosisResponse } | { error: ApiError }> => {
                try {
                    const data = await geminiService.diagnosePlant(
                        args.base64Image,
                        args.mimeType,
                        args.plant,
                        args.userNotes,
                        args.lang
                    )
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        getPlantAdvice: builder.mutation<AIResponse, { plant: Plant, lang: Language }>({
            queryFn: async (
                { plant, lang }
            ): Promise<{ data: AIResponse } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getPlantAdvice(plant, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        getProactiveDiagnosis: builder.mutation<AIResponse, { plant: Plant, lang: Language }>({
            queryFn: async (
                { plant, lang }
            ): Promise<{ data: AIResponse } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getProactiveDiagnosis(plant, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        getMentorResponse: builder.mutation<
            Omit<MentorMessage, 'role'>,
            { plant: Plant; query: string, lang: Language }
        >({
            queryFn: async (
                { plant, query, lang }
            ): Promise<{ data: Omit<MentorMessage, 'role'> } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getMentorResponse(plant, query, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        getStrainTips: builder.mutation<
            StructuredGrowTips,
            { strain: Strain; context: { focus: string; stage: string; experience: string }, lang: Language }
        >({
            queryFn: async (
                { strain, context, lang }
            ): Promise<{ data: StructuredGrowTips } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getStrainTips(strain, context, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        generateStrainImage: builder.mutation<string, { strain: Strain, lang: Language }>({
            queryFn: async (
                { strain, lang }
            ): Promise<{ data: string } | { error: ApiError }> => {
                try {
                    const data = await geminiService.generateStrainImage(strain.name, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        generateDeepDive: builder.mutation<DeepDiveGuide, { topic: string; plant: Plant, lang: Language }>({
            queryFn: async (
                { topic, plant, lang }
            ): Promise<{ data: DeepDiveGuide } | { error: ApiError }> => {
                try {
                    const data = await geminiService.generateDeepDive(topic, plant, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
    }),
})

export const {
    useGetEquipmentRecommendationMutation,
    useDiagnosePlantMutation,
    useGetPlantAdviceMutation,
    useGetProactiveDiagnosisMutation,
    useGetMentorResponseMutation,
    useGetStrainTipsMutation,
    useGenerateStrainImageMutation,
    useGenerateDeepDiveMutation,
} = geminiApi