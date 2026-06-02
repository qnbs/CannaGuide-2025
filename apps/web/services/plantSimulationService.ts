import { Plant, PlantStage, GrowSetup, Strain, JournalEntry, Task } from '@/types'
import { DEFAULT_GROW_ID } from '@/constants'
import { calculateVPD as calculateScientificVPD } from '@/lib/vpd/calculator'
import { PLANT_STAGE_DETAILS } from '@/services/simulation/plantStageDetails'
import {
    simulateOnePlantDay,
    type DailySimulationDeps,
} from '@/services/simulation/dailySimulationLoop'
import {
    getSimulationProfileCurve,
    SIM_MILLISECONDS_PER_DAY,
    type SimulationSettings,
} from '@/services/simulation/simulationProfiles'
import { simClamp } from '@/services/simulation/simulationMath'
import type { SimulationDiagnostics } from '@/services/simulation/simulationDiagnosticsTypes'
import {
    advancePostHarvestState as runPostHarvestAdvance,
    createInitialHarvestData,
} from '@/services/simulation/postHarvestSimulation'
import { normalizePlant } from '@/services/simulation/plantNormalization'
import {
    getCorrectedRh,
    getEnvironmentalInstabilityCurve,
    getNutrientSensitivityCurve,
    getPestPressureCurve,
    getPestPressureMultiplier,
    getSimulationAltitude,
    getSimulationLeafTemperatureOffset,
    getSimulationLightExtinctionCoefficient,
    getSimulationNutrientConversionEfficiency,
    getSimulationStomataSensitivity,
} from '@/services/simulation/simulationEnvironmentHelpers'

export { PLANT_STAGE_DETAILS } from '@/services/simulation/plantStageDetails'
export { vpdService } from '@/services/simulation/vpdSimulationService'
export type { SimulationDiagnostics } from '@/services/simulation/simulationDiagnosticsTypes'

class PlantSimulationService {
    private readonly dailySimulationDeps: DailySimulationDeps = {
        clonePlant: (plant) => this.clonePlant(plant),
        applyEnvironmentalCorrections: (plant, settings) =>
            this.applyEnvironmentalCorrections(plant, settings),
    }

    ensurePostHarvestData(plant: Plant): Plant {
        const p = normalizePlant(this.clonePlant(plant))
        if (
            ![
                PlantStage.Harvest,
                PlantStage.Drying,
                PlantStage.Curing,
                PlantStage.Finished,
            ].includes(p.stage)
        ) {
            return p
        }
        if (!p.harvestData) {
            p.harvestData = createInitialHarvestData(p)
        }
        return p
    }

    advancePostHarvestState(
        plant: Plant,
        action: 'dry' | 'burp' | 'cure',
        simulationSettings?: SimulationSettings | undefined,
    ): { updatedPlant: Plant; newJournalEntries: JournalEntry[] } {
        const p = this.ensurePostHarvestData(plant)
        return runPostHarvestAdvance(p, action, simulationSettings)
    }

    getSimulationDiagnostics(
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ): SimulationDiagnostics {
        const p = this.applyEnvironmentalCorrections(
            this.ensurePostHarvestData(plant),
            simulationSettings,
        )
        const ideal = PLANT_STAGE_DETAILS[p.stage].idealVitals
        const correctedRh = getCorrectedRh(p)
        const leafOffset = getSimulationLeafTemperatureOffset(p, simulationSettings)
        const altitudeM = getSimulationAltitude(simulationSettings)
        const lightAbsorption =
            1 -
            Math.exp(
                -getSimulationLightExtinctionCoefficient(simulationSettings) *
                    p.leafAreaIndex,
            )
        const nutrientAvailability =
            (p.nutrientPool.nitrogen + p.nutrientPool.phosphorus + p.nutrientPool.potassium) *
            getSimulationNutrientConversionEfficiency(simulationSettings)
        const co2Factor = simClamp(p.environment.co2Level / 400, 0.5, 2)
        const profileCurve = getSimulationProfileCurve(simulationSettings)
        const dominantFactors: SimulationDiagnostics['dominantFactors'] = [
            {
                id: 'vpd',
                value: `${p.environment.vpd.toFixed(2)} kPa`,
                tone:
                    p.environment.vpd < ideal.vpd.min || p.environment.vpd > ideal.vpd.max
                        ? 'critical'
                        : 'good',
                context: {
                    min: ideal.vpd.min.toFixed(1),
                    max: ideal.vpd.max.toFixed(1),
                },
            },
            {
                id: 'lightCapture',
                value: `${(lightAbsorption * 100).toFixed(0)}%`,
                tone: lightAbsorption < 0.55 ? 'warn' : 'good',
                context: {
                    k: getSimulationLightExtinctionCoefficient(simulationSettings).toFixed(2),
                    lai: p.leafAreaIndex.toFixed(2),
                },
            },
            {
                id: 'nutrientThroughput',
                value: nutrientAvailability.toFixed(2),
                tone: nutrientAvailability < 5 ? 'warn' : 'good',
                context: {
                    sensitivity: getNutrientSensitivityCurve(simulationSettings).toFixed(2),
                },
            },
            {
                id: 'pestPressure',
                value: `${getPestPressureMultiplier(simulationSettings).toFixed(2)}x`,
                tone:
                    getPestPressureMultiplier(simulationSettings) > 1.8 ? 'critical' : 'warn',
                context: {
                    profile: profileCurve.pestPressure.toFixed(2),
                },
            },
        ]

        return {
            profile: {
                name: simulationSettings?.simulationProfile ?? 'intermediate',
                environmentStress: profileCurve.environmentStress,
                nutrientStress: profileCurve.nutrientStress,
                pestPressure: profileCurve.pestPressure,
                postHarvestPrecision: profileCurve.postHarvestPrecision,
            },
            environment: {
                temperature: p.environment.internalTemperature,
                humidity: p.environment.internalHumidity,
                correctedRh,
                vpd: p.environment.vpd,
                targetMin: ideal.vpd.min,
                targetMax: ideal.vpd.max,
                leafOffset,
                altitudeM,
            },
            growth: {
                lightAbsorption,
                co2Factor,
                nutrientAvailability,
                nutrientConversionEfficiency:
                    getSimulationNutrientConversionEfficiency(simulationSettings),
                lightExtinctionCoefficient:
                    getSimulationLightExtinctionCoefficient(simulationSettings),
                stomataSensitivity: getSimulationStomataSensitivity(p, simulationSettings),
            },
            stress: {
                environmentalInstability:
                    getEnvironmentalInstabilityCurve(simulationSettings),
                nutrientSensitivityCurve: getNutrientSensitivityCurve(simulationSettings),
                pestPressureCurve: getPestPressureCurve(simulationSettings),
                accumulatedSubdayHours: p.simulationClock.accumulatedDayMs / 3600000,
            },
            dominantFactors,
            postHarvest: p.harvestData
                ? {
                      stage: p.stage,
                      jarHumidity: p.harvestData.jarHumidity,
                      chlorophyllPercent: p.harvestData.chlorophyllPercent,
                      terpeneRetentionPercent: p.harvestData.terpeneRetentionPercent,
                      moldRiskPercent: p.harvestData.moldRiskPercent,
                      finalQuality: p.harvestData.finalQuality,
                      burpDebtDays: Math.max(
                          0,
                          p.harvestData.currentCureDay - p.harvestData.lastBurpDay - 1,
                      ),
                  }
                : undefined,
        }
    }

    applyEnvironmentalCorrections(
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ): Plant {
        const p = normalizePlant(this.clonePlant(plant))
        const correctedRh = getCorrectedRh(p)
        const leafOffset = getSimulationLeafTemperatureOffset(p, simulationSettings)
        p.environment.vpd = this._calculateVPD(
            p.environment.internalTemperature,
            correctedRh,
            leafOffset,
            getSimulationAltitude(simulationSettings),
        )
        return p
    }

    createPlant(strain: Strain, setup: GrowSetup, name: string): Plant {
        const now = Date.now()
        const waterHoldingCapacity =
            setup.potSize * 1000 * (setup.potType === 'Fabric' ? 0.28 : 0.35)
        const newPlant: Plant = {
            id: `plant-${now}`,
            growId: DEFAULT_GROW_ID,
            name,
            strain,
            mediumType: setup.medium,
            createdAt: now,
            lastUpdated: now,
            age: 0,
            stage: PlantStage.Seed,
            health: 100,
            stressLevel: 0,
            height: 0,
            biomass: { total: 0.01, stem: 0.01, leaves: 0, flowers: 0 },
            leafAreaIndex: 0.01,
            isTopped: false,
            lstApplied: 0,
            environment: {
                internalTemperature: 24,
                internalHumidity: 65,
                vpd: 0,
                co2Level: 400,
            },
            medium: {
                ph: 6.5,
                ec: 0.8,
                moisture: 100,
                microbeHealth: 80,
                substrateWater: waterHoldingCapacity,
                nutrientConcentration: { nitrogen: 100, phosphorus: 100, potassium: 100 },
            },
            nutrientPool: { nitrogen: 5, phosphorus: 5, potassium: 5 },
            rootSystem: { health: 100, rootMass: 0.01 },
            equipment: {
                light: {
                    type: setup.lightType,
                    wattage: setup.lightWattage,
                    isOn: true,
                    lightHours: setup.lightHours,
                },
                exhaustFan: {
                    power: setup.ventilation,
                    isOn: true,
                },
                circulationFan: {
                    isOn: setup.hasCirculationFan,
                },
                potSize: setup.potSize,
                potType: setup.potType,
            },
            problems: [],
            journal: [],
            tasks: [],
            harvestData: null,
            structuralModel: { branches: 1, nodes: 1 },
            // Copy strain defaults as starting phenotype; can be tuned per-plant via training or amendments
            phenotypeModifiers: { ...strain.geneticModifiers },
            history: [
                {
                    day: 0,
                    health: 100,
                    height: 0,
                    stressLevel: 0,
                    medium: { ph: 6.5, ec: 0.8, moisture: 100 },
                },
            ],
            cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
            terpeneProfile: {},
            stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
            simulationClock: { accumulatedDayMs: 0 },
        }

        return this.applyEnvironmentalCorrections(newPlant)
    }

    calculateStateForTimeDelta(
        plant: Plant,
        deltaTime: number,
        simulationSettings?: SimulationSettings | undefined,
    ): { updatedPlant: Plant; newJournalEntries: JournalEntry[]; newTasks: Task[] } {
        let updatedPlant = normalizePlant(this.clonePlant(plant))
        const newJournalEntries: JournalEntry[] = []
        const newTasks: Task[] = []
        const safeDeltaTime = Math.max(0, Number.isFinite(deltaTime) ? deltaTime : 0)
        const nextTimestamp = updatedPlant.lastUpdated + safeDeltaTime
        const totalMillisToSimulate = updatedPlant.simulationClock.accumulatedDayMs + safeDeltaTime
        const daysToSimulate = Math.floor(totalMillisToSimulate / SIM_MILLISECONDS_PER_DAY)

        updatedPlant.simulationClock.accumulatedDayMs =
            totalMillisToSimulate % SIM_MILLISECONDS_PER_DAY

        if (daysToSimulate < 1) {
            updatedPlant.lastUpdated = nextTimestamp
            return { updatedPlant, newJournalEntries, newTasks }
        }

        for (let i = 0; i < daysToSimulate; i++) {
            updatedPlant.age += 1

            const dayResult = simulateOnePlantDay(
                updatedPlant,
                simulationSettings,
                this.dailySimulationDeps,
            )
            updatedPlant = dayResult.plant
            newJournalEntries.push(...dayResult.journalEntries)
            newTasks.push(...dayResult.tasks)

            updatedPlant.history.push({
                day: updatedPlant.age,
                height: updatedPlant.height,
                health: updatedPlant.health,
                stressLevel: updatedPlant.stressLevel,
                medium: {
                    ph: updatedPlant.medium.ph,
                    ec: updatedPlant.medium.ec,
                    moisture: updatedPlant.medium.moisture,
                },
            })
        }

        updatedPlant.lastUpdated = nextTimestamp
        return { updatedPlant, newJournalEntries, newTasks }
    }

    private _calculateVPD(
        tempC: number,
        rh: number,
        leafTempOffset: number,
        altitudeM = 0,
    ): number {
        return calculateScientificVPD(tempC, rh, leafTempOffset, altitudeM)
    }

    clonePlant(plant: Plant): Plant {
        if (typeof structuredClone === 'function') {
            return structuredClone(plant)
        }

        return JSON.parse(JSON.stringify(plant))
    }

    topPlant(plant: Plant): { updatedPlant: Plant } {
        const p = this.clonePlant(plant)
        if (p.stage === PlantStage.Vegetative && !p.isTopped) {
            p.isTopped = true
            p.structuralModel.branches *= 2
            p.stressLevel = Math.min(100, plant.stressLevel + 25)
        }
        return { updatedPlant: p }
    }

    applyLst(plant: Plant): { updatedPlant: Plant } {
        const p = this.clonePlant(plant)
        if (p.stage === PlantStage.Vegetative) {
            p.lstApplied += 1
            p.stressLevel = Math.min(100, plant.stressLevel + 5)
        }
        return { updatedPlant: p }
    }
}

export const plantSimulationService = new PlantSimulationService()
