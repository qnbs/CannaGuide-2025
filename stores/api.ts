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
import { RootState } from './store'

interface ApiError {
    message: string
}

export const geminiApi = createApi({
    reducerPath: 'geminiApi',
    baseQuery: fakeBaseQuery<ApiError>(),
    endpoints: (builder) => ({
        getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string }>({
            queryFn: async (
                { prompt },
                { getState }
            ): Promise<{ data: Recommendation } | { error: ApiError }> => {
                // FIX: Cast getState() result to RootState in a separate variable to avoid untyped function call error.
                const state = getState() as RootState;
                const lang = state.settings.settings.language
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
            { base64Image: string; mimeType: string; plant: Plant; userNotes: string }
        >({
            queryFn: async (
                args,
                { getState }
            ): Promise<{ data: PlantDiagnosisResponse } | { error: ApiError }> => {
                // FIX: Cast getState() result to RootState in a separate variable to avoid untyped function call error.
                const state = getState() as RootState;
                const lang = state.settings.settings.language
                try {
                    const data = await geminiService.diagnosePlant(
                        args.base64Image,
                        args.mimeType,
                        args.plant,
                        args.userNotes,
                        lang
                    )
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        getPlantAdvice: builder.mutation<AIResponse, Plant>({
            queryFn: async (
                plant,
                { getState }
            ): Promise<{ data: AIResponse } | { error: ApiError }> => {
                // FIX: Cast getState() result to RootState in a separate variable to avoid untyped function call error.
                const state = getState() as RootState;
                const lang = state.settings.settings.language
                try {
                    const data = await geminiService.getPlantAdvice(plant, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        getProactiveDiagnosis: builder.mutation<AIResponse, Plant>({
            queryFn: async (
                plant,
                { getState }
            ): Promise<{ data: AIResponse } | { error: ApiError }> => {
                // FIX: Cast getState() result to RootState in a separate variable to avoid untyped function call error.
                const state = getState() as RootState;
                const lang = state.settings.settings.language
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
            { plant: Plant; query: string }
        >({
            queryFn: async (
                { plant, query },
                { getState }
            ): Promise<{ data: Omit<MentorMessage, 'role'> } | { error: ApiError }> => {
                // FIX: Cast getState() result to RootState in a separate variable to avoid untyped function call error.
                const state = getState() as RootState;
                const lang = state.settings.settings.language
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
            { strain: Strain; context: { focus: string; stage: string; experience: string } }
        >({
            queryFn: async (
                { strain, context },
                { getState }
            ): Promise<{ data: StructuredGrowTips } | { error: ApiError }> => {
                // FIX: Cast getState() result to RootState in a separate variable to avoid untyped function call error.
                const state = getState() as RootState;
                const lang = state.settings.settings.language
                try {
                    const data = await geminiService.getStrainTips(strain, context, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        generateStrainImage: builder.mutation<string, Strain>({
            queryFn: async (
                strain,
                { getState }
            ): Promise<{ data: string } | { error: ApiError }> => {
                // FIX: Cast getState() result to RootState in a separate variable to avoid untyped function call error.
                const state = getState() as RootState;
                const lang = state.settings.settings.language
                try {
                    const data = await geminiService.generateStrainImage(strain.name, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: (error as Error).message } }
                }
            },
        }),
        generateDeepDive: builder.mutation<DeepDiveGuide, { topic: string; plant: Plant }>({
            queryFn: async (
                { topic, plant },
                { getState }
            ): Promise<{ data: DeepDiveGuide } | { error: ApiError }> => {
                // FIX: Cast getState() result to RootState in a separate variable to avoid untyped function call error.
                const state = getState() as RootState;
                const lang = state.settings.settings.language
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
