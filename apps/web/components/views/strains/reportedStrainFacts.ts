import { StrainType } from '@/types'

export const reportedName = (name: unknown, unknownLabel: string): string =>
    typeof name === 'string' && name.trim() !== '' ? name : unknownLabel

export const reportedStrainType = (type: string | undefined): StrainType | undefined => {
    if (type === StrainType.Sativa || type === StrainType.Indica || type === StrainType.Hybrid) {
        return type
    }
    return undefined
}

export const reportedNumber = (value: unknown, digits: number, unknownLabel: string): string =>
    typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : unknownLabel

export const isPositiveReported = (value: number | undefined): value is number =>
    typeof value === 'number' && value > 0

/** The reported point value, otherwise the record's stated range such as "<1%". */
export const reportedPercentText = (
    value: unknown,
    range: unknown,
    unknownLabel: string,
): string => {
    if (typeof value === 'number' && Number.isFinite(value)) return `${value.toFixed(1)}%`
    if (typeof range !== 'string') return unknownLabel
    const text = range.trim()
    if (text === '' || text.toLowerCase() === 'unknown') return unknownLabel
    return text.endsWith('%') ? text : `${text}%`
}

export const formatFloweringWeeks = (
    range: string | undefined,
    weeks: unknown,
    unitLabel: string,
    unknownLabel: string,
): string => {
    if (typeof range === 'string' && range.trim() !== '') return `${range} ${unitLabel}`
    if (typeof weeks === 'number' && Number.isFinite(weeks)) return `${weeks} ${unitLabel}`
    return unknownLabel
}

export const favoriteActionLabel = (
    isFavorite: boolean,
    removeLabel: string,
    addLabel: string,
): string => (isFavorite ? removeLabel : addLabel)
