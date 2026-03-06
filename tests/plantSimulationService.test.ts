/**
 * Unit tests for PlantSimulationService.
 * Private methods are tested indirectly through the public API; we use
 * vi.setSystemTime() to control `Date.now()` inside calculateStateForTimeDelta.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { plantSimulationService } from '@/services/plantSimulationService'
import { Plant, PlantStage, Strain, StrainType } from '@/types'
import { SIM_SECONDS_PER_DAY } from '@/constants'

// ─── Minimal test fixtures ────────────────────────────────────────────────────

const testStrain: Strain = {
    id: 'strain-test',
    name: 'Test Strain',
    type: StrainType.Hybrid,
    thc: 20,
    cbd: 1,
    floweringTime: 56,
    floweringType: 'Photoperiod',
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
    geneticModifiers: {
        pestResistance: 1.0,
        nutrientUptakeRate: 1.0,
        stressTolerance: 1.0,
        rue: 1.0,
        vpdTolerance: { min: 0.8, max: 1.6 },
        transpirationFactor: 1.0,
        stomataSensitivity: 1.0,
    },
}

const testSetup = {
    lightType: 'LED' as const,
    lightWattage: 400,
    lightHours: 18,
    ventilation: 'high' as const,
    hasCirculationFan: true,
    potSize: 11,
    potType: 'Fabric' as const,
    medium: 'Soil' as const,
}

const tunedSimulationSettings = {
    autoJournaling: {
        logStageChanges: true,
        logProblems: true,
        logTasks: true,
    },
    simulationProfile: 'expert' as const,
    pestPressure: 0.1,
    nutrientSensitivity: 1.0,
    environmentalStability: 0.9,
    leafTemperatureOffset: -2,
    lightExtinctionCoefficient: 0.7,
    nutrientConversionEfficiency: 0.5,
    stomataSensitivity: 1.0,
    altitudeM: 0,
}

// Advance time by N simulation days (milliseconds)
const daysMs = (n: number) => n * SIM_SECONDS_PER_DAY * 1000

// Run N simulation days on a plant. Returns the updated plant.
const simulate = (plant: Plant, days: number): Plant => {
    const start = Date.now()
    vi.setSystemTime(start + daysMs(days))
    const { updatedPlant } = plantSimulationService.calculateStateForTimeDelta(plant, daysMs(days))
    vi.setSystemTime(start) // restore
    return updatedPlant
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('plantSimulationService', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    // ── createPlant ───────────────────────────────────────────────────────────

    describe('createPlant()', () => {
        it('produces a plant with valid initial health and stage', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            expect(plant.health).toBe(100)
            expect(plant.stressLevel).toBe(0)
            expect(plant.stage).toBe(PlantStage.Seed)
            expect(plant.age).toBe(0)
        })

        it('sets phenotypeModifiers from strain defaults', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            expect(plant.phenotypeModifiers).toEqual(testStrain.geneticModifiers)
        })

        it('initializes the persistent simulation clock', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            expect(plant.simulationClock.accumulatedDayMs).toBe(0)
        })

        it('calculates initial vpd from temperature and humidity', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            // VPD must be a positive number for default 24°C / 65% RH
            expect(plant.environment.vpd).toBeGreaterThan(0)
        })

        it('sets substrateWater based on pot size', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            // Fabric pot: 11L * 1000 * 0.28 = 3080 mL
            expect(plant.medium.substrateWater).toBeCloseTo(11 * 1000 * 0.28, 0)
        })
    })

    // ── applyEnvironmentalCorrections ─────────────────────────────────────────

    describe('applyEnvironmentalCorrections()', () => {
        it('does not mutate the input plant', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            const originalVpd = plant.environment.vpd
            plantSimulationService.applyEnvironmentalCorrections(plant)
            expect(plant.environment.vpd).toBe(originalVpd)
        })

        it('VPD increases when temperature rises (same RH)', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            const hot = plantSimulationService.clonePlant(plant)
            hot.environment.internalTemperature = 32
            const cooled = plantSimulationService.applyEnvironmentalCorrections(plant)
            const heated = plantSimulationService.applyEnvironmentalCorrections(hot)
            expect(heated.environment.vpd).toBeGreaterThan(cooled.environment.vpd)
        })

        it('uses configured leaf offset and altitude for VPD calibration', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            const tuned = plantSimulationService.applyEnvironmentalCorrections(plant, {
                ...tunedSimulationSettings,
                leafTemperatureOffset: -3,
                altitudeM: 1800,
            })

            expect(tuned.environment.vpd).not.toBeCloseTo(plant.environment.vpd, 3)
        })
    })

    // ── CO2 ecosystem (_runDailyEcosystem) ────────────────────────────────────

    describe('CO2 ecosystem (via 1-day simulation)', () => {
        it('CO2 stays near ambient 400 ppm with high ventilation', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            // Default: exhaustFan high + isOn
            const after = simulate(plant, 1)
            // Should remain close to ambient
            expect(after.environment.co2Level).toBeGreaterThan(350)
            expect(after.environment.co2Level).toBeLessThan(450)
        })

        it('CO2 drops when fan is off and light is on', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.equipment.exhaustFan.isOn = false
            plant.environment.co2Level = 400
            // Give the plant some leaves so photosynthesis draws down CO2
            plant.biomass.leaves = 5
            const after = simulate(plant, 1)
            // Fan off + no replenishment + photosynthesis consumption → CO2 should drop
            expect(after.environment.co2Level).toBeLessThan(400)
        })
    })

    // ── Growth simulation (_runDailyGrowth) ───────────────────────────────────

    describe('biomass growth (via multi-day simulation)', () => {
        it('plant gains biomass over 20 vegetative days', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            // Skip seed/germination/seedling by fast-forwarding age & stage
            plant.stage = PlantStage.Vegetative
            plant.age = 18
            plant.nutrientPool = { nitrogen: 50, phosphorus: 50, potassium: 50 }
            plant.biomass = { total: 1, stem: 0.5, leaves: 0.4, flowers: 0 }
            plant.leafAreaIndex = 0.2
            const after = simulate(plant, 20)
            expect(after.biomass.total).toBeGreaterThan(1)
        })

        it('height increases proportionally to stem biomass', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            plant.age = 18
            plant.nutrientPool = { nitrogen: 100, phosphorus: 100, potassium: 100 }
            plant.biomass = { total: 2, stem: 1, leaves: 0.8, flowers: 0 }
            plant.leafAreaIndex = 0.4
            const after = simulate(plant, 10)
            // height = stem * 20
            expect(after.height).toBeCloseTo(after.biomass.stem * 20, 1)
        })

        it('no biomass gain when nutrients run out', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            plant.age = 18
            plant.nutrientPool = { nitrogen: 0, phosphorus: 0, potassium: 0 }
            plant.medium.ec = 0 // No dissolved nutrients in medium
            plant.biomass = { total: 1, stem: 0.5, leaves: 0.4, flowers: 0 }
            const after = simulate(plant, 5)
            // Biomass should not increase meaningfully without nutrients
            expect(after.biomass.total).toBeCloseTo(1, 0)
        })

        it('changes biomass response when expert light and nutrient coefficients are tuned', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            plant.age = 18
            plant.nutrientPool = { nitrogen: 60, phosphorus: 60, potassium: 60 }
            plant.biomass = { total: 1.2, stem: 0.5, leaves: 0.6, flowers: 0 }
            plant.leafAreaIndex = 0.45

            const start = Date.now()
            vi.setSystemTime(start + daysMs(10))
            const baseline = plantSimulationService.calculateStateForTimeDelta(plant, daysMs(10), tunedSimulationSettings).updatedPlant
            const tuned = plantSimulationService.calculateStateForTimeDelta(plant, daysMs(10), {
                ...tunedSimulationSettings,
                lightExtinctionCoefficient: 1.1,
                nutrientConversionEfficiency: 0.8,
            }).updatedPlant
            vi.setSystemTime(start)

            expect(tuned.biomass.total).toBeGreaterThan(baseline.biomass.total)
        })
    })

    // ── pH lockout (_runDailyMetabolism) ──────────────────────────────────────

    describe('pH lockout effect', () => {
        it('plant grows less when pH is severely out of range', () => {
            const base = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            base.stage = PlantStage.Vegetative
            base.age = 18
            base.nutrientPool = { nitrogen: 50, phosphorus: 50, potassium: 50 }
            base.biomass = { total: 1, stem: 0.5, leaves: 0.4, flowers: 0 }
            base.leafAreaIndex = 0.2

            const goodPH = plantSimulationService.clonePlant(base)
            goodPH.medium.ph = 6.2 // ideal

            const badPH = plantSimulationService.clonePlant(base)
            badPH.medium.ph = 8.5 // far outside range

            const goodAfter = simulate(goodPH, 10)
            const badAfter = simulate(badPH, 10)

            expect(goodAfter.biomass.total).toBeGreaterThan(badAfter.biomass.total)
        })
    })

    // ── Stress & health (_updateHealthAndStress) ──────────────────────────────

    describe('stress accumulation', () => {
        it('extreme pH raises stress and lowers health over time', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            plant.medium.ph = 9.0 // extreme pH
            const after = simulate(plant, 7)
            expect(after.stressLevel).toBeGreaterThan(0)
            expect(after.health).toBeLessThan(100)
        })

        it('good conditions keep health at 100 over short run', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            // 20°C / 70% RH → corrected RH 69% (Soil/Fabric −1) → leaf 22.2°C
            // VPD ≈ 1.06 kPa — solidly inside vegetative window (0.8–1.2 kPa)
            plant.environment.internalTemperature = 20
            plant.environment.internalHumidity = 70
            plant.medium.ph = 6.2   // ideal for vegetative
            plant.medium.ec = 1.0   // within 0.8–1.5
            plant.medium.moisture = 70
            plant.medium.substrateWater = 1500
            plant.nutrientPool = { nitrogen: 50, phosphorus: 50, potassium: 50 }
            // Re-apply corrections so environment.vpd reflects the adjusted settings
            const corrected = plantSimulationService.applyEnvironmentalCorrections(plant)
            corrected.lastUpdated = Date.now()
            const after = simulate(corrected, 3)
            expect(after.health).toBe(100)
        })
    })

    // ── Stage progression (_checkForEvents) ───────────────────────────────────

    describe('stage progression', () => {
        it('advances from Seedling to Vegetative after enough days', () => {
            // Seed=1, Germination=3, Seedling=14 → cumulative 18 days
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Seedling
            plant.age = 17 // one day before threshold
            const after = simulate(plant, 2)
            expect(after.stage).toBe(PlantStage.Vegetative)
        })

        it('photoperiod plant does NOT enter flowering at 18h light', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            plant.age = 45 // past vegetative threshold
            plant.equipment.light.lightHours = 18 // long day
            const after = simulate(plant, 2)
            expect(after.stage).toBe(PlantStage.Vegetative)
        })

        it('photoperiod plant enters flowering when light switches to 12h', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            plant.age = 45
            plant.equipment.light.lightHours = 12 // flip to 12/12
            const after = simulate(plant, 2)
            expect(after.stage).toBe(PlantStage.Flowering)
        })
    })

    describe('sub-day accumulation', () => {
        it('preserves fractional elapsed time across realtime catch-up runs', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            const halfDayMs = daysMs(0.5)

            const first = plantSimulationService.calculateStateForTimeDelta(plant, halfDayMs).updatedPlant
            expect(first.age).toBe(0)
            expect(first.simulationClock.accumulatedDayMs).toBe(halfDayMs)

            const second = plantSimulationService.calculateStateForTimeDelta(first, halfDayMs).updatedPlant
            expect(second.age).toBe(1)
            expect(second.simulationClock.accumulatedDayMs).toBe(0)
        })
    })

    // ── Training actions ──────────────────────────────────────────────────────

    describe('topPlant()', () => {
        it('doubles branch count in vegetative stage', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            const before = plant.structuralModel.branches
            const { updatedPlant } = plantSimulationService.topPlant(plant)
            expect(updatedPlant.structuralModel.branches).toBe(before * 2)
        })

        it('increases stress after topping', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            const { updatedPlant } = plantSimulationService.topPlant(plant)
            expect(updatedPlant.stressLevel).toBeGreaterThan(plant.stressLevel)
        })

        it('does nothing outside vegetative stage', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Flowering
            const before = plant.structuralModel.branches
            const { updatedPlant } = plantSimulationService.topPlant(plant)
            expect(updatedPlant.structuralModel.branches).toBe(before)
        })

        it('does not mutate the input plant', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            const beforeBranches = plant.structuralModel.branches
            plantSimulationService.topPlant(plant)
            expect(plant.structuralModel.branches).toBe(beforeBranches)
        })
    })

    describe('applyLst()', () => {
        it('increments lstApplied in vegetative stage', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            const { updatedPlant } = plantSimulationService.applyLst(plant)
            expect(updatedPlant.lstApplied).toBe(1)
        })

        it('adds minor stress after LST', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            const { updatedPlant } = plantSimulationService.applyLst(plant)
            expect(updatedPlant.stressLevel).toBeGreaterThan(plant.stressLevel)
        })
    })

    // ── Cannabinoid synthesis (_runDailySynthesis) ────────────────────────────

    describe('cannabinoid synthesis', () => {
        it('THC accumulates in flowering stage with healthy flowers', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Flowering
            plant.age = 25
            plant.biomass.flowers = 5
            plant.health = 100
            plant.stressLevel = 0
            const after = simulate(plant, 14)
            expect(after.cannabinoidProfile.thc).toBeGreaterThan(0)
        })

        it('no cannabinoid production in vegetative stage', () => {
            const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Testy')
            plant.stage = PlantStage.Vegetative
            plant.biomass.flowers = 0
            const after = simulate(plant, 7)
            expect(after.cannabinoidProfile.thc).toBe(0)
            expect(after.cannabinoidProfile.cbd).toBe(0)
        })
    })
})
