import { createApi } from '@reduxjs/toolkit/query/react'
// FIX: Changed to `import type` for `BaseQueryFn`. Using a type-only import is the correct approach for TypeScript's inference engine to correctly type the RTK Query builder. The builder was previously untyped, leading to errors on `builder.mutation`.
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

// When using `queryFn` for all endpoints, RTK Query still needs a `baseQuery` for type inference.
// Without it, the `builder` argument in the `endpoints` function is untyped, leading to "Untyped function calls may not accept type arguments" errors.
// A properly typed fake base query is the standard pattern to resolve this.
const fakeBaseQuery: BaseQueryFn<void, unknown, ApiError> = () => {
  return { error: { message: 'When using `queryFn`, `baseQuery` should not be called.' } };
};

export const geminiApi = createApi({
    reducerPath: 'geminiApi',
    baseQuery: fakeBaseQuery,
    endpoints: (builder) => ({
        getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string; lang: Language }>({
            queryFn: async ({ prompt, lang }) => {
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
            queryFn: async ({ base64Image, mimeType, plant, userNotes, lang }) => {
                try {
                    const data = await geminiService.diagnosePlant(
                        base64Image,
                        mimeType,
                        plant,
                        userNotes,
                        lang
                    )
                    return { data }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getPlantAdvice: builder.mutation<AIResponse, { plant: Plant, lang: Language }>({
            queryFn: async ({ plant, lang }) => {
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
            queryFn: async ({ plant, lang }) => {
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
            queryFn: async ({ plant, query, lang }) => {
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
            queryFn: async ({ strain, context, lang }) => {
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
            queryFn: async ({ strain, lang }) => {
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
            queryFn: async ({ topic, plant, lang }) => {
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