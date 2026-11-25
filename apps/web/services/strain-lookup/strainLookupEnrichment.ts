/* eslint-disable @typescript-eslint/no-unsafe-type-assertion --
 * External API responses return untyped JSON; runtime guards and ?? fallbacks apply. */

import { TERPENE_DATABASE } from '@/data/terpeneDatabase'
import type { Strain } from '@/types'
import type {
    CannabinoidDataPoint,
    FlavonoidDataPoint,
    TerpeneDataPoint,
} from '@/services/strain-lookup/strainLookupTypes'
import { TYPE_FLAVONOIDS } from '@/services/strain-lookup/flavonoidProfiles'
import { TERPENE_SYNERGIES } from '@/services/strain-lookup/terpeneSynergies'

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
export function enrichTerpeneDataPoints(terpenes: TerpeneDataPoint[]): TerpeneDataPoint[] {
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
export function buildFlavonoidDataPoints(strainType: string): FlavonoidDataPoint[] {
    return TYPE_FLAVONOIDS[strainType] ?? TYPE_FLAVONOIDS['Hybrid']!
}

/**
 * Compute an overall entourage effect score (0-100).
 * Accounts for terpene diversity, terpene-cannabinoid synergies, flavonoid contributions,
 * and cannabinoid ratio balance.
 */
export function calculateEntourageScore(
    terpenes: TerpeneDataPoint[],
    thc: number | undefined,
    cbd: number | undefined,
    flavonoids: FlavonoidDataPoint[],
): number {
    // Terpene contribution (up to 50 pts)
    const terpeneSum = terpenes.reduce((acc, t) => acc + (t.entourageScore ?? 3), 0)
    const terpenePts = Math.min(50, (terpeneSum / Math.max(1, terpenes.length)) * 7)

    // Flavonoid contribution (up to 20 pts)
    const flavoSum = flavonoids.reduce((acc, f) => acc + (f.entourageScore ?? 3), 0)
    const flavoPts = Math.min(20, (flavoSum / Math.max(1, flavonoids.length)) * 3)

    const cannabinoidPts = cannabinoidBalancePoints(thc, cbd)

    // Terpene diversity bonus (up to 10 pts)
    const diversityPts = Math.min(10, terpenes.length * 1.8)

    return Math.round(terpenePts + flavoPts + cannabinoidPts + diversityPts)
}

/**
 * Balance bonus (up to 20 pts): a THC:CBD ratio closer to 1:1 scores higher. A ratio
 * needs both values, so an unreported one earns no bonus instead of a computed ratio.
 */
function cannabinoidBalancePoints(thc: number | undefined, cbd: number | undefined): number {
    if (thc === undefined || cbd === undefined) return 0
    const total = thc + cbd
    return total > 0 ? (Math.min(thc, cbd) / Math.max(thc, cbd)) * 20 : 0
}

/**
 * Shannon diversity index for a terpene profile.
 * Higher values (closer to ln(n)) indicate a more diverse aromatic profile.
 */
export function shannonDiversity(terpenes: TerpeneDataPoint[]): number {
    const total = terpenes.reduce((s, t) => s + t.percentage, 0)
    if (total === 0) return 0
    const h = terpenes.reduce((acc, t) => {
        const p = t.percentage / total
        return p > 0 ? acc - p * Math.log(p) : acc
    }, 0)
    return Math.round(h * 100) / 100
}
export function buildTerpeneDataPoints(strain: Strain): TerpeneDataPoint[] {
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

/** A reported, positive percentage; an absent one is no data point. */
const isReportedPositive = (value: number | undefined): value is number =>
    typeof value === 'number' && value > 0

export function buildCannabinoidDataPoints(strain: Strain): CannabinoidDataPoint[] {
    const items: CannabinoidDataPoint[] = []
    if (isReportedPositive(strain.thc)) items.push({ name: 'THC', percentage: strain.thc })
    if (isReportedPositive(strain.cbd)) items.push({ name: 'CBD', percentage: strain.cbd })
    if (isReportedPositive(strain.cbg)) items.push({ name: 'CBG', percentage: strain.cbg })
    if (isReportedPositive(strain.thcv)) items.push({ name: 'THCV', percentage: strain.thcv })
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
