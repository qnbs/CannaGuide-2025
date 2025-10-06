

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
        getEquipmentRecommendation: builder.mutation({
            queryFn: async ({ prompt, lang }: { prompt: string; lang: Language }) => {
                try {
                    const data = await geminiService.getEquipmentRecommendation(prompt, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    const message = err instanceof Error ? t(err.message) || err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        diagnosePlant: builder.mutation({
            queryFn: async ({ base64Image, mimeType, plant, userNotes, lang }: { base64Image: string; mimeType: string; plant: Plant; userNotes: string, lang: Language }) => {
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
                    const message = err instanceof Error ? t(err.message) || err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getPlantAdvice: builder.mutation({
            queryFn: async ({ plant, lang }: { plant: Plant, lang: Language }) => {
                try {
                    const data = await geminiService.getPlantAdvice(plant, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    const message = err instanceof Error ? t(err.message) || err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getProactiveDiagnosis: builder.mutation({
            queryFn: async ({ plant, lang }: { plant: Plant, lang: Language }) => {
                try {
                    const data = await geminiService.getProactiveDiagnosis(plant, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    const message = err instanceof Error ? t(err.message) || err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getMentorResponse: builder.mutation({
            queryFn: async ({ plant, query, lang }: { plant: Plant; query: string, lang: Language }) => {
                try {
                    const data = await geminiService.getMentorResponse(plant, query, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    const message = err instanceof Error ? t(err.message) || err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        getStrainTips: builder.mutation({
            // FIX: Corrected the type for `context` to use `experienceLevel` instead of `experience` to match the service function signature.
            queryFn: async ({ strain, context, lang }: { strain: Strain; context: { focus: string; stage: string; experienceLevel: string }, lang: Language }) => {
                try {
                    const data = await geminiService.getStrainTips(strain, context, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    const message = err instanceof Error ? t(err.message) || err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        generateStrainImage: builder.mutation({
            queryFn: async ({ strain, lang }: { strain: Strain, lang: Language }) => {
                try {
                    const data = await geminiService.generateStrainImage(strain, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    const message = err instanceof Error ? t(err.message) || err.message : String(err);
                    return { error: { message } };
                }
            },
        }),
        generateDeepDive: builder.mutation({
            queryFn: async ({ topic, plant, lang }: { topic: string; plant: Plant, lang: Language }) => {
                try {
                    const data = await geminiService.generateDeepDive(topic, plant, lang)
                    return { data }
                } catch (err) {
                    const t = getT();
                    const message = err instanceof Error ? t(err.message) || err.message : String(err);
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