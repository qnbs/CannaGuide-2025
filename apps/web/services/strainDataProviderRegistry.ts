/**
 * Strain Data Provider Registry
 *
 * Centralized registry for all external strain data sources. Each provider
 * has a standardized interface for search, fetch, and capability reporting.
 * The registry handles provider selection, CORS proxy routing, rate limiting,
 * and result normalization via Zod schemas.
 *
 * Providers:
 *  - Seedfinder.eu (lineage, breeder data)
 *  - Otreeba (open cannabis API -- strains, terpenes, studies)
 *  - Cannlytics (lab data, COAs)
 *  - Strain API / RapidAPI (effects, aromas)
 *  - CannSeek (SNP/genetic markers)
 *  - OpenTHC (seed-to-sale, lab schemas)
 *  - Cansativa (DE medical market)
 *  - Kushy/Community (static JSON datasets)
 */

import type { StrainApiProvider, DataProvenance } from '@/types'
import { externalStrainDataSchema, type ValidatedExternalStrainData } from '@/types/strainSchemas'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Capabilities that a provider can offer */
export type ProviderCapability =
    | 'search'
    | 'strain-detail'
    | 'lineage'
    | 'terpenes'
    | 'cannabinoids'
    | 'flavonoids'
    | 'lab-results'
    | 'medical-info'
    | 'effects'
    | 'aromas'
    | 'breeder-info'
    | 'genetic-markers'

/** Provider status */
export type ProviderStatus = 'available' | 'unavailable' | 'rate-limited' | 'no-key'

/** Provider configuration */
export interface ProviderConfig {
    /** Unique provider identifier */
    id: StrainApiProvider
    /** Display name */
    name: string
    /** Base API URL */
    baseUrl: string
    /** Whether an API key is required */
    requiresApiKey: boolean
    /** Environment variable name for API key */
    apiKeyEnvVar?: string
    /** Supported capabilities */
    capabilities: ProviderCapability[]
    /** Rate limit (requests per minute) */
    rateLimitPerMin: number
    /** Whether CORS proxy is needed */
    needsCorsProxy: boolean
    /** Whether this provider has a static/bundled dataset */
    hasStaticDataset: boolean
    /** Data quality tier (1 = lab-verified, 2 = curated, 3 = community) */
    qualityTier: 1 | 2 | 3
    /** Geographic focus */
    region: 'global' | 'eu' | 'de' | 'us' | 'nl'
    /** Brief description */
    description: string
}

/** Normalized search result from any provider */
export interface ProviderSearchResult {
    provider: StrainApiProvider
    data: ValidatedExternalStrainData
    /** Relevance score for the search query (0--1) */
    relevance: number
    /** Time taken for this specific fetch (ms) */
    fetchTimeMs: number
}

// ---------------------------------------------------------------------------
// CORS Proxy Cascade
// ---------------------------------------------------------------------------

const CORS_PROXIES = [
    (url: string): string => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string): string => `https://corsproxy.io/?${encodeURIComponent(url)}`,
]

export const fetchWithCorsProxy = async (
    url: string,
    options?: globalThis.RequestInit,
): Promise<Response> => {
    // Try direct first (works in non-browser or CORS-enabled APIs)
    try {
        const direct = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) })
        if (direct.ok) return direct
    } catch {
        // Direct failed, try proxies
    }

    for (const proxy of CORS_PROXIES) {
        try {
            const proxied = await fetch(proxy(url), {
                ...options,
                signal: AbortSignal.timeout(10000),
            })
            if (proxied.ok) return proxied
        } catch {
            continue
        }
    }

    throw new Error(`All CORS proxies failed for: ${url}`)
}

// ---------------------------------------------------------------------------
// Rate Limiter (per-provider sliding window)
// ---------------------------------------------------------------------------

const rateLimitWindows = new Map<string, number[]>()

const checkRateLimit = (providerId: string, limitPerMin: number): boolean => {
    const now = Date.now()
    const window = rateLimitWindows.get(providerId) ?? []
    const recent = window.filter((t) => now - t < 60_000)
    rateLimitWindows.set(providerId, recent)
    if (recent.length >= limitPerMin) return false
    recent.push(now)
    return true
}

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

export const PROVIDER_CONFIGS: Record<StrainApiProvider, ProviderConfig> = {
    seedfinder: {
        id: 'seedfinder',
        name: 'Seedfinder.eu',
        baseUrl: 'https://en.seedfinder.eu/api/json',
        requiresApiKey: true,
        apiKeyEnvVar: 'VITE_SEEDFINDER_API_KEY',
        capabilities: ['search', 'strain-detail', 'lineage', 'breeder-info'],
        rateLimitPerMin: 30,
        needsCorsProxy: true,
        hasStaticDataset: false,
        qualityTier: 2,
        region: 'eu',
        description: 'Premier genetic lineage database with 40,000+ strains and breeder data',
    },
    otreeba: {
        id: 'otreeba',
        name: 'Otreeba',
        baseUrl: 'https://api.otreeba.com/v1',
        requiresApiKey: false,
        capabilities: ['search', 'strain-detail', 'terpenes', 'cannabinoids', 'effects'],
        rateLimitPerMin: 60,
        needsCorsProxy: true,
        hasStaticDataset: false,
        qualityTier: 2,
        region: 'global',
        description: 'Open Cannabis API with strains, products, and lab data',
    },
    cannlytics: {
        id: 'cannlytics',
        name: 'Cannlytics',
        baseUrl: 'https://cannlytics.com/api',
        requiresApiKey: true,
        apiKeyEnvVar: 'VITE_CANNLYTICS_API_KEY',
        capabilities: ['search', 'lab-results', 'terpenes', 'cannabinoids'],
        rateLimitPerMin: 30,
        needsCorsProxy: true,
        hasStaticDataset: false,
        qualityTier: 1,
        region: 'us',
        description: 'Lab-verified cannabis analytics with COAs and terpene data',
    },
    strainapi: {
        id: 'strainapi',
        name: 'The Strain API',
        baseUrl: 'https://the-strain-api.p.rapidapi.com',
        requiresApiKey: true,
        apiKeyEnvVar: 'VITE_STRAINAPI_KEY',
        capabilities: ['search', 'effects', 'aromas'],
        rateLimitPerMin: 20,
        needsCorsProxy: false,
        hasStaticDataset: false,
        qualityTier: 3,
        region: 'global',
        description: '1,500+ strains with consumer effects and flavor profiles',
    },
    cannseek: {
        id: 'cannseek',
        name: 'CannSeek',
        baseUrl: 'https://cannseek.scu.edu.au/api',
        requiresApiKey: false,
        capabilities: ['search', 'genetic-markers', 'lineage'],
        rateLimitPerMin: 10,
        needsCorsProxy: true,
        hasStaticDataset: false,
        qualityTier: 1,
        region: 'global',
        description: 'SNP-based genetic marker database for phylogenetic analysis',
    },
    openthc: {
        id: 'openthc',
        name: 'OpenTHC',
        baseUrl: 'https://api.openthc.org/v2',
        requiresApiKey: false,
        capabilities: ['search', 'lab-results', 'cannabinoids', 'terpenes'],
        rateLimitPerMin: 30,
        needsCorsProxy: true,
        hasStaticDataset: false,
        qualityTier: 1,
        region: 'us',
        description: 'Open seed-to-sale data standards with lab result schemas',
    },
    cansativa: {
        id: 'cansativa',
        name: 'Cansativa',
        baseUrl: 'https://cansativagw.azure-api.net/v2',
        requiresApiKey: true,
        apiKeyEnvVar: 'VITE_CANSATIVA_API_KEY',
        capabilities: [
            'search',
            'strain-detail',
            'terpenes',
            'cannabinoids',
            'lab-results',
            'medical-info',
        ],
        rateLimitPerMin: 15,
        needsCorsProxy: false,
        hasStaticDataset: false,
        qualityTier: 1,
        region: 'de',
        description: 'German medical cannabis distributor with GMP-grade lab data (Azure API)',
    },
    kushy: {
        id: 'kushy',
        name: 'Kushy Dataset',
        baseUrl: '',
        requiresApiKey: false,
        capabilities: ['search', 'effects', 'aromas'],
        rateLimitPerMin: 999,
        needsCorsProxy: false,
        hasStaticDataset: true,
        qualityTier: 3,
        region: 'global',
        description: 'Open-source community strain dataset (static JSON, offline-ready)',
    },
    community: {
        id: 'community',
        name: 'Community Data',
        baseUrl: '',
        requiresApiKey: false,
        capabilities: ['search', 'effects', 'aromas', 'terpenes'],
        rateLimitPerMin: 999,
        needsCorsProxy: false,
        hasStaticDataset: true,
        qualityTier: 3,
        region: 'global',
        description: 'Aggregated community datasets from GitHub and Kaggle',
    },
}

// ---------------------------------------------------------------------------
// Provider Status
// ---------------------------------------------------------------------------

/**
 * Get the current status of a provider.
 */
export const getProviderStatus = (providerId: StrainApiProvider): ProviderStatus => {
    const config = PROVIDER_CONFIGS[providerId]
    if (!config) return 'unavailable'

    if (isLocalOnlyMode()) return 'unavailable'

    if (config.requiresApiKey) {
        const key = config.apiKeyEnvVar ? import.meta.env[config.apiKeyEnvVar] : undefined
        if (!key) return 'no-key'
    }

    const window = rateLimitWindows.get(providerId)
    if (window && window.filter((t) => Date.now() - t < 60_000).length >= config.rateLimitPerMin) {
        return 'rate-limited'
    }

    return 'available'
}

/**
 * Get all providers that support a specific capability.
 */
export const getProvidersForCapability = (capability: ProviderCapability): ProviderConfig[] => {
    return Object.values(PROVIDER_CONFIGS).filter((p) => p.capabilities.includes(capability))
}

/**
 * Get all currently available providers.
 */
export const getAvailableProviders = (): ProviderConfig[] => {
    return Object.values(PROVIDER_CONFIGS).filter((p) => getProviderStatus(p.id) === 'available')
}

/**
 * Get provider configs sorted by quality tier (best first).
 */
export const getProvidersByQuality = (capability?: ProviderCapability): ProviderConfig[] => {
    const providers = capability
        ? getProvidersForCapability(capability)
        : Object.values(PROVIDER_CONFIGS)
    return [...providers].sort((a, b) => a.qualityTier - b.qualityTier)
}

// ---------------------------------------------------------------------------
// Unified Search
// ---------------------------------------------------------------------------

/**
 * Search across all available providers for strain data.
 * Results are validated via Zod, deduplicated, and sorted by relevance.
 */
export const searchAllProviders = async (
    query: string,
    options?: {
        providers?: StrainApiProvider[]
        capabilities?: ProviderCapability[]
        limit?: number
        timeoutMs?: number
    },
): Promise<ProviderSearchResult[]> => {
    if (isLocalOnlyMode()) return []
    if (!query.trim()) return []

    const limit = options?.limit ?? 20
    const timeoutMs = options?.timeoutMs ?? 15_000

    // Determine which providers to query
    let providers = options?.providers
        ? options.providers.map((id) => PROVIDER_CONFIGS[id]).filter(Boolean)
        : Object.values(PROVIDER_CONFIGS)

    // Filter by capability if specified
    if (options?.capabilities?.length) {
        providers = providers.filter((p) =>
            options.capabilities!.some((cap) => p.capabilities.includes(cap)),
        )
    }

    // Filter by availability and rate limit
    providers = providers.filter((p) => {
        const status = getProviderStatus(p.id)
        return status === 'available' && checkRateLimit(p.id, p.rateLimitPerMin)
    })

    if (providers.length === 0) return []

    // Parallel fetch with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const results: ProviderSearchResult[] = []

    try {
        const fetches = providers.map(async (provider) => {
            const start = performance.now()
            try {
                const raw = await fetchProviderData(provider, query, controller.signal)
                const fetchTimeMs = Math.round(performance.now() - start)
                for (const item of raw) {
                    const parsed = externalStrainDataSchema.safeParse(item)
                    if (parsed.success) {
                        results.push({
                            provider: provider.id,
                            data: parsed.data,
                            relevance: computeRelevance(query, parsed.data),
                            fetchTimeMs,
                        })
                    }
                }
            } catch {
                // Provider failed -- skip silently
            }
        })

        await Promise.allSettled(fetches)
    } finally {
        clearTimeout(timeout)
    }

    // Sort by relevance, deduplicate by name
    results.sort((a, b) => b.relevance - a.relevance)
    const seen = new Set<string>()
    const deduped: ProviderSearchResult[] = []
    for (const r of results) {
        const key = r.data.name.toLowerCase()
        if (!seen.has(key)) {
            seen.add(key)
            deduped.push(r)
        }
    }

    return deduped.slice(0, limit)
}

// ---------------------------------------------------------------------------
// Provider-specific fetch (stub implementations -- extended later)
// ---------------------------------------------------------------------------

const fetchProviderData = async (
    provider: ProviderConfig,
    query: string,
    _signal: AbortSignal,
): Promise<Record<string, unknown>[]> => {
    // For static dataset providers, return empty (handled by hydration worker)
    if (provider.hasStaticDataset) return []

    const fetcher = providerFetchers[provider.id]
    if (!fetcher) return []
    return fetcher(query, provider)
}

/**
 * Provider-specific fetch functions.
 * Each returns an array of raw objects that will be validated by Zod.
 */
const providerFetchers: Partial<
    Record<
        StrainApiProvider,
        (query: string, config: ProviderConfig) => Promise<Record<string, unknown>[]>
    >
> = {
    seedfinder: async (query, config) => {
        const apiKey = import.meta.env.VITE_SEEDFINDER_API_KEY
        if (!apiKey) return []
        const url = `${config.baseUrl}/strain/${encodeURIComponent(query)}?ac=${apiKey}&lng=en`
        try {
            const res = await fetchWithCorsProxy(url)
            const data = await res.json()
            if (!data || data.error) return []
            // Normalize to our format
            return [normalizeSeedfinderResult(data, query)]
        } catch {
            return []
        }
    },

    otreeba: async (query, config) => {
        const url = `${config.baseUrl}/strains?sort=-name&page[limit]=10&filter[name]=${encodeURIComponent(query)}`
        try {
            const res = await fetchWithCorsProxy(url)
            const json = await res.json()
            const items = json?.data ?? json ?? []
            if (!Array.isArray(items)) return []
            return items.map((item: Record<string, unknown>) => normalizeOtreebaResult(item))
        } catch {
            return []
        }
    },

    cannlytics: async (query, config) => {
        const apiKey = import.meta.env.VITE_CANNLYTICS_API_KEY
        if (!apiKey) return []
        const url = `${config.baseUrl}/strains?q=${encodeURIComponent(query)}&limit=10`
        try {
            const res = await fetchWithCorsProxy(url, {
                headers: { Authorization: `Bearer ${apiKey}` },
            })
            const json = await res.json()
            const items = json?.data ?? json ?? []
            if (!Array.isArray(items)) return []
            return items.map((item: Record<string, unknown>) => normalizeCannlyticsResult(item))
        } catch {
            return []
        }
    },

    cansativa: async (_query, config) => {
        const apiKey = import.meta.env.VITE_CANSATIVA_API_KEY
        if (!apiKey) return []
        const headers: Record<string, string> = {
            'Cache-Control': 'no-cache',
            'Ocp-Apim-Subscription-Key': apiKey,
        }
        try {
            // Fetch inventory (primary product catalog)
            const inventoryRes = await fetch(`${config.baseUrl}/inventory`, {
                method: 'POST',
                headers,
                signal: AbortSignal.timeout(10_000),
            })
            if (!inventoryRes.ok) return []
            const inventoryData = await inventoryRes.json()
            const items = Array.isArray(inventoryData)
                ? inventoryData
                : (inventoryData?.data ?? inventoryData?.items ?? [])
            if (!Array.isArray(items)) return []
            return items.map((item: Record<string, unknown>) => normalizeCansativaResult(item))
        } catch {
            return []
        }
    },
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

const normalizeSeedfinderResult = (
    data: Record<string, unknown>,
    query: string,
): Record<string, unknown> => {
    const parents = data.parents as Record<string, { name?: string; id?: string }> | undefined
    const parentList = parents
        ? Object.values(parents).map((p) => ({ name: p.name ?? 'Unknown', id: p.id }))
        : []

    const flowering = data.flowering as { auto?: boolean; days?: number } | undefined

    return {
        provider: 'seedfinder',
        name: (data.name as string) ?? query,
        type: mapSeedfinderType(data.genotype as string | undefined),
        genetics: data.genotype as string | undefined,
        description: data.description as string | undefined,
        thc: parsePercentString(data.thc as string | undefined),
        cbd: parsePercentString(data.cbd as string | undefined),
        floweringType: flowering?.auto ? 'Autoflowering' : 'Photoperiod',
        floweringTime: flowering?.days,
        lineage: {
            parents: parentList,
            breeder: data.breedby as string | undefined,
        },
        sourceUrl: data.url as string | undefined,
    }
}

const normalizeOtreebaResult = (data: Record<string, unknown>): Record<string, unknown> => {
    const genetics = data.genetics as { names?: string } | undefined
    const seedCompany = data.seed_company as { name?: string } | undefined

    return {
        provider: 'otreeba',
        externalId: data.ucpc as string | undefined,
        name: (data.name as string) ?? 'Unknown',
        genetics: genetics?.names,
        lineage: seedCompany ? { breeder: seedCompany.name } : undefined,
        sourceUrl: data.url as string | undefined,
    }
}

const normalizeCannlyticsResult = (data: Record<string, unknown>): Record<string, unknown> => {
    const results = data.results as Record<string, number> | undefined
    const terpeneProfile: Record<string, number> = {}
    const cannabinoidProfile: Record<string, number> = {}

    if (results) {
        for (const [key, val] of Object.entries(results)) {
            const lower = key.toLowerCase()
            if (
                lower.includes('thc') ||
                lower.includes('cbd') ||
                lower.includes('cbg') ||
                lower.includes('cbn') ||
                lower.includes('cbc')
            ) {
                cannabinoidProfile[key] = val
            } else {
                terpeneProfile[key] = val
            }
        }
    }

    return {
        provider: 'cannlytics',
        name: (data.strain_name as string) ?? (data.name as string) ?? 'Unknown',
        terpeneProfile: Object.keys(terpeneProfile).length > 0 ? terpeneProfile : undefined,
        cannabinoidProfile:
            Object.keys(cannabinoidProfile).length > 0 ? cannabinoidProfile : undefined,
        labTested: true,
    }
}

const normalizeCansativaResult = (data: Record<string, unknown>): Record<string, unknown> => {
    const name =
        (data.product_name as string) ??
        (data.name as string) ??
        (data.strain as string) ??
        (data.kultivar as string) ??
        'Unknown'

    const terpeneProfile: Record<string, number> = {}
    const cannabinoidProfile: Record<string, number> = {}

    // Extract THC/CBD from top-level or nested lab data
    const thc =
        (data.thc as number) ??
        (data.thc_percent as number) ??
        (data.thc_content as number) ??
        undefined
    const cbd =
        (data.cbd as number) ??
        (data.cbd_percent as number) ??
        (data.cbd_content as number) ??
        undefined

    if (thc !== undefined) cannabinoidProfile['THC'] = thc
    if (cbd !== undefined) cannabinoidProfile['CBD'] = cbd

    // Extract terpene data if available
    const terpenes = data.terpenes as Record<string, number> | undefined
    if (terpenes && typeof terpenes === 'object') {
        for (const [key, val] of Object.entries(terpenes)) {
            if (typeof val === 'number') terpeneProfile[key] = val
        }
    }

    // Extract cultivar/genetics info
    const genetics =
        (data.genetics as string) ??
        (data.cultivar as string) ??
        (data.sorte as string) ??
        undefined

    const type = mapCansativaType(
        (data.type as string) ?? (data.category as string) ?? genetics,
    )

    return {
        provider: 'cansativa',
        externalId: (data.id as string) ?? (data.pzn as string) ?? undefined,
        name,
        type,
        genetics,
        thc,
        cbd,
        terpeneProfile: Object.keys(terpeneProfile).length > 0 ? terpeneProfile : undefined,
        cannabinoidProfile:
            Object.keys(cannabinoidProfile).length > 0 ? cannabinoidProfile : undefined,
        labTested: true,
        medicalInfo: {
            gmpCertified: true,
            pzn: (data.pzn as string) ?? undefined,
            apothekenpflichtig: true,
            cultivationCountry: (data.origin as string) ?? (data.herkunft as string) ?? undefined,
        },
        description:
            (data.description as string) ??
            (data.beschreibung as string) ??
            undefined,
        sourceUrl: (data.url as string) ?? undefined,
    }
}

const mapCansativaType = (
    value: string | undefined,
): 'Sativa' | 'Indica' | 'Hybrid' | undefined => {
    if (!value) return undefined
    const lower = value.toLowerCase()
    if (lower.includes('sativa') && !lower.includes('indica')) return 'Sativa'
    if (lower.includes('indica') && !lower.includes('sativa')) return 'Indica'
    if (lower.includes('hybrid')) return 'Hybrid'
    return undefined
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

const mapSeedfinderType = (
    genotype: string | undefined,
): 'Sativa' | 'Indica' | 'Hybrid' | undefined => {
    if (!genotype) return undefined
    const lower = genotype.toLowerCase()
    if (lower.includes('sativa') && !lower.includes('indica')) return 'Sativa'
    if (lower.includes('indica') && !lower.includes('sativa')) return 'Indica'
    return 'Hybrid'
}

const parsePercentString = (value: string | undefined): number | undefined => {
    if (!value) return undefined
    const match = value.match(/(\d+(?:\.\d+)?)/)
    return match?.[1] ? Number.parseFloat(match[1]) : undefined
}

const computeRelevance = (query: string, data: ValidatedExternalStrainData): number => {
    const q = query.toLowerCase()
    const name = data.name.toLowerCase()

    // Exact match
    if (name === q) return 1.0
    // Starts with query
    if (name.startsWith(q)) return 0.9
    // Contains query
    if (name.includes(q)) return 0.7
    // Fuzzy: query words appear in name
    const words = q.split(/\s+/)
    const matched = words.filter((w) => name.includes(w)).length
    if (matched > 0) return 0.3 + 0.3 * (matched / words.length)

    return 0.1
}

// ---------------------------------------------------------------------------
// Build data provenance record
// ---------------------------------------------------------------------------

export const buildProvenance = (
    providerId: StrainApiProvider,
    externalId?: string,
    labVerified = false,
): DataProvenance => ({
    provider: providerId,
    fetchedAt: new Date().toISOString(),
    externalId,
    labVerified,
    confidence: PROVIDER_CONFIGS[providerId]?.qualityTier === 1 ? 0.9 : 0.6,
    dataVersion: '1.0',
})

// ---------------------------------------------------------------------------
// Export types for consuming services
// ---------------------------------------------------------------------------

export type { ValidatedExternalStrainData, ProviderCapability as DataCapability }
