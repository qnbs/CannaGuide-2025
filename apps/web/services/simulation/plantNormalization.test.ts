import { describe, expect, it } from 'vitest'
import { PlantStage, StrainType } from '@/types'
import type { Plant } from '@/types'
import { getPlantGeneticModifiers, normalizePlant } from '@/services/simulation/plantNormalization'

const sparsePlant = (): Plant =>
    ({
        id: 'sparse-1',
        growId: 'grow-1',
        name: 'Sparse',
        strain: {
            id: 's1',
            name: 'Test',
            type: StrainType.Hybrid,
            floweringType: 'Photoperiod',
            thc: 20,
            cbd: 1,
            floweringTime: 60,
            agronomic: { difficulty: 'Easy', yield: 'High', height: 'Medium' },
            geneticModifiers: {
                pestResistance: 1,
                nutrientUptakeRate: 1,
                stressTolerance: 1,
                rue: 1,
                vpdTolerance: { min: 0.4, max: 1.6 },
                transpirationFactor: 1,
                stomataSensitivity: 1,
            },
        },
        mediumType: 'Soil',
        createdAt: 0,
        lastUpdated: 0,
        age: NaN,
        stage: PlantStage.Vegetative,
        health: NaN,
        stressLevel: NaN,
        height: NaN,
        biomass: { total: NaN, stem: NaN, leaves: NaN, flowers: NaN },
        leafAreaIndex: NaN,
        isTopped: false,
        lstApplied: 0,
        environment: {},
        medium: {},
        nutrientPool: {},
        rootSystem: {},
        equipment: {},
        journal: [],
        problems: [],
    }) as unknown as Plant

describe('plantNormalization', () => {
    it('normalizePlant fills finite defaults for corrupt numeric fields', () => {
        const normalized = normalizePlant(sparsePlant())
        expect(Number.isFinite(normalized.health)).toBe(true)
        expect(Number.isFinite(normalized.environment.internalTemperature)).toBe(true)
        expect(normalized.equipment.light.type).toBe('LED')
        expect(normalized.equipment.light.wattage).toBeGreaterThanOrEqual(10)
    })

    it('keeps a chosen flowering policy without inventing a cultivar mode', () => {
        const plant = sparsePlant()
        const strain = { ...plant.strain }
        delete (strain as { floweringType?: string }).floweringType
        plant.strain = strain
        plant.equipment = {
            ...plant.equipment,
            floweringPolicy: 'Autoflower',
        }
        const normalized = normalizePlant(plant)
        expect(normalized.equipment.floweringPolicy).toBe('Autoflower')
        expect(normalized.strain.floweringType).toBeUndefined()
        expect(plant.strain.floweringType).toBeUndefined()
    })

    it('drops a flowering policy that is not a real mode', () => {
        const plant = sparsePlant()
        plant.equipment = {
            ...plant.equipment,
            floweringPolicy: 'Weekly' as 'Autoflower',
        }
        expect(normalizePlant(plant).equipment.floweringPolicy).toBeUndefined()
    })

    it('does not invent genetic modifiers on a cultivar that reported none', () => {
        const plant = sparsePlant()
        const strain = { ...plant.strain }
        delete (strain as { geneticModifiers?: unknown }).geneticModifiers
        plant.strain = strain
        const normalized = normalizePlant(plant)
        expect(normalized.strain.geneticModifiers).toBeUndefined()
        expect(normalized.phenotypeModifiers?.pestResistance).toEqual(expect.any(Number))
        expect(plant.strain.geneticModifiers).toBeUndefined()
    })

    it('does not throw when a legacy plant has no strain object', () => {
        const plant = sparsePlant()
        delete (plant as { strain?: Plant['strain'] }).strain
        const normalized = normalizePlant(plant)
        expect(normalized.strain.geneticModifiers).toBeUndefined()
    })

    it('keeps an explicit phenotype modifier through normalization', () => {
        const plant = sparsePlant()
        const strain = { ...plant.strain }
        delete (strain as { geneticModifiers?: unknown }).geneticModifiers
        plant.strain = strain
        plant.phenotypeModifiers = {
            pestResistance: 2,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1,
            vpdTolerance: { min: 0.3, max: 1.8 },
            transpirationFactor: 1.2,
            stomataSensitivity: 0.9,
        }
        const normalized = normalizePlant(plant)
        expect(normalized.phenotypeModifiers?.pestResistance).toBe(2)
        expect(normalized.strain.geneticModifiers).toBeUndefined()
    })

    it('keeps reported genetic modifiers on the cultivar', () => {
        const normalized = normalizePlant(sparsePlant())
        expect(normalized.strain.geneticModifiers?.pestResistance).toBe(1)
    })

    it('getPlantGeneticModifiers prefers phenotypeModifiers', () => {
        const plant = normalizePlant(sparsePlant())
        plant.phenotypeModifiers = {
            pestResistance: 2,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1,
            vpdTolerance: { min: 0.3, max: 1.8 },
            transpirationFactor: 1.2,
            stomataSensitivity: 0.9,
        }
        const mods = getPlantGeneticModifiers(plant)
        expect(mods.pestResistance).toBe(2)
    })
})
