export type SortDirection = 'asc' | 'desc'

export const getSafeStrainType = (value: unknown): string =>
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

export const rankIn = (
    order: Record<string, number>,
    value: string | undefined,
): number | undefined => {
    if (value === undefined || !Object.hasOwn(order, value)) return undefined
    const rank = order[value]
    return typeof rank === 'number' ? rank : undefined
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
    if (left === undefined || right === undefined) {
        if (left === undefined && right === undefined) return 0
        return left === undefined ? 1 : -1
    }
    const delta = left - right
    return direction === 'asc' ? delta : -delta
}
