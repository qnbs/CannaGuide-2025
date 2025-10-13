import { z } from 'zod';
import { TrainingType, AmendmentType } from '@/types';

// Ring 1: Schemas for core data structures
export const GrowSetupSchema = z.object({
  lightType: z.enum(['LED', 'HPS']).optional(),
  lightWattage: z.number().min(10).optional(),
  lightHours: z.number().min(0).max(24),
  ventilation: z.enum(['low', 'medium', 'high']).optional(),
  hasCirculationFan: z.boolean().optional(),
  potSize: z.number().min(1),
  potType: z.enum(['Plastic', 'Fabric']).optional(),
  medium: z.enum(['Soil', 'Coco', 'Hydro']),
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