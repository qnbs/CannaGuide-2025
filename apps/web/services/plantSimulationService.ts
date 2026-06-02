import {
    Plant,
    PlantStage,
    GrowSetup,
    Strain,
    JournalEntry,
    Task,
    ProblemType,
    JournalEntryType,
} from '@/types'
import {
    STAGES_ORDER,
    SIM_PAR_PER_WATT_LED,
    DEFAULT_GROW_ID,
} from '@/constants'
import { calculateVPD as calculateScientificVPD } from '@/lib/vpd/calculator'
import { secureRandom } from '@/utils/random'
import { PLANT_STAGE_DETAILS } from '@/services/simulation/plantStageDetails'
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
import {
    normalizePlant,
    getPlantGeneticModifiers,
} from '@/services/simulation/plantNormalization'
import {
    applyDailyEnvironmentalDrift,
    getCorrectedRh,
    getEnvironmentalInstabilityCurve,
    getEnvironmentalStressMultiplier,
    getNutrientSensitivityCurve,
    getNutrientStressMultiplier,
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

            updatedPlant = this._runDailyEcosystem(updatedPlant, simulationSettings)
            updatedPlant = this._runDailyMetabolism(updatedPlant, simulationSettings)
            updatedPlant = this._runDailyGrowth(updatedPlant, simulationSettings)
            updatedPlant = this._runDailySynthesis(updatedPlant)
            updatedPlant = this._updateHealthAndStress(updatedPlant, simulationSettings)

            const {
                plant: p,
                journalEntries: j,
                tasks: t,
            } = this._checkForEvents(updatedPlant, simulationSettings)
            updatedPlant = p
            newJournalEntries.push(...j)
            newTasks.push(...t)

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

    private _runDailyEcosystem(
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ): Plant {
        const p = applyDailyEnvironmentalDrift(this.clonePlant(plant), simulationSettings)

        // Exhaust fan replenishes CO2 toward ambient (400 ppm).
        // With poor or disabled ventilation, photosynthesis steadily depletes CO2.
        const co2RefreshRate: Record<string, number> = { high: 0.9, medium: 0.7, low: 0.4 }
        const fanRefreshRate = p.equipment.exhaustFan.isOn
            ? (co2RefreshRate[p.equipment.exhaustFan.power] ?? 0.7)
            : 0.1
        const stabilityFactor = simulationSettings
            ? simClamp(simulationSettings.environmentalStability, 0.4, 1.2)
            : 1
        const ambientCo2 = 400
        const co2Consumption = p.equipment.light.isOn ? p.biomass.leaves * 8 : 0
        const co2After = p.environment.co2Level - co2Consumption
        p.environment.co2Level = simClamp(
            co2After + (ambientCo2 - co2After) * fanRefreshRate * stabilityFactor,
            200,
            1500,
        )

        return p
    }

    private _runDailyMetabolism(
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ): Plant {
        const p = this.clonePlant(plant)

        p.environment = this.applyEnvironmentalCorrections(p, simulationSettings).environment

        const mods = getPlantGeneticModifiers(p)
        const vpd = p.environment.vpd
        const vpdOptimum = (mods.vpdTolerance.min + mods.vpdTolerance.max) / 2
        const stomataSensitivity = getSimulationStomataSensitivity(p, simulationSettings)
        const vpdStressFactor = simClamp(
            1 - Math.abs(vpd - vpdOptimum) * stomataSensitivity,
            0.1,
            1,
        )
        const transpirationRate = p.biomass.leaves * mods.transpirationFactor * vpdStressFactor

        const waterUsed = Math.min(p.medium.substrateWater, transpirationRate * 100)
        p.medium.substrateWater -= waterUsed
        const waterCapacity =
            p.equipment.potSize * 1000 * (p.equipment.potType === 'Fabric' ? 0.28 : 0.35)
        p.medium.moisture = (p.medium.substrateWater / waterCapacity) * 100

        // pH lockout: nutrient availability is reduced when pH deviates beyond the ideal window
        const idealPh = PLANT_STAGE_DETAILS[p.stage].idealVitals.ph
        const phOptimal = (idealPh.min + idealPh.max) / 2
        const phHalfRange = Math.max(0.01, (idealPh.max - idealPh.min) / 2)
        const phDeviation = Math.max(0, Math.abs(p.medium.ph - phOptimal) - phHalfRange)
        const phLockoutFactor = simClamp(1.0 - (phDeviation / phHalfRange) * 0.8, 0.2, 1.0)

        const uptakeFactor = mods.nutrientUptakeRate * (p.rootSystem.health / 100)
        const nutrientDemand = (p.biomass.total + p.rootSystem.rootMass) * 0.05
        const availableNutrients = waterUsed * p.medium.ec * uptakeFactor * phLockoutFactor

        const nutrientsTaken = Math.min(nutrientDemand, availableNutrients)
        if (nutrientsTaken > 0) {
            const ratio = PLANT_STAGE_DETAILS[p.stage].nutrientRatio
            const totalRatio = ratio.n + ratio.p + ratio.k
            p.nutrientPool.nitrogen += nutrientsTaken * (ratio.n / totalRatio)
            p.nutrientPool.phosphorus += nutrientsTaken * (ratio.p / totalRatio)
            p.nutrientPool.potassium += nutrientsTaken * (ratio.k / totalRatio)
        }

        return p
    }

    private _runDailyGrowth(
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ): Plant {
        const p = this.clonePlant(plant)
        const nutrientConversionEfficiency =
            getSimulationNutrientConversionEfficiency(simulationSettings)
        const lightExtinctionCoefficient =
            getSimulationLightExtinctionCoefficient(simulationSettings)

        const parEfficiency =
            p.equipment.light.type === 'LED' ? SIM_PAR_PER_WATT_LED : SIM_PAR_PER_WATT_LED * 0.8
        const dailyLightIntegral =
            (p.equipment.light.wattage * parEfficiency * p.equipment.light.lightHours * 3600) /
            1000000
        const lightAbsorbed = 1 - Math.exp(-lightExtinctionCoefficient * p.leafAreaIndex)
        // CO2 enrichment factor: 1.0 at ambient 400 ppm, scales proportionally, capped at 2.0×
        const co2Factor = simClamp(p.environment.co2Level / 400, 0.5, 2.0)
        const potentialBiomassGain =
            (dailyLightIntegral / 4) * lightAbsorbed * getPlantGeneticModifiers(p).rue * co2Factor

        const nutrientSupply =
            (p.nutrientPool.nitrogen + p.nutrientPool.phosphorus + p.nutrientPool.potassium) *
            nutrientConversionEfficiency
        const actualBiomassGain = Math.min(potentialBiomassGain, nutrientSupply) * (p.health / 100)

        const partition = PLANT_STAGE_DETAILS[p.stage].biomassPartitioning
        const gainedRoots = actualBiomassGain * partition.roots
        const gainedStem = actualBiomassGain * partition.stem
        const gainedLeaves = actualBiomassGain * partition.leaves
        const gainedFlowers = actualBiomassGain * partition.flowers

        p.rootSystem.rootMass += gainedRoots
        p.biomass.stem += gainedStem
        p.biomass.leaves += gainedLeaves
        p.biomass.flowers += gainedFlowers
        p.biomass.total = p.biomass.stem + p.biomass.leaves + p.biomass.flowers

        p.height = p.biomass.stem * 20
        p.leafAreaIndex = p.biomass.leaves * 0.05

        const consumedNutrients = actualBiomassGain / nutrientConversionEfficiency
        const ratio = PLANT_STAGE_DETAILS[p.stage].nutrientRatio
        const totalRatio = ratio.n + ratio.p + ratio.k
        if (totalRatio > 0) {
            p.nutrientPool.nitrogen = Math.max(
                0,
                p.nutrientPool.nitrogen - consumedNutrients * (ratio.n / totalRatio),
            )
            p.nutrientPool.phosphorus = Math.max(
                0,
                p.nutrientPool.phosphorus - consumedNutrients * (ratio.p / totalRatio),
            )
            p.nutrientPool.potassium = Math.max(
                0,
                p.nutrientPool.potassium - consumedNutrients * (ratio.k / totalRatio),
            )
        }

        return p
    }

    private _runDailySynthesis(plant: Plant): Plant {
        const p = this.clonePlant(plant)

        if (p.stage !== PlantStage.Flowering) {
            return p
        }

        const productionFactor = 0.02 * (p.health / 100) * (1 - p.stressLevel / 150)
        const newCannabinoids = p.biomass.flowers * productionFactor

        if (newCannabinoids > 0) {
            const thcToCbdRatio = p.strain.thc / (p.strain.cbd + 0.1)
            p.cannabinoidProfile.thc += newCannabinoids * (thcToCbdRatio / (thcToCbdRatio + 1))
            p.cannabinoidProfile.cbd += newCannabinoids * (1 / (thcToCbdRatio + 1))
        }

        if (p.strain.dominantTerpenes && p.strain.dominantTerpenes.length > 0) {
            const newTerpenes = p.biomass.flowers * (productionFactor * 0.2)
            const terpeneCount = p.strain.dominantTerpenes.length
            const blockedTerpeneKeys = new Set(['__proto__', 'constructor', 'prototype'])
            const nextTerpeneProfile = new Map<string, number>(Object.entries(p.terpeneProfile))
            p.strain.dominantTerpenes.forEach((terpName) => {
                if (blockedTerpeneKeys.has(terpName)) {
                    return
                }
                const currentTerpeneAmount = nextTerpeneProfile.get(terpName) ?? 0
                nextTerpeneProfile.set(terpName, currentTerpeneAmount + newTerpenes / terpeneCount)
            })
            p.terpeneProfile = Object.fromEntries(nextTerpeneProfile)
        }

        return p
    }

    private _updateHealthAndStress(
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ): Plant {
        const p = this.clonePlant(plant)
        const ideal = PLANT_STAGE_DETAILS[p.stage].idealVitals
        const envMult = getEnvironmentalStressMultiplier(simulationSettings)
        const nutMult = getNutrientStressMultiplier(simulationSettings)

        const stressChecks: ReadonlyArray<{
            key: keyof typeof p.stressCounters
            outOfRange: boolean
            penalty: number
        }> = [
            {
                key: 'vpd',
                outOfRange: p.environment.vpd < ideal.vpd.min || p.environment.vpd > ideal.vpd.max,
                penalty: 10 * envMult,
            },
            {
                key: 'ph',
                outOfRange: p.medium.ph < ideal.ph.min || p.medium.ph > ideal.ph.max,
                penalty: 15 * nutMult,
            },
            {
                key: 'ec',
                outOfRange: p.medium.ec < ideal.ec.min || p.medium.ec > ideal.ec.max,
                penalty: 10 * nutMult,
            },
            {
                key: 'moisture',
                outOfRange: p.medium.moisture < 20 || p.medium.moisture > 98,
                penalty: p.medium.moisture < 20 ? 20 : 5,
            },
        ]

        let stress = 0
        for (const { key, outOfRange, penalty } of stressChecks) {
            if (outOfRange) {
                stress += penalty
                p.stressCounters[key] = (p.stressCounters[key] ?? 0) + 1
            } else {
                p.stressCounters[key] = 0
            }
        }

        p.stressLevel = Math.min(100, p.stressLevel * 0.8 + stress)
        p.health = Math.max(0, 100 - p.stressLevel)

        return p
    }

    private _shouldEvaluateStageProgression(stage: PlantStage, currentStageIndex: number): boolean {
        return (
            currentStageIndex < STAGES_ORDER.length - 1 &&
            ![
                PlantStage.Harvest,
                PlantStage.Drying,
                PlantStage.Curing,
                PlantStage.Finished,
            ].includes(stage)
        )
    }

    private _applyStageProgression(p: Plant): void {
        const currentStageIndex = STAGES_ORDER.indexOf(p.stage)
        if (!this._shouldEvaluateStageProgression(p.stage, currentStageIndex)) {
            return
        }

        let cumulativeDuration = 0
        for (let i = 0; i <= currentStageIndex; i++) {
            cumulativeDuration += PLANT_STAGE_DETAILS[STAGES_ORDER[i]!]!.duration
        }

        const nextStage = STAGES_ORDER[currentStageIndex + 1]!
        const isPhotoperiodBlockedFlowerTransition =
            nextStage === PlantStage.Flowering &&
            p.strain.floweringType === 'Photoperiod' &&
            p.equipment.light.lightHours > 12

        if (!isPhotoperiodBlockedFlowerTransition && p.age >= cumulativeDuration) {
            p.stage = nextStage
        }
    }

    private _createStageChangeEntry(from: PlantStage, to: PlantStage): JournalEntry {
        return {
            id: '',
            createdAt: 0,
            type: JournalEntryType.System,
            notes: `Stage changed from ${from} to ${to}`,
            details: { from, to },
        }
    }

    private _createWaterTaskIfNeeded(p: Plant): Task | null {
        const hasWaterTask = p.tasks.some((task) => task.title === 'Task: Water Plant')
        if (p.medium.moisture >= 30 || hasWaterTask) {
            return null
        }

        return {
            id: `task-water-${p.id}`,
            title: 'Task: Water Plant',
            description: `${p.name} is thirsty!`,
            isCompleted: false,
            createdAt: Date.now(),
            priority: 'high',
        }
    }

    private _hasActiveProblem(p: Plant, type: ProblemType): boolean {
        return p.problems.some((problem) => problem.type === type && problem.status === 'active')
    }

    private _tryAddPestProblem(p: Plant, pestPressureMultiplier: number): void {
        if (p.stressCounters.vpd <= 3 || this._hasActiveProblem(p, ProblemType.PestInfestation)) {
            return
        }

        const vpdStressChance =
            ((p.stressCounters.vpd - 3) * 0.05 * pestPressureMultiplier) /
            getPlantGeneticModifiers(p).pestResistance
        if (secureRandom() < vpdStressChance) {
            p.problems.push({
                type: ProblemType.PestInfestation,
                severity: 1,
                onsetDay: p.age,
                status: 'active',
            })
            p.stressCounters.vpd = 0
        }
    }

    private _tryAddNutrientProblem(p: Plant, nutrientStressMultiplier: number): void {
        if (
            (p.stressCounters.ph <= 3 && p.stressCounters.ec <= 3) ||
            this._hasActiveProblem(p, ProblemType.NutrientDeficiency)
        ) {
            return
        }

        const nutrientStressChance =
            ((p.stressCounters.ph + p.stressCounters.ec - 3) * 0.04 * nutrientStressMultiplier) /
            getPlantGeneticModifiers(p).stressTolerance

        if (secureRandom() < nutrientStressChance) {
            p.problems.push({
                type: ProblemType.NutrientDeficiency,
                severity: 1,
                onsetDay: p.age,
                status: 'active',
            })
            p.stressCounters.ph = 0
            p.stressCounters.ec = 0
        }
    }

    private _tryAddMoistureProblem(p: Plant): void {
        if (
            p.stressCounters.moisture > 2 &&
            !this._hasActiveProblem(p, ProblemType.Underwatering) &&
            p.medium.moisture < 20
        ) {
            p.problems.push({
                type: ProblemType.Underwatering,
                severity: 1,
                onsetDay: p.age,
                status: 'active',
            })
            p.stressCounters.moisture = 0
            return
        }

        if (
            p.stressCounters.moisture > 4 &&
            !this._hasActiveProblem(p, ProblemType.Overwatering) &&
            p.medium.moisture > 95
        ) {
            p.problems.push({
                type: ProblemType.Overwatering,
                severity: 1,
                onsetDay: p.age,
                status: 'active',
            })
            p.stressCounters.moisture = 0
        }
    }

    private _checkForEvents(
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ): { plant: Plant; journalEntries: JournalEntry[]; tasks: Task[] } {
        const p = this.clonePlant(plant)
        const journalEntries: JournalEntry[] = []
        const newTasks: Task[] = []
        const originalStage = p.stage
        const pestPressureMultiplier = getPestPressureMultiplier(simulationSettings)
        const nutrientStressMultiplier = getNutrientStressMultiplier(simulationSettings)

        this._applyStageProgression(p)

        if (p.stage !== originalStage) {
            if (p.stage === PlantStage.Harvest && !p.harvestData) {
                p.harvestData = createInitialHarvestData(p)
            }
            journalEntries.push(this._createStageChangeEntry(originalStage, p.stage))
        }

        const waterTask = this._createWaterTaskIfNeeded(p)
        if (waterTask) {
            newTasks.push(waterTask)
        }

        this._tryAddPestProblem(p, pestPressureMultiplier)
        this._tryAddNutrientProblem(p, nutrientStressMultiplier)
        this._tryAddMoistureProblem(p)

        return { plant: p, journalEntries, tasks: newTasks }
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
