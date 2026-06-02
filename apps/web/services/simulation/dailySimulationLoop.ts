import {
    Plant,
    PlantStage,
    JournalEntry,
    JournalEntryType,
    Task,
    ProblemType,
} from '@/types'
import { STAGES_ORDER, SIM_PAR_PER_WATT_LED } from '@/constants'
import { secureRandom } from '@/utils/random'
import { PLANT_STAGE_DETAILS } from '@/services/simulation/plantStageDetails'
import type { SimulationSettings } from '@/services/simulation/simulationProfiles'
import { simClamp } from '@/services/simulation/simulationMath'
import { getPlantGeneticModifiers } from '@/services/simulation/plantNormalization'
import {
    applyDailyEnvironmentalDrift,
    getEnvironmentalStressMultiplier,
    getNutrientStressMultiplier,
    getPestPressureMultiplier,
    getSimulationLightExtinctionCoefficient,
    getSimulationNutrientConversionEfficiency,
    getSimulationStomataSensitivity,
} from '@/services/simulation/simulationEnvironmentHelpers'
import { createInitialHarvestData } from '@/services/simulation/postHarvestSimulation'
import { getT } from '@/i18n'

const WATER_TASK_ID_PREFIX = 'task-water-'

export type DailySimulationDeps = {
    clonePlant: (plant: Plant) => Plant
    applyEnvironmentalCorrections: (
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ) => Plant
}

export function runDailyEcosystem(
    plant: Plant,
    simulationSettings: SimulationSettings | undefined,
    deps: DailySimulationDeps,
): Plant {
    const p = applyDailyEnvironmentalDrift(deps.clonePlant(plant), simulationSettings)

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

export function runDailyMetabolism(
    plant: Plant,
    simulationSettings: SimulationSettings | undefined,
    deps: DailySimulationDeps,
): Plant {
    const p = deps.clonePlant(plant)

    p.environment = deps.applyEnvironmentalCorrections(p, simulationSettings).environment

    const mods = getPlantGeneticModifiers(p)
    const vpd = p.environment.vpd
    const vpdOptimum = (mods.vpdTolerance.min + mods.vpdTolerance.max) / 2
    const stomataSensitivity = getSimulationStomataSensitivity(p, simulationSettings)
    const vpdStressFactor = simClamp(1 - Math.abs(vpd - vpdOptimum) * stomataSensitivity, 0.1, 1)
    const transpirationRate = p.biomass.leaves * mods.transpirationFactor * vpdStressFactor

    const waterUsed = Math.min(p.medium.substrateWater, transpirationRate * 100)
    p.medium.substrateWater -= waterUsed
    const waterCapacity =
        p.equipment.potSize * 1000 * (p.equipment.potType === 'Fabric' ? 0.28 : 0.35)
    p.medium.moisture = (p.medium.substrateWater / waterCapacity) * 100

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

export function runDailyGrowth(
    plant: Plant,
    simulationSettings: SimulationSettings | undefined,
    deps: DailySimulationDeps,
): Plant {
    const p = deps.clonePlant(plant)
    const nutrientConversionEfficiency =
        getSimulationNutrientConversionEfficiency(simulationSettings)
    const lightExtinctionCoefficient = getSimulationLightExtinctionCoefficient(simulationSettings)

    const parEfficiency =
        p.equipment.light.type === 'LED' ? SIM_PAR_PER_WATT_LED : SIM_PAR_PER_WATT_LED * 0.8
    const dailyLightIntegral =
        (p.equipment.light.wattage * parEfficiency * p.equipment.light.lightHours * 3600) /
        1000000
    const lightAbsorbed = 1 - Math.exp(-lightExtinctionCoefficient * p.leafAreaIndex)
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

export function runDailySynthesis(plant: Plant, deps: DailySimulationDeps): Plant {
    const p = deps.clonePlant(plant)

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

export function updateHealthAndStress(
    plant: Plant,
    simulationSettings: SimulationSettings | undefined,
    deps: DailySimulationDeps,
): Plant {
    const p = deps.clonePlant(plant)
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

function shouldEvaluateStageProgression(stage: PlantStage, currentStageIndex: number): boolean {
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

function applyStageProgression(p: Plant): void {
    const currentStageIndex = STAGES_ORDER.indexOf(p.stage)
    if (!shouldEvaluateStageProgression(p.stage, currentStageIndex)) {
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

function stageDisplayName(stage: PlantStage): string {
    return getT()(`plantStages.${stage}`)
}

function createStageChangeEntry(from: PlantStage, to: PlantStage): JournalEntry {
    const t = getT()
    return {
        id: '',
        createdAt: 0,
        type: JournalEntryType.System,
        notes: t('plantsView.dailySimulation.stageChangeJournal', {
            from: stageDisplayName(from),
            to: stageDisplayName(to),
        }),
        details: { from, to },
    }
}

function createWaterTaskIfNeeded(p: Plant): Task | null {
    const t = getT()
    const waterTaskId = `${WATER_TASK_ID_PREFIX}${p.id}`
    const hasWaterTask = p.tasks.some((task) => task.id === waterTaskId)
    if (p.medium.moisture >= 30 || hasWaterTask) {
        return null
    }

    return {
        id: waterTaskId,
        title: t('plantsView.dailySimulation.waterTaskTitle'),
        description: t('plantsView.dailySimulation.waterTaskDescription', { name: p.name }),
        isCompleted: false,
        createdAt: Date.now(),
        priority: 'high',
    }
}

function hasActiveProblem(p: Plant, type: ProblemType): boolean {
    return p.problems.some((problem) => problem.type === type && problem.status === 'active')
}

function tryAddPestProblem(p: Plant, pestPressureMultiplier: number): void {
    if (p.stressCounters.vpd <= 3 || hasActiveProblem(p, ProblemType.PestInfestation)) {
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

function tryAddNutrientProblem(p: Plant, nutrientStressMultiplier: number): void {
    if (
        (p.stressCounters.ph <= 3 && p.stressCounters.ec <= 3) ||
        hasActiveProblem(p, ProblemType.NutrientDeficiency)
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

function tryAddMoistureProblem(p: Plant): void {
    if (
        p.stressCounters.moisture > 2 &&
        !hasActiveProblem(p, ProblemType.Underwatering) &&
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
        !hasActiveProblem(p, ProblemType.Overwatering) &&
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

export function checkDailySimulationEvents(
    plant: Plant,
    simulationSettings: SimulationSettings | undefined,
    deps: DailySimulationDeps,
): { plant: Plant; journalEntries: JournalEntry[]; tasks: Task[] } {
    const p = deps.clonePlant(plant)
    const journalEntries: JournalEntry[] = []
    const newTasks: Task[] = []
    const originalStage = p.stage
    const pestPressureMultiplier = getPestPressureMultiplier(simulationSettings)
    const nutrientStressMultiplier = getNutrientStressMultiplier(simulationSettings)

    applyStageProgression(p)

    if (p.stage !== originalStage) {
        if (p.stage === PlantStage.Harvest && !p.harvestData) {
            p.harvestData = createInitialHarvestData(p)
        }
        journalEntries.push(createStageChangeEntry(originalStage, p.stage))
    }

    const waterTask = createWaterTaskIfNeeded(p)
    if (waterTask) {
        newTasks.push(waterTask)
    }

    tryAddPestProblem(p, pestPressureMultiplier)
    tryAddNutrientProblem(p, nutrientStressMultiplier)
    tryAddMoistureProblem(p)

    return { plant: p, journalEntries, tasks: newTasks }
}

/** Runs ecosystem → metabolism → growth → synthesis → stress → daily events for one simulated day. */
export function simulateOnePlantDay(
    plant: Plant,
    simulationSettings: SimulationSettings | undefined,
    deps: DailySimulationDeps,
): { plant: Plant; journalEntries: JournalEntry[]; tasks: Task[] } {
    let p = runDailyEcosystem(plant, simulationSettings, deps)
    p = runDailyMetabolism(p, simulationSettings, deps)
    p = runDailyGrowth(p, simulationSettings, deps)
    p = runDailySynthesis(p, deps)
    p = updateHealthAndStress(p, simulationSettings, deps)

    const events = checkDailySimulationEvents(p, simulationSettings, deps)
    return {
        plant: events.plant,
        journalEntries: events.journalEntries,
        tasks: events.tasks,
    }
}
