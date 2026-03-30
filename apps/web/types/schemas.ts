import { z } from 'zod';

// Ring 1: Schemas for core data structures
export const GrowSetupSchema = z.object({
  lightType: z.enum(['LED', 'HPS']).optional(),
  lightWattage: z.number().min(10).optional(),
  lightHours: z.number().min(0).max(24),
  ventilation: z.enum(['low', 'medium', 'high']).optional(),
  hasCirculationFan: z.boolean().optional(),
  potSize: z.number().min(1),
  potType: z.enum(['Plastic', 'Fabric']).optional(),
  medium: z.enum(['Soil', 'Coco', 'Hydro', 'Aeroponics']),
  dynamicLighting: z.boolean().optional(),
});

// Schemas for user actions (to be used in Ring 3)
export const WaterDataSchema = z.object({
    amountMl: z.number().min(0).optional(),
    ph: z.number().min(0).max(14).optional(),
    ec: z.number().min(0).optional()
});

export const FeedDataSchema = z.object({
    amountMl: z.number().min(0),
    ec: z.number().min(0),
    ph: z.number().min(0).max(14),
    npk: z.object({
        n: z.number().min(0),
        p: z.number().min(0),
        k: z.number().min(0),
    }).optional(),
});

export const TrainingDataSchema = z.object({
    type: z.enum(['LST', 'Topping', 'FIMing', 'Defoliation']),
});

export const PestControlDataSchema = z.object({
    method: z.string().min(1),
    product: z.string().optional()
});

export const AmendmentDataSchema = z.object({
    type: z.enum(['Mycorrhizae', 'WormCastings']),
});

// ---------------------------------------------------------------------------
// AI response schemas – used in geminiService.parseJsonResponse() for
// belt-and-suspenders validation after Gemini's own responseSchema enforcement.
// ---------------------------------------------------------------------------

/** Generic two-field AI response (advisor, proactive diagnosis, garden status) */
export const AIResponseSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(8000),
});

/** Plant image diagnosis */
export const PlantDiagnosisResponseSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(4000),
    confidence: z.number().min(0).max(1),
    immediateActions: z.string().min(1).max(2000),
    longTermSolution: z.string().min(1).max(2000),
    prevention: z.string().min(1).max(2000),
    diagnosis: z.string().min(1).max(2000),
});

/** Grow tips (strain + plant) */
export const StructuredGrowTipsSchema = z.object({
    nutrientTip: z.string().min(1).max(1000),
    trainingTip: z.string().min(1).max(1000),
    environmentalTip: z.string().min(1).max(1000),
    proTip: z.string().min(1).max(1000),
});

/** Deep-dive guide */
export const DeepDiveGuideSchema = z.object({
    introduction: z.string().min(1).max(3000),
    stepByStep: z.array(z.string().max(1000)).min(1).max(20),
    prosAndCons: z.object({
        pros: z.array(z.string().max(500)).max(10),
        cons: z.array(z.string().max(500)).max(10),
    }),
    proTip: z.string().min(1).max(1000),
});

/** Mentor chat message */
export const MentorMessageContentSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(6000),
    uiHighlights: z.array(
        z.object({
            elementId: z.string().max(100),
            plantId: z.string().max(100).optional(),
        })
    ).max(10).optional(),
});

/** Equipment recommendation */
const RecommendationItemSchema = z.object({
    name: z.string().min(1).max(200),
    price: z.number().min(0).max(100000),
    rationale: z.string().min(1).max(1000),
    watts: z.number().min(0).optional(),
});

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
});

/** Garden status summary (AI narrative) */
export const GardenStatusSummarySchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(4000),
});

/** Breeding tips (strain crossing advice) */
export const BreedingTipsSchema = z.object({
    crossName: z.string().min(1).max(200),
    rationale: z.string().min(1).max(2000),
    expectedTraits: z.array(z.string().max(300)).min(1).max(10),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    tips: z.array(z.string().max(500)).min(1).max(10),
});
