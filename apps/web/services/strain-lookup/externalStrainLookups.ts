/* eslint-disable @typescript-eslint/no-unsafe-type-assertion --
 * External API responses return untyped JSON; runtime guards and ?? fallbacks apply. */

import type {
  CannabinoidDataPoint,
  FlavonoidDataPoint,
  LookupStrainResult,
  TerpeneDataPoint,
} from '@/services/strain-lookup/strainLookupTypes'
import type { KnownFlavonoid } from '@/services/strain-lookup/flavonoidProfiles'
import { FLAVONOID_PROFILES } from '@/services/strain-lookup/flavonoidProfiles'
import {
  buildFlavonoidDataPoints,
  calculateEntourageScore,
  enrichTerpeneDataPoints,
  shannonDiversity,
} from '@/services/strain-lookup/strainLookupEnrichment'
import { throttleExternal } from '@/services/strain-lookup/strainLookupCache'

export async function lookupCannlytics(name: string): Promise<LookupStrainResult | null> {
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

export async function lookupOtreeba(name: string): Promise<LookupStrainResult | null> {
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

export async function lookupCannabisApi(name: string): Promise<LookupStrainResult | null> {
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

export async function lookupWithAI(name: string): Promise<LookupStrainResult | null> {
    try {
        const { aiService, getAiMode } = await import('@/services/aiFacade')
        const { sanitizeForPrompt } = await import('@/services/ai/safetyPipeline')
        if (getAiMode() === 'eco') return null

        const safeName = sanitizeForPrompt(name, 120)
        if (!safeName.trim()) return null

        const lang = (document.documentElement.lang ?? 'en') as 'en' | 'de'
        const prompt =
            lang === 'de'
                ? `Gib mir detaillierte Informationen zur Cannabis-Sorte "${safeName}" als JSON (kein Begleittext):
{"name":"...","breeder":"...","type":"Indica|Sativa|Hybrid","floweringType":"Photoperiod|Autoflower","thc":0,"cbd":0,"cbg":0,"genetics":"...","description":"...","terpenes":[{"name":"Myrcene","percentage":0.3}],"flavonoids":[{"name":"Cannflavin A","role":"dominant"}],"summary":"Kurze Einschaetzung (2-3 Saetze)."}`
                : `Provide detailed information about cannabis strain "${safeName}" as JSON only (no surrounding text):
{"name":"...","breeder":"...","type":"Indica|Sativa|Hybrid","floweringType":"Photoperiod|Autoflower","thc":0,"cbd":0,"cbg":0,"genetics":"...","description":"...","terpenes":[{"name":"Myrcene","percentage":0.3}],"flavonoids":[{"name":"Cannflavin A","role":"dominant"}],"summary":"Short assessment of why this strain is notable (2-3 sentences)."}`

        const plantStub = { id: 'strain-lookup', name: safeName } as Parameters<
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
                    const profile =
                        fname in FLAVONOID_PROFILES
                            ? FLAVONOID_PROFILES[fname as KnownFlavonoid]
                            : undefined
                    aiFlavonoids.push({
                        name: fname,
                        role: (rec['role'] as FlavonoidDataPoint['role']) ?? 'secondary',
                        ...(profile !== undefined && {
                            entourageScore: profile.score,
                            cannabinoidInteractions: profile.interactions,
                        }),
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
