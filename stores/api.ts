import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { geminiService } from '@/services/geminiService'
import {
    Plant,
    Recommendation,
    Strain,
    PlantDiagnosisResponse,
    AIResponse,
    StructuredGrowTips,
    DeepDiveGuide,
    MentorMessage,
    Language,
} from '@/types'
import { getT } from '@/i18n'

// This API slice uses a custom `queryFn` for all endpoints to interact with the Gemini service.
// `fakeBaseQuery` is used as a placeholder to satisfy RTK Query's `baseQuery` requirement
// and ensure the endpoint builder is correctly typed.
export const geminiApi = createApi({
    reducerPath: 'geminiApi',
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string; lang: Language }>({
            queryFn: async ({ prompt, lang }) => {
                try {
                    const data = await geminiService.getEquipmentRecommendation(prompt, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    // FIX: Explicitly cast the result of the `t` function to a string to resolve TypeScript errors with i18next's overloaded function signatures.
                    const message = err instanceof Error ? String(t(err.message)) : String(err);
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
                    const t = getT();
                    // FIX: Explicitly cast the result of the `t` function to a string to resolve TypeScript errors with i18next's overloaded function signatures.
                    const message = err instanceof Error ? String(t(err.message)) : String(err);
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
                    const t = getT();
                    // FIX: Explicitly cast the result of the `t` function to a string to resolve TypeScript errors with i18next's overloaded function signatures.
                    const message = err instanceof Error ? String(t(err.message)) : String(err);
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
                    const t = getT();
                    // FIX: Explicitly cast the result of the `t` function to a string to resolve TypeScript errors with i18next's overloaded function signatures.
                    const message = err instanceof Error ? String(t(err.message)) : String(err);
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
                    const t = getT();
                    // FIX: Explicitly cast the result of the `t` function to a string to resolve TypeScript errors with i18next's overloaded function signatures.
                    const message = err instanceof Error ? String(t(err.message)) : String(err);
                    return { error: { message } };
                }
            },
        }),
        getStrainTips: builder.mutation<StructuredGrowTips, { strain: Strain; context: { focus: string; stage: string; experienceLevel: string }, lang: Language }>({
            // FIX: Corrected the type for `context` to use `experienceLevel` instead of `experience` to match the service function signature.
            queryFn: async ({ strain, context, lang }) => {
                try {
                    const data = await geminiService.getStrainTips(strain, context, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    // FIX: Explicitly cast the result of the `t` function to a string to resolve TypeScript errors with i18next's overloaded function signatures.
                    const message = err instanceof Error ? String(t(err.message)) : String(err);
                    return { error: { message } };
                }
            },
        }),
        generateStrainImage: builder.mutation<string, { strain: Strain, lang: Language }>({
            queryFn: async ({ strain, lang }) => {
                try {
                    const data = await geminiService.generateStrainImage(strain, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    // FIX: Explicitly cast the result of the `t` function to a string to resolve TypeScript errors with i18next's overloaded function signatures.
                    const message = err instanceof Error ? String(t(err.message)) : String(err);
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
                    const t = getT();
                    // FIX: Explicitly cast the result of the `t` function to a string to resolve TypeScript errors with i18next's overloaded function signatures.
                    const message = err instanceof Error ? String(t(err.message)) : String(err);
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
