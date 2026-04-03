// ---------------------------------------------------------------------------
// strainLookupService.ts -- Multi-API Strain Lookup
//
// Strategy: Local DB (instant) -> Cannlytics API (lab data) ->
//           Otreeba Open Cannabis API -> The Cannabis API (RapidAPI/public) ->
//           AI-generated summary (last resort)
//
// All external calls check isLocalOnlyMode() and are rate-limited.
// Results are cached in sessionStorage (5-min TTL).
// ---------------------------------------------------------------------------

import { allStrainsData } from '@/data/strains/index'
import { TERPENE_DATABASE } from '@/data/terpeneDatabase'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import type { Strain } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Entourage effect science -- known terpene x cannabinoid synergies
// Based on Russo (2011) "Taming THC" + Booth & Bohlmann (2019)
// ---------------------------------------------------------------------------

const TERPENE_SYNERGIES: Record<string, TerpeneInteraction[]> = {
    Myrcene: [
        { cannabinoid: 'THC', effect: 'Enhanced sedation + BBB permeability', strength: 'high' },
        { cannabinoid: 'CBD', effect: 'Amplified anti-inflammatory', strength: 'medium' },
    ],
    Limonene: [
        { cannabinoid: 'THC', effect: 'Anxiety reduction + mood elevation', strength: 'high' },
        { cannabinoid: 'CBD', effect: 'Improved oral bioavailability', strength: 'medium' },
    ],
    Caryophyllene: [
        { cannabinoid: 'CBD', effect: 'Synergistic anti-inflammatory via CB2', strength: 'high' },
        {
            cannabinoid: 'THC',
            effect: 'Reduced psychoactivity + neuroprotection',
            strength: 'medium',
        },
    ],
    Linalool: [
        { cannabinoid: 'THC', effect: 'Calming + enhanced analgesic effect', strength: 'high' },
        { cannabinoid: 'CBD', effect: 'Anti-anxiety amplification (GABA)', strength: 'high' },
    ],
    Pinene: [
        { cannabinoid: 'THC', effect: 'Memory retention (AChE inhibition)', strength: 'medium' },
        {
            cannabinoid: 'CBD',
            effect: 'Bronchodilation + synergistic anti-inflammatory',
            strength: 'low',
        },
    ],
    Terpinolene: [
        { cannabinoid: 'THC', effect: 'Uplifting + energy enhancement', strength: 'medium' },
        { cannabinoid: 'CBG', effect: 'Mild antibacterial synergy', strength: 'low' },
    ],
    Humulene: [
        {
            cannabinoid: 'CBD',
            effect: 'Appetite suppression + anti-inflammatory',
            strength: 'medium',
        },
        { cannabinoid: 'THC', effect: 'Anti-inflammatory (COX-1/2)', strength: 'medium' },
    ],
    Ocimene: [
        { cannabinoid: 'CBD', effect: 'Antifungal + antiviral synergy', strength: 'low' },
        { cannabinoid: 'THC', effect: 'Mood uplift + decongestant', strength: 'low' },
    ],
    Bisabolol: [
        { cannabinoid: 'CBD', effect: 'Skin permeability + soothing', strength: 'medium' },
        { cannabinoid: 'THC', effect: 'Analgesic potentiation', strength: 'low' },
    ],
    Nerolidol: [
        { cannabinoid: 'THC', effect: 'Sedation + antiparasitic', strength: 'medium' },
        { cannabinoid: 'CBD', effect: 'Antioxidant synergy', strength: 'low' },
    ],
    Valencene: [
        { cannabinoid: 'THC', effect: 'Anti-allergic + mood brightening', strength: 'low' },
        { cannabinoid: 'CBD', effect: 'Mild skin-protective synergy', strength: 'low' },
    ],
    Geraniol: [
        { cannabinoid: 'CBD', effect: 'Neuroprotective + antioxidant', strength: 'medium' },
        { cannabinoid: 'THC', effect: 'Mood-lifting + antifungal', strength: 'low' },
    ],
}

// Known flavonoids with estimated entourage contributions
const FLAVONOID_PROFILES: Record<string, { interactions: TerpeneInteraction[]; score: number }> = {
    'Cannflavin A': {
        interactions: [
            {
                cannabinoid: 'CBD',
                effect: 'Potent anti-inflammatory (30x stronger than aspirin)',
                strength: 'high',
            },
            { cannabinoid: 'THC', effect: 'Analgesic potentiation', strength: 'medium' },
        ],
        score: 8.5,
    },
    'Cannflavin B': {
        interactions: [
            {
                cannabinoid: 'CBD',
                effect: 'Anti-inflammatory via COX-2 inhibition',
                strength: 'high',
            },
        ],
        score: 7.5,
    },
    Quercetin: {
        interactions: [
            {
                cannabinoid: 'CBD',
                effect: 'Antioxidant + neuroprotective synergy',
                strength: 'medium',
            },
            { cannabinoid: 'CBG', effect: 'Anticancer + antibacterial', strength: 'medium' },
        ],
        score: 6.5,
    },
    Apigenin: {
        interactions: [
            { cannabinoid: 'CBD', effect: 'Anxiolytic + mild estrogenic', strength: 'medium' },
            { cannabinoid: 'THC', effect: 'Sedation enhancement', strength: 'low' },
        ],
        score: 6.0,
    },
    Luteolin: {
        interactions: [
            {
                cannabinoid: 'CBD',
                effect: 'Anti-inflammatory + cognitive support',
                strength: 'medium',
            },
        ],
        score: 5.5,
    },
    Kaempferol: {
        interactions: [
            { cannabinoid: 'THC', effect: 'Neuroprotective co-activity', strength: 'low' },
            { cannabinoid: 'CBD', effect: 'Antioxidant amplification', strength: 'low' },
        ],
        score: 5.0,
    },
}

// Typical flavonoid presence by strain type
const TYPE_FLAVONOIDS: Record<string, FlavonoidDataPoint[]> = {
    Indica: [
        {
            name: 'Cannflavin A',
            role: 'dominant',
            entourageScore: 8.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Cannflavin A']!.interactions,
        },
        {
            name: 'Quercetin',
            role: 'secondary',
            entourageScore: 6.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Quercetin']!.interactions,
        },
        {
            name: 'Apigenin',
            role: 'trace',
            entourageScore: 6.0,
            cannabinoidInteractions: FLAVONOID_PROFILES['Apigenin']!.interactions,
        },
    ],
    Sativa: [
        {
            name: 'Luteolin',
            role: 'dominant',
            entourageScore: 5.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Luteolin']!.interactions,
        },
        {
            name: 'Apigenin',
            role: 'secondary',
            entourageScore: 6.0,
            cannabinoidInteractions: FLAVONOID_PROFILES['Apigenin']!.interactions,
        },
        {
            name: 'Quercetin',
            role: 'trace',
            entourageScore: 6.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Quercetin']!.interactions,
        },
    ],
    Hybrid: [
        {
            name: 'Cannflavin B',
            role: 'dominant',
            entourageScore: 7.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Cannflavin B']!.interactions,
        },
        {
            name: 'Quercetin',
            role: 'secondary',
            entourageScore: 6.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Quercetin']!.interactions,
        },
        {
            name: 'Kaempferol',
            role: 'trace',
            entourageScore: 5.0,
            cannabinoidInteractions: FLAVONOID_PROFILES['Kaempferol']!.interactions,
        },
    ],
}

// ---------------------------------------------------------------------------
// Enrichment helpers
// ---------------------------------------------------------------------------

/**
 * Enrich raw TerpeneDataPoint[] with aromaNotes, effects, interactions, roles,
 * and entourage scores sourced from TERPENE_DATABASE and synergy data.
 */
function enrichTerpeneDataPoints(terpenes: TerpeneDataPoint[]): TerpeneDataPoint[] {
    return terpenes.map((tp, idx) => {
        const ref = TERPENE_DATABASE[tp.name as keyof typeof TERPENE_DATABASE]
        const synergies = TERPENE_SYNERGIES[tp.name]
        const role: TerpeneDataPoint['role'] =
            idx === 0 ? 'dominant' : idx <= 2 ? 'secondary' : 'trace'
        // Entourage score: base 3, +2 per terpene-database match, +1 per high-strength synergy
        const highSynergies = synergies?.filter((s) => s.strength === 'high').length ?? 0
        const medSynergies = synergies?.filter((s) => s.strength === 'medium').length ?? 0
        const entourageScore = Math.min(
            10,
            3 + (ref ? 2 : 0) + highSynergies * 1.5 + medSynergies * 0.75,
        )
        return {
            ...tp,
            role,
            aromaNotes: ref?.aromas ?? [],
            primaryEffects: (ref?.effects?.slice(0, 4) as string[]) ?? [],
            cannabinoidInteractions: synergies ?? [],
            entourageScore: Math.round(entourageScore * 10) / 10,
        }
    })
}

/**
 * Return estimated flavonoid profile based on strain type.
 * Falls back to Hybrid profile for unknown types.
 */
function buildFlavonoidDataPoints(strainType: string): FlavonoidDataPoint[] {
    return TYPE_FLAVONOIDS[strainType] ?? TYPE_FLAVONOIDS['Hybrid']!
}

/**
 * Compute an overall entourage effect score (0-100).
 * Accounts for terpene diversity, terpene-cannabinoid synergies, flavonoid contributions,
 * and cannabinoid ratio balance.
 */
function calculateEntourageScore(
    terpenes: TerpeneDataPoint[],
    thc: number,
    cbd: number,
    flavonoids: FlavonoidDataPoint[],
): number {
    // Terpene contribution (up to 50 pts)
    const terpeneSum = terpenes.reduce((acc, t) => acc + (t.entourageScore ?? 3), 0)
    const terpenePts = Math.min(50, (terpeneSum / Math.max(1, terpenes.length)) * 7)

    // Flavonoid contribution (up to 20 pts)
    const flavoSum = flavonoids.reduce((acc, f) => acc + (f.entourageScore ?? 3), 0)
    const flavoPts = Math.min(20, (flavoSum / Math.max(1, flavonoids.length)) * 3)

    // Cannabinoid balance bonus (up to 20 pts): THC:CBD ratio closer to 1:1 = higher score
    const total = thc + cbd
    const ratio = total > 0 ? Math.min(thc, cbd) / Math.max(thc, cbd) : 0
    const cannabinoidPts = ratio * 20

    // Terpene diversity bonus (up to 10 pts)
    const diversityPts = Math.min(10, terpenes.length * 1.8)

    return Math.round(terpenePts + flavoPts + cannabinoidPts + diversityPts)
}

/**
 * Shannon diversity index for a terpene profile.
 * Higher values (closer to ln(n)) indicate a more diverse aromatic profile.
 */
function shannonDiversity(terpenes: TerpeneDataPoint[]): number {
    const total = terpenes.reduce((s, t) => s + t.percentage, 0)
    if (total === 0) return 0
    const h = terpenes.reduce((acc, t) => {
        const p = t.percentage / total
        return p > 0 ? acc - p * Math.log(p) : acc
    }, 0)
    return Math.round(h * 100) / 100
}

// ---------------------------------------------------------------------------
// Session storage cache (5-min TTL)
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'cg.sl.'
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry {
    result: LookupStrainResult
    ts: number
}

function getCached(name: string): LookupStrainResult | null {
    try {
        const key = CACHE_PREFIX + name.toLowerCase().trim()
        const raw = sessionStorage.getItem(key)
        if (!raw) return null
        const entry = JSON.parse(raw) as CacheEntry
        if (Date.now() - entry.ts > CACHE_TTL_MS) {
            sessionStorage.removeItem(key)
            return null
        }
        return entry.result
    } catch {
        return null
    }
}

function setCached(name: string, result: LookupStrainResult): void {
    try {
        const key = CACHE_PREFIX + name.toLowerCase().trim()
        const entry: CacheEntry = { result, ts: Date.now() }
        sessionStorage.setItem(key, JSON.stringify(entry))
    } catch {
        // sessionStorage quota exceeded -- ignore
    }
}

// ---------------------------------------------------------------------------
// Rate limiter (token bucket, 15 req/min across all external calls)
// ---------------------------------------------------------------------------

let _lastExternalCall = 0
const MIN_INTERVAL_MS = 4000 // 15/min => 1 per 4s

async function throttleExternal(): Promise<void> {
    const elapsed = Date.now() - _lastExternalCall
    if (elapsed < MIN_INTERVAL_MS) {
        await new Promise<void>((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed))
    }
    _lastExternalCall = Date.now()
}

// ---------------------------------------------------------------------------
// Fuzzy suggestions from local DB (for real-time dropdown)
// ---------------------------------------------------------------------------

const TERPENE_ESTIMATE: Record<string, number> = {
    Myrcene: 34,
    Limonene: 22,
    Caryophyllene: 20,
    Linalool: 14,
    Pinene: 18,
    Terpinolene: 12,
    Ocimene: 10,
    Humulene: 11,
    Bisabolol: 8,
    Nerolidol: 7,
}

/**
 * Returns up to `limit` strain names that fuzzy-match the query.
 * Prefix matches are ranked first.
 */
export function getFuzzySuggestions(query: string, limit = 8): string[] {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return allStrainsData
        .filter((s) => s.name.toLowerCase().includes(q))
        .sort((a, b) => {
            const aPrefix = a.name.toLowerCase().startsWith(q) ? 0 : 1
            const bPrefix = b.name.toLowerCase().startsWith(q) ? 0 : 1
            return aPrefix - bPrefix || a.name.localeCompare(b.name)
        })
        .slice(0, limit)
        .map((s) => s.name)
}

// ---------------------------------------------------------------------------
// Local catalog lookup
// ---------------------------------------------------------------------------

function buildTerpeneDataPoints(strain: Strain): TerpeneDataPoint[] {
    let raw: TerpeneDataPoint[] = []
    // Prefer structured terpene profile if available
    if (strain.terpeneProfile && typeof strain.terpeneProfile === 'object') {
        const entries = Object.entries(strain.terpeneProfile as Record<string, unknown>)
            .filter(([, v]) => typeof v === 'number' && (v as number) > 0)
            .map(([name, v]) => ({ name, percentage: v as number }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 6)
        if (entries.length > 0) raw = entries
    }
    // Fall back to dominant terpene list with estimated values
    if (raw.length === 0) {
        const dominant = strain.dominantTerpenes ?? []
        raw = dominant.slice(0, 6).map((name, i) => ({
            name,
            percentage: (TERPENE_ESTIMATE[name] ?? 10) * (1 - i * 0.08),
        }))
    }
    return enrichTerpeneDataPoints(raw)
}

function buildCannabinoidDataPoints(strain: Strain): CannabinoidDataPoint[] {
    const items: CannabinoidDataPoint[] = []
    if (strain.thc > 0) items.push({ name: 'THC', percentage: strain.thc })
    if (strain.cbd > 0) items.push({ name: 'CBD', percentage: strain.cbd })
    if ((strain.cbg ?? 0) > 0) items.push({ name: 'CBG', percentage: strain.cbg! })
    if ((strain.thcv ?? 0) > 0) items.push({ name: 'THCV', percentage: strain.thcv! })
    if (strain.cannabinoidProfile && typeof strain.cannabinoidProfile === 'object') {
        const existing = new Set(items.map((i2) => i2.name.toLowerCase()))
        for (const [name, val] of Object.entries(
            strain.cannabinoidProfile as Record<string, unknown>,
        )) {
            if (typeof val === 'number' && val > 0 && !existing.has(name.toLowerCase())) {
                items.push({ name, percentage: val })
            }
        }
    }
    return items.slice(0, 6)
}

function lookupLocalCatalog(name: string): LookupStrainResult | null {
    const q = name.toLowerCase().trim()
    const hit =
        allStrainsData.find((s) => s.name.toLowerCase() === q) ??
        allStrainsData.find((s) => s.name.toLowerCase().includes(q))
    if (!hit) return null

    const terpenes = buildTerpeneDataPoints(hit)
    const cannabinoids = buildCannabinoidDataPoints(hit)
    const flavonoids = buildFlavonoidDataPoints(hit.type)
    const totalEntourageScore = calculateEntourageScore(terpenes, hit.thc, hit.cbd, flavonoids)
    const terpeneDiversity = shannonDiversity(terpenes)

    return {
        id: hit.id,
        name: hit.name,
        breeder: hit.lineage?.breeder ?? 'Community',
        type: hit.type,
        floweringType: hit.floweringType,
        thc: hit.thc,
        cbd: hit.cbd,
        cbg: hit.cbg ?? 0,
        thcv: hit.thcv ?? 0,
        description: hit.description ?? '',
        genetics: hit.genetics ?? '',
        terpenes,
        cannabinoids,
        flavonoids,
        aiSummary: '',
        matchScore: 0,
        confidenceScore: 95,
        confidenceSource: 'local',
        discoveredAt: new Date().toISOString(),
        sourceUrl: '',
        totalEntourageScore,
        terpeneDiversity,
        fullStrain: hit,
    }
}

// ---------------------------------------------------------------------------
// Cannlytics API (primary external source -- lab analytics data)
// ---------------------------------------------------------------------------

async function lookupCannlytics(name: string): Promise<LookupStrainResult | null> {
    const apiKey =
        (import.meta.env as Record<string, string | undefined>)['VITE_CANNLYTICS_API_KEY'] ?? ''
    if (!apiKey) return null

    try {
        await throttleExternal()
        const encoded = encodeURIComponent(name)
        const response = await fetch(`https://cannlytics.com/api/data/strains/${encoded}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json',
            },
            signal: AbortSignal.timeout(8000),
        })
        if (!response.ok) return null

        const raw = (await response.json()) as Record<string, unknown>
        const data = (raw['data'] as Record<string, unknown> | undefined) ?? raw

        const thc = parseFloat(String(data['thc'] ?? data['total_thc'] ?? 0)) || 0
        const cbd = parseFloat(String(data['cbd'] ?? data['total_cbd'] ?? 0)) || 0
        const cbg = parseFloat(String(data['cbg'] ?? 0)) || 0
        const strainName = String(data['strain_name'] ?? data['name'] ?? name)

        const terpenes: TerpeneDataPoint[] = []
        const rawTerps = data['terpenes'] as Record<string, number> | undefined
        if (rawTerps && typeof rawTerps === 'object') {
            for (const [n, v] of Object.entries(rawTerps)) {
                if (typeof v === 'number' && v > 0) {
                    terpenes.push({ name: n, percentage: v * 100 })
                }
            }
        }

        const cannabinoids: CannabinoidDataPoint[] = []
        if (thc > 0) cannabinoids.push({ name: 'THC', percentage: thc })
        if (cbd > 0) cannabinoids.push({ name: 'CBD', percentage: cbd })
        if (cbg > 0) cannabinoids.push({ name: 'CBG', percentage: cbg })

        const rawType = String(data['type'] ?? data['strain_type'] ?? 'hybrid').toLowerCase()
        const type = rawType.includes('indica')
            ? 'Indica'
            : rawType.includes('sativa')
              ? 'Sativa'
              : 'Hybrid'

        return {
            id: `cannlytics-${strainName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: strainName,
            breeder: String(data['producer'] ?? data['breeder'] ?? 'Unknown'),
            type,
            floweringType: 'Photoperiod',
            thc,
            cbd,
            cbg,
            thcv: 0,
            description: String(data['description'] ?? ''),
            genetics: String(data['genetics'] ?? ''),
            terpenes: terpenes.slice(0, 6),
            cannabinoids: cannabinoids.slice(0, 6),
            aiSummary: '',
            matchScore: 0,
            confidenceScore: 88,
            confidenceSource: 'cannlytics',
            discoveredAt: new Date().toISOString(),
            sourceUrl: `https://cannlytics.com/strains/${encodeURIComponent(strainName)}`,
        }
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// Otreeba Open Cannabis API (secondary external source)
// Uses both the direct API and the strainApiService proxy cascade.
// ---------------------------------------------------------------------------

async function lookupOtreeba(name: string): Promise<LookupStrainResult | null> {
    try {
        await throttleExternal()
        const encoded = encodeURIComponent(name)

        // Try multiple Otreeba endpoint variants (API has had URL changes)
        const endpoints = [
            `https://api.otreeba.com/v1/strains?search=${encoded}&limit=5`,
            `https://otreeba.com/api/v1/strains?search=${encoded}&count=5`,
        ]

        let item: Record<string, unknown> | null = null
        for (const url of endpoints) {
            try {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    signal: AbortSignal.timeout(8000),
                })
                if (!response.ok) continue
                const raw = (await response.json()) as Record<string, unknown>
                // Handle both {items:[...]} and {data:[...]} response shapes
                const list =
                    (raw['items'] as Array<Record<string, unknown>> | undefined) ??
                    (raw['data'] as Array<Record<string, unknown>> | undefined)
                if (Array.isArray(list) && list.length > 0) {
                    item = list[0] as Record<string, unknown>
                    break
                }
            } catch {
                // Try next endpoint
            }
        }

        if (!item) return null

        const strainName = String(item['name'] ?? name)
        const thc = parseFloat(String(item['thcRatio'] ?? item['thc'] ?? 0)) || 0
        const cbd = parseFloat(String(item['cbdRatio'] ?? item['cbd'] ?? 0)) || 0

        const rawType = String(item['race'] ?? item['type'] ?? 'hybrid').toLowerCase()
        const type = rawType.includes('indica')
            ? 'Indica'
            : rawType.includes('sativa')
              ? 'Sativa'
              : 'Hybrid'

        // Map Otreeba flavor tags to approximate terpene names
        const flavorTerpeneMap: Record<string, string> = {
            Citrus: 'Limonene',
            Lemon: 'Limonene',
            Lime: 'Limonene',
            Earthy: 'Myrcene',
            Musky: 'Myrcene',
            Herbal: 'Myrcene',
            Pepper: 'Caryophyllene',
            Spicy: 'Caryophyllene',
            Pine: 'Pinene',
            Woody: 'Pinene',
            Floral: 'Linalool',
            Lavender: 'Linalool',
            Sweet: 'Terpinolene',
            Berry: 'Ocimene',
        }
        const terpenes: TerpeneDataPoint[] = []
        const flavors = item['flavors'] as string[] | undefined
        if (Array.isArray(flavors)) {
            for (let i = 0; i < Math.min(flavors.length, 4); i++) {
                const mapped = flavorTerpeneMap[flavors[i]!] ?? flavors[i]!
                terpenes.push({ name: mapped, percentage: 25 - i * 5 })
            }
        }

        const cannabinoids: CannabinoidDataPoint[] = []
        if (thc > 0) cannabinoids.push({ name: 'THC', percentage: thc })
        if (cbd > 0) cannabinoids.push({ name: 'CBD', percentage: cbd })

        const parents = item['parents'] as string[] | undefined
        const genetics = Array.isArray(parents) ? parents.join(' x ') : ''

        return {
            id: `otreeba-${strainName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: strainName,
            breeder: String(item['seedCompany'] ?? item['brand'] ?? 'Unknown'),
            type,
            floweringType: 'Photoperiod',
            thc,
            cbd,
            cbg: 0,
            thcv: 0,
            description: String(item['description'] ?? ''),
            genetics,
            terpenes,
            cannabinoids,
            aiSummary: '',
            matchScore: 0,
            confidenceScore: 72,
            confidenceSource: 'otreeba',
            discoveredAt: new Date().toISOString(),
            sourceUrl: '',
        }
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// The Cannabis API (public, GitHub: nicholasgasior/the-cannabis-api)
// Endpoint: https://the-cannabis-api.vercel.app/api/strains?name=<name>
// No API key required. Falls back to RapidAPI hosted variant if needed.
// ---------------------------------------------------------------------------

interface CannabisApiStrain {
    name?: string
    type?: string
    effects?: string[]
    flavors?: string[]
    description?: string
}

async function lookupCannabisApi(name: string): Promise<LookupStrainResult | null> {
    try {
        await throttleExternal()
        const encoded = encodeURIComponent(name)

        // Try multiple known endpoints for "The Cannabis API"
        const endpoints = [
            `https://the-cannabis-api.vercel.app/api/strains?name=${encoded}`,
            `https://api.cannabis.wiki/v1/strains?search=${encoded}&limit=5`,
        ]

        let hit: CannabisApiStrain | null = null
        for (const url of endpoints) {
            try {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    signal: AbortSignal.timeout(7000),
                })
                if (!response.ok) continue
                const raw = (await response.json()) as unknown

                // Handle array or {strains:[]} shape
                const list = Array.isArray(raw)
                    ? (raw as CannabisApiStrain[])
                    : (((raw as Record<string, unknown>)['strains'] as
                          | CannabisApiStrain[]
                          | undefined) ??
                      ((raw as Record<string, unknown>)['data'] as CannabisApiStrain[] | undefined))
                if (Array.isArray(list) && list.length > 0) {
                    hit = list[0] as CannabisApiStrain
                    break
                }
                // Handle single-object response
                if (
                    raw &&
                    typeof raw === 'object' &&
                    !Array.isArray(raw) &&
                    (raw as Record<string, unknown>)['name']
                ) {
                    hit = raw as CannabisApiStrain
                    break
                }
            } catch {
                // Try next
            }
        }

        if (!hit?.name) return null

        const strainName = String(hit.name ?? name)
        const rawType = String(hit.type ?? 'hybrid').toLowerCase()
        const type = rawType.includes('indica')
            ? 'Indica'
            : rawType.includes('sativa')
              ? 'Sativa'
              : 'Hybrid'

        // Map flavors to approximate terpenes
        const flavorTerpeneMap: Record<string, string> = {
            citrus: 'Limonene',
            lemon: 'Limonene',
            earthy: 'Myrcene',
            herbal: 'Myrcene',
            pepper: 'Caryophyllene',
            pine: 'Pinene',
            berry: 'Myrcene',
            sweet: 'Myrcene',
        }
        const terpenes: TerpeneDataPoint[] = (hit.flavors ?? [])
            .slice(0, 6)
            .map((f) => {
                const mapped = flavorTerpeneMap[f.toLowerCase()]
                return mapped ? ({ name: mapped, percentage: 0.2 } as TerpeneDataPoint) : null
            })
            .filter((t): t is TerpeneDataPoint => t !== null)

        return {
            id: `cannabis-api-${strainName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: strainName,
            breeder: 'Unknown',
            type,
            floweringType: 'Photoperiod',
            thc: 0,
            cbd: 0,
            cbg: 0,
            thcv: 0,
            description: String(hit.description ?? '').slice(0, 500),
            genetics: '',
            terpenes,
            cannabinoids: [],
            aiSummary: '',
            matchScore: 0,
            confidenceScore: 65,
            confidenceSource: 'cannabis-api',
            discoveredAt: new Date().toISOString(),
            sourceUrl: '',
        }
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// AI fallback (last resort -- generates summary + estimated data)
// ---------------------------------------------------------------------------

async function lookupWithAI(name: string): Promise<LookupStrainResult | null> {
    try {
        const { aiService, getAiMode } = await import('@/services/aiFacade')
        if (getAiMode() === 'eco') return null

        const lang = (document.documentElement.lang ?? 'en') as 'en' | 'de'
        const prompt =
            lang === 'de'
                ? `Gib mir detaillierte Informationen zur Cannabis-Sorte "${name}" als JSON (kein Begleittext):
{"name":"...","breeder":"...","type":"Indica|Sativa|Hybrid","floweringType":"Photoperiod|Autoflower","thc":0,"cbd":0,"cbg":0,"genetics":"...","description":"...","terpenes":[{"name":"Myrcene","percentage":0.3}],"flavonoids":[{"name":"Cannflavin A","role":"dominant"}],"summary":"Kurze Einschaetzung (2-3 Saetze)."}`
                : `Provide detailed information about cannabis strain "${name}" as JSON only (no surrounding text):
{"name":"...","breeder":"...","type":"Indica|Sativa|Hybrid","floweringType":"Photoperiod|Autoflower","thc":0,"cbd":0,"cbg":0,"genetics":"...","description":"...","terpenes":[{"name":"Myrcene","percentage":0.3}],"flavonoids":[{"name":"Cannflavin A","role":"dominant"}],"summary":"Short assessment of why this strain is notable (2-3 sentences)."}`

        const plantStub = { id: 'strain-lookup', name } as Parameters<
            typeof aiService.getMentorResponse
        >[0]
        const response = await aiService.getMentorResponse(plantStub, prompt, lang)
        if (!response?.content) return null

        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (!jsonMatch?.[0]) return null

        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
        const strainName = String(parsed['name'] ?? name)
        const thc = parseFloat(String(parsed['thc'] ?? 0)) || 0
        const cbd = parseFloat(String(parsed['cbd'] ?? 0)) || 0
        const cbg = parseFloat(String(parsed['cbg'] ?? 0)) || 0

        const rawType = String(parsed['type'] ?? '').toLowerCase()
        const type = rawType.includes('indica')
            ? 'Indica'
            : rawType.includes('sativa')
              ? 'Sativa'
              : 'Hybrid'

        const terpenes: TerpeneDataPoint[] = []
        const rawTerps = parsed['terpenes']
        if (Array.isArray(rawTerps)) {
            for (const t of rawTerps.slice(0, 6)) {
                if (t && typeof t === 'object' && 'name' in t && 'percentage' in t) {
                    const rec = t as Record<string, unknown>
                    const pct = parseFloat(String(rec['percentage'])) || 0
                    // Normalise: if value looks like a fraction (< 2), scale to %
                    terpenes.push({
                        name: String(rec['name']),
                        percentage: pct < 2 ? pct * 100 : pct,
                    })
                }
            }
        }
        const enrichedTerpenes = enrichTerpeneDataPoints(terpenes)

        const rawFlavonoids = parsed['flavonoids']
        const aiFlavonoids: FlavonoidDataPoint[] = []
        if (Array.isArray(rawFlavonoids)) {
            for (const f of rawFlavonoids.slice(0, 4)) {
                if (f && typeof f === 'object' && 'name' in f) {
                    const rec = f as Record<string, unknown>
                    const fname = String(rec['name'])
                    const profile = FLAVONOID_PROFILES[fname]
                    aiFlavonoids.push({
                        name: fname,
                        role: (rec['role'] as FlavonoidDataPoint['role']) ?? 'secondary',
                        entourageScore: profile?.score,
                        cannabinoidInteractions: profile?.interactions,
                    })
                }
            }
        }
        const flavonoids = aiFlavonoids.length > 0 ? aiFlavonoids : buildFlavonoidDataPoints(type)

        const cannabinoids: CannabinoidDataPoint[] = []
        if (thc > 0) cannabinoids.push({ name: 'THC', percentage: thc, role: 'primary' })
        if (cbd > 0) cannabinoids.push({ name: 'CBD', percentage: cbd, role: 'secondary' })
        if (cbg > 0) cannabinoids.push({ name: 'CBG', percentage: cbg, role: 'trace' })

        const totalEntourageScore = calculateEntourageScore(enrichedTerpenes, thc, cbd, flavonoids)
        const terpeneDiversity = shannonDiversity(enrichedTerpenes)

        return {
            id: `ai-${strainName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: strainName,
            breeder: String(parsed['breeder'] ?? 'Unknown'),
            type,
            floweringType:
                String(parsed['floweringType'] ?? '') === 'Autoflower'
                    ? 'Autoflower'
                    : 'Photoperiod',
            thc,
            cbd,
            cbg,
            thcv: 0,
            description: String(parsed['description'] ?? '').slice(0, 500),
            genetics: String(parsed['genetics'] ?? ''),
            terpenes: enrichedTerpenes,
            cannabinoids,
            flavonoids,
            aiSummary: String(parsed['summary'] ?? ''),
            matchScore: 0,
            confidenceScore: 60,
            confidenceSource: 'ai',
            discoveredAt: new Date().toISOString(),
            sourceUrl: '',
            totalEntourageScore,
            terpeneDiversity,
        }
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lookup a strain by name using the multi-API strategy:
 * 1. Local catalog (instant, 95% confidence)
 * 2. Cannlytics API (lab data, 88% confidence) -- requires VITE_CANNLYTICS_API_KEY
 * 3. Otreeba Open Cannabis API (72% confidence)
 * 4. The Cannabis API -- public, no key required (65% confidence)
 * 5. AI-generated summary (60% confidence, last resort)
 *
 * Results are cached in sessionStorage for 5 minutes.
 * All external calls respect isLocalOnlyMode() and rate limiting.
 */
export async function lookupStrain(name: string): Promise<LookupStrainResult | null> {
    const trimmed = name.trim()
    if (trimmed.length < 2) return null

    // 1. Cache check
    const cached = getCached(trimmed)
    if (cached) return cached

    // 2. Local catalog (always, regardless of mode)
    const local = lookupLocalCatalog(trimmed)
    if (local) {
        setCached(trimmed, local)
        return local
    }

    // External lookups require network access
    if (isLocalOnlyMode()) return null

    // 3. Cannlytics API
    const cannlytics = await lookupCannlytics(trimmed)
    if (cannlytics) {
        setCached(trimmed, cannlytics)
        return cannlytics
    }

    // 4. Otreeba Open Cannabis API
    const otreeba = await lookupOtreeba(trimmed)
    if (otreeba) {
        setCached(trimmed, otreeba)
        return otreeba
    }

    // 5. The Cannabis API (public, no key)
    const cannabisApi = await lookupCannabisApi(trimmed)
    if (cannabisApi) {
        setCached(trimmed, cannabisApi)
        return cannabisApi
    }

    // 6. AI fallback
    const ai = await lookupWithAI(trimmed)
    if (ai) {
        setCached(trimmed, ai)
        return ai
    }

    return null
}
