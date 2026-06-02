/**
 * Multi-API strain lookup — public entry point.
 *
 * Implementation under `services/strain-lookup/`; imports stay on
 * `@/services/strainLookupService`.
 */

export type {
    TerpeneInteraction,
    TerpeneDataPoint,
    CannabinoidDataPoint,
    FlavonoidDataPoint,
    ConfidenceSource,
    LookupStrainResult,
} from '@/services/strain-lookup/strainLookupTypes'

export { getFuzzySuggestions } from '@/services/strain-lookup/localStrainLookup'

import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { getCached, setCached } from '@/services/strain-lookup/strainLookupCache'
import { lookupLocalCatalog } from '@/services/strain-lookup/localStrainLookup'
import {
    lookupCannabisApi,
    lookupCannlytics,
    lookupOtreeba,
    lookupWithAI,
} from '@/services/strain-lookup/externalStrainLookups'
import type { LookupStrainResult } from '@/services/strain-lookup/strainLookupTypes'

/**
 * Lookup a strain by name using the multi-API strategy:
 * 1. Local catalog (instant, 95% confidence)
 * 2. Cannlytics API (lab data) — requires VITE_CANNLYTICS_API_KEY
 * 3. Otreeba Open Cannabis API
 * 4. The Cannabis API (public)
 * 5. AI-generated summary (last resort)
 *
 * Results are cached in sessionStorage for 5 minutes.
 */
export async function lookupStrain(name: string): Promise<LookupStrainResult | null> {
    const trimmed = name.trim()
    if (trimmed.length < 2) return null

    const cached = getCached(trimmed)
    if (cached) return cached

    const local = lookupLocalCatalog(trimmed)
    if (local) {
        setCached(trimmed, local)
        return local
    }

    if (isLocalOnlyMode()) return null

    const cannlytics = await lookupCannlytics(trimmed)
    if (cannlytics) {
        setCached(trimmed, cannlytics)
        return cannlytics
    }

    const otreeba = await lookupOtreeba(trimmed)
    if (otreeba) {
        setCached(trimmed, otreeba)
        return otreeba
    }

    const cannabisApi = await lookupCannabisApi(trimmed)
    if (cannabisApi) {
        setCached(trimmed, cannabisApi)
        return cannabisApi
    }

    const ai = await lookupWithAI(trimmed)
    if (ai) {
        setCached(trimmed, ai)
        return ai
    }

    return null
}
