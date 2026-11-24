import { describe, expect, it } from 'vitest'
import { createStrainObject } from '@/services/strainFactory'
import type { LookupStrainResult } from '@/services/strain-lookup/strainLookupTypes'
import { StrainType, type Strain } from '@/types'
import { libraryMatchScore } from './libraryMatchScore'

const lookup = (fields: Partial<LookupStrainResult>): LookupStrainResult =>
    ({
        id: 'result',
        name: 'Result',
        type: StrainType.Indica,
        thc: 20,
        cbd: 1,
        ...fields,
    }) as LookupStrainResult

const library = (...strains: Partial<Strain>[]): Strain[] =>
    strains.map((fields, index) =>
        createStrainObject({ id: `lib-${index}`, name: `Library ${index}`, ...fields }),
    )

describe('libraryMatchScore', () => {
    it('adds no CBD closeness when no library strain reports CBD', () => {
        const strains = library({ type: StrainType.Indica, thc: 20 })

        // 40 base + 30 same type + 20 THC match; no CBD term.
        expect(libraryMatchScore(lookup({ cbd: 1 }), strains)).toBe(90)
    })

    it('averages only reported values and counts a reported zero', () => {
        const strains = library(
            { type: StrainType.Indica, thc: 20, cbd: 0 },
            { type: StrainType.Indica, thc: 20 },
        )

        // The average CBD is 0 from the one reported value, so a 1% result adds 10 - 5.
        expect(libraryMatchScore(lookup({ cbd: 1 }), strains)).toBe(95)
    })

    it('does not count an unreported THC value as 0', () => {
        const strains = library({ type: StrainType.Indica, thc: 20 }, { type: StrainType.Indica })

        // The THC average stays 20, not 10, so the result matches it fully.
        expect(libraryMatchScore(lookup({ cbd: undefined }), strains)).toBe(90)
    })

    it('returns 0 for an empty library', () => {
        expect(libraryMatchScore(lookup({}), [])).toBe(0)
    })
})
