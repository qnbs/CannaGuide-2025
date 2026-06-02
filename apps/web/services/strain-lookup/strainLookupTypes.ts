import type { Strain } from '@/types'

/** A directional interaction between a terpene (or flavonoid) and a cannabinoid */
export interface TerpeneInteraction {
    cannabinoid: string
    effect: string
    strength: 'low' | 'medium' | 'high'
}

export interface TerpeneDataPoint {
    name: string
    /** Percentage value, e.g. 25.4 means 25.4% */
    percentage: number
    /** Relative prominence in the terpene profile */
    role?: 'dominant' | 'secondary' | 'trace'
    /** Primary aroma descriptors for this terpene */
    aromaNotes?: string[]
    /** Therapeutic / consumer effects */
    primaryEffects?: string[]
    /** Known synergies with cannabinoids */
    cannabinoidInteractions?: TerpeneInteraction[]
    /** Weighted contribution to entourage score (0-10) */
    entourageScore?: number
}

export interface CannabinoidDataPoint {
    name: string
    /** Percentage value, e.g. 22.0 means 22% THC */
    percentage: number
    /** Typical lab-reported range for this strain class */
    range?: [number, number]
    /** Role in the cannabinoid profile */
    role?: 'primary' | 'secondary' | 'trace'
}

export interface FlavonoidDataPoint {
    name: string
    percentage?: number
    role?: 'dominant' | 'secondary' | 'trace'
    /** Synergies with cannabinoids (e.g. Cannflavin A + CB2) */
    cannabinoidInteractions?: TerpeneInteraction[]
    /** Weighted contribution to entourage score (0-10) */
    entourageScore?: number
}

/** Confidence source ordering: local > cannlytics > otreeba > cannabis-api > ai */
export type ConfidenceSource = 'local' | 'cannlytics' | 'otreeba' | 'cannabis-api' | 'ai'

export interface LookupStrainResult {
    id: string
    name: string
    breeder: string
    type: string
    floweringType: string
    thc: number
    cbd: number
    cbg: number
    thcv: number
    description: string
    genetics: string
    terpenes: TerpeneDataPoint[]
    cannabinoids: CannabinoidDataPoint[]
    /** Estimated flavonoid profile (derived from type + terpene data) */
    flavonoids?: FlavonoidDataPoint[]
    /** KI-generated insight text about this strain */
    aiSummary: string
    /** 0-100 relevance match to user profile */
    matchScore: number
    /** 0-100 confidence in the data quality */
    confidenceScore: number
    confidenceSource: ConfidenceSource
    discoveredAt: string
    sourceUrl: string
    /** Overall entourage effect score (0-100) */
    totalEntourageScore?: number
    /** Shannon diversity index of the terpene profile (0-5) */
    terpeneDiversity?: number
    /** Full Strain object if found in local catalog */
    fullStrain?: Strain | undefined
}
