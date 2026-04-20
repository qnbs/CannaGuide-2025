import { describe, expect, it } from 'vitest'
import {
    calculateGeneticTrendMatchScore,
    calculateGrowTechMatchScore,
    getRelatedGrowTechForGenetic,
    getRelatedGeneticForGrowTech,
} from './trendsEcosystemService'
import type { GeneticTrendCategory, GrowTechCategory, Plant, GrowSetup } from '@/types'

const basePlant: Plant = {
    id: 'p1',
    name: 'Test Plant',
    stage: 'VEGETATIVE',
    mediumType: 'Soil',
    strain: {
        id: 's1',
        name: 'OG Kush',
        type: 'Hybrid',
        thcContent: 20,
        cbdContent: 0.5,
        floweringType: 'Photoperiod',
        floweringTime: 9,
        difficulty: 'Medium',
        description: 'Classic strain',
        effects: [],
        flavors: [],
        growInfo: { indoor: true, outdoor: true, height: 'Medium' },
    },
} as unknown as Plant

const baseSetup: GrowSetup = {
    medium: 'Soil',
    lightType: 'LED',
    dynamicLighting: false,
} as unknown as GrowSetup

describe('trendsEcosystemService', () => {
    describe('calculateGeneticTrendMatchScore', () => {
        it('scores terpeneDiversity high for Soil', () => {
            const result = calculateGeneticTrendMatchScore('terpeneDiversity', basePlant)
            expect(result.score).toBe(90)
            expect(result.category).toBe('terpeneDiversity')
            expect(result.reason).toBeDefined()
        })

        it('scores terpeneDiversity lower for Hydro', () => {
            const hydroPlant = { ...basePlant, mediumType: 'Hydro' } as unknown as Plant
            const result = calculateGeneticTrendMatchScore('terpeneDiversity', hydroPlant)
            expect(result.score).toBe(65)
        })

        it('scores ultraPotency high during FLOWERING', () => {
            const flowerPlant = { ...basePlant, stage: 'FLOWERING' } as unknown as Plant
            const result = calculateGeneticTrendMatchScore('ultraPotency', flowerPlant)
            expect(result.score).toBe(95)
        })

        it('scores ultraPotency moderate during VEGETATIVE', () => {
            const result = calculateGeneticTrendMatchScore('ultraPotency', basePlant)
            expect(result.score).toBe(70)
        })

        it('scores ultraPotency low in other stages', () => {
            const seedPlant = { ...basePlant, stage: 'SEED' } as unknown as Plant
            const result = calculateGeneticTrendMatchScore('ultraPotency', seedPlant)
            expect(result.score).toBe(45)
        })

        it('scores balancedHybrids at 80', () => {
            const result = calculateGeneticTrendMatchScore('balancedHybrids', basePlant)
            expect(result.score).toBe(80)
        })

        it('scores autofloweringRevolution high for autoflower strains', () => {
            const autoPlant = {
                ...basePlant,
                id: 'p-auto',
                strain: { ...basePlant.strain, floweringType: 'Autoflower' },
            } as unknown as Plant
            const result = calculateGeneticTrendMatchScore('autofloweringRevolution', autoPlant)
            expect(result.score).toBe(95)
        })

        it('scores autofloweringRevolution lower for photoperiod', () => {
            const photoPlant = { ...basePlant, id: 'p-photo' } as unknown as Plant
            const result = calculateGeneticTrendMatchScore('autofloweringRevolution', photoPlant)
            expect(result.score).toBe(60)
        })

        it('scores advancedBreeding higher in early stages', () => {
            const result = calculateGeneticTrendMatchScore('advancedBreeding', basePlant)
            expect(result.score).toBe(75)
        })

        it('scores advancedBreeding lower in late stages', () => {
            const latePlant = { ...basePlant, stage: 'FLOWERING' } as unknown as Plant
            const result = calculateGeneticTrendMatchScore('advancedBreeding', latePlant)
            expect(result.score).toBe(50)
        })

        it('scores landraceRevival high for Soil', () => {
            const result = calculateGeneticTrendMatchScore('landraceRevival', basePlant)
            expect(result.score).toBe(88)
        })

        it('scores landraceRevival lower for non-Soil', () => {
            const cocoPlant = { ...basePlant, mediumType: 'Coco' } as unknown as Plant
            const result = calculateGeneticTrendMatchScore('landraceRevival', cocoPlant)
            expect(result.score).toBe(55)
        })

        it('returns cached result on second call', () => {
            const r1 = calculateGeneticTrendMatchScore('balancedHybrids', basePlant)
            const r2 = calculateGeneticTrendMatchScore('balancedHybrids', basePlant)
            expect(r1).toEqual(r2)
        })
    })

    describe('calculateGrowTechMatchScore', () => {
        it('scores dynamicLighting high for LED with dynamic', () => {
            const setup = { ...baseSetup, dynamicLighting: true } as unknown as GrowSetup
            const result = calculateGrowTechMatchScore('dynamicLighting', setup)
            expect(result.score).toBe(95)
        })

        it('scores dynamicLighting moderate for LED without dynamic', () => {
            const result = calculateGrowTechMatchScore('dynamicLighting', baseSetup)
            expect(result.score).toBe(80)
        })

        it('scores dynamicLighting lower for HPS', () => {
            const hpsSetup = { ...baseSetup, lightType: 'HPS' } as unknown as GrowSetup
            const result = calculateGrowTechMatchScore('dynamicLighting', hpsSetup)
            expect(result.score).toBe(55)
        })

        it('scores sensorsIoT at 88', () => {
            const result = calculateGrowTechMatchScore('sensorsIoT', baseSetup)
            expect(result.score).toBe(88)
        })

        it('scores aiAutomation at 82', () => {
            const result = calculateGrowTechMatchScore('aiAutomation', baseSetup)
            expect(result.score).toBe(82)
        })

        it('scores hydroAero high for Hydro medium', () => {
            const hydroSetup = { ...baseSetup, medium: 'Hydro' } as unknown as GrowSetup
            const result = calculateGrowTechMatchScore('hydroAero', hydroSetup)
            expect(result.score).toBe(95)
        })

        it('scores hydroAero moderate for Coco', () => {
            const cocoSetup = { ...baseSetup, medium: 'Coco' } as unknown as GrowSetup
            const result = calculateGrowTechMatchScore('hydroAero', cocoSetup)
            expect(result.score).toBe(65)
        })

        it('scores hydroAero low for Soil', () => {
            const result = calculateGrowTechMatchScore('hydroAero', baseSetup)
            expect(result.score).toBe(40)
        })

        it('scores sustainability high for LED', () => {
            const result = calculateGrowTechMatchScore('sustainability', baseSetup)
            expect(result.score).toBe(90)
        })

        it('scores sustainability lower for non-LED', () => {
            const hpsSetup = { ...baseSetup, lightType: 'HPS' } as unknown as GrowSetup
            const result = calculateGrowTechMatchScore('sustainability', hpsSetup)
            expect(result.score).toBe(65)
        })

        it('scores digitalTwin higher with dynamic lighting', () => {
            const setup = { ...baseSetup, dynamicLighting: true } as unknown as GrowSetup
            const result = calculateGrowTechMatchScore('digitalTwin', setup)
            expect(result.score).toBe(85)
        })

        it('scores digitalTwin lower without dynamic lighting', () => {
            const result = calculateGrowTechMatchScore('digitalTwin', baseSetup)
            expect(result.score).toBe(70)
        })

        it('scores tissueCulture at 60', () => {
            const result = calculateGrowTechMatchScore('tissueCulture', baseSetup)
            expect(result.score).toBe(60)
        })

        it('scores smartGrowBoxes at 68', () => {
            const result = calculateGrowTechMatchScore('smartGrowBoxes', baseSetup)
            expect(result.score).toBe(68)
        })
    })

    describe('getRelatedGrowTechForGenetic', () => {
        it('returns related techs for terpeneDiversity', () => {
            const techs = getRelatedGrowTechForGenetic('terpeneDiversity')
            expect(techs).toContain('sustainability')
            expect(techs).toContain('sensorsIoT')
        })

        it('returns related techs for autofloweringRevolution', () => {
            const techs = getRelatedGrowTechForGenetic('autofloweringRevolution')
            expect(techs).toContain('dynamicLighting')
            expect(techs).toContain('smartGrowBoxes')
        })

        it('returns empty array for unknown category', () => {
            const techs = getRelatedGrowTechForGenetic('unknown' as GeneticTrendCategory)
            expect(techs).toEqual([])
        })
    })

    describe('getRelatedGeneticForGrowTech', () => {
        it('returns related genetics for sustainability', () => {
            const genetics = getRelatedGeneticForGrowTech('sustainability')
            expect(genetics).toContain('terpeneDiversity')
            expect(genetics).toContain('landraceRevival')
        })

        it('returns related genetics for sensorsIoT', () => {
            const genetics = getRelatedGeneticForGrowTech('sensorsIoT')
            expect(genetics).toContain('terpeneDiversity')
            expect(genetics).toContain('ultraPotency')
            expect(genetics).toContain('balancedHybrids')
        })

        it('returns empty array for unknown tech', () => {
            const genetics = getRelatedGeneticForGrowTech('unknown' as GrowTechCategory)
            expect(genetics).toEqual([])
        })
    })
})
