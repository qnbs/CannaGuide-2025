import type { DifficultyLevel, HeightLevel, SortKey, Strain, YieldLevel } from '@/types'

export type SortDirection = 'asc' | 'desc'

const difficultyOrder: Record<DifficultyLevel, number> = { Easy: 1, Medium: 2, Hard: 3 }
const yieldOrder: Record<YieldLevel, number> = { Low: 1, Medium: 2, High: 3 }
const heightOrder: Record<HeightLevel, number> = { Short: 1, Medium: 2, Tall: 3 }

const safeText = (value: unknown): string => (typeof value === 'string' ? value : '')

const directed = (delta: number, direction: SortDirection): number =>
    direction === 'asc' ? delta : -delta

const knownNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

const unknownOrder = (left: number | undefined, right: number | undefined): number => {
    if (left === undefined && right === undefined) return 0
    return left === undefined ? 1 : -1
}

const numericDelta = (left: unknown, right: unknown, direction: SortDirection): number => {
    const reportedLeft = knownNumber(left)
    const reportedRight = knownNumber(right)
    if (reportedLeft === undefined || reportedRight === undefined) {
        return unknownOrder(reportedLeft, reportedRight)
    }
    return directed(reportedLeft - reportedRight, direction)
}

export const getSafeStrainType = (value?: unknown): string =>
    value === 'Sativa' || value === 'Indica' || value === 'Hybrid' ? value : ''

export const measurementInRange = (
    value: unknown,
    range: [number, number],
    initial: [number, number],
): boolean => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value >= range[0] && value <= range[1]
    }
    return range[0] === initial[0] && range[1] === initial[1]
}

export const rankIn = (order: Record<string, number>, value?: string): number | undefined => {
    if (value === undefined || !Object.hasOwn(order, value)) return undefined
    const rank = order[value]
    return typeof rank === 'number' ? rank : undefined
}

const reportedRankDelta = (
    left: number | undefined,
    right: number | undefined,
): number | undefined => {
    if (left === undefined || right === undefined) return undefined
    return left - right
}

const missingRankDelta = (left: number | undefined, right: number | undefined): number => {
    if (left === undefined && right === undefined) return 0
    return left === undefined ? 1 : -1
}

/**
 * Missing ranks sort after every reported rank. Sort direction applies only
 * when both sides have a rank, so descending yield cannot float unknowns first.
 */
export const compareOptionalRanks = (
    left: number | undefined,
    right: number | undefined,
    direction: SortDirection,
): number => {
    const delta = reportedRankDelta(left, right)
    if (delta === undefined) return missingRankDelta(left, right)
    return direction === 'asc' ? delta : -delta
}

const isRankKey = (key: SortKey): key is 'difficulty' | 'yield' | 'height' =>
    key === 'difficulty' || key === 'yield' || key === 'height'

const RANK_ORDERS = {
    difficulty: difficultyOrder,
    yield: yieldOrder,
    height: heightOrder,
} as const

const agronomicField = (
    strain: Strain,
    key: 'difficulty' | 'yield' | 'height',
): string | undefined => strain.agronomic?.[key]

const rankValue = (strain: Strain, key: 'difficulty' | 'yield' | 'height'): number | undefined =>
    rankIn(RANK_ORDERS[key], agronomicField(strain, key))

const isMeasurementKey = (key: SortKey): key is 'thc' | 'cbd' | 'floweringTime' =>
    key === 'thc' || key === 'cbd' || key === 'floweringTime'

const labelDelta = (
    left: Strain,
    right: Strain,
    key: SortKey,
    direction: SortDirection,
): number | undefined => {
    if (key !== 'name' && key !== 'type') return undefined
    return directed(safeText(left[key]).localeCompare(safeText(right[key])), direction)
}

const measurementDelta = (
    left: Strain,
    right: Strain,
    key: SortKey,
    direction: SortDirection,
): number | undefined => {
    if (!isMeasurementKey(key)) return undefined
    return numericDelta(left[key], right[key], direction)
}

const listed = (ids: Set<string>, favorites: Set<string>, strain: Strain): boolean =>
    ids.has(strain.id) || favorites.has(strain.id)

export interface StrainSort {
    key: SortKey
    direction: SortDirection
    prioritize: boolean
    userStrainIds: Set<string>
    favorites: Set<string>
}

const priorityDelta = (left: Strain, right: Strain, sort: StrainSort): number => {
    if (!sort.prioritize) return 0
    const leftFirst = listed(sort.userStrainIds, sort.favorites, left)
    const rightFirst = listed(sort.userStrainIds, sort.favorites, right)
    if (leftFirst === rightFirst) return 0
    return leftFirst ? -1 : 1
}

/** User strains and favorites stay first. Unknown numbers and ranks sort last. */
export const compareStrains = (left: Strain, right: Strain, sort: StrainSort): number => {
    const priority = priorityDelta(left, right, sort)
    if (priority !== 0) return priority
    if (isRankKey(sort.key)) {
        return compareOptionalRanks(
            rankValue(left, sort.key),
            rankValue(right, sort.key),
            sort.direction,
        )
    }
    const labeled = labelDelta(left, right, sort.key, sort.direction)
    if (labeled !== undefined) return labeled
    return measurementDelta(left, right, sort.key, sort.direction) ?? 0
}
