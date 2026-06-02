import { z } from 'zod'
import {
    createGeminiClient,
    generateWithGeminiFallback,
    getEducationalUseOnlyInstruction,
    parseGeminiJsonFromText,
    parseGeminiJsonResponse,
    reportGeminiUsage,
} from '@/services/ai/geminiRuntime'
import {
    createLocalizedPrompt,
    MAX_OUTPUT_TOKENS_JSON,
    truncatePromptForModel,
} from '@/services/ai/geminiPromptUtils'
import {
    buildDeepDiveResponseSchema,
    buildDiagnosePlantResponseSchema,
    buildEquipmentRecommendationResponseSchema,
    buildMentorResponseSchema,
    buildStrainTipsResponseSchema,
} from '@/services/ai/geminiResponseSchemas'
import { buildLocalizedEducationalPrompt } from '@/services/ai/geminiContextBuilders'
import { generateViaAlternateProvider } from '@/services/ai/geminiProviderRouting'
import type {
    DeepDiveGuide,
    Language,
    MentorMessage,
    PlantDiagnosisResponse,
    Recommendation,
    StructuredGrowTips,
} from '@/types'
import {
    DeepDiveGuideSchema,
    MentorMessageContentSchema,
    PlantDiagnosisResponseSchema,
    RecommendationSchema,
    StructuredGrowTipsSchema,
} from '@/types/schemas'
import { getT } from '@/i18n'
import { aiRateLimiter } from '@/services/aiRateLimiter'

export async function getEquipmentRecommendationFromAlternateProvider(
    prompt: string,
    lang: Language,
): Promise<Recommendation> {
    const t = getT()
    const systemPrompt = `${getEducationalUseOnlyInstruction(lang)}\n\n${t('ai.prompts.equipmentSystemInstruction')}`
    const jsonInstruction =
        'Respond ONLY with valid JSON matching this exact structure: { "tent": {"name":"...","price":0,"rationale":"..."}, "light": {"name":"...","price":0,"rationale":"...","watts":0}, "ventilation": {"name":"...","price":0,"rationale":"..."}, "circulationFan": {"name":"...","price":0,"rationale":"..."}, "pots": {"name":"...","price":0,"rationale":"..."}, "soil": {"name":"...","price":0,"rationale":"..."}, "nutrients": {"name":"...","price":0,"rationale":"..."}, "extra": {"name":"...","price":0,"rationale":"..."}, "proTip": "..." }'

    const text = await generateViaAlternateProvider(
        'getEquipmentRecommendation',
        systemPrompt,
        `${createLocalizedPrompt(prompt, lang)}\n\n${jsonInstruction}`,
        true,
        MAX_OUTPUT_TOKENS_JSON,
    )

    return parseGeminiJsonFromText<Recommendation>(
        text,
        'ai.error.equipment',
        RecommendationSchema,
    )
}

export async function getEquipmentRecommendationFromGemini(
    prompt: string,
    lang: Language,
): Promise<Recommendation> {
    const t = getT()
    aiRateLimiter.acquireSlot('getEquipmentRecommendation')
    const ai = await createGeminiClient()
    const systemInstruction = t('ai.prompts.equipmentSystemInstruction')
    const localizedSystemInstruction = createLocalizedPrompt(
        `${getEducationalUseOnlyInstruction(lang)}\n\n${systemInstruction}`,
        lang,
    )

    const response = await generateWithGeminiFallback({
        ai,
        model: 'gemini-2.5-flash',
        contents: truncatePromptForModel(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
        ),
        config: {
            systemInstruction: localizedSystemInstruction,
            maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
            responseMimeType: 'application/json',
            responseSchema: buildEquipmentRecommendationResponseSchema(),
        },
    })
    reportGeminiUsage('getEquipmentRecommendation', response)

    return parseGeminiJsonResponse<Recommendation>(
        response,
        'ai.error.equipment',
        RecommendationSchema,
    )
}

export async function getMentorResponseFromAlternateProvider(
    prompt: string,
    lang: Language,
): Promise<Omit<MentorMessage, 'role'>> {
    const t = getT()
    const systemPrompt = `${getEducationalUseOnlyInstruction(lang)}\n\n${t('ai.prompts.mentor.systemInstruction')}`
    const jsonInstruction =
        'Respond ONLY with valid JSON matching: { "title": "...", "content": "...", "uiHighlights": [] }'
    const text = await generateViaAlternateProvider(
        'getMentorResponse',
        systemPrompt,
        `${createLocalizedPrompt(`${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`, lang)}\n\n${jsonInstruction}`,
        true,
        MAX_OUTPUT_TOKENS_JSON,
    )

    return parseGeminiJsonFromText<Omit<MentorMessage, 'role'>>(
        text,
        'ai.error.generic',
        MentorMessageContentSchema as z.ZodSchema<Omit<MentorMessage, 'role'>>,
    )
}

export async function getMentorResponseFromGemini(
    prompt: string,
    lang: Language,
): Promise<Omit<MentorMessage, 'role'>> {
    const t = getT()
    aiRateLimiter.acquireSlot('getMentorResponse')
    const ai = await createGeminiClient()
    const systemInstruction = t('ai.prompts.mentor.systemInstruction')
    const localizedSystemInstruction = createLocalizedPrompt(
        `${getEducationalUseOnlyInstruction(lang)}\n\n${systemInstruction}`,
        lang,
    )
    const localizedPrompt = createLocalizedPrompt(
        `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
        lang,
    )
    const response = await generateWithGeminiFallback({
        ai,
        model: 'gemini-2.5-flash',
        contents: truncatePromptForModel(localizedPrompt),
        config: {
            systemInstruction: localizedSystemInstruction,
            maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
            responseMimeType: 'application/json',
            responseSchema: buildMentorResponseSchema(),
        },
    })
    reportGeminiUsage('getMentorResponse', response)

    return parseGeminiJsonResponse<Omit<MentorMessage, 'role'>>(
        response,
        'ai.error.generic',
        MentorMessageContentSchema as z.ZodSchema<Omit<MentorMessage, 'role'>>,
    )
}

export async function diagnosePlantViaGemini(
    base64Image: string,
    mimeType: string,
    localizedPrompt: string,
): Promise<PlantDiagnosisResponse> {
    aiRateLimiter.acquireSlot('diagnosePlant')
    const ai = await createGeminiClient()
    const imagePart = { inlineData: { data: base64Image, mimeType } }
    const textPart = { text: localizedPrompt }

    const response = await generateWithGeminiFallback({
        ai,
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
            responseMimeType: 'application/json',
            responseSchema: buildDiagnosePlantResponseSchema(),
        },
    })
    reportGeminiUsage('diagnosePlant', response)

    return parseGeminiJsonResponse<PlantDiagnosisResponse>(
        response,
        'ai.error.diagnostics',
        PlantDiagnosisResponseSchema,
    )
}

export async function getStrainTipsFromAlternateProvider(
    localizedPrompt: string,
    lang: Language,
): Promise<StructuredGrowTips> {
    const jsonInstruction =
        'Respond ONLY with valid JSON matching: { "nutrientTip": "...", "trainingTip": "...", "environmentalTip": "...", "proTip": "..." }'
    const text = await generateViaAlternateProvider(
        'getStrainTips',
        getEducationalUseOnlyInstruction(lang),
        `${localizedPrompt}\n\n${jsonInstruction}`,
        true,
        MAX_OUTPUT_TOKENS_JSON,
    )
    return parseGeminiJsonFromText<StructuredGrowTips>(
        text,
        'ai.error.tips',
        StructuredGrowTipsSchema,
    )
}

export async function getStrainTipsFromGemini(localizedPrompt: string): Promise<StructuredGrowTips> {
    aiRateLimiter.acquireSlot('getStrainTips')
    const ai = await createGeminiClient()
    const response = await generateWithGeminiFallback({
        ai,
        model: 'gemini-2.5-flash',
        contents: truncatePromptForModel(localizedPrompt),
        config: {
            maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
            responseMimeType: 'application/json',
            responseSchema: buildStrainTipsResponseSchema(),
        },
    })
    reportGeminiUsage('getStrainTips', response)

    return parseGeminiJsonResponse<StructuredGrowTips>(
        response,
        'ai.error.tips',
        StructuredGrowTipsSchema,
    )
}

export async function generateDeepDiveFromAlternateProvider(
    localizedPrompt: string,
    lang: Language,
): Promise<DeepDiveGuide> {
    const jsonInstruction =
        'Respond ONLY with valid JSON matching: { "introduction": "...", "stepByStep": ["..."], "prosAndCons": { "pros": ["..."], "cons": ["..."] }, "proTip": "..." }'
    const text = await generateViaAlternateProvider(
        'generateDeepDive',
        getEducationalUseOnlyInstruction(lang),
        `${localizedPrompt}\n\n${jsonInstruction}`,
        true,
        MAX_OUTPUT_TOKENS_JSON,
    )
    return parseGeminiJsonFromText<DeepDiveGuide>(text, 'ai.error.deepDive', DeepDiveGuideSchema)
}

export async function generateDeepDiveFromGemini(localizedPrompt: string): Promise<DeepDiveGuide> {
    aiRateLimiter.acquireSlot('generateDeepDive')
    const ai = await createGeminiClient()
    const response = await generateWithGeminiFallback({
        ai,
        model: 'gemini-2.5-pro',
        fallbackModel: 'gemini-2.5-flash',
        contents: truncatePromptForModel(localizedPrompt),
        config: {
            maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
            responseMimeType: 'application/json',
            responseSchema: buildDeepDiveResponseSchema(),
        },
    })
    reportGeminiUsage('generateDeepDive', response)

    return parseGeminiJsonResponse<DeepDiveGuide>(
        response,
        'ai.error.deepDive',
        DeepDiveGuideSchema,
    )
}

export { buildLocalizedEducationalPrompt }
