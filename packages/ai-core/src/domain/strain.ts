// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- strain & phytochemistry domain types
// ---------------------------------------------------------------------------

import type {
    StrainType,
    FloweringType,
    DifficultyLevel,
    YieldLevel,
    HeightLevel,
    SeedType,
} from './enums'

// ---------------------------------------------------------------------------
// Terpene types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cannabinoid types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Flavonoid types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Chemovar classification
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Strain provenance, lineage & quality
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Seed availability
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Genetic modifiers
// ---------------------------------------------------------------------------

export interface GeneticModifiers {
    pestResistance: number
    nutrientUptakeRate: number
    stressTolerance: number
    rue: number // Radiation Use Efficiency
    vpdTolerance: { min: number; max: number }
    transpirationFactor: number
    stomataSensitivity: number
}

// ---------------------------------------------------------------------------
// Strain (core domain object)
// ---------------------------------------------------------------------------

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
    cbg?: number | undefined
    thcv?: number | undefined
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
