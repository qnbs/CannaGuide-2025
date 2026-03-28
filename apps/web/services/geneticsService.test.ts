import { describe, it, expect } from 'vitest'
import { geneticsService } from '@/services/geneticsService'
import { Strain, StrainType } from '@/types'

const makeStrain = (overrides: Partial<Strain> = {}): Strain => ({
    id: 'test-strain',
    name: 'Test Strain',
    type: StrainType.Hybrid,
    floweringType: 'Photoperiod',
    thc: 20,
    cbd: 1,
    floweringTime: 9,
    genetics: '',
    description: '',
    aromas: [],
    dominantTerpenes: [],
    agronomic: {
        difficulty: 'Medium',
        yield: 'Medium',
        height: 'Medium',
    },
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1,
        vpdTolerance: { min: 0.4, max: 1.6 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
    ...overrides,
})

describe('GeneticsService', () => {
    describe('buildGenealogyTree', () => {
        it('returns null for non-existent strain', () => {
            const tree = geneticsService.buildGenealogyTree('non-existent', [])
            expect(tree).toBeNull()
        })

        it('builds tree for a landrace strain (no genetics)', () => {
            const strains = [makeStrain({ id: 's1', name: 'Afghan Kush', genetics: '' })]
            const tree = geneticsService.buildGenealogyTree('s1', strains)
            expect(tree).not.toBeNull()
            expect(tree!.name).toBe('Afghan Kush')
            expect(tree!.isLandrace).toBe(true)
        })

        it('builds tree with parent nodes from genetics string', () => {
            const strains = [
                makeStrain({ id: 'child', name: 'Child', genetics: 'ParentA x ParentB' }),
                makeStrain({ id: 'pa', name: 'ParentA', genetics: '' }),
                makeStrain({ id: 'pb', name: 'ParentB', genetics: '' }),
            ]
            const tree = geneticsService.buildGenealogyTree('child', strains)
            expect(tree).not.toBeNull()
            expect(tree!.name).toBe('Child')
            expect(tree!.isLandrace).toBe(false)

            const childNodes = tree!.children || tree!._children
            expect(childNodes).toBeDefined()
            if (childNodes) {
                const names = childNodes.map(c => c.name)
                expect(names).toContain('ParentA')
                expect(names).toContain('ParentB')
            }
        })

        it('handles circular references with placeholder markers', () => {
            const strains = [
                makeStrain({ id: 's1', name: 'StrainA', genetics: 'StrainB x Landrace1' }),
                makeStrain({ id: 's2', name: 'StrainB', genetics: 'StrainA x Landrace2' }),
            ]
            // This should not infinite-loop
            const tree = geneticsService.buildGenealogyTree('s1', strains)
            expect(tree).not.toBeNull()
        })

        it('marks unknown parents as landraces', () => {
            const strains = [
                makeStrain({ id: 's1', name: 'Hybrid', genetics: 'Unknown Parent x Another Unknown' }),
            ]
            const tree = geneticsService.buildGenealogyTree('s1', strains)
            const children = tree!.children || tree!._children
            if (children) {
                children.forEach(c => {
                    expect(c.isLandrace).toBe(true)
                })
            }
        })
    })

    describe('calculateGeneticContribution', () => {
        it('returns empty array for null tree', () => {
            const contributions = geneticsService.calculateGeneticContribution(null)
            expect(contributions).toEqual([])
        })

        it('returns 100% for a single landrace node', () => {
            const tree = { id: 's1', name: 'Afghan', type: StrainType.Indica, thc: 15, isLandrace: true }
            const contributions = geneticsService.calculateGeneticContribution(tree)
            expect(contributions).toHaveLength(1)
            expect(contributions[0]!.name).toBe('Afghan')
            expect(contributions[0]!.contribution).toBeCloseTo(100)
        })

        it('splits contribution equally between two children', () => {
            const tree = {
                id: 's1', name: 'Hybrid', type: StrainType.Hybrid, thc: 20, isLandrace: false,
                children: [
                    { id: 'p1', name: 'ParentA', type: StrainType.Indica, thc: 18, isLandrace: true },
                    { id: 'p2', name: 'ParentB', type: StrainType.Sativa, thc: 22, isLandrace: true },
                ],
            }
            const contributions = geneticsService.calculateGeneticContribution(tree)
            expect(contributions).toHaveLength(2)
            expect(contributions[0]!.contribution).toBeCloseTo(50)
            expect(contributions[1]!.contribution).toBeCloseTo(50)
        })

        it('returns sorted contributions (highest first)', () => {
            const tree = {
                id: 's1', name: 'Hybrid', type: StrainType.Hybrid, thc: 20, isLandrace: false,
                children: [
                    { id: 'p1', name: 'LowContrib', type: StrainType.Indica, thc: 18, isLandrace: false,
                        children: [
                            { id: 'g1', name: 'Grand1', type: StrainType.Indica, thc: 15, isLandrace: true },
                            { id: 'g2', name: 'Grand2', type: StrainType.Indica, thc: 16, isLandrace: true },
                        ],
                    },
                    { id: 'p2', name: 'HighContrib', type: StrainType.Sativa, thc: 22, isLandrace: true },
                ],
            }
            const contributions = geneticsService.calculateGeneticContribution(tree)
            for (let i = 1; i < contributions.length; i++) {
                expect(contributions[i - 1]!.contribution).toBeGreaterThanOrEqual(contributions[i]!.contribution)
            }
        })
    })

    describe('findDescendants', () => {
        it('returns empty arrays for non-existent strain', () => {
            const result = geneticsService.findDescendants('nonexistent', [])
            expect(result.children).toEqual([])
            expect(result.grandchildren).toEqual([])
        })

        it('finds direct children', () => {
            const parent = makeStrain({ id: 'p1', name: 'OG Kush', genetics: '' })
            const child1 = makeStrain({ id: 'c1', name: 'Bubba', genetics: 'OG Kush x Purple Kush' })
            const child2 = makeStrain({ id: 'c2', name: 'SFV OG', genetics: 'OG Kush x Afghani' })
            const unrelated = makeStrain({ id: 'u1', name: 'Blue Dream', genetics: 'Blueberry x Haze' })

            const result = geneticsService.findDescendants('p1', [parent, child1, child2, unrelated])
            expect(result.children.map(s => s.id)).toContain('c1')
            expect(result.children.map(s => s.id)).toContain('c2')
            expect(result.children.map(s => s.id)).not.toContain('u1')
        })
    })

    describe('estimateOffspringProfile', () => {
        const parentA = makeStrain({ id: 'pa', name: 'PA', thc: 20, cbd: 1, floweringTime: 9 })
        const parentB = makeStrain({ id: 'pb', name: 'PB', thc: 10, cbd: 3, floweringTime: 11 })
        const defaultPhenotypes = {
            parentA: { vigor: 5, resin: 5, aroma: 5, resistance: 5 },
            parentB: { vigor: 5, resin: 5, aroma: 5, resistance: 5 },
        }

        it('returns average THC of parents at neutral phenotypes', () => {
            const result = geneticsService.estimateOffspringProfile(parentA, parentB, defaultPhenotypes)
            // avg(20,10) + (5-5)*0.35 = 15
            expect(result.thc).toBeCloseTo(15, 0)
        })

        it('returns average CBD of parents at neutral phenotypes', () => {
            const result = geneticsService.estimateOffspringProfile(parentA, parentB, defaultPhenotypes)
            // avg(1,3) + (5-5)*0.08 = 2
            expect(result.cbd).toBeCloseTo(2, 0)
        })

        it('adjusts THC upward with high resin phenotype', () => {
            const highResin = {
                parentA: { vigor: 5, resin: 10, aroma: 5, resistance: 5 },
                parentB: { vigor: 5, resin: 10, aroma: 5, resistance: 5 },
            }
            const result = geneticsService.estimateOffspringProfile(parentA, parentB, highResin)
            expect(result.thc).toBeGreaterThan(15) // higher than neutral average
        })

        it('returns stability score between 0 and 100', () => {
            const result = geneticsService.estimateOffspringProfile(parentA, parentB, defaultPhenotypes)
            expect(result.stabilityScore).toBeGreaterThanOrEqual(0)
            expect(result.stabilityScore).toBeLessThanOrEqual(100)
        })

        it('minimum flowering weeks is 6', () => {
            const result = geneticsService.estimateOffspringProfile(parentA, parentB, {
                parentA: { vigor: 10, resin: 5, aroma: 5, resistance: 5 },
                parentB: { vigor: 10, resin: 5, aroma: 5, resistance: 5 },
            })
            expect(result.floweringWeeks).toBeGreaterThanOrEqual(6)
        })

        it('clamps phenotype scores 0-10', () => {
            const extreme = {
                parentA: { vigor: -5, resin: 20, aroma: -10, resistance: 15 },
                parentB: { vigor: -5, resin: 20, aroma: -10, resistance: 15 },
            }
            const result = geneticsService.estimateOffspringProfile(parentA, parentB, extreme)
            expect(result.vigorScore).toBeGreaterThanOrEqual(0)
            expect(result.vigorScore).toBeLessThanOrEqual(10)
            expect(result.resinScore).toBeGreaterThanOrEqual(0)
            expect(result.resinScore).toBeLessThanOrEqual(10)
        })
    })
})
