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

const getAiService = async () => {
    const module = await import('@/services/aiService')
    return module.aiService
}

const mapAiErrorMessage = (error: unknown): string => {
    const t = getT()

    if (error instanceof Error && typeof error.message === 'string' && error.message.length > 0) {
        // Rate limit errors carry retry seconds: "ai.error.rateLimited:30"
        if (error.message.startsWith('ai.error.rateLimited')) {
            const parts = error.message.split(':')
            const seconds = parts[1] ?? '60'
            return t('ai.error.rateLimited', { seconds })
        }
        if (error.message.startsWith('ai.error.') || error.message.startsWith('settingsView.security.')) {
            return t(error.message)
        }
        return error.message
    }

    return t('ai.error.unknown')
}

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
                    const aiService = await getAiService()
                    const data = await aiService.getEquipmentRecommendation(prompt, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
                    const aiService = await getAiService()
                    const data = await aiService.diagnosePlant(
                        base64Image,
                        mimeType,
                        plant,
                        userNotes,
                        lang,
                    )
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
                    const aiService = await getAiService()
                    const data = await aiService.getPlantAdvice(plant, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
                    const aiService = await getAiService()
                    const data = await aiService.getProactiveDiagnosis(plant, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
                    const aiService = await getAiService()
                    const data = await aiService.getMentorResponse(plant, query, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
                    const aiService = await getAiService()
                    const data = await aiService.getStrainTips(strain, context, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
                    const aiService = await getAiService()
                    const data = await aiService.generateStrainImage(strain, style as import('@/services/geminiService').ImageStyle, criteria)
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
                    const aiService = await getAiService()
                    const data = await aiService.generateDeepDive(topic, plant, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
                    const aiService = await getAiService()
                    const data = await aiService.getGardenStatusSummary(plants, lang)
                    return { data }
                } catch (error) {
                    return { error: { message: mapAiErrorMessage(error) } }
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
