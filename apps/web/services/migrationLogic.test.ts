import { describe, expect, it } from 'vitest'

import { migrateState, mergeStrainCatalogForUpdate } from '@/services/migrationLogic'
import { PlantStage, StrainType } from '@/types'

describe('migrationLogic', () => {
    it('keeps the first bundled strain when duplicate ids are present', () => {
        const merged = mergeStrainCatalogForUpdate(
            [],
            [
                {
                    id: 'strain-1',
                    name: 'Alpha',
                    type: StrainType.Hybrid,
                    floweringType: 'Photoperiod',
                    thc: 20,
                    cbd: 1,
                    floweringTime: 9,
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
                {
                    id: 'strain-1',
                    name: 'Beta',
                    type: StrainType.Sativa,
                    floweringType: 'Photoperiod',
                    thc: 25,
                    cbd: 2,
                    floweringTime: 10,
                    agronomic: { difficulty: 'Hard', yield: 'High', height: 'Tall' },
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
            ],
        )

        expect(merged).toHaveLength(1)
        expect(merged[0]!.name).toBe('Alpha')
        expect(merged[0]!.type).toBe('Hybrid')
    })

    it('deep merges nested strain fields when updating legacy data', () => {
        const merged = mergeStrainCatalogForUpdate(
            [
                {
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
                } as never,
            ],
            [
                {
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
                } as never,
            ],
        )

        expect(merged).toHaveLength(1)
        expect(merged[0]!.name).toBe('Bundled')
        expect(merged[0]!.agronomic.difficulty).toBe('Hard')
        expect(merged[0]!.agronomic.yield).toBe('High')
        expect(merged[0]!.geneticModifiers.vpdTolerance.min).toBe(0.9)
        expect(merged[0]!.aromas).toEqual(['Fruity'])
        expect(merged[0]!.dominantTerpenes).toEqual(['Limonene'])
    })

    it('deeply normalizes partial post-harvest data on persisted plants', () => {
        const migrated = migrateState({
            version: 4,
            _sliceVersions: {
                settings: 2,
                simulation: 3,
                grows: 1,
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
            } as never,
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

    it('repairs missing userStrains entity adapter shape', () => {
        const migrated = migrateState({
            version: 5,
            _sliceVersions: { settings: 2, simulation: 2, genealogy: 3 },
            userStrains: undefined,
        } as never)

        expect(migrated.userStrains).toEqual({ ids: [], entities: {} })
    })

    it('repairs corrupt savedItems with missing sub-adapters', () => {
        const migrated = migrateState({
            version: 5,
            _sliceVersions: { settings: 2, simulation: 2, genealogy: 3 },
            savedItems: { savedSetups: null, savedStrainTips: undefined },
        } as never)

        expect(migrated.savedItems!.savedSetups).toEqual({ ids: [], entities: {} })
        expect(migrated.savedItems!.savedStrainTips).toEqual({ ids: [], entities: {} })
        expect(migrated.savedItems!.savedExports).toEqual({ ids: [], entities: {} })
    })

    it('repairs legacy saved strain tip image urls', () => {
        const migrated = migrateState({
            version: 5,
            _sliceVersions: { settings: 2, simulation: 2, genealogy: 3 },
            savedItems: {
                savedSetups: { ids: [], entities: {} },
                savedStrainTips: {
                    ids: ['tip-1'],
                    entities: {
                        'tip-1': {
                            id: 'tip-1',
                            createdAt: 123,
                            strainId: 'strain-1',
                            strainName: 'Aurora',
                            title: 'Aurora tips',
                            nutrientTip: 'Nutrient',
                            trainingTip: 'Training',
                            environmentalTip: 'Environment',
                            proTip: 'Pro',
                            imageUrl:
                                'data:image/jpeg;base64,data:image/svg+xml;charset=utf-8,%3Csvg%3Elegacy%3C/svg%3E',
                        },
                    },
                },
                savedExports: { ids: [], entities: {} },
            },
        } as never)

        const savedTip = migrated.savedItems?.savedStrainTips.entities?.['tip-1'] as
            | { imageUrl?: string }
            | undefined

        expect(savedTip?.imageUrl).toBe(
            'data:image/svg+xml;charset=utf-8,%3Csvg%3Elegacy%3C/svg%3E',
        )
    })

    it('repairs missing favorites shape', () => {
        const migrated = migrateState({
            version: 5,
            _sliceVersions: { settings: 2, simulation: 2, genealogy: 3 },
            favorites: null,
        } as never)

        expect(migrated.favorites).toEqual({ favoriteIds: [] })
    })

    it('repairs missing strainsView shape', () => {
        const migrated = migrateState({
            version: 5,
            _sliceVersions: { settings: 2, simulation: 2, genealogy: 3 },
            strainsView: undefined,
        } as never)

        // strainsView was migrated to zustand; migration logic may still produce it
        // for backward compatibility but it is no longer part of the Redux RootState.
        const raw = migrated as Record<string, unknown>
        expect(raw.strainsView).toBeDefined()
        expect((raw.strainsView as { selectedStrainIds: string[] }).selectedStrainIds).toEqual([])
    })

    it('repairs missing archives shape', () => {
        const migrated = migrateState({
            version: 5,
            _sliceVersions: { settings: 2, simulation: 2, genealogy: 3 },
            archives: undefined,
        } as never)

        expect(migrated.archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        })
    })

    it('survives completely empty persisted state', () => {
        const migrated = migrateState({ version: 5 } as never)

        expect(migrated.userStrains).toEqual({ ids: [], entities: {} })
        expect(migrated.favorites).toEqual({ favoriteIds: [] })
        expect(migrated.savedItems!.savedSetups).toEqual({ ids: [], entities: {} })
        expect(migrated.savedItems!.savedStrainTips).toEqual({ ids: [], entities: {} })
        expect(migrated.savedItems!.savedExports).toEqual({ ids: [], entities: {} })
    })
})

describe('v5 -> v6 migration (Multi-Grow)', () => {
    it('creates grows slice with default grow', () => {
        const migrated = migrateState({ version: 5 } as never)

        const grows = (migrated as Record<string, unknown>).grows as Record<string, unknown>
        expect(grows).toBeDefined()
        expect(grows.activeGrowId).toBe('default-grow')
        const inner = grows.grows as { ids: string[]; entities: Record<string, unknown> }
        expect(inner.ids).toContain('default-grow')
        expect(inner.entities['default-grow']).toBeDefined()
    })

    it('stamps growId on existing plants', () => {
        const migrated = migrateState({
            version: 5,
            simulation: {
                plants: {
                    ids: ['plant-1'],
                    entities: {
                        'plant-1': {
                            id: 'plant-1',
                            growId: 'default-grow',
                            name: 'Legacy Plant',
                            stage: PlantStage.Vegetative,
                            health: 100,
                            stressLevel: 0,
                            height: 20,
                            age: 7,
                        },
                    },
                },
                plantSlots: ['plant-1', null, null],
                selectedPlantId: null,
                vpdProfiles: {},
            },
        } as never)

        const sim = migrated.simulation as unknown as Record<string, unknown>
        const plants = sim?.plants as { entities: Record<string, Record<string, unknown>> }
        expect(plants.entities['plant-1']?.growId).toBe('default-grow')
    })

    it('stamps growId on existing nutrient schedule entries', () => {
        const migrated = migrateState({
            version: 5,
            nutrientPlanner: {
                schedule: [
                    {
                        id: 'schedule-seedling',
                        stage: PlantStage.Seedling,
                        targetEc: 0.6,
                        targetPh: 6.2,
                        npkRatio: { n: 2, p: 1, k: 1 },
                        notes: '',
                    },
                ],
                readings: [],
                alerts: [],
                autoAdjustEnabled: false,
                medium: 'Soil',
                isAiLoading: false,
                lastAiRecommendation: null,
                activePluginId: null,
                autoAdjustRecommendation: null,
            },
        } as never)

        const np = migrated.nutrientPlanner as unknown as Record<string, unknown>
        const schedule = np.schedule as Record<string, unknown>[]
        expect(schedule[0]?.growId).toBe('default-grow')
    })

    it('does not overwrite existing growId on plants', () => {
        const migrated = migrateState({
            version: 5,
            simulation: {
                plants: {
                    ids: ['plant-1'],
                    entities: {
                        'plant-1': {
                            id: 'plant-1',
                            growId: 'custom-grow',
                            name: 'Already Has GrowId',
                        },
                    },
                },
                plantSlots: ['plant-1', null, null],
                selectedPlantId: null,
                vpdProfiles: {},
            },
        } as never)

        const sim = migrated.simulation as unknown as Record<string, unknown>
        const plants = sim?.plants as { entities: Record<string, Record<string, unknown>> }
        expect(plants.entities['plant-1']?.growId).toBe('custom-grow')
    })

    it('migrated state has version 6', () => {
        const migrated = migrateState({ version: 5 } as never)
        expect(migrated.version).toBe(6)
    })
})
