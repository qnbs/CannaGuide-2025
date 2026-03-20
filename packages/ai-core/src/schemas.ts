// ---------------------------------------------------------------------------
// Zod validation schemas for AI response types
// ---------------------------------------------------------------------------

import { z } from 'zod'

export const AIResponseSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(8000),
})

export const PlantDiagnosisResponseSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(4000),
    confidence: z.number().min(0).max(1),
    immediateActions: z.string().min(1).max(2000),
    longTermSolution: z.string().min(1).max(2000),
    prevention: z.string().min(1).max(2000),
    diagnosis: z.string().min(1).max(2000),
})

export const StructuredGrowTipsSchema = z.object({
    nutrientTip: z.string().min(1).max(1000),
    trainingTip: z.string().min(1).max(1000),
    environmentalTip: z.string().min(1).max(1000),
    proTip: z.string().min(1).max(1000),
})

export const DeepDiveGuideSchema = z.object({
    introduction: z.string().min(1).max(3000),
    stepByStep: z.array(z.string().max(1000)).min(1).max(20),
    prosAndCons: z.object({
        pros: z.array(z.string().max(500)).max(10),
        cons: z.array(z.string().max(500)).max(10),
    }),
    proTip: z.string().min(1).max(1000),
})

export const RecommendationItemSchema = z.object({
    name: z.string().min(1).max(200),
    price: z.number().min(0),
    rationale: z.string().min(1).max(500),
    watts: z.number().optional(),
})

export const RecommendationSchema = z.object({
    tent: RecommendationItemSchema,
    light: RecommendationItemSchema,
    ventilation: RecommendationItemSchema,
    circulationFan: RecommendationItemSchema,
    pots: RecommendationItemSchema,
    soil: RecommendationItemSchema,
    nutrients: RecommendationItemSchema,
    extra: RecommendationItemSchema,
    proTip: z.string().min(1).max(1000),
})
