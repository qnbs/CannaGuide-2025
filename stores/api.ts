import { createApi } from '@reduxjs/toolkit/query/react'
// FIX: QueryReturnValue is no longer used directly and can be removed from the import.
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
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

// FIX: A correctly typed `baseQuery` is necessary for RTK Query's builder type inference.
// The previous implementation used an unsafe type assertion `{} as QueryReturnValue<...>`, which
// broke TypeScript's type inference. This new version returns a valid, type-safe error object,
// which resolves the "Untyped function calls may not accept type arguments" errors on the builder methods.
const customFakeBaseQuery: BaseQueryFn<
  string | void,
  unknown,
  ApiError,
  {}
> = async () => {
    return { error: { message: 'When using `queryFn`, `baseQuery` should not be called.' } };
};

export const geminiApi = createApi({
    reducerPath: 'geminiApi',
    baseQuery: customFakeBaseQuery,
    endpoints: (builder) => ({
        getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string; lang: Language }>({
            queryFn: async ({ prompt, lang }): Promise<{ data: Recommendation } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getEquipmentRecommendation(prompt, lang)
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        diagnosePlant: builder.mutation<PlantDiagnosisResponse, { base64Image: string; mimeType: string; plant: Plant; userNotes: string, lang: Language }>({
            queryFn: async (args): Promise<{ data: PlantDiagnosisResponse } | { error: ApiError }> => {
                try {
                    const data = await geminiService.diagnosePlant(
                        args.base64Image,
                        args.mimeType,
                        args.plant,
                        args.userNotes,
                        args.lang
                    )
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getPlantAdvice: builder.mutation<AIResponse, { plant: Plant, lang: Language }>({
            queryFn: async ({ plant, lang }): Promise<{ data: AIResponse } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getPlantAdvice(plant, lang)
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getProactiveDiagnosis: builder.mutation<AIResponse, { plant: Plant, lang: Language }>({
            queryFn: async ({ plant, lang }): Promise<{ data: AIResponse } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getProactiveDiagnosis(plant, lang)
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getMentorResponse: builder.mutation<Omit<MentorMessage, 'role'>, { plant: Plant; query: string, lang: Language }>({
            queryFn: async ({ plant, query, lang }): Promise<{ data: Omit<MentorMessage, 'role'> } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getMentorResponse(plant, query, lang)
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getStrainTips: builder.mutation<StructuredGrowTips, { strain: Strain; context: { focus: string; stage: string; experience: string }, lang: Language }>({
            queryFn: async ({ strain, context, lang }): Promise<{ data: StructuredGrowTips } | { error: ApiError }> => {
                try {
                    const data = await geminiService.getStrainTips(strain, context, lang)
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        generateStrainImage: builder.mutation<string, { strain: Strain, lang: Language }>({
            queryFn: async ({ strain, lang }): Promise<{ data: string } | { error: ApiError }> => {
                try {
                    const data = await geminiService.generateStrainImage(strain.name, lang)
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        generateDeepDive: builder.mutation<DeepDiveGuide, { topic: string; plant: Plant, lang: Language }>({
            queryFn: async ({ topic, plant, lang }): Promise<{ data: DeepDiveGuide } | { error: ApiError }> => {
                try {
                    const data = await geminiService.generateDeepDive(topic, plant, lang)
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
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