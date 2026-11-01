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
