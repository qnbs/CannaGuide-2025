import React from 'react'
import { Strain, StrainType } from '@/types'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { createStrainObject } from '@/services/strainFactory'
import { secureRandom } from '@/utils/random'

/**
 * Crosses two parent strains and returns a plausible offspring profile.
 * Pure function — safe to call outside React.
 */
export const crossStrains = (parentA: Strain, parentB: Strain): Omit<Strain, 'id'> => {
    const getSafeText = (value: unknown, fallback = ''): string =>
        typeof value === 'string' ? value : fallback
    const getSafeNumericValue = (value: unknown, fallback: number): number =>
        typeof value === 'number' && Number.isFinite(value) ? value : fallback
    const getSafeStringArray = (value: unknown): string[] =>
        Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

    const parentAName = getSafeText(parentA.name, 'Parent A').trim() || 'Parent A'
    const parentBName = getSafeText(parentB.name, 'Parent B').trim() || 'Parent B'
    const newName = `${parentAName.split(' ')[0]} ${parentBName.split(' ').pop()}`
    const randomFactor = (magnitude = 0.2) => 1 + (secureRandom() - 0.5) * magnitude
    const safeParentADifficulty = parentA.agronomic?.difficulty ?? 'Medium'
    const safeParentBDifficulty = parentB.agronomic?.difficulty ?? 'Medium'
    const safeParentAYield = parentA.agronomic?.yield ?? 'Medium'
    const safeParentBYield = parentB.agronomic?.yield ?? 'Medium'
    const safeParentAHeight = parentA.agronomic?.height ?? 'Medium'
    const safeParentBHeight = parentB.agronomic?.height ?? 'Medium'

    const newStrainData: Partial<Strain> = {
        name: newName,
        type: parentA.type === parentB.type ? parentA.type : StrainType.Hybrid,
        genetics: `${parentAName} x ${parentBName}`,
        floweringType: 'Photoperiod',
        thc:
            ((getSafeNumericValue(parentA.thc, 0) + getSafeNumericValue(parentB.thc, 0)) / 2) *
            randomFactor(),
        cbd: (getSafeNumericValue(parentA.cbd, 0) + getSafeNumericValue(parentB.cbd, 0)) / 2,
        floweringTime:
            ((getSafeNumericValue(parentA.floweringTime, 0) +
                getSafeNumericValue(parentB.floweringTime, 0)) /
                2) *
            randomFactor(0.1),
        agronomic: {
            difficulty: secureRandom() > 0.5 ? safeParentADifficulty : safeParentBDifficulty,
            yield: secureRandom() > 0.5 ? safeParentAYield : safeParentBYield,
            height: secureRandom() > 0.5 ? safeParentAHeight : safeParentBHeight,
        },
        aromas: [
            ...new Set([
                ...getSafeStringArray(parentA.aromas),
                ...getSafeStringArray(parentB.aromas),
            ]),
        ]
            .sort(() => 0.5 - secureRandom())
            .slice(0, 4),
        dominantTerpenes: [
            ...new Set([
                ...getSafeStringArray(parentA.dominantTerpenes),
                ...getSafeStringArray(parentB.dominantTerpenes),
            ]),
        ]
            .sort(() => 0.5 - secureRandom())
            .slice(0, 3),
    }

    return createStrainObject(newStrainData)
}

export const strainTypeInfo: Record<StrainType, { icon: React.ReactNode; color: string }> = {
    [StrainType.Sativa]: { icon: <SativaIcon />, color: 'text-amber-400' },
    [StrainType.Indica]: { icon: <IndicaIcon />, color: 'text-indigo-400' },
    [StrainType.Hybrid]: { icon: <HybridIcon />, color: 'text-blue-400' },
}
