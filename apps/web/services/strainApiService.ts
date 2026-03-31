/**
 * External Strain Data API Service
 *
 * Fetches strain, terpene, and cannabinoid data from external APIs:
 * - **Otreeba** (otreeba.com) -- General strain catalog with REST/JSON
 * - **Cannlytics** (docs.cannlytics.com) -- Lab-grade analytics platform
 *
 * All external requests respect isLocalOnlyMode() and use the CORS proxy
 * cascade pattern from seedbankService. Results are cached in-memory with
 * TTL to reduce API calls.
 *
 * BYOK: API keys are stored encrypted via cryptoService (same as AI providers).
 */

import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import type { TerpeneProfile, CannabinoidProfile, StrainApiProvider } from '@/types'
import { resolveTerpeneName } from '@/services/terpeneService'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OTREEBA_BASE = 'https://api.otreeba.com/v1'
const CANNLYTICS_BASE = 'https://cannlytics.com/api'

const CORS_PROXIES = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
] as const

const FETCH_TIMEOUT_MS = 10_000
const CACHE_TTL_MS = 5 * 60 * 1000

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
    data: T
    expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

const getCached = <T>(key: string): T | null => {
    const entry = cache.get(key)
    if (entry && Date.now() < entry.expiresAt) return entry.data as T
    if (entry) cache.delete(key)
    return null
}

const setCache = <T>(key: string, data: T): void => {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ---------------------------------------------------------------------------
// CORS proxy fetch
// ---------------------------------------------------------------------------

async function fetchViaProxy(directUrl: string, apiKey?: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const headers: Record<string, string> = { Accept: 'application/json' }
    if (apiKey) {
        headers['X-API-Key'] = apiKey
    }

    try {
        // Try direct first (works if API has CORS headers)
        try {
            const res = await fetch(directUrl, { signal: controller.signal, headers })
            if (res.ok) return await res.json()
        } catch {
            // Fall through to proxies
        }

        // Try CORS proxies
        for (const proxyFn of CORS_PROXIES) {
            const proxiedUrl = proxyFn(directUrl)
            try {
                const res = await fetch(proxiedUrl, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                })
                if (res.ok) return await res.json()
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
// API key management (VITE env vars or runtime settings)
// ---------------------------------------------------------------------------

const getApiKey = (provider: StrainApiProvider): string | undefined => {
    if (provider === 'otreeba') {
        return import.meta.env.VITE_OTREEBA_API_KEY as string | undefined
    }
    if (provider === 'cannlytics') {
        return import.meta.env.VITE_CANNLYTICS_API_KEY as string | undefined
    }
    return undefined
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ExternalStrainData {
    provider: StrainApiProvider
    name: string
    type?: string | undefined
    description?: string | undefined
    thc?: number | undefined
    cbd?: number | undefined
    terpeneProfile?: TerpeneProfile | undefined
    cannabinoidProfile?: CannabinoidProfile | undefined
    effects?: string[] | undefined
    aromas?: string[] | undefined
    labTested?: boolean | undefined
}

// ---------------------------------------------------------------------------
// Otreeba API
// ---------------------------------------------------------------------------

interface OtreebaStrainResponse {
    data?: {
        name?: string
        type?: string
        description?: string
        thc?: string
        cbd?: string
        terpenes?: Array<{
            name?: string
            percentage?: number
        }>
        effects?: string[]
        flavors?: string[]
    }
}

const parseOtreebaStrain = (json: unknown): ExternalStrainData | null => {
    const res = json as OtreebaStrainResponse
    if (!res?.data?.name) return null

    const terpeneProfile: TerpeneProfile = {}
    if (Array.isArray(res.data.terpenes)) {
        for (const t of res.data.terpenes) {
            if (t.name && typeof t.percentage === 'number') {
                const resolved = resolveTerpeneName(t.name)
                if (resolved) {
                    terpeneProfile[resolved] = t.percentage
                }
            }
        }
    }

    return {
        provider: 'otreeba',
        name: res.data.name,
        type: res.data.type,
        description: res.data.description,
        thc: res.data.thc ? parseFloat(res.data.thc) : undefined,
        cbd: res.data.cbd ? parseFloat(res.data.cbd) : undefined,
        terpeneProfile: Object.keys(terpeneProfile).length > 0 ? terpeneProfile : undefined,
        effects: res.data.effects,
        aromas: res.data.flavors,
    }
}

/**
 * Search strains via Otreeba API.
 */
export const searchOtreeba = async (
    query: string,
    limit: number = 10,
): Promise<ExternalStrainData[]> => {
    if (isLocalOnlyMode()) return []

    const cacheKey = `otreeba:search:${query}:${limit}`
    const cached = getCached<ExternalStrainData[]>(cacheKey)
    if (cached) return cached

    const apiKey = getApiKey('otreeba')
    const url = `${OTREEBA_BASE}/strains?search=${encodeURIComponent(query)}&limit=${limit}`
    const json = await fetchViaProxy(url, apiKey)

    if (!json) return []

    const responseData = json as { data?: unknown[] }
    if (!Array.isArray(responseData?.data)) return []

    const results: ExternalStrainData[] = []
    for (const item of responseData.data) {
        const parsed = parseOtreebaStrain({ data: item })
        if (parsed) results.push(parsed)
    }

    setCache(cacheKey, results)
    return results
}

/**
 * Fetch a single strain by name from Otreeba.
 */
export const fetchOtreebaStrain = async (
    strainName: string,
): Promise<ExternalStrainData | null> => {
    if (isLocalOnlyMode()) return null

    const cacheKey = `otreeba:strain:${strainName}`
    const cached = getCached<ExternalStrainData | null>(cacheKey)
    if (cached !== null) return cached

    const apiKey = getApiKey('otreeba')
    const url = `${OTREEBA_BASE}/strains?name=${encodeURIComponent(strainName)}&limit=1`
    const json = await fetchViaProxy(url, apiKey)

    if (!json) return null

    const responseData = json as { data?: unknown[] }
    const first = Array.isArray(responseData?.data) ? responseData.data[0] : null
    const result = first ? parseOtreebaStrain({ data: first }) : null

    if (result) setCache(cacheKey, result)
    return result
}

// ---------------------------------------------------------------------------
// Cannlytics API
// ---------------------------------------------------------------------------

interface CannlyticsStrainResponse {
    strain_name?: string
    strain_type?: string
    total_thc?: number
    total_cbd?: number
    total_cbg?: number
    total_terpenes?: number
    terpenes?: Record<string, number>
    cannabinoids?: Record<string, number>
    analyses?: Array<{
        analytes?: Array<{
            name?: string
            value?: number
            key?: string
        }>
    }>
}

const parseCannlyticsResponse = (json: unknown): ExternalStrainData | null => {
    const res = json as CannlyticsStrainResponse
    if (!res?.strain_name) return null

    const terpeneProfile: TerpeneProfile = {}
    if (res.terpenes) {
        for (const [name, value] of Object.entries(res.terpenes)) {
            if (typeof value === 'number' && value > 0) {
                const resolved = resolveTerpeneName(name)
                if (resolved) terpeneProfile[resolved] = value
            }
        }
    }

    const cannabinoidProfile: CannabinoidProfile = {}
    if (res.cannabinoids) {
        for (const [name, value] of Object.entries(res.cannabinoids)) {
            if (typeof value === 'number' && value > 0) {
                const upperKey = name.toUpperCase().replace(/[^A-Z0-9]/g, '')
                const cannabinoidMap: Record<string, keyof CannabinoidProfile> = {
                    THC: 'THC',
                    CBD: 'CBD',
                    CBG: 'CBG',
                    CBN: 'CBN',
                    THCV: 'THCV',
                    CBC: 'CBC',
                    CBDV: 'CBDV',
                    THCA: 'THCA',
                    CBDA: 'CBDA',
                    CBGA: 'CBGA',
                    DELTA8THC: 'Delta8THC',
                    D8THC: 'Delta8THC',
                }
                const mapped = cannabinoidMap[upperKey]
                if (mapped) cannabinoidProfile[mapped] = value
            }
        }
    }

    return {
        provider: 'cannlytics',
        name: res.strain_name,
        type: res.strain_type,
        thc: res.total_thc,
        cbd: res.total_cbd,
        terpeneProfile: Object.keys(terpeneProfile).length > 0 ? terpeneProfile : undefined,
        cannabinoidProfile:
            Object.keys(cannabinoidProfile).length > 0 ? cannabinoidProfile : undefined,
        labTested: true,
    }
}

/**
 * Search strains via Cannlytics API.
 */
export const searchCannlytics = async (
    query: string,
    limit: number = 10,
): Promise<ExternalStrainData[]> => {
    if (isLocalOnlyMode()) return []

    const cacheKey = `cannlytics:search:${query}:${limit}`
    const cached = getCached<ExternalStrainData[]>(cacheKey)
    if (cached) return cached

    const apiKey = getApiKey('cannlytics')
    const url = `${CANNLYTICS_BASE}/strains?search=${encodeURIComponent(query)}&limit=${limit}`
    const json = await fetchViaProxy(url, apiKey)

    if (!json) return []

    const results: ExternalStrainData[] = []
    const responseData = json as { data?: unknown[] }
    if (Array.isArray(responseData?.data)) {
        for (const item of responseData.data) {
            const parsed = parseCannlyticsResponse(item as CannlyticsStrainResponse)
            if (parsed) results.push(parsed)
        }
    }

    setCache(cacheKey, results)
    return results
}

// ---------------------------------------------------------------------------
// Unified search across all providers
// ---------------------------------------------------------------------------

/**
 * Search all configured strain API providers in parallel.
 * Falls back gracefully -- any provider failure is silently skipped.
 * Returns an empty array in local-only mode.
 */
export const searchExternalStrainData = async (
    query: string,
    limit: number = 10,
): Promise<ExternalStrainData[]> => {
    if (isLocalOnlyMode()) return []

    const results = await Promise.allSettled([
        searchOtreeba(query, limit),
        searchCannlytics(query, limit),
    ])

    const merged: ExternalStrainData[] = []
    for (const result of results) {
        if (result.status === 'fulfilled') {
            merged.push(...result.value)
        }
    }

    return merged.slice(0, limit)
}

/**
 * Merge external data into an existing strain's terpene/cannabinoid fields.
 * Only fills in missing data -- never overwrites existing values.
 */
export const mergeExternalData = (
    existing: {
        terpeneProfile?: TerpeneProfile
        cannabinoidProfile?: CannabinoidProfile
    },
    external: ExternalStrainData,
): { terpeneProfile?: TerpeneProfile; cannabinoidProfile?: CannabinoidProfile } => {
    const merged = { ...existing }

    if (external.terpeneProfile) {
        merged.terpeneProfile = {
            ...external.terpeneProfile,
            ...(existing.terpeneProfile ?? {}),
        }
    }

    if (external.cannabinoidProfile) {
        merged.cannabinoidProfile = {
            ...external.cannabinoidProfile,
            ...(existing.cannabinoidProfile ?? {}),
        }
    }

    return merged
}

/** Clear the in-memory API cache. */
export const clearStrainApiCache = (): void => {
    cache.clear()
}

/** Get available providers (those with API keys configured). */
export const getAvailableProviders = (): StrainApiProvider[] => {
    const providers: StrainApiProvider[] = []
    if (getApiKey('otreeba')) providers.push('otreeba')
    if (getApiKey('cannlytics')) providers.push('cannlytics')
    return providers
}
