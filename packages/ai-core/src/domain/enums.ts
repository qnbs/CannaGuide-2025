// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- shared domain enums & string literal types
// ---------------------------------------------------------------------------

export enum PlantStage {
    Seed = 'SEED',
    Germination = 'GERMINATION',
    Seedling = 'SEEDLING',
    Vegetative = 'VEGETATIVE',
    Flowering = 'FLOWERING',
    Harvest = 'HARVEST',
    Drying = 'DRYING',
    Curing = 'CURING',
    Finished = 'FINISHED',
}

export enum StrainType {
    Sativa = 'Sativa',
    Indica = 'Indica',
    Hybrid = 'Hybrid',
}

export type FloweringType = 'Photoperiod' | 'Autoflower'

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard'
export type YieldLevel = 'Low' | 'Medium' | 'High'
export type HeightLevel = 'Short' | 'Medium' | 'Tall'

export type GrowGoal = 'medical' | 'recreational' | 'hobbyist'

export enum ProblemType {
    NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
    Overwatering = 'OVERWATERING',
    Underwatering = 'UNDERWATERING',
    PestInfestation = 'PEST_INFESTATION',
}

export enum JournalEntryType {
    Watering = 'WATERING',
    Feeding = 'FEEDING',
    Training = 'TRAINING',
    Observation = 'OBSERVATION',
    System = 'SYSTEM',
    Photo = 'PHOTO',
    PestControl = 'PEST_CONTROL',
    Environment = 'ENVIRONMENT',
    Amendment = 'AMENDMENT',
    Harvest = 'HARVEST',
    PostHarvest = 'POST_HARVEST',
}

export enum PhotoCategory {
    FullPlant = 'FullPlant',
    Bud = 'Bud',
    Leaf = 'Leaf',
    Roots = 'Roots',
    ProblemArea = 'ProblemArea',
    Trichomes = 'Trichomes',
    Setup = 'Setup',
}

export type GrowAction =
    | 'water'
    | 'feed'
    | 'train'
    | 'photo'
    | 'defoliate'
    | 'flush'
    | 'harvest_check'
    | 'transplant'
    | 'pest_control'

export type HydroSystemType = 'DWC' | 'NFT' | 'DripSystem' | 'EbbFlow' | 'Aeroponics' | 'Kratky'

/** Disease/deficiency/pest category */
export type DiseaseCategory = 'deficiency' | 'toxicity' | 'environmental' | 'pest' | 'disease'

/** Urgency level for taking action */
export type DiseaseUrgency = 'monitor' | 'act_soon' | 'act_immediately'

/** Category of plant issue */
export type IssueCategory = 'pest' | 'deficiency' | 'toxicity' | 'disease' | 'environmental'

/** Status of a tracked issue */
export type IssueStatus = 'detected' | 'treating' | 'resolved'

/** Severity level for issues */
export type IssueSeverity = 'mild' | 'moderate' | 'severe'

export type SeedType = 'Feminized' | 'Regular' | 'Autoflowering' | 'Clone'

/** How seeds were acquired */
export type SeedSource = 'purchase' | 'harvest' | 'trade' | 'gift'

export type TaskPriority = 'high' | 'medium' | 'low'

export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation'
export type AmendmentType = 'Mycorrhizae' | 'WormCastings'

export type LightType = 'LED' | 'HPS'
export type VentilationPower = 'low' | 'medium' | 'high'
export type PotType = 'Plastic' | 'Fabric'

export type HydroAlertDirection = 'low' | 'high'
export type HydroForecastTrend = 'stable' | 'rising' | 'falling' | 'critical'

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

/** Plugin architecture categories */
export type PluginCategory = 'nutrient-schedule' | 'hardware' | 'grow-profile'

/** IoT time-series resolution */
export type TimeSeriesResolution = 'raw' | 'hourly' | 'daily'

export type PlantCount = '1' | '2' | '3'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert'
export type GrowPriority = 'yield' | 'quality' | 'stealth' | 'easeOfUse' | 'energy'

export type GeneticTrendCategory =
    | 'terpeneDiversity'
    | 'ultraPotency'
    | 'balancedHybrids'
    | 'autofloweringRevolution'
    | 'advancedBreeding'
    | 'landraceRevival'
