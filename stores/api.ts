// This API slice uses a custom `queryFn` for all endpoints to interact with the Gemini service.
// `fakeBaseQuery` is used as a placeholder to satisfy RTK Query's `baseQuery` requirement.
// All RTK Query imports are from '@reduxjs/toolkit/query/react' to ensure the endpoint 
// builder is correctly typed and React hooks are auto-generated.
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
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
import { geminiService } from '@/services/geminiService';

// This API slice uses a custom `queryFn` for all endpoints to interact with the Gemini service.
// `fakeBaseQuery` is used as a placeholder to satisfy RTK Query's `baseQuery` requirement
// and ensure the endpoint builder is correctly typed.
export const geminiApi = createApi({
    reducerPath: 'geminiApi',
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        getEquipmentRecommendation: builder.mutation({
            async queryFn({
                prompt,
                lang,
            }: {
                prompt: string
                lang: Language
            }): Promise<{ data: Recommendation } | { error: { message: string } }> {
                try {
                    const data = await geminiService.getEquipmentRecommendation(prompt, lang)
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
                }
            },
        }),
        diagnosePlant: builder.mutation({
            async queryFn({
                base64Image,
                mimeType,
                plant,
                userNotes,
                lang,
            }: {
                base64Image: string
                mimeType: string
                plant: Plant
                userNotes: string
                lang: Language
            }): Promise<{ data: PlantDiagnosisResponse } | { error: { message: string } }> {
                try {
                    const data = await geminiService.diagnosePlant(
                        base64Image,
                        mimeType,
                        plant,
                        userNotes,
                        lang,
                    )
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
                }
            },
        }),
        getPlantAdvice: builder.mutation({
            async queryFn({
                plant,
                lang,
            }: {
                plant: Plant
                lang: Language
            }): Promise<{ data: AIResponse } | { error: { message: string } }> {
                try {
                    const data = await geminiService.getPlantAdvice(plant, lang)
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
                }
            },
        }),
        getProactiveDiagnosis: builder.mutation({
            async queryFn({
                plant,
                lang,
            }: {
                plant: Plant
                lang: Language
            }): Promise<{ data: AIResponse } | { error: { message: string } }> {
                try {
                    const data = await geminiService.getProactiveDiagnosis(plant, lang)
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
                }
            },
        }),
        getMentorResponse: builder.mutation({
            async queryFn({
                plant,
                query,
                lang,
            }: {
                plant: Plant
                query: string
                lang: Language
            }): Promise<{ data: Omit<MentorMessage, 'role'> } | { error: { message: string } }> {
                try {
                    const data = await geminiService.getMentorResponse(plant, query, lang)
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
                }
            },
        }),
        getStrainTips: builder.mutation({
            async queryFn({
                strain,
                context,
                lang,
            }: {
                strain: Strain
                context: { focus: string; stage: string; experienceLevel: string }
                lang: Language
            }): Promise<{ data: StructuredGrowTips } | { error: { message: string } }> {
                try {
                    const data = await geminiService.getStrainTips(strain, context, lang)
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
                }
            },
        }),
        generateStrainImage: builder.mutation({
            async queryFn({
                strain,
                style,
                criteria,
            }: {
                strain: Strain
                style: string
                criteria: { focus: string; composition: string; mood: string }
            }): Promise<{ data: string } | { error: { message: string } }> {
                try {
                    const data = await geminiService.generateStrainImage(strain, style as any, criteria)
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
                }
            },
        }),
        getDeepDive: builder.mutation({
            async queryFn({
                topic,
                plant,
                lang,
            }: {
                topic: string
                plant: Plant
                lang: Language
            }): Promise<{ data: DeepDiveGuide } | { error: { message: string } }> {
                try {
                    const data = await geminiService.generateDeepDive(topic, plant, lang)
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
                }
            },
        }),
        getGardenStatusSummary: builder.mutation({
            async queryFn({
                plants,
                lang,
            }: {
                plants: Plant[]
                lang: Language
            }): Promise<{ data: AIResponse } | { error: { message: string } }> {
                try {
                    const data = await geminiService.getGardenStatusSummary(plants, lang)
                    return { data }
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : 'ai.error.unknown'
                    return { error: { message } }
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
    useGetDeepDiveMutation,
    useGetGardenStatusSummaryMutation,
} = geminiApi
