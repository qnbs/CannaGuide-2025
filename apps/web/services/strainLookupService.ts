// ---------------------------------------------------------------------------
// strainLookupService.ts -- Multi-API Strain Lookup
//
// Strategy: Local DB (instant) -> Cannlytics API (lab data) ->
//           Otreeba Open Cannabis API -> AI-generated summary (last resort)
//
// All external calls check isLocalOnlyMode() and are rate-limited.
// Results are cached in sessionStorage (5-min TTL).
// ---------------------------------------------------------------------------

import { allStrainsData } from '@/data/strains/index'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import type { Strain } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TerpeneDataPoint {
    name: string
    /** Percentage value, e.g. 25.4 means 25.4% */
    percentage: number
}

export interface CannabinoidDataPoint {
    name: string
    /** Percentage value, e.g. 22.0 means 22% THC */
    percentage: number
}

/** Confidence source ordering: local > cannlytics > otreeba > ai */
export type ConfidenceSource = 'local' | 'cannlytics' | 'otreeba' | 'ai'

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
    /** KI-generated insight text about this strain */
    aiSummary: string
    /** 0-100 relevance match to user profile */
    matchScore: number
    /** 0-100 confidence in the data quality */
    confidenceScore: number
    confidenceSource: ConfidenceSource
    discoveredAt: string
    sourceUrl: string
    /** Full Strain object if found in local catalog */
    fullStrain?: Strain | undefined
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
    // Prefer structured terpene profile if available
    if (strain.terpeneProfile && typeof strain.terpeneProfile === 'object') {
        const entries = Object.entries(strain.terpeneProfile as Record<string, unknown>)
            .filter(([, v]) => typeof v === 'number' && (v as number) > 0)
            .map(([name, v]) => ({ name, percentage: v as number }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 6)
        if (entries.length > 0) return entries
    }
    // Fall back to dominant terpene list with estimated values
    const dominant = strain.dominantTerpenes ?? []
    return dominant.slice(0, 6).map((name, i) => ({
        name,
        percentage: (TERPENE_ESTIMATE[name] ?? 10) * (1 - i * 0.08),
    }))
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
        terpenes: buildTerpeneDataPoints(hit),
        cannabinoids: buildCannabinoidDataPoints(hit),
        aiSummary: '',
        matchScore: 0,
        confidenceScore: 95,
        confidenceSource: 'local',
        discoveredAt: new Date().toISOString(),
        sourceUrl: '',
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
// ---------------------------------------------------------------------------

async function lookupOtreeba(name: string): Promise<LookupStrainResult | null> {
    try {
        await throttleExternal()
        const encoded = encodeURIComponent(name)
        const response = await fetch(
            `https://otreeba.com/api/v1/strains?search=${encoded}&count=5`,
            {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(8000),
            },
        )
        if (!response.ok) return null

        const raw = (await response.json()) as Record<string, unknown>
        const items = raw['items'] as Array<Record<string, unknown>> | undefined
        if (!items || items.length === 0) return null
        const item = items[0]!

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
            breeder: String(item['seedCompany'] ?? 'Unknown'),
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
{"name":"...","breeder":"...","type":"Indica|Sativa|Hybrid","floweringType":"Photoperiod|Autoflower","thc":0,"cbd":0,"cbg":0,"genetics":"...","description":"...","terpenes":[{"name":"Myrcene","percentage":0.3}],"summary":"Kurze Einschaetzung (2-3 Saetze)."}`
                : `Provide detailed information about cannabis strain "${name}" as JSON only (no surrounding text):
{"name":"...","breeder":"...","type":"Indica|Sativa|Hybrid","floweringType":"Photoperiod|Autoflower","thc":0,"cbd":0,"cbg":0,"genetics":"...","description":"...","terpenes":[{"name":"Myrcene","percentage":0.3}],"summary":"Short assessment of why this strain is notable (2-3 sentences)."}`

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

        const cannabinoids: CannabinoidDataPoint[] = []
        if (thc > 0) cannabinoids.push({ name: 'THC', percentage: thc })
        if (cbd > 0) cannabinoids.push({ name: 'CBD', percentage: cbd })
        if (cbg > 0) cannabinoids.push({ name: 'CBG', percentage: cbg })

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
            terpenes,
            cannabinoids,
            aiSummary: String(parsed['summary'] ?? ''),
            matchScore: 0,
            confidenceScore: 60,
            confidenceSource: 'ai',
            discoveredAt: new Date().toISOString(),
            sourceUrl: '',
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
 * 4. AI-generated summary (60% confidence, last resort)
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

    // 5. AI fallback
    const ai = await lookupWithAI(trimmed)
    if (ai) {
        setCached(trimmed, ai)
        return ai
    }

    return null
}
