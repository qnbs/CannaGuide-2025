/**
 * Cansativa API Service
 *
 * Integrates with the Cansativa Azure API Gateway (cansativagw.azure-api.net/v2)
 * to fetch German medical cannabis inventory, partner pharmacies, and menu data.
 *
 * Authentication: Ocp-Apim-Subscription-Key header with subscription key.
 * All endpoints use POST method with Cache-Control: no-cache.
 *
 * Endpoints:
 *  - /inventory -- Product catalog (strains, THC/CBD, terpenes)
 *  - /menu      -- Current menu/availability for dispensaries
 *  - /partner   -- Partner pharmacy data
 *  - /plz       -- Postal code based pharmacy lookup
 *
 * Security:
 *  - API key from VITE_CANSATIVA_API_KEY env var (never hardcoded)
 *  - isLocalOnlyMode() guard on all outbound requests
 *  - Response data validated/sanitized before use
 *  - 10s request timeout via AbortSignal
 */

import { isLocalOnlyMode } from '@/services/localOnlyModeService'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = 'https://cansativagw.azure-api.net/v2'
const REQUEST_TIMEOUT_MS = 10_000

/** In-memory cache with 5-minute TTL */
interface CacheEntry<T> {
    data: T
    fetchedAt: number
}
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, CacheEntry<unknown>>()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A product from the Cansativa inventory */
export interface CansativaProduct {
    id: string
    name: string
    cultivar: string
    thc: number | undefined
    cbd: number | undefined
    terpenes: Record<string, number>
    origin: string | undefined
    pzn: string | undefined
    gmpCertified: boolean
    irradiated: boolean | undefined
    available: boolean
    description: string | undefined
}

/** A partner pharmacy entry */
export interface CansativaPartner {
    id: string
    name: string
    address: string | undefined
    postalCode: string | undefined
    city: string | undefined
}

/** Menu entry (current availability) */
export interface CansativaMenuItem {
    productId: string
    productName: string
    available: boolean
    price: number | undefined
    unit: string | undefined
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const getApiKey = (): string | undefined => {
    const key: string = import.meta.env.VITE_CANSATIVA_API_KEY ?? ''
    return key || undefined
}

const buildHeaders = (apiKey: string): Record<string, string> => ({
    'Cache-Control': 'no-cache',
    'Ocp-Apim-Subscription-Key': apiKey,
})

const fetchEndpoint = async <T>(endpoint: string): Promise<T | null> => {
    if (isLocalOnlyMode()) return null

    const apiKey = getApiKey()
    if (!apiKey) return null

    // Check cache
    const cacheKey = `cansativa:${endpoint}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data as T
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: buildHeaders(apiKey),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        if (!response.ok) {
            console.debug(`[cansativa] ${endpoint} responded ${response.status}`)
            return null
        }

        const data = (await response.json()) as T
        cache.set(cacheKey, { data, fetchedAt: Date.now() })
        return data
    } catch (err) {
        console.debug('[cansativa] fetch failed:', endpoint, err)
        return null
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the full product inventory from Cansativa.
 * Returns an array of normalized product entries.
 */
export const fetchInventory = async (): Promise<CansativaProduct[]> => {
    const raw = await fetchEndpoint<Record<string, unknown>[]>('/inventory')
    if (!raw || !Array.isArray(raw)) return []
    return raw.map(normalizeProduct).filter(Boolean) as CansativaProduct[]
}

/**
 * Fetch the current menu/availability.
 */
export const fetchMenu = async (): Promise<CansativaMenuItem[]> => {
    const raw = await fetchEndpoint<Record<string, unknown>[]>('/menu')
    if (!raw || !Array.isArray(raw)) return []
    return raw.map(normalizeMenuItem).filter(Boolean) as CansativaMenuItem[]
}

/**
 * Fetch partner pharmacy data.
 */
export const fetchPartners = async (): Promise<CansativaPartner[]> => {
    const raw = await fetchEndpoint<Record<string, unknown>[]>('/partner')
    if (!raw || !Array.isArray(raw)) return []
    return raw.map(normalizePartner).filter(Boolean) as CansativaPartner[]
}

/**
 * Search partner pharmacies by postal code (PLZ).
 */
export const fetchByPostalCode = async (plz: string): Promise<CansativaPartner[]> => {
    if (isLocalOnlyMode()) return []

    const apiKey = getApiKey()
    if (!apiKey) return []

    // Validate PLZ format (German: 5 digits)
    if (!/^\d{5}$/.test(plz)) return []

    try {
        const response = await fetch(`${BASE_URL}/plz`, {
            method: 'POST',
            headers: {
                ...buildHeaders(apiKey),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plz }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        if (!response.ok) return []
        const raw = (await response.json()) as Record<string, unknown>[]
        if (!Array.isArray(raw)) return []
        return raw.map(normalizePartner).filter(Boolean) as CansativaPartner[]
    } catch {
        return []
    }
}

/**
 * Check if the Cansativa API is configured and reachable.
 */
export const isCansativaAvailable = (): boolean => {
    return !isLocalOnlyMode() && !!getApiKey()
}

/**
 * Clear the in-memory cache.
 */
export const clearCansativaCache = (): void => {
    cache.clear()
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

const normalizeProduct = (raw: Record<string, unknown>): CansativaProduct | null => {
    const name = (raw.product_name as string) ?? (raw.name as string) ?? (raw.strain as string)
    if (!name) return null

    const terpenes: Record<string, number> = {}
    const rawTerpenes = raw.terpenes as Record<string, number> | undefined
    if (rawTerpenes && typeof rawTerpenes === 'object') {
        for (const [key, val] of Object.entries(rawTerpenes)) {
            if (typeof val === 'number') terpenes[key] = val
        }
    }

    return {
        id: String(raw.id ?? raw.pzn ?? ''),
        name,
        cultivar: (raw.cultivar as string) ?? (raw.kultivar as string) ?? name,
        thc: typeof raw.thc === 'number' ? raw.thc : undefined,
        cbd: typeof raw.cbd === 'number' ? raw.cbd : undefined,
        terpenes,
        origin: (raw.origin as string) ?? (raw.herkunft as string) ?? undefined,
        pzn: (raw.pzn as string) ?? undefined,
        gmpCertified: (raw.gmp_certified as boolean) ?? (raw.gmpCertified as boolean) ?? true,
        irradiated: typeof raw.irradiated === 'boolean' ? raw.irradiated : undefined,
        available: (raw.available as boolean) ?? (raw.verfuegbar as boolean) ?? true,
        description: (raw.description as string) ?? (raw.beschreibung as string) ?? undefined,
    }
}

const normalizeMenuItem = (raw: Record<string, unknown>): CansativaMenuItem | null => {
    const productName = (raw.product_name as string) ?? (raw.name as string)
    if (!productName) return null

    return {
        productId: String(raw.product_id ?? raw.id ?? ''),
        productName,
        available: (raw.available as boolean) ?? true,
        price: typeof raw.price === 'number' ? raw.price : undefined,
        unit: (raw.unit as string) ?? (raw.einheit as string) ?? undefined,
    }
}

const normalizePartner = (raw: Record<string, unknown>): CansativaPartner | null => {
    const name = (raw.name as string) ?? (raw.pharmacy_name as string)
    if (!name) return null

    return {
        id: String(raw.id ?? ''),
        name,
        address: (raw.address as string) ?? (raw.adresse as string) ?? undefined,
        postalCode: (raw.postal_code as string) ?? (raw.plz as string) ?? undefined,
        city: (raw.city as string) ?? (raw.stadt as string) ?? undefined,
    }
}
