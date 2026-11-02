import React from 'react'
import { Strain, StrainType } from '@/types'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { createStrainObject } from '@/services/strainFactory'
import { secureRandom } from '@/utils/random'

const finiteMeasurement = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

/** Both parents must report the measurement. A missing value is not zero. */
const averageReported = (left: unknown, right: unknown, scale = 1): number | undefined => {
    const leftValue = finiteMeasurement(left)
    const rightValue = finiteMeasurement(right)
    if (leftValue === undefined || rightValue === undefined) return undefined
    return ((leftValue + rightValue) / 2) * scale
}

const assignReported = (
    target: Partial<Strain>,
    key: 'thc' | 'cbd' | 'floweringTime',
    value: number | undefined,
) => {
    if (value !== undefined) target[key] = value
}

const textOr = (value: unknown, fallback: string): string => {
    const text = typeof value === 'string' ? value.trim() : ''
    return text || fallback
}

const stringList = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const crossedType = (
    left: StrainType | undefined,
    right: StrainType | undefined,
): StrainType | undefined => {
    if (left === undefined || right === undefined) return undefined
    return left === right ? left : StrainType.Hybrid
}

const pickEither = <T,>(left: T, right: T): T => (secureRandom() > 0.5 ? left : right)

const reportedLevel = <T extends string>(
    left: T | undefined,
    right: T | undefined,
): T | undefined => {
    if (left !== undefined && right !== undefined) return pickEither(left, right)
    return left ?? right
}

type Agronomic = Strain['agronomic']

const agronomicLevel = <K extends 'difficulty' | 'yield' | 'height'>(
    strain: Strain,
    key: K,
): Agronomic[K] | undefined => {
    const agronomic = strain.agronomic
    if (agronomic === undefined) return undefined
    return agronomic[key]
}

const withDifficulty = (
    difficulty: Agronomic['difficulty'],
): Pick<Agronomic, 'difficulty'> | Record<string, never> =>
    difficulty === undefined ? {} : { difficulty }

const withYield = (
    yieldLevel: Agronomic['yield'],
): Pick<Agronomic, 'yield'> | Record<string, never> =>
    yieldLevel === undefined ? {} : { yield: yieldLevel }

const withHeight = (
    height: Agronomic['height'],
): Pick<Agronomic, 'height'> | Record<string, never> => (height === undefined ? {} : { height })

/** Each reported level is kept. A missing level stays absent. */
const reportedAgronomy = (parentA: Strain, parentB: Strain): Agronomic | undefined => {
    const agronomic: Agronomic = {
        ...withDifficulty(
            reportedLevel(
                agronomicLevel(parentA, 'difficulty'),
                agronomicLevel(parentB, 'difficulty'),
            ),
        ),
        ...withYield(
            reportedLevel(agronomicLevel(parentA, 'yield'), agronomicLevel(parentB, 'yield')),
        ),
        ...withHeight(
            reportedLevel(agronomicLevel(parentA, 'height'), agronomicLevel(parentB, 'height')),
        ),
    }
    return Object.keys(agronomic).length > 0 ? agronomic : undefined
}

const mixedList = (left: unknown, right: unknown, limit: number): string[] =>
    [...new Set([...stringList(left), ...stringList(right)])]
        .sort(() => 0.5 - secureRandom())
        .slice(0, limit)

const nameScale = (magnitude: number): number => 1 + (secureRandom() - 0.5) * magnitude

/**
 * Crosses two parent strains and returns a plausible offspring profile.
 * Pure function -- safe to call outside React.
 */
export const crossStrains = (parentA: Strain, parentB: Strain): Omit<Strain, 'id'> => {
    const parentAName = textOr(parentA.name, 'Parent A')
    const parentBName = textOr(parentB.name, 'Parent B')
    const offspringType = crossedType(parentA.type, parentB.type)
    const offspring: Partial<Strain> = {
        name: `${parentAName.split(' ')[0]} ${parentBName.split(' ').pop()}`,
        genetics: `${parentAName} x ${parentBName}`,
        floweringType: 'Photoperiod',
        aromas: mixedList(parentA.aromas, parentB.aromas, 4),
        dominantTerpenes: mixedList(parentA.dominantTerpenes, parentB.dominantTerpenes, 3),
    }
    if (offspringType !== undefined) offspring.type = offspringType
    const agronomy = reportedAgronomy(parentA, parentB)
    if (agronomy !== undefined) offspring.agronomic = agronomy
    assignReported(offspring, 'thc', averageReported(parentA.thc, parentB.thc, nameScale(0.2)))
    assignReported(offspring, 'cbd', averageReported(parentA.cbd, parentB.cbd))
    assignReported(
        offspring,
        'floweringTime',
        averageReported(parentA.floweringTime, parentB.floweringTime, nameScale(0.1)),
    )
    return createStrainObject(offspring)
}

export const strainTypeInfo: Record<StrainType, { icon: React.ReactNode; color: string }> = {
    [StrainType.Sativa]: { icon: <SativaIcon />, color: 'text-amber-400' },
    [StrainType.Indica]: { icon: <IndicaIcon />, color: 'text-indigo-400' },
    [StrainType.Hybrid]: { icon: <HybridIcon />, color: 'text-blue-400' },
}
