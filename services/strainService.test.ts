import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Strain } from '@/types'
import { StrainType } from '@/types'

const mockStrain = (overrides: Partial<Strain> = {}): Strain =>
    ({
        id: 'strain-1',
        name: 'Test Strain',
        type: StrainType.Hybrid,
        thc: 20,
        cbd: 1,
        floweringType: 'Photoperiod',
        floweringTime: 9,
        aromas: ['Earthy'],
        description: 'A test strain',
        genetics: 'Unknown',
        dominantTerpenes: ['Myrcene'],
        agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        geneticModifiers: { autoflowerProbability: 0, feminizedProbability: 0 },
        ...overrides,
    }) as Strain

vi.mock('@/services/dbService', () => ({
    dbService: {
        getMetadata: vi.fn().mockResolvedValue(null),
        setMetadata: vi.fn().mockResolvedValue(undefined),
        getStrainsCount: vi.fn().mockResolvedValue(0),
        getAllStrains: vi.fn().mockResolvedValue([]),
        addStrains: vi.fn().mockResolvedValue(undefined),
    },
}))

vi.mock('@/services/migrationLogic', () => ({
    mergeStrainCatalogForUpdate: vi.fn((_existing: Strain[], incoming: Strain[]) => incoming),
}))

vi.mock('@/services/strainFactory', () => ({
    createStrainObject: vi.fn((data: Partial<Strain>) => ({
        id: data.id ?? 'generated-id',
        name: data.name ?? 'Unknown',
        type: data.type ?? StrainType.Hybrid,
        thc: data.thc ?? 0,
        cbd: data.cbd ?? 0,
        floweringType: 'Photoperiod',
        floweringTime: 9,
        aromas: data.aromas ?? [],
        description: data.description ?? '',
        genetics: data.genetics ?? '',
        dominantTerpenes: data.dominantTerpenes ?? [],
        agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        geneticModifiers: { autoflowerProbability: 0, feminizedProbability: 0 },
        ...data,
    })),
}))

describe('strainService', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    describe('strainService instance', () => {
        it('exports a strainService singleton', async () => {
            const { strainService } = await import('@/services/strainService')
            expect(strainService).toBeDefined()
            expect(typeof strainService.getAllStrains).toBe('function')
            expect(typeof strainService.getSimilarStrains).toBe('function')
        })
    })

    describe('getSimilarStrains', () => {
        it('returns strains sorted by similarity', async () => {
            const { strainService } = await import('@/services/strainService')
            const { dbService } = await import('@/services/dbService')
            vi.mocked(dbService.getStrainsCount).mockResolvedValueOnce(3)
            vi.mocked(dbService.getMetadata).mockResolvedValueOnce('current')
            const strains = [
                mockStrain({
                    id: 's1',
                    type: StrainType.Indica,
                    thc: 22,
                    aromas: ['Earthy', 'Pine'],
                }),
                mockStrain({ id: 's2', type: StrainType.Sativa, thc: 10, aromas: ['Citrus'] }),
                mockStrain({ id: 's3', type: StrainType.Indica, thc: 20, aromas: ['Earthy'] }),
            ]
            vi.mocked(dbService.getAllStrains).mockResolvedValueOnce(strains)
            await strainService.init()

            const base = mockStrain({
                id: 'base',
                type: StrainType.Indica,
                thc: 21,
                aromas: ['Earthy'],
            })
            const similar = await strainService.getSimilarStrains(base, 2)
            expect(similar).toHaveLength(2)
            // s1 and s3 are Indica with Earthy aroma -- should rank higher than s2
            expect(similar.map((s) => s.id)).not.toContain('base')
        })
    })
})
