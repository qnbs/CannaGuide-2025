import { describe, expect, it } from 'vitest'

import { migrateState, mergeStrainCatalogForUpdate } from '@/services/migrationLogic'
import { PlantStage } from '@/types'

describe('migrationLogic', () => {
    it('keeps the first bundled strain when duplicate ids are present', () => {
        const merged = mergeStrainCatalogForUpdate(
            [],
            [
                { id: 'strain-1', name: 'Alpha', type: 'Hybrid', floweringType: 'Photoperiod', thc: 20, cbd: 1, floweringTime: 9, agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' }, geneticModifiers: { pestResistance: 1, nutrientUptakeRate: 1, stressTolerance: 1, rue: 1, vpdTolerance: { min: 0.8, max: 1.6 }, transpirationFactor: 1, stomataSensitivity: 1 } },
                { id: 'strain-1', name: 'Beta', type: 'Sativa', floweringType: 'Photoperiod', thc: 25, cbd: 2, floweringTime: 10, agronomic: { difficulty: 'Hard', yield: 'High', height: 'Tall' }, geneticModifiers: { pestResistance: 1, nutrientUptakeRate: 1, stressTolerance: 1, rue: 1, vpdTolerance: { min: 0.8, max: 1.6 }, transpirationFactor: 1, stomataSensitivity: 1 } },
            ],
        )

        expect(merged).toHaveLength(1)
        expect(merged[0].name).toBe('Alpha')
        expect(merged[0].type).toBe('Hybrid')
    })

    it('deep merges nested strain fields when updating legacy data', () => {
        const merged = mergeStrainCatalogForUpdate(
            [{
                id: 'strain-1',
                name: 'Legacy',
                type: 'Hybrid',
                floweringType: 'Photoperiod',
                thc: 20,
                cbd: 1,
                floweringTime: 9,
                agronomic: { difficulty: 'Easy', yield: 'Low', height: 'Short' },
                geneticModifiers: {
                    pestResistance: 0.9,
                    nutrientUptakeRate: 0.9,
                    stressTolerance: 0.9,
                    rue: 1.1,
                    vpdTolerance: { min: 0.8, max: 1.4 },
                    transpirationFactor: 0.95,
                    stomataSensitivity: 0.96,
                },
                aromas: ['Fruity'],
            } as never],
            [{
                id: 'strain-1',
                name: 'Bundled',
                type: 'Sativa',
                floweringType: 'Autoflower',
                thc: 24,
                cbd: 2,
                floweringTime: 8,
                agronomic: { difficulty: 'Hard', yield: 'High', height: 'Tall' },
                geneticModifiers: {
                    pestResistance: 1,
                    nutrientUptakeRate: 1,
                    stressTolerance: 1,
                    rue: 1.2,
                    vpdTolerance: { min: 0.9, max: 1.5 },
                    transpirationFactor: 1,
                    stomataSensitivity: 1,
                },
                dominantTerpenes: ['Limonene'],
            } as never],
        )

        expect(merged).toHaveLength(1)
        expect(merged[0].name).toBe('Bundled')
        expect(merged[0].agronomic.difficulty).toBe('Hard')
        expect(merged[0].agronomic.yield).toBe('High')
        expect(merged[0].geneticModifiers.vpdTolerance.min).toBe(0.9)
        expect(merged[0].aromas).toEqual(['Fruity'])
        expect(merged[0].dominantTerpenes).toEqual(['Limonene'])
    })

    it('deeply normalizes partial post-harvest data on persisted plants', () => {
        const migrated = migrateState({
            version: 4,
            _sliceVersions: {
                settings: 2,
                simulation: 2,
                genealogy: 3,
                sandbox: 1,
                userStrains: 1,
                favorites: 1,
                notes: 1,
                archives: 1,
                savedItems: 1,
                knowledge: 1,
                breeding: 1,
                ui: 1,
            },
            simulation: {
                plants: {
                    ids: ['plant-1'],
                    entities: {
                        'plant-1': {
                            id: 'plant-1',
                            name: 'Legacy Plant',
                            stage: PlantStage.Curing,
                            createdAt: 1,
                            lastUpdated: 1,
                            strain: {
                                id: 'strain-1',
                                name: 'Legacy Strain',
                                type: 'Hybrid',
                                thc: 20,
                                cbd: 1,
                                floweringTime: 56,
                                floweringType: 'Photoperiod',
                                agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
                                geneticModifiers: {
                                    pestResistance: 1,
                                    nutrientUptakeRate: 1,
                                    stressTolerance: 1,
                                    rue: 1,
                                    vpdTolerance: { min: 0.8, max: 1.6 },
                                    transpirationFactor: 1,
                                    stomataSensitivity: 1,
                                },
                            },
                            harvestData: {
                                wetWeight: 40,
                            },
                        },
                    },
                },
                plantSlots: ['plant-1', null, null],
                selectedPlantId: null,
                vpdProfiles: {},
                isCatchingUp: false,
            } as any,
        })

        const harvestData = migrated.simulation?.plants.entities['plant-1']?.harvestData
        expect(harvestData).toMatchObject({
            wetWeight: 40,
            currentDryDay: 0,
            currentCureDay: 1,
            lastBurpDay: 0,
            jarHumidity: 62,
            chlorophyllPercent: 100,
            terpeneRetentionPercent: 100,
            moldRiskPercent: 0,
            finalQuality: 0,
            cannabinoidProfile: { thc: 0, cbn: 0 },
        })
        expect(harvestData?.terpeneProfile).toEqual({})
    })
})
