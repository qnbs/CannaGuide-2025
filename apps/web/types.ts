import { EntityState } from '@reduxjs/toolkit'
import type { FC } from 'react'
import type { SimulationPoint } from '@/types/simulation.types'

// Enums and String Literal Types
export enum View {
    Plants = 'plants',
    Strains = 'strains',
    Equipment = 'equipment',
    Knowledge = 'knowledge',
    Settings = 'settings',
    Help = 'help',
}

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

export type Language = 'en' | 'de' | 'es' | 'fr' | 'nl'

export type Theme =
    | 'midnight'
    | 'forest'
    | 'purpleHaze'
    | 'desertSky'
    | 'roseQuartz'
    | 'rainbowKush'
    | 'ogKushGreen'
    | 'runtzRainbow'
    | 'lemonSkunk'
export type GrowGoal = 'medical' | 'recreational' | 'hobbyist'

/**
 * AI execution mode.
 * - cloud:  Always use the cloud provider (local AI only as error fallback)
 * - local:  Always use the on-device models – no cloud API calls
 * - hybrid: Smart routing – use local when models are pre-loaded, cloud otherwise
 */
export type AiMode = 'cloud' | 'local' | 'hybrid' | 'eco'

/** Scientifically recognised cannabis terpenes */
export type TerpeneName =
    | 'Myrcene'
    | 'Limonene'
    | 'Caryophyllene'
    | 'Pinene'
    | 'Linalool'
    | 'Terpinolene'
    | 'Humulene'
    | 'Ocimene'
    | 'Bisabolol'
    | 'Valencene'
    | 'Geraniol'
    | 'Guaiol'
    | 'Camphene'
    | 'Nerolidol'
    | 'Phytol'
    | 'Eucalyptol'
    | 'Borneol'
    | 'Sabinene'
    | 'Terpineol'
    | 'Fenchol'
    | 'Pulegone'
    | 'Carene'
    | 'Phellandrene'
    | 'Cedrol'
    | 'Citral'
    | 'Farnesene'
    | 'Isopulegol'

/** Terpene percentage by dry-weight (typical range 0.01 -- 2.0 %) */
export type TerpeneProfile = Partial<Record<TerpeneName, number>>

/** Extended terpene entry with lab-data-grade statistics */
export interface TerpeneProfileEntry {
    /** Mean percentage across lab samples */
    percent: number
    /** Standard deviation across samples (0 if only 1 sample) */
    variance: number
    /** Consistency rating derived from variance */
    stability: 'high' | 'medium' | 'low'
    /** Number of lab samples used (0 = estimated) */
    sampleCount: number
}

/** Full lab-grade terpene profile with per-terpene statistics */
export type DetailedTerpeneProfile = Partial<Record<TerpeneName, TerpeneProfileEntry>>

/** Scientifically recognised cannabis cannabinoids */
export type CannabinoidName =
    | 'THC'
    | 'CBD'
    | 'CBG'
    | 'CBN'
    | 'THCV'
    | 'CBC'
    | 'CBDV'
    | 'THCA'
    | 'CBDA'
    | 'CBGA'
    | 'Delta8THC'

/** Cannabinoid percentage profile */
export type CannabinoidProfile = Partial<Record<CannabinoidName, number>>

/** Extended cannabinoid entry with lab statistics */
export interface CannabinoidProfileEntry {
    percent: number
    variance: number
    stability: 'high' | 'medium' | 'low'
    sampleCount: number
}

/** Full lab-grade cannabinoid profile */
export type DetailedCannabinoidProfile = Partial<Record<CannabinoidName, CannabinoidProfileEntry>>

/**
 * Chemovar classification (chemotype-based, not indica/sativa/hybrid morphology).
 * Based on cannabinoid ratios as defined by Hazekamp & Fischedick (2012).
 */
export type ChemovarType =
    | 'Type I' // THC-dominant (THC:CBD > 5:1)
    | 'Type II' // Balanced (THC:CBD 1:1 to 5:1)
    | 'Type III' // CBD-dominant (THC:CBD < 1:1)
    | 'Type IV' // CBG-dominant
    | 'Type V' // Low cannabinoid

/** Complete chemovar profile combining terpene + cannabinoid + classification data */
export interface ChemovarProfile {
    /** Chemovar type classification */
    chemovarType: ChemovarType
    /** Total terpene content percentage */
    totalTerpenePercent: number
    /** Total cannabinoid content percentage */
    totalCannabinoidPercent: number
    /** THC:CBD ratio (Infinity if CBD is 0) */
    thcCbdRatio: number
    /** Detailed terpene profile with lab statistics */
    detailedTerpeneProfile: DetailedTerpeneProfile
    /** Detailed cannabinoid profile with lab statistics */
    detailedCannabinoidProfile: DetailedCannabinoidProfile
    /** Predicted effects from entourage analysis */
    predictedEffects: EffectTag[]
    /** Data quality score (0--1): 1 = all real lab data, 0 = fully estimated */
    dataQuality: number
    /** ISO timestamp of last data update */
    lastUpdated: string
}

/** Terpene similarity search result */
export interface TerpeneSimilarityResult {
    strainId: string
    strainName: string
    /** Cosine similarity score (0--1) */
    cosineSimilarity: number
    /** Euclidean distance (lower = more similar) */
    euclideanDistance: number
    /** Matched terpene overlap count */
    sharedTerpeneCount: number
}

/** External strain API provider identifiers */
export type StrainApiProvider =
    | 'otreeba'
    | 'cannlytics'
    | 'strainapi'
    | 'cannseek'
    | 'openthc'
    | 'cansativa'
    | 'kushy'
    | 'community'

/** Cannabis flavonoid names (cannflavins and common plant flavonoids) */
export type FlavonoidName =
    | 'Cannflavin A'
    | 'Cannflavin B'
    | 'Cannflavin C'
    | 'Quercetin'
    | 'Kaempferol'
    | 'Apigenin'
    | 'Luteolin'
    | 'Vitexin'
    | 'Isovitexin'
    | 'Orientin'
    | 'Silymarin'
    | 'Catechins'

/** Quantitative flavonoid profile (% dry weight) */
export type FlavonoidProfile = Partial<Record<FlavonoidName, number>>

/** Detailed flavonoid entry with lab statistics */
export interface FlavonoidProfileEntry {
    percent: number
    variance: number
    stability: 'high' | 'medium' | 'low'
    sampleCount: number
}

export type DetailedFlavonoidProfile = Partial<Record<FlavonoidName, FlavonoidProfileEntry>>

/** Data provenance -- tracks where strain data originated */
export interface DataProvenance {
    /** Which API/source provided this data */
    provider: StrainApiProvider
    /** When this data was fetched/imported (ISO timestamp) */
    fetchedAt: string
    /** Provider-specific external ID */
    externalId?: string | undefined
    /** Whether data is verified by lab results */
    labVerified: boolean
    /** Data confidence score (0--1) */
    confidence: number
    /** URL to original data source */
    sourceUrl?: string | undefined
    /** API version or dataset version */
    dataVersion?: string | undefined
}

/** Lab test result for a specific strain batch */
export interface LabTestResult {
    /** Lab name */
    labName: string
    /** Test date (ISO timestamp) */
    testDate: string
    /** Certificate of Analysis URL */
    coaUrl?: string | undefined
    /** Batch/lot number */
    batchId?: string | undefined
    /** Tested cannabinoid percentages */
    cannabinoids: CannabinoidProfile
    /** Tested terpene percentages */
    terpenes?: TerpeneProfile | undefined
    /** Moisture content percentage */
    moisture?: number | undefined
    /** Passed safety tests (pesticides, heavy metals, microbials) */
    safetyPassed?: boolean | undefined
    /** Country/jurisdiction of testing */
    jurisdiction?: string | undefined
}

/** Lineage data for genetic ancestry tracking */
export interface StrainLineage {
    /** Direct parent strains */
    parents: Array<{ name: string; id?: string | undefined }>
    /** Known children/offspring */
    children?: Array<{ name: string; id?: string | undefined }> | undefined
    /** Breeder/creator name */
    breeder?: string | undefined
    /** Breeder country */
    breederCountry?: string | undefined
    /** Year first released */
    yearReleased?: number | undefined
    /** Generation depth (F1, F2, S1, BX, etc.) */
    generation?: string | undefined
    /** Original landrace or heirloom origins */
    landraceOrigins?: string[] | undefined
    /** Whether this is a stabilized IBL */
    isIBL?: boolean | undefined
}

/** Medical/regulatory information for EU/DE market */
export interface MedicalInfo {
    /** EU Novel Food status */
    euNovelFood?: boolean | undefined
    /** EU common catalogue listed (Nutzhanf) */
    euCatalogListed?: boolean | undefined
    /** German PZN (Pharmazentralnummer) for medical strains */
    pzn?: string | undefined
    /** Available in German pharmacies */
    apothekenpflichtig?: boolean | undefined
    /** GMP certified producer */
    gmpCertified?: boolean | undefined
    /** Irradiation status */
    irradiated?: boolean | undefined
    /** Country of cultivation */
    cultivationCountry?: string | undefined
}

/** Strain data quality assessment */
export interface DataQualityScore {
    /** Overall quality score (0--1) */
    overall: number
    /** Number of independent data sources confirming this data */
    sourceCount: number
    /** Has lab-verified cannabinoid data */
    hasLabData: boolean
    /** Has real (non-estimated) terpene data */
    hasRealTerpeneData: boolean
    /** Has lineage/genetics info */
    hasLineageData: boolean
    /** Has flavonoid data */
    hasFlavonoidData: boolean
    /** Last curated/reviewed (ISO timestamp) */
    lastCurated?: string | undefined
}

/** Predicted consumer/therapeutic effect tags from entourage analysis */
export type EffectTag =
    | 'Relaxing'
    | 'Sedating'
    | 'Uplifting'
    | 'Energizing'
    | 'Focusing'
    | 'Creative'
    | 'Euphoric'
    | 'Pain Relief'
    | 'Anti-Anxiety'
    | 'Anti-Inflammatory'
    | 'Appetite Stimulating'
    | 'Appetite Suppressing'
    | 'Neuroprotective'
    | 'Antiemetic'
    | 'Antispasmodic'

export type SortKey =
    | 'name'
    | 'type'
    | 'thc'
    | 'cbd'
    | 'floweringTime'
    | 'difficulty'
    | 'yield'
    | 'height'
export type SortDirection = 'asc' | 'desc'

export type ModalType =
    | 'watering'
    | 'feeding'
    | 'training'
    | 'observation'
    | 'photo'
    | 'pestControl'
    | 'amendment'

export enum EquipmentViewTab {
    Configurator = 'configurator',
    Setups = 'setups',
    Calculators = 'calculators',
    GrowShops = 'growShops',
    Seedbanks = 'seedbanks',
    GrowTech = 'growTech',
    IotDashboard = 'iotDashboard',
    HydroMonitoring = 'hydroMonitoring',
}

// ---------------------------------------------------------------------------
// Hydroponic Monitoring types
// ---------------------------------------------------------------------------

export type HydroSystemType = 'DWC' | 'NFT' | 'DripSystem' | 'EbbFlow' | 'Aeroponics' | 'Kratky'

export interface HydroThresholds {
    phMin: number
    phMax: number
    ecMin: number
    ecMax: number
    waterTempMin: number
    waterTempMax: number
}

export interface HydroReading {
    id: string
    timestamp: number
    ph: number
    ec: number
    waterTemp: number
    reservoirLevel?: number | undefined
    tds?: number | undefined
    plantId?: string | undefined
    note?: string | undefined
}

export type HydroAlertDirection = 'low' | 'high'

export interface HydroAlert {
    id: string
    metric: 'ph' | 'ec' | 'waterTemp'
    value: number
    threshold: number
    direction: HydroAlertDirection
    timestamp: number
    dismissed: boolean
}

export interface HydroState {
    readings: HydroReading[]
    alerts: HydroAlert[]
    systemType: HydroSystemType
    thresholds: HydroThresholds
}

// ---------------------------------------------------------------------------
// Hydroponic Forecasting types
// ---------------------------------------------------------------------------

export type HydroForecastTrend = 'stable' | 'rising' | 'falling' | 'critical'

export interface HydroForecast {
    nextHour: { ph: number; ec: number; temp: number }
    trend: HydroForecastTrend
    confidence: number
    alerts: string[]
    modelBased: boolean
}

export enum KnowledgeViewTab {
    Mentor = 'mentor',
    Guide = 'guide',
    Lexikon = 'lexikon',
    Atlas = 'atlas',
    Rechner = 'rechner',
    Lernpfad = 'lernpfad',
    Analytik = 'analytik',
    Archive = 'archive',
    Sandbox = 'sandbox',
}

export enum StrainViewTab {
    All = 'all',
    MyStrains = 'my-strains',
    Favorites = 'favorites',
    DailyStrains = 'daily-strains',
    Comparison = 'comparison',
    Genealogy = 'genealogy',
    BreedingLab = 'breeding-lab',
    Exports = 'exports',
    Tips = 'tips',
    Trends = 'trends',
}

export type GeneticTrendCategory =
    | 'terpeneDiversity'
    | 'ultraPotency'
    | 'balancedHybrids'
    | 'autofloweringRevolution'
    | 'advancedBreeding'
    | 'landraceRevival'

export type TaskPriority = 'high' | 'medium' | 'low'

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

export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation'
export type AmendmentType = 'Mycorrhizae' | 'WormCastings'
export enum PhotoCategory {
    FullPlant = 'FullPlant',
    Bud = 'Bud',
    Leaf = 'Leaf',
    Roots = 'Roots',
    ProblemArea = 'ProblemArea',
    Trichomes = 'Trichomes',
    Setup = 'Setup',
}

// Strain related types
export interface GeneticModifiers {
    pestResistance: number
    nutrientUptakeRate: number
    stressTolerance: number
    rue: number // Radiation Use Efficiency
    vpdTolerance: { min: number; max: number }
    transpirationFactor: number
    stomataSensitivity: number
}

export interface Strain {
    id: string
    name: string
    type: StrainType
    typeDetails?: string | undefined
    genetics?: string | undefined
    floweringType: FloweringType
    thc: number
    cbd: number
    thcRange?: string | undefined
    cbdRange?: string | undefined
    cbg?: number // optional CBG % | undefined
    thcv?: number // optional THCV % | undefined
    floweringTime: number
    floweringTimeRange?: string | undefined
    description?: string | undefined
    agronomic: {
        difficulty: DifficultyLevel
        yield: YieldLevel
        height: HeightLevel
        yieldDetails?: { indoor?: string | undefined; outdoor?: string | undefined } | undefined
        heightDetails?: { indoor?: string | undefined; outdoor?: string | undefined } | undefined
    }
    aromas?: string[] | undefined
    dominantTerpenes?: string[] | undefined
    /** Quantitative terpene profile (% dry-weight). Derived from dominantTerpenes if not set. */
    terpeneProfile?: TerpeneProfile | undefined
    /** Full cannabinoid profile beyond THC/CBD */
    cannabinoidProfile?: CannabinoidProfile | undefined
    /** Flavonoid profile (cannflavins, quercetin, etc.) */
    flavonoidProfile?: FlavonoidProfile | undefined
    /** Complete chemovar classification and detailed lab-grade profiles */
    chemovarProfile?: ChemovarProfile | undefined
    /** Genetic lineage and breeder info */
    lineage?: StrainLineage | undefined
    /** Lab test results (most recent first) */
    labResults?: LabTestResult[] | undefined
    /** Medical/regulatory info (EU/DE market) */
    medicalInfo?: MedicalInfo | undefined
    /** Data provenance records from external sources */
    dataProvenance?: DataProvenance[] | undefined
    /** Data quality assessment */
    dataQuality?: DataQualityScore | undefined
    geneticModifiers: GeneticModifiers
    availability?: SeedAvailability[] | undefined
}

export type SeedType = 'Feminized' | 'Regular' | 'Autoflowering'

export interface Seedbank {
    id: string
    name: string
    websiteUrl: string
    logoUrl?: string | undefined
    rating: number
}

export interface SeedAvailability {
    seedbankId: string
    pricePerSeed: number
    currency: string
    inStock: boolean
    packSizes: number[]
    seedType: SeedType
}

export interface StrainTranslationData {
    description?: string | undefined
    typeDetails?: string | undefined
    genetics?: string | undefined
    yieldDetails?: { indoor?: string | undefined; outdoor?: string | undefined } | undefined
    heightDetails?: { indoor?: string | undefined; outdoor?: string | undefined } | undefined
}

// Plant & Simulation types
export interface GrowSetup {
    lightType: LightType
    lightWattage: number
    lightHours: number
    dynamicLighting: boolean
    ventilation: VentilationPower
    hasCirculationFan: boolean
    potSize: number
    potType: PotType
    medium: 'Soil' | 'Coco' | 'Hydro' | 'Aeroponics'
}

export type LightType = 'LED' | 'HPS'
export type VentilationPower = 'low' | 'medium' | 'high'
export type PotType = 'Plastic' | 'Fabric'

export type GrowTechCategory =
    | 'dynamicLighting'
    | 'sensorsIoT'
    | 'aiAutomation'
    | 'digitalTwin'
    | 'hydroAero'
    | 'tissueCulture'
    | 'smartGrowBoxes'
    | 'sustainability'

export interface TrendMatchScore {
    category: GeneticTrendCategory | GrowTechCategory
    score: number
    reason: string
}

export interface TrendFilterState {
    query: string
    showMatchedOnly: boolean
}

export interface PlantEnvironment {
    internalTemperature: number
    internalHumidity: number
    vpd: number
    co2Level: number
}

export interface PlantMedium {
    ph: number
    ec: number
    moisture: number
    microbeHealth: number
    substrateWater: number
    nutrientConcentration: { nitrogen: number; phosphorus: number; potassium: number }
}

export interface PlantNutrientPool {
    nitrogen: number
    phosphorus: number
    potassium: number
}

export interface PlantRootSystem {
    health: number
    rootMass: number
}

export interface PlantEquipment {
    light: { type: LightType; wattage: number; isOn: boolean; lightHours: number }
    exhaustFan: { power: VentilationPower; isOn: boolean }
    circulationFan: { isOn: boolean }
    potSize: number
    potType: PotType
}

export interface PlantStructuralModel {
    branches: number
    nodes: number
}

export interface PlantStressCounters {
    vpd: number
    ph: number
    ec: number
    moisture: number
}

export interface PlantSimulationClock {
    accumulatedDayMs: number
}

export interface Plant {
    id: string
    /** ID of the grow this plant belongs to */
    growId: string
    name: string
    strain: Strain
    mediumType: GrowSetup['medium']
    createdAt: number
    lastUpdated: number
    age: number // in days
    stage: PlantStage
    health: number // 0-100
    stressLevel: number // 0-100
    height: number // in cm
    biomass: { total: number; stem: number; leaves: number; flowers: number }
    leafAreaIndex: number
    isTopped: boolean
    lstApplied: number
    environment: PlantEnvironment
    medium: PlantMedium
    nutrientPool: PlantNutrientPool
    rootSystem: PlantRootSystem
    equipment: PlantEquipment
    problems: PlantProblem[]
    journal: JournalEntry[]
    tasks: Task[]
    harvestData: HarvestData | null
    structuralModel: PlantStructuralModel
    // Per-individual phenotype expression; may diverge from strain defaults via training or amendments
    phenotypeModifiers?: GeneticModifiers | undefined
    history: PlantHistoryEntry[]
    // Real-time chemical synthesis tracking
    cannabinoidProfile: { thc: number; cbd: number; cbn: number }
    terpeneProfile: Record<string, number>
    stressCounters: PlantStressCounters
    simulationClock: PlantSimulationClock
}

export interface PlantProblem {
    type: ProblemType
    severity: number
    onsetDay: number
    status: 'active' | 'resolved'
}

export interface JournalEntry {
    id: string
    createdAt: number
    type: JournalEntryType
    notes: string
    details?: JournalEntryDetails | undefined
}

export type JournalEntryDetails =
    | WateringDetails
    | FeedingDetails
    | TrainingDetails
    | ObservationDetails
    | SystemDetails
    | PhotoDetails
    | PestControlDetails
    | EnvironmentDetails
    | AmendmentDetails
    | HarvestDetails
    | PostHarvestDetails
export interface WateringDetails {
    amountMl?: number | undefined
    ph?: number | undefined
    ec?: number | undefined
}
export interface FeedingDetails extends WateringDetails {
    npk?: { n: number; p: number; k: number } | undefined
}
export interface TrainingDetails {
    type: TrainingType
}
export interface ObservationDetails {
    diagnosis?: string | undefined
}
export interface SystemDetails {
    from: PlantStage
    to: PlantStage
}
export interface PhotoDetails {
    imageId?: string | undefined
    imageUrl?: string | undefined
    photoCategory: PhotoCategory
    timelineLabel?: string | undefined
    capturedAt?: number | undefined
    exifCapturedAt?: number | undefined
}
export interface PestControlDetails {
    method: string
    product?: string | undefined
}
export interface EnvironmentDetails {
    temp?: number | undefined
    humidity?: number | undefined
    ec?: number | undefined
    ph?: number | undefined
    lightPpfd?: number | undefined
    waterVolumeMl?: number | undefined
    source?: 'manual' | 'iot_sensor'
}
export interface AmendmentDetails {
    type: AmendmentType
}
export interface HarvestDetails {
    wetWeight: number
}
export interface PostHarvestDetails {
    dryWeight: number
    quality: number
}

export interface Task {
    id: string
    title: string
    description: string
    isCompleted: boolean
    createdAt: number
    completedAt?: number | undefined
    priority: TaskPriority
}

export interface HarvestData {
    wetWeight: number
    dryWeight: number
    currentDryDay: number
    currentCureDay: number
    lastBurpDay: number
    jarHumidity: number
    chlorophyllPercent: number
    terpeneRetentionPercent: number
    moldRiskPercent: number
    finalQuality: number
    cannabinoidProfile: { thc: number; cbn: number }
    terpeneProfile: Record<string, number>
}

export interface PlantHistoryEntry {
    day: number
    health: number
    height: number
    stressLevel: number
    medium: { ph: number; ec: number; moisture: number }
}

export interface SimulationState {
    plants: EntityState<Plant, string>
    plantSlots: (string | null)[]
    selectedPlantId: string | null
    vpdProfiles: Record<string, SimulationPoint[]>
    /** Set to true while the background worker is processing a catch-up delta. */
    isCatchingUp?: boolean | undefined
}

// --- Multi-Grow Types ---

export interface Grow {
    id: string
    name: string
    createdAt: number
    updatedAt: number
    /** Whether this grow is currently active */
    isActive: boolean
    /** Optional description */
    description?: string | undefined
    /** Accent color (CSS hex) */
    color?: string | undefined
    /** Display emoji */
    emoji?: string | undefined
    /** Archived (finished) grow */
    archived?: boolean | undefined
}

export interface GrowsState {
    /** All grows keyed by EntityAdapter (max MAX_GROWS) */
    grows: EntityState<Grow, string>
    /** Currently selected/active grow ID */
    activeGrowId: string
}

/** Data format for per-grow export (v2.0). */
export interface GrowExportData {
    version: '2.0'
    exportedAt: number
    grow: Grow
    plants: Plant[]
}

/** Summary statistics for a single grow. */
export interface GrowSummary {
    growId: string
    plantCount: number
    activePlantCount: number
    journalEntryCount: number
    nutrientEntryCount: number
    oldestPlantAge: number
    averageHealth: number
}

// AI related types
export interface ProductLink {
    vendor: string
    url: string
    price?: number | undefined
    currency?: string | undefined
    inStock?: boolean | undefined
}

export interface RecommendationItem {
    name: string
    price: number
    rationale: string
    watts?: number | undefined
    manufacturer?: string | undefined
    productLinks?: ProductLink[] | undefined
}
export type RecommendationCategory =
    | 'tent'
    | 'light'
    | 'ventilation'
    | 'circulationFan'
    | 'pots'
    | 'soil'
    | 'nutrients'
    | 'extra'
export type Recommendation = Record<RecommendationCategory, RecommendationItem> & { proTip: string }

export interface PlantDiagnosisResponse {
    title: string
    content: string
    confidence: number
    immediateActions: string
    longTermSolution: string
    prevention: string
    diagnosis: string
}

export interface AIResponse {
    title: string
    content: string
    /** Optional confidence score (0-1). Responses below 0.7 should be flagged as uncertain. */
    confidence?: number | undefined
}

/** Status of the cached plant disease ONNX model. */
export type ModelStatus = 'not-cached' | 'downloading' | 'ready' | 'error'

/** Knowledge-base recommendation linked to a detected disease label. */
export interface DiseaseRecommendation {
    diseaseId: string
    relatedLexiconKeys: string[]
    relatedArticleIds: string[]
}

/** Result of an on-device leaf image scan (ONNX or zero-shot fallback). */
export interface LeafDiagnosisResult {
    /** Mapped cannabis-term label (e.g. 'spider_mites'). */
    label: string
    /** Top-1 confidence score (0-1). */
    confidence: number
    /** Top-5 class predictions sorted by confidence. */
    top5: Array<{ label: string; confidence: number }>
    /** Severity tier derived from confidence. */
    severity: 'none' | 'mild' | 'moderate' | 'severe'
    /** Disease-atlas recommendations linked to the detected label. */
    recommendations: DiseaseRecommendation[]
    /** Which model produced the result. */
    modelUsed: 'onnx-mobilenet' | 'zero-shot' | 'unavailable'
    /** Inference wall-clock time in milliseconds. */
    latencyMs: number
}

export interface YieldPredictionResult {
    predictedDryWeight: number
    heuristicDryWeight: number
    confidence: number
    sampleCount: number
    usedTensorflowModel: boolean
    explanation: string
}

export interface StructuredGrowTips {
    nutrientTip: string
    trainingTip: string
    environmentalTip: string
    proTip: string
}

export interface DeepDiveGuide {
    introduction: string
    stepByStep: string[]
    prosAndCons: { pros: string[]; cons: string[] }
    proTip: string
}

export interface MentorMessage {
    id?: string | undefined
    role: 'user' | 'model'
    title: string
    content: string
    uiHighlights?: { elementId: string; plantId?: string | undefined }[] | undefined
}

// App settings
export interface AppSettings {
    version: number
    onboardingCompleted: boolean
    aiMode: AiMode
    general: {
        language: Language
        theme: Theme
        fontSize: 'sm' | 'base' | 'lg'
        defaultView: View
        uiDensity: 'comfortable' | 'compact'
        dyslexiaFont: boolean
        reducedMotion: boolean
        highContrastMode: boolean
        colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
    }
    voiceControl: {
        enabled: boolean
        hotwordEnabled: boolean
        confirmationSound: boolean
    }
    tts: TTSSettings
    strainsView: {
        defaultSortKey: SortKey
        defaultSortDirection: SortDirection
        defaultViewMode: 'list' | 'grid'
        strainsPerPage: number
        visibleColumns: string[]
        prioritizeUserStrains: boolean
        genealogyDefaultDepth: number
        genealogyDefaultLayout: 'horizontal' | 'vertical'
        aiTipsDefaultFocus: string
        aiTipsDefaultExperience: string
    }
    plantsView: {
        showArchived: boolean
        autoGenerateTasks: boolean
    }
    simulation: {
        autoJournaling: {
            logStageChanges: boolean
            logProblems: boolean
            logTasks: boolean
        }
        simulationProfile: 'beginner' | 'intermediate' | 'expert'
        pestPressure: number
        nutrientSensitivity: number
        environmentalStability: number
        leafTemperatureOffset: number
        lightExtinctionCoefficient: number
        nutrientConversionEfficiency: number
        stomataSensitivity: number
        /** Grow-room altitude above sea level (m). Used for barometric VPD correction. */
        altitudeM: number
    }
    notifications: {
        enabled: boolean
        stageChange: boolean
        problemDetected: boolean
        harvestReady: boolean
        newTask: boolean
        lowWaterWarning: boolean
        phDriftWarning: boolean
        quietHours: {
            enabled: boolean
            start: string
            end: string
        }
    }
    defaults: {
        growSetup: GrowSetup
        journalNotes: {
            watering: string
            feeding: string
        }
    }
    localAi: {
        forceWasm: boolean
        /** Feature flag: enable WebGPU acceleration for local AI inference. */
        enableWebGpu: boolean
        preferredTextModel: 'auto' | 'qwen2.5' | 'qwen3'
        /** Selected WebLLM model ID or 'auto' for GPU-tier-based auto-selection. */
        selectedLlmModelId: string
        enableSemanticRag: boolean
        enableSentimentAnalysis: boolean
        enableSummarization: boolean
        enableQueryClassification: boolean
        enablePersistentCache: boolean
        enableTelemetry: boolean
        maxInferenceCacheSize: number
        inferenceTimeoutMs: number
        /** Progressive quantization preference: 'auto' (VRAM-based), 'q4f16', 'q4', or 'none'. */
        quantizationLevel: 'auto' | 'q4f16' | 'q4' | 'none'
        /** Eco-mode: disables WebLLM + image gen, forces WASM backend and smallest model. */
        ecoMode: boolean
    }
    data: {
        autoBackup: 'off' | 'daily' | 'weekly'
        persistenceIntervalMs: 500 | 1500 | 5000
        cloudSync: {
            enabled: boolean
            provider: 'none' | 'gist'
            gistId: string | null
            lastSyncAt: number | null
            /** Base64-encoded AES-GCM key for E2EE of Gist backups. */
            encryptionKeyBase64: string | null
        }
    }
    privacy: {
        requirePinOnLaunch: boolean
        pin: string | null
        clearAiHistoryOnExit: boolean
        /** When true, blocks ALL outbound network requests (Sentry, cloud AI, Gist sync). */
        localOnlyMode: boolean
    }
}

export interface TTSSettings {
    enabled: boolean
    voiceName: string | null
    rate: number
    pitch: number
    volume: number
    highlightSpeakingText: boolean
}

/** Provider interface for text-to-speech engines. */
export interface ITTSProvider {
    isSupported(): boolean
    init(): void
    getVoices(lang: Language): SpeechSynthesisVoice[]
    speak(text: string, lang: Language, onEnd: () => void, settings: TTSSettings): void
    cancel(): void
    pause(): void
    resume(): void
}

// UI & State types
export interface AdvancedFilterState {
    thcRange: [number, number]
    cbdRange: [number, number]
    floweringRange: [number, number]
    selectedDifficulties: DifficultyLevel[]
    selectedYields: YieldLevel[]
    selectedHeights: HeightLevel[]
    selectedAromas: string[]
    selectedTerpenes: string[]
}

export interface Notification {
    id: number
    message: string
    type: 'success' | 'error' | 'info'
}

export interface StoredImageData {
    id: string
    data: string // base64 data URL
    createdAt: number
}

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

// Help & Knowledge types
export interface LexiconEntry {
    id?: string | undefined
    key: string
    category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General' | 'Nutrient' | 'Disease'
}

/** Disease/deficiency/pest category */
export type DiseaseCategory = 'deficiency' | 'toxicity' | 'environmental' | 'pest' | 'disease'

/** Urgency level for taking action */
export type DiseaseUrgency = 'monitor' | 'act_soon' | 'act_immediately'

/** Disease atlas entry -- metadata only; text content lives in i18n */
export interface DiseaseEntry {
    id: string
    nameKey: string
    category: DiseaseCategory
    severity: 'low' | 'medium' | 'high' | 'critical'
    affectedStages: PlantStage[]
    urgency: DiseaseUrgency
    relatedLexiconKeys: string[]
    relatedArticleIds: string[]
    /** A Tailwind color token name (e.g. 'amber', 'red') used for visual badges */
    colorToken: string
}

/** A single step in a learning path */
export interface LearningStep {
    id: string
    titleKey: string
    descriptionKey: string
    type: 'article' | 'calculator' | 'quiz' | 'practice'
    referenceId: string
}

/** A curated learning path for guided knowledge acquisition */
export interface LearningPath {
    id: string
    titleKey: string
    descriptionKey: string
    targetLevel: 'beginner' | 'intermediate' | 'expert'
    estimatedMinutes: number
    tags: string[]
    steps: LearningStep[]
}

export interface VisualGuide {
    id: string
    titleKey: string
    descriptionKey: string
}

export interface FAQItem {
    id: string
    questionKey: string
    answerKey: string
    triggers: {
        plantStage?: PlantStage | PlantStage[]
    }
}

export interface KnowledgeArticle {
    id: string
    titleKey: string
    contentKey: string
    tags: string[]
    triggers: {
        ageInDays?: { min: number; max: number } | undefined
        plantStage?: PlantStage | PlantStage[]
        activeProblems?: ProblemType[] | undefined
    }
}

export interface ArchivedMentorResponse {
    id: string
    createdAt: number
    query: string
    title: string
    content: string
    feedback?: 'positive' | 'negative' | undefined
    uiHighlights?: { elementId: string; plantId?: string | undefined }[] | undefined
}

export interface ArchivedAdvisorResponse extends AIResponse {
    id: string
    createdAt: number
    plantId: string
    plantStage: PlantStage
    query: string // What was asked, or "Proactive Diagnosis"
    feedback?: 'positive' | 'negative' | undefined
}

export interface SavedStrainTip extends StructuredGrowTips {
    id: string
    createdAt: number
    strainId: string
    strainName: string
    title: string
    imageUrl?: string | undefined
}

export interface SavedSetup {
    id: string
    name: string
    createdAt: number
    recommendation: Recommendation
    totalCost: number
    sourceDetails: {
        plantCount: PlantCount
        experience: ExperienceLevel
        budget: number
        priorities: GrowPriority[]
        customNotes: string
        growSpace: { width: number; depth: number }
        floweringTypePreference: 'autoflower' | 'photoperiod' | 'any'
    }
}

export type PlantCount = '1' | '2' | '3'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert'
export type GrowPriority = 'yield' | 'quality' | 'stealth' | 'easeOfUse' | 'energy'

// Other types from slices
export type CommandGroup =
    | 'Navigation'
    | 'Strains'
    | 'Plants'
    | 'Equipment'
    | 'Knowledge'
    | 'Appearance'
    | 'Accessibility'
    | 'AI'
    | 'General'

export interface Command {
    id: string
    title: string
    subtitle?: string | undefined
    group: CommandGroup | string
    icon: FC
    action: () => void
    keywords?: string | undefined
    shortcut?: string[] | undefined
    isHeader?: boolean | undefined
    /** Higher = shown first when no query (default 0) */
    priority?: number | undefined
}

export interface SpeechQueueItem {
    id: string
    text: string
}

export interface KnowledgeProgress {
    [sectionId: string]: string[]
}

/** Per-path completion: map of stepId -> completed */
export interface LearningPathProgress {
    [pathId: string]: string[]
}

export interface Seed {
    id: string
    strainId: string
    strainName: string
    quality: number // 0-1
    createdAt: number
}

export interface Scenario {
    id: string
    titleKey: string
    descriptionKey: string
    title?: string | undefined
    description?: string | undefined
    durationDays: number
    plantAModifier: { day: number; action: ScenarioAction }
    plantBModifier: { day: number; action: ScenarioAction }
}
export type ScenarioAction = 'TOP' | 'LST' | 'NONE' | 'TEMP_PLUS_2' | 'TEMP_MINUS_2'

export interface ExperimentResult {
    originalHistory: PlantHistoryEntry[]
    modifiedHistory: PlantHistoryEntry[]
    originalFinalState: Plant
    modifiedFinalState: Plant
}

export interface SavedExperiment extends ExperimentResult {
    id: string
    scenarioId: string
    basePlantName: string
    createdAt: number
}

// Genealogy Types
export interface GenealogyNode {
    id: string
    name: string
    type: StrainType
    thc: number
    isLandrace: boolean
    isPlaceholder?: boolean // For circular dependencies | undefined
    children?: GenealogyNode[] | undefined
    _children?: GenealogyNode[] // For d3 collapse/expand | undefined
}

export interface GeneticContribution {
    name: string
    contribution: number
}

export type SandboxState = {
    currentExperiment: (ExperimentResult & { basePlantId?: string; scenarioId?: string }) | null
    status: 'idle' | 'running' | 'succeeded' | 'failed'
    savedExperiments: SavedExperiment[]
}

export interface SavedExport {
    id: string
    name: string
    createdAt: number
    format: 'pdf' | 'txt' | 'csv' | 'json' | 'xml'
    strainIds: string[]
    sourceDescription: string
}

// ---------------------------------------------------------------------------
// Time-Series IoT Data
// ---------------------------------------------------------------------------

export type TimeSeriesResolution = 'raw' | 'hourly' | 'daily'

export interface TimeSeriesEntry {
    id?: number | undefined
    deviceId: string
    timestamp: number
    resolution: TimeSeriesResolution
    temperatureC: number
    humidityPercent: number
    vpd: number | null
    ph: number | null
    sampleCount: number
}

// ---------------------------------------------------------------------------
// Predictive Analytics
// ---------------------------------------------------------------------------

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

export interface BotrytisRiskAssessment {
    riskLevel: RiskLevel
    riskScore: number
    factors: string[]
    recommendation: string
}

export interface EnvironmentAlert {
    type: 'temperature' | 'humidity' | 'vpd' | 'ph'
    severity: RiskLevel
    message: string
    currentValue: number
    idealRange: [number, number]
}

export interface PredictiveInsight {
    botrytisRisk: BotrytisRiskAssessment
    environmentAlerts: EnvironmentAlert[]
    yieldImpact: { impactPercent: number; description: string; factors: string[] }
    analyzedSamples: number
    analysisTimestamp: number
}

// ---------------------------------------------------------------------------
// Plugin Architecture
// ---------------------------------------------------------------------------

export type PluginCategory = 'nutrient-schedule' | 'hardware' | 'grow-profile'

export interface PluginManifest {
    id: string
    name: string
    version: string
    description: string
    author: string
    category: PluginCategory
    minAppVersion?: number | undefined
    icon?: string | undefined
    tags?: string[] | undefined
}

/** Queued offline action with idempotency key to prevent duplicate replay across tabs. */
export interface OfflineAction {
    idempotencyKey: string
    type: string
    payload?: unknown | undefined
}
