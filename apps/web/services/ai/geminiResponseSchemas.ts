/**
 * Gemini structured-output response schemas (Google GenAI Type.*).
 */
import { Type } from '@google/genai'

const namedPriceRationale = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        price: { type: Type.NUMBER },
        rationale: { type: Type.STRING },
    },
    required: ['name', 'price', 'rationale'],
} as const

export const buildEquipmentRecommendationResponseSchema = (): Record<string, unknown> => ({
    type: Type.OBJECT,
    properties: {
        tent: namedPriceRationale,
        light: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                rationale: { type: Type.STRING },
                watts: { type: Type.NUMBER },
            },
            required: ['name', 'price', 'rationale', 'watts'],
        },
        ventilation: namedPriceRationale,
        circulationFan: namedPriceRationale,
        pots: namedPriceRationale,
        soil: namedPriceRationale,
        nutrients: namedPriceRationale,
        extra: namedPriceRationale,
        proTip: { type: Type.STRING },
    },
    required: [
        'tent',
        'light',
        'ventilation',
        'circulationFan',
        'pots',
        'soil',
        'nutrients',
        'extra',
        'proTip',
    ],
})

export const buildMentorResponseSchema = (): Record<string, unknown> => ({
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        uiHighlights: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    elementId: { type: Type.STRING },
                    plantId: { type: Type.STRING },
                },
                required: ['elementId'],
            },
        },
    },
    required: ['title', 'content'],
})

export const buildDiagnosePlantResponseSchema = (): Record<string, unknown> => ({
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        immediateActions: { type: Type.STRING },
        longTermSolution: { type: Type.STRING },
        prevention: { type: Type.STRING },
        diagnosis: { type: Type.STRING },
    },
    required: [
        'title',
        'content',
        'confidence',
        'immediateActions',
        'longTermSolution',
        'prevention',
        'diagnosis',
    ],
})

export const buildStrainTipsResponseSchema = (): Record<string, unknown> => ({
    type: Type.OBJECT,
    properties: {
        nutrientTip: { type: Type.STRING },
        trainingTip: { type: Type.STRING },
        environmentalTip: { type: Type.STRING },
        proTip: { type: Type.STRING },
    },
    required: ['nutrientTip', 'trainingTip', 'environmentalTip', 'proTip'],
})

export const buildDeepDiveResponseSchema = (): Record<string, unknown> => ({
    type: Type.OBJECT,
    properties: {
        introduction: { type: Type.STRING },
        stepByStep: { type: Type.ARRAY, items: { type: Type.STRING } },
        prosAndCons: {
            type: Type.OBJECT,
            properties: {
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['pros', 'cons'],
        },
        proTip: { type: Type.STRING },
    },
    required: ['introduction', 'stepByStep', 'prosAndCons', 'proTip'],
})
