import type { Strain } from '@/types'
import { createStrainObject } from '@/services/strainFactory'

const UPPER_BOUND_RANGE = /^\s*<\s*(\d+(?:\.\d+)?)\s*%?\s*$/u

const upperBoundOf = (range: unknown): number | undefined => {
    if (typeof range !== 'string') return undefined
    const bound = UPPER_BOUND_RANGE.exec(range)?.[1]
    return bound === undefined ? undefined : Number(bound)
}

const rangeContradicts = (value: unknown, range: unknown): boolean => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return false
    const bound = upperBoundOf(range)
    return bound !== undefined && value >= bound
}

/**
 * Bundled catalog records carry placeholder point values such as `cbd: 1` next to their
 * own stated range `"<1%"` (GH #750). Such a value is not a measurement: it made the app
 * show 1% and count the strain as CBD-rich. The stated range stays; only the point value
 * that contradicts it is dropped, at load time, so the catalog source is unchanged.
 *
 * For bundled records only: a value a user entered is never rewritten.
 */
export const withoutContradictedPoints = (strain: Strain): Strain => {
    const dropThc = rangeContradicts(strain.thc, strain.thcRange)
    const dropCbd = rangeContradicts(strain.cbd, strain.cbdRange)
    if (!dropThc && !dropCbd) return strain

    const reported: Partial<Strain> = { ...strain }
    if (dropThc) delete reported.thc
    if (dropCbd) delete reported.cbd
    return createStrainObject(reported)
}
