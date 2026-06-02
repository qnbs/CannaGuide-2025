import type { GeneticModifiers } from '@/types'
import { DEFAULT_GENETIC_MODIFIERS } from '@/services/simulation/simulationProfiles'
import { simClamp } from '@/services/simulation/simulationMath'

export function normalizeGeneticModifiers(
    modifiers?: Partial<GeneticModifiers> | null,
): GeneticModifiers {
    const merged = {
        ...DEFAULT_GENETIC_MODIFIERS,
        ...(modifiers ?? {}),
        vpdTolerance: {
            ...DEFAULT_GENETIC_MODIFIERS.vpdTolerance,
            ...(modifiers?.vpdTolerance ?? {}),
        },
    }

    return {
        pestResistance: simClamp(
            Number.isFinite(merged.pestResistance)
                ? merged.pestResistance
                : DEFAULT_GENETIC_MODIFIERS.pestResistance,
            0.2,
            3,
        ),
        nutrientUptakeRate: simClamp(
            Number.isFinite(merged.nutrientUptakeRate)
                ? merged.nutrientUptakeRate
                : DEFAULT_GENETIC_MODIFIERS.nutrientUptakeRate,
            0.2,
            3,
        ),
        stressTolerance: simClamp(
            Number.isFinite(merged.stressTolerance)
                ? merged.stressTolerance
                : DEFAULT_GENETIC_MODIFIERS.stressTolerance,
            0.2,
            3,
        ),
        rue: simClamp(
            Number.isFinite(merged.rue) ? merged.rue : DEFAULT_GENETIC_MODIFIERS.rue,
            0.5,
            3,
        ),
        vpdTolerance: {
            min: simClamp(
                Number.isFinite(merged.vpdTolerance.min)
                    ? merged.vpdTolerance.min
                    : DEFAULT_GENETIC_MODIFIERS.vpdTolerance.min,
                0.2,
                2,
            ),
            max: simClamp(
                Number.isFinite(merged.vpdTolerance.max)
                    ? merged.vpdTolerance.max
                    : DEFAULT_GENETIC_MODIFIERS.vpdTolerance.max,
                0.4,
                2.5,
            ),
        },
        transpirationFactor: simClamp(
            Number.isFinite(merged.transpirationFactor)
                ? merged.transpirationFactor
                : DEFAULT_GENETIC_MODIFIERS.transpirationFactor,
            0.2,
            3,
        ),
        stomataSensitivity: simClamp(
            Number.isFinite(merged.stomataSensitivity)
                ? merged.stomataSensitivity
                : DEFAULT_GENETIC_MODIFIERS.stomataSensitivity,
            0.2,
            3,
        ),
    }
}
