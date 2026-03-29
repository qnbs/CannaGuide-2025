// ---------------------------------------------------------------------------
// seedbankService.ts -- Seedbank availability lookups
//
// Strategy:
//   1. Try SeedFinder.eu public API via CORS proxy
//   2. Fallback to deterministic mock data when the API is unreachable,
//      rate-limited, or returns no results for the given strain
// ---------------------------------------------------------------------------

import type { Seedbank, SeedAvailability, SeedType } from '@/types'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'

// ---------------------------------------------------------------------------
// Seedbank registry (used by both API + mock paths)
// ---------------------------------------------------------------------------

const SEEDBANKS: Seedbank[] = [
    {
        id: 'sensi-seeds',
        name: 'Sensi Seeds',
        websiteUrl: 'https://sensiseeds.com',
        rating: 4.8,
    },
    {
        id: 'barneys-farm',
        name: "Barney's Farm",
        websiteUrl: 'https://barneysfarm.com',
        rating: 4.7,
    },
    {
        id: 'royal-queen-seeds',
        name: 'Royal Queen Seeds',
        websiteUrl: 'https://royalqueenseeds.com',
        rating: 4.6,
    },
    {
        id: 'dutch-passion',
        name: 'Dutch Passion',
        websiteUrl: 'https://dutch-passion.com',
        rating: 4.5,
    },
    {
        id: 'fastbuds',
        name: 'FastBuds',
        websiteUrl: 'https://fastbuds.com',
        rating: 4.4,
    },
]

// ---------------------------------------------------------------------------
// SeedFinder API configuration
// ---------------------------------------------------------------------------

const SEEDFINDER_BASE = 'https://en.seedfinder.eu/api/json'
const SEEDFINDER_API_KEY: string = import.meta.env.VITE_SEEDFINDER_API_KEY ?? ''

/** Ordered list of CORS proxies -- first success wins. */
const CORS_PROXIES = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
] as const

const FETCH_TIMEOUT_MS = 8_000

// ---------------------------------------------------------------------------
// Deterministic hash for reproducible mock prices
// ---------------------------------------------------------------------------

function simpleHash(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) | 0
    }
    return Math.abs(hash)
}

// ---------------------------------------------------------------------------
// API fetch with CORS proxy cascade
// ---------------------------------------------------------------------------

async function fetchViaProxy(directUrl: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
        for (const proxyFn of CORS_PROXIES) {
            const proxiedUrl = proxyFn(directUrl)
            try {
                const res = await fetch(proxiedUrl, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                })
                if (res.ok) {
                    const data: unknown = await res.json()
                    return data
                }
            } catch {
                // Try next proxy
            }
        }
    } finally {
        clearTimeout(timer)
    }
    return null
}

// ---------------------------------------------------------------------------
// SeedFinder response parsing
// ---------------------------------------------------------------------------

interface SeedFinderShopEntry {
    name?: string
    link?: string
    price?: string | number
    amount?: string | number
    currency?: string
    available?: boolean | number | string
    fem?: boolean | number | string
    auto?: boolean | number | string
}

function parseSeedFinderResponse(json: unknown, strainName: string): SeedAvailability[] {
    if (!json || typeof json !== 'object') return []

    // SeedFinder returns { shops: { ...entries } } or an array
    const shops: SeedFinderShopEntry[] = []

    const record = json as Record<string, unknown>
    if (record['error']) return []

    const shopsObj = record['shops'] ?? record['prices'] ?? record
    if (shopsObj && typeof shopsObj === 'object') {
        const entries = Array.isArray(shopsObj)
            ? (shopsObj as SeedFinderShopEntry[])
            : Object.values(shopsObj as Record<string, SeedFinderShopEntry>)
        shops.push(...entries.filter((e): e is SeedFinderShopEntry => !!e && typeof e === 'object'))
    }

    if (shops.length === 0) return []

    return shops.slice(0, 5).map((shop, idx) => {
        const shopName = String(shop.name ?? `Shop ${idx + 1}`)
        const shopId = shopName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+$/, '')
        const price =
            typeof shop.price === 'number' ? shop.price : parseFloat(String(shop.price ?? '0')) || 0
        const amount =
            typeof shop.amount === 'number'
                ? shop.amount
                : parseInt(String(shop.amount ?? '1'), 10) || 1
        const pricePerSeed = amount > 0 ? Math.round((price / amount) * 100) / 100 : price

        const isFem = shop.fem === true || shop.fem === 1 || shop.fem === '1'
        const isAuto = shop.auto === true || shop.auto === 1 || shop.auto === '1'
        const seedType: SeedType = isAuto ? 'Autoflowering' : isFem ? 'Feminized' : 'Regular'

        // Register dynamic seedbank if not already known
        const knownSb = SEEDBANKS.find((sb) => sb.id === shopId)
        if (!knownSb) {
            const hash = simpleHash(`${shopId}-${strainName}`)
            dynamicSeedbanks.set(shopId, {
                id: shopId,
                name: shopName,
                websiteUrl:
                    typeof shop.link === 'string' && shop.link.startsWith('http')
                        ? shop.link
                        : `https://en.seedfinder.eu/`,
                rating: 3.5 + (hash % 15) / 10,
            })
        }

        return {
            seedbankId: knownSb?.id ?? shopId,
            pricePerSeed,
            currency: (shop.currency ?? 'EUR') as string,
            inStock: shop.available !== false && shop.available !== 0 && shop.available !== '0',
            packSizes: [1, amount, amount * 2].filter((v, i, a) => a.indexOf(v) === i && v > 0),
            seedType,
        }
    })
}

/** Seedbanks discovered from API responses (not in the static registry). */
const dynamicSeedbanks = new Map<string, Seedbank>()

// ---------------------------------------------------------------------------
// Mock data generator (deterministic fallback)
// ---------------------------------------------------------------------------

function generateMockAvailability(strainId: string): SeedAvailability[] {
    const hash = simpleHash(strainId)
    const seedTypes: SeedType[] = ['Feminized', 'Regular', 'Autoflowering']
    const packOptions: number[][] = [
        [1, 3, 5],
        [3, 5, 10],
        [1, 5, 10],
        [3, 10],
        [5, 10, 25],
    ]

    const count = 2 + (hash % 3)
    const startIdx = hash % SEEDBANKS.length

    const results: SeedAvailability[] = []
    for (let i = 0; i < count; i++) {
        const sbIdx = (startIdx + i) % SEEDBANKS.length
        const sb = SEEDBANKS[sbIdx]
        if (!sb) continue
        const entryHash = simpleHash(`${strainId}-${sb.id}`)
        const basePrice = 3 + (entryHash % 12) + (entryHash % 100) / 100

        results.push({
            seedbankId: sb.id,
            pricePerSeed: Math.round(basePrice * 100) / 100,
            currency: 'EUR',
            inStock: entryHash % 5 !== 0,
            packSizes: packOptions[entryHash % packOptions.length] ?? [3, 5, 10],
            seedType: seedTypes[entryHash % seedTypes.length] ?? 'Feminized',
        })
    }
    return results
}

// ---------------------------------------------------------------------------
// In-memory cache (strain name -> availability, 5-min TTL)
// ---------------------------------------------------------------------------

interface CacheEntry {
    data: SeedAvailability[]
    expiresAt: number
}

const availabilityCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getSeedbanks(): Seedbank[] {
    return [...SEEDBANKS, ...dynamicSeedbanks.values()]
}

export function getSeedbankById(id: string): Seedbank | undefined {
    return SEEDBANKS.find((sb) => sb.id === id) ?? dynamicSeedbanks.get(id)
}

/**
 * Fetch seed availability for a strain.
 *
 * 1. Check in-memory cache
 * 2. If online, try SeedFinder API via CORS proxy cascade
 * 3. Fallback to deterministic mock data
 *
 * @param strainId - Unique strain identifier
 * @param strainName - Human-readable strain name (used for API query)
 */
export async function getAvailabilityForStrain(
    strainId: string,
    strainName?: string,
): Promise<SeedAvailability[]> {
    // 1. Cache hit?
    const cached = availabilityCache.get(strainId)
    if (cached && Date.now() < cached.expiresAt) {
        return cached.data
    }

    // 2. Try real API (skip in local-only mode or when API key is not configured)
    if (strainName && SEEDFINDER_API_KEY && !isLocalOnlyMode()) {
        try {
            const encodedName = encodeURIComponent(strainName)
            const apiUrl = `${SEEDFINDER_BASE}/strain.json?str=${encodedName}&ac=${SEEDFINDER_API_KEY}&lng=en`
            const json = await fetchViaProxy(apiUrl)
            const parsed = parseSeedFinderResponse(json, strainName)

            if (parsed.length > 0) {
                const entry: CacheEntry = { data: parsed, expiresAt: Date.now() + CACHE_TTL_MS }
                availabilityCache.set(strainId, entry)
                return parsed
            }
        } catch {
            // API failed -- fall through to mock
        }
    }

    // 3. Deterministic mock fallback (always works, always functional)
    const mock = generateMockAvailability(strainId)
    const entry: CacheEntry = { data: mock, expiresAt: Date.now() + CACHE_TTL_MS }
    availabilityCache.set(strainId, entry)
    return mock
}

// ---------------------------------------------------------------------------
// SeedFinder lineage / breeder data
// ---------------------------------------------------------------------------

export interface SeedfinderLineageData {
    parents: Array<{ name: string; type?: string }>
    breeder?: string
    breederCountry?: string
    yearReleased?: number
    description?: string
    genetics?: string
}

const lineageCache = new Map<string, CacheEntry>()

/**
 * Fetch lineage and breeder information for a strain from SeedFinder.
 *
 * Uses the strain info endpoint which returns parent strains and breeder
 * metadata. Requires VITE_SEEDFINDER_API_KEY.
 */
export async function getLineageFromSeedfinder(
    strainName: string,
): Promise<SeedfinderLineageData | null> {
    if (!SEEDFINDER_API_KEY || isLocalOnlyMode()) return null

    const cacheKey = `lineage:${strainName.toLowerCase()}`
    const cached = lineageCache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
        return cached.data as unknown as SeedfinderLineageData
    }

    try {
        const encoded = encodeURIComponent(strainName)
        const apiUrl = `${SEEDFINDER_BASE}/strain.json?str=${encoded}&ac=${SEEDFINDER_API_KEY}&lng=en&info=1`
        const json = await fetchViaProxy(apiUrl)
        if (!json || typeof json !== 'object') return null

        const record = json as Record<string, unknown>
        if (record['error']) return null

        const parents: Array<{ name: string; type?: string }> = []
        const parentsObj = record['parents'] ?? record['lineage']
        if (parentsObj && typeof parentsObj === 'object') {
            const entries = Array.isArray(parentsObj)
                ? (parentsObj as Array<Record<string, unknown>>)
                : Object.values(parentsObj as Record<string, Record<string, unknown>>)
            for (const p of entries) {
                if (p && typeof p === 'object') {
                    const name = String(p['name'] ?? p['strain'] ?? '')
                    if (name) {
                        parents.push({ name, type: p['type'] ? String(p['type']) : undefined })
                    }
                }
            }
        }

        const breeder = record['breeder']
            ? String(record['breeder'])
            : (record['breedby'] as string | undefined)
        const result: SeedfinderLineageData = {
            parents,
            breeder: breeder ?? undefined,
            breederCountry: record['country'] ? String(record['country']) : undefined,
            yearReleased: record['year'] ? Number(record['year']) || undefined : undefined,
            description: record['description'] ? String(record['description']) : undefined,
            genetics: record['genetics'] ? String(record['genetics']) : undefined,
        }

        lineageCache.set(cacheKey, {
            data: result as unknown as SeedAvailability[],
            expiresAt: Date.now() + CACHE_TTL_MS,
        })
        return result
    } catch {
        return null
    }
}
