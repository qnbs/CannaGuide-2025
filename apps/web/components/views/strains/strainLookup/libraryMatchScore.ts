import { isPositiveReported } from '@/components/views/strains/reportedStrainFacts'
import type { LookupStrainResult } from '@/services/strain-lookup/strainLookupTypes'
import type { Strain } from '@/types'

const isReported = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

/** The mean of the reported values; undefined when none is reported. A reported 0 counts. */
const reportedAverage = (values: readonly unknown[]): number | undefined => {
    const known = values.filter(isReported)
    if (known.length === 0) return undefined
    return known.reduce((sum, value) => sum + value, 0) / known.length
}

/**
 * How well a lookup result fits the user's library: its share of the same type, plus THC
 * and CBD closeness to the library's averages. An unreported value is never averaged in
 * as 0, and a cannabinoid no library strain reports adds nothing (GH #750).
 */
export const libraryMatchScore = (
    result: LookupStrainResult,
    userStrains: readonly Strain[],
): number => {
    if (userStrains.length === 0) return 0
    const sameType = userStrains.filter(
        (strain) => Boolean(strain.type) && strain.type === result.type,
    )
    let score = 40 + (sameType.length / userStrains.length) * 30
    const avgThc = reportedAverage(userStrains.map((strain) => strain.thc))
    const avgCbd = reportedAverage(userStrains.map((strain) => strain.cbd))
    if (isPositiveReported(result.thc) && avgThc !== undefined) {
        score += Math.max(0, 20 - Math.abs(result.thc - avgThc))
    }
    if (isPositiveReported(result.cbd) && avgCbd !== undefined) {
        score += Math.max(0, 10 - Math.abs(result.cbd - avgCbd) * 5)
    }
    return Math.min(100, Math.max(0, Math.round(score)))
}
