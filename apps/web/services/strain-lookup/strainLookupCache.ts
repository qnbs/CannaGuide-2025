import type { LookupStrainResult } from '@/services/strain-lookup/strainLookupTypes'

const CACHE_PREFIX = 'cg.sl.'
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry {
    result: LookupStrainResult
    ts: number
}

const isCacheEntry = (value: unknown): value is CacheEntry => {
    if (!value || typeof value !== 'object') return false
    if (!('ts' in value) || !('result' in value)) return false
    const { ts, result } = value
    return typeof ts === 'number' && typeof result === 'object' && result !== null
}

export function getCached(name: string): LookupStrainResult | null {
    try {
        const key = CACHE_PREFIX + name.toLowerCase().trim()
        const raw = sessionStorage.getItem(key)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        if (!isCacheEntry(parsed)) return null
        const entry = parsed
        if (Date.now() - entry.ts > CACHE_TTL_MS) {
            sessionStorage.removeItem(key)
            return null
        }
        return entry.result
    } catch {
        return null
    }
}

export function setCached(name: string, result: LookupStrainResult): void {
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

export async function throttleExternal(): Promise<void> {
    const elapsed = Date.now() - _lastExternalCall
    if (elapsed < MIN_INTERVAL_MS) {
        await new Promise<void>((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed))
    }
    _lastExternalCall = Date.now()
}
