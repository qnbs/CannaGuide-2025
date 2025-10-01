import { z } from 'zod';

// Enums as Zod enums
export const PlantStageSchema = z.enum(['SEED', 'GERMINATION', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'HARVEST', 'DRYING', 'CURING', 'FINISHED']);
export const StrainTypeSchema = z.enum(['Sativa', 'Indica', 'Hybrid']);
export const DifficultyLevelSchema = z.enum(['Easy', 'Medium', 'Hard']);
export const YieldLevelSchema = z.enum(['Low', 'Medium', 'High']);
export const HeightLevelSchema = z.enum(['Short', 'Medium', 'Tall']);
export const ProblemTypeSchema = z.enum(['NUTRIENT_DEFICIENCY', 'OVERWATERING', 'UNDERWATERING', 'PEST_INFESTATION', 'PH_TOO_HIGH', 'PH_TOO_LOW', 'HUMIDITY_TOO_HIGH', 'HUMIDITY_TOO_LOW', 'TEMPERATURE_TOO_HIGH', 'TEMPERATURE_TOO_LOW', 'NUTRIENT_BURN']);
export const JournalEntryTypeSchema = z.enum(['WATERING', 'FEEDING', 'TRAINING', 'OBSERVATION', 'SYSTEM', 'PHOTO', 'PEST_CONTROL', 'ENVIRONMENT', 'AMENDMENT']);
export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);
export const TrainingTypeSchema = z.enum(['LST', 'Topping', 'FIMing', 'Defoliation']);

// Schemas for nested interfaces
export const StrainSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: StrainTypeSchema,
    typeDetails: z.string().optional(),
    genetics: z.string().optional(),
    floweringType: z.enum(['Photoperiod', 'Autoflower']),
    thc: z.number(),
    cbd: z.number(),
    thcRange: z.string().optional(),
    cbdRange: z.string().optional(),
    floweringTime: z.number(),
    floweringTimeRange: z.string().optional(),
    description: z.string().optional(),
    agronomic: z.object({
        difficulty: DifficultyLevelSchema,
        yield: YieldLevelSchema,
        height: HeightLevelSchema,
        yieldDetails: z.object({ indoor: z.string(), outdoor: z.string() }).optional(),
        heightDetails: z.object({ indoor: z.string(), outdoor: z.string() }).optional(),
    }),
    aromas: z.array(z.string()).optional(),
    dominantTerpenes: z.array(z.string()).optional(),
    geneticModifiers: z.object({
        pestResistance: z.number(),
        nutrientUptakeRate: z.number(),
        stressTolerance: z.number(),
        rue: z.number(),
    }),
});

export const PlantProblemSchema = z.object({
    type: ProblemTypeSchema,
    status: z.enum(['active', 'resolved']),
    severity: z.number(),
    detectedAt: z.number(),
    resolvedAt: z.number().optional(),
});

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: TaskPrioritySchema,
    isCompleted: z.boolean(),
    createdAt: z.number(),
    completedAt: z.number().optional(),
});

export const JournalEntrySchema = z.object({
    id: z.string(),
    createdAt: z.number(),
    type: JournalEntryTypeSchema,
    notes: z.string(),
    details: z.record(z.any()).optional(),
});

export const PlantHistoryEntrySchema = z.object({
    day: z.number(),
    height: z.number(),
    health: z.number(),
    stressLevel: z.number(),
    medium: z.object({
        ph: z.number(),
        ec: z.number(),
        moisture: z.number(),
    }),
});

export const HarvestDataSchema = z.object({
    wetWeight: z.number(),
    dryWeight: z.number(),
    terpeneRetentionPercent: z.number(),
    moldRiskPercent: z.number(),
    dryingEnvironment: z.object({ temperature: z.number(), humidity: z.number() }),
    currentDryDay: z.number(),
    currentCureDay: z.number(),
    jarHumidity: z.number(),
    finalQuality: z.number(),
    chlorophyllPercent: z.number(),
    terpeneProfile: z.record(z.number()),
    cannabinoidProfile: z.object({ thc: z.number(), cbn: z.number() }),
    lastBurpDay: z.number(),
});

export const PlantSchema = z.object({
    id: z.string(),
    name: z.string(),
    strain: StrainSchema,
    createdAt: z.number(),
    lastUpdated: z.number(),
    age: z.number(),
    stage: PlantStageSchema,
    height: z.number(),
    biomass: z.number(),
    health: z.number(),
    stressLevel: z.number(),
    nutrientPool: z.number(),
    problems: z.array(PlantProblemSchema),
    tasks: z.array(TaskSchema),
    journal: z.array(JournalEntrySchema),
    history: z.array(PlantHistoryEntrySchema),
    isTopped: z.boolean(),
    lstApplied: z.number(),
    environment: z.object({
        internalTemperature: z.number(),
        internalHumidity: z.number(),
        vpd: z.number(),
        co2Level: z.number(),
    }),
    medium: z.object({
        ph: z.number(),
        ec: z.number(),
        moisture: z.number(),
        microbeHealth: z.number(),
    }),
    rootSystem: z.object({
        health: z.number(),
        microbeActivity: z.number(),
        rootMass: z.number(),
    }),
    structuralModel: z.object({
        branches: z.number(),
        nodes: z.number(),
        leafCount: z.number(),
    }),
    equipment: z.object({
        light: z.object({ wattage: z.number(), isOn: z.boolean(), lightHours: z.number() }),
        fan: z.object({ isOn: z.boolean(), speed: z.number() }),
    }),
    harvestData: HarvestDataSchema.optional(),
});

export const GrowSetupSchema = z.object({
    potSize: z.number().min(1),
    medium: z.enum(['Soil', 'Coco', 'Hydro']),
    lightHours: z.number().min(0).max(24),
});

export const WaterDataSchema = z.object({
    amount: z.number().min(0),
    ph: z.number().min(0).max(14),
    ec: z.number().min(0).optional(),
});
