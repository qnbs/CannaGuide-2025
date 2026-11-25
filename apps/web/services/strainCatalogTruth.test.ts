import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { reportedPercentText } from '@/components/views/strains/reportedStrainFacts'
import { allStrainsData } from '@/data/strains/index'
import { withoutContradictedPoints } from '@/services/strainCatalogTruth'
import { createStrainObject } from '@/services/strainFactory'
import { lookupLocalCatalog } from '@/services/strain-lookup/localStrainLookup'
import type { Strain } from '@/types'

interface CatalogRecord {
    id: string
    thc?: number
    cbd?: number
    thcRange?: string
    cbdRange?: string
}

const here = dirname(fileURLToPath(import.meta.url))
const catalogSource = JSON.parse(
    readFileSync(resolve(here, '../data/strains/strains.json'), 'utf8'),
) as CatalogRecord[]

const strainWith = (fields: Partial<Strain>): Strain =>
    createStrainObject({ id: 'fixture', name: 'Fixture', ...fields })

const upperBound = (range: string | undefined): number | undefined => {
    const match = /^<\s*(\d+(?:\.\d+)?)%?$/u.exec(range?.trim() ?? '')
    return match?.[1] === undefined ? undefined : Number(match[1])
}

const contradicts = (value: number | undefined, range: string | undefined): boolean => {
    if (value === undefined) return false
    const bound = upperBound(range)
    return bound !== undefined && value >= bound
}

describe('withoutContradictedPoints', () => {
    it('drops a value at or above the stated upper bound and keeps the range', () => {
        const atBound = withoutContradictedPoints(strainWith({ cbd: 1, cbdRange: '<1%' }))
        const above = withoutContradictedPoints(strainWith({ thc: 2, thcRange: '<1%' }))

        expect(atBound.cbd).toBeUndefined()
        expect(atBound.cbdRange).toBe('<1%')
        expect(above.thc).toBeUndefined()
        expect(above.thcRange).toBe('<1%')
    })

    it('keeps a value next to an unknown range, which rules nothing out', () => {
        const strain = withoutContradictedPoints(strainWith({ cbd: 0, cbdRange: 'Unknown' }))
        expect(strain.cbd).toBe(0)
    })

    it('keeps a real value that agrees with its range', () => {
        expect(withoutContradictedPoints(strainWith({ cbd: 0, cbdRange: '<1%' })).cbd).toBe(0)
        expect(withoutContradictedPoints(strainWith({ cbd: 0.4, cbdRange: '<1%' })).cbd).toBe(0.4)
        expect(withoutContradictedPoints(strainWith({ cbd: 1, cbdRange: '<2%' })).cbd).toBe(1)
        expect(withoutContradictedPoints(strainWith({ cbd: 1, cbdRange: '1-2%' })).cbd).toBe(1)
        expect(withoutContradictedPoints(strainWith({ cbd: 1 })).cbd).toBe(1)
    })

    it('keeps every other reported field of the record', () => {
        const source = strainWith({
            thc: 22,
            cbd: 1,
            cbdRange: '<1%',
            genetics: 'A x B',
            aromas: ['Pine'],
            dataProvenance: [
                { provider: 'local', fetchedAt: '2026-01-01', labVerified: false, confidence: 0.5 },
            ],
        })

        const { cbd: _dropped, ...expected } = source
        expect(withoutContradictedPoints(source)).toEqual(expected)
    })

    it('returns the same record when nothing is contradicted', () => {
        const strain = strainWith({ thc: 20, thcRange: '18-22%', cbd: 0.5, cbdRange: '<1%' })
        expect(withoutContradictedPoints(strain)).toBe(strain)
    })
})

describe('the bundled catalog (GH #750)', () => {
    const loaded = new Map(allStrainsData.map((strain) => [strain.id, strain]))

    it('keeps every catalog id', () => {
        expect(allStrainsData).toHaveLength(catalogSource.length)
        expect([...loaded.keys()].toSorted()).toEqual(
            catalogSource.map((record) => record.id).toSorted(),
        )
    })

    it('shows no point value that contradicts its own range', () => {
        const remaining = allStrainsData.filter(
            (strain) =>
                contradicts(strain.thc, strain.thcRange) ||
                contradicts(strain.cbd, strain.cbdRange),
        )
        expect(remaining.map((strain) => strain.id)).toEqual([])
    })

    it('changes only contradicted values and keeps every stated range', () => {
        for (const record of catalogSource) {
            const strain = loaded.get(record.id)
            expect(strain?.thcRange).toBe(record.thcRange)
            expect(strain?.cbdRange).toBe(record.cbdRange)
            expect(strain?.thc).toBe(
                contradicts(record.thc, record.thcRange) ? undefined : record.thc,
            )
            expect(strain?.cbd).toBe(
                contradicts(record.cbd, record.cbdRange) ? undefined : record.cbd,
            )
        }
    })
})

describe('the local strain lookup', () => {
    it('keeps an unreported CBD value unknown, with a finite score', () => {
        const result = lookupLocalCatalog('24k Gold')

        expect(result?.fullStrain?.cbd).toBeUndefined()
        expect(result?.cbd).toBeUndefined()
        expect(Number.isFinite(result?.totalEntourageScore)).toBe(true)
    })
})

describe('reportedPercentText', () => {
    it('prefers a reported value and keeps a real zero', () => {
        expect(reportedPercentText(22, '20-25%', 'Unknown')).toBe('22.0%')
        expect(reportedPercentText(0, '<1%', 'Unknown')).toBe('0.0%')
    })

    it('shows the stated range when there is no value', () => {
        expect(reportedPercentText(undefined, '<1%', 'Unknown')).toBe('<1%')
        expect(reportedPercentText(undefined, '1-2', 'Unknown')).toBe('1-2%')
    })

    it('says unknown when neither is reported', () => {
        expect(reportedPercentText(undefined, undefined, 'Unknown')).toBe('Unknown')
        expect(reportedPercentText(undefined, '  ', 'Unknown')).toBe('Unknown')
        expect(reportedPercentText(undefined, 'unknown', 'Unknown')).toBe('Unknown')
        expect(reportedPercentText(Number.NaN, undefined, 'Unknown')).toBe('Unknown')
    })
})
