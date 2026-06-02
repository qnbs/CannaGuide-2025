import { PlantStage } from '@/types'
import type { LegacyPlant } from '@/services/migration/migrationTypes'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion --
 * Persisted state from IndexedDB has unknown shapes; runtime narrowing via typeof checks. */


export const ensureSimulationRootShape = (sim: Record<string, unknown>): void => {
    if (!Array.isArray(sim.plantSlots)) {
        sim.plantSlots = [null, null, null]
    }
    if (typeof sim.selectedPlantId === 'undefined') {
        sim.selectedPlantId = null
    }
    if (Object.prototype.hasOwnProperty.call(sim, 'devSpeedMultiplier')) {
        delete sim.devSpeedMultiplier
    }
    if (!sim.vpdProfiles || typeof sim.vpdProfiles !== 'object') {
        sim.vpdProfiles = {}
    }
}

const resolvePostHarvestStage = (
    plant: LegacyPlant,
): { stage: PlantStage; isPostHarvest: boolean } => {
    const stage = typeof plant.stage === 'string' ? (plant.stage as PlantStage) : PlantStage.Seed
    const isPostHarvest = [
        PlantStage.Harvest,
        PlantStage.Drying,
        PlantStage.Curing,
        PlantStage.Finished,
    ].includes(stage)

    return { stage, isPostHarvest }
}

const ensureLegacyPlantTimestamps = (plant: LegacyPlant): void => {
    if (typeof plant.mediumType !== 'string') {
        plant.mediumType = 'Soil'
    }
    if (typeof plant.createdAt !== 'number') {
        plant.createdAt = typeof plant.lastUpdated === 'number' ? plant.lastUpdated : Date.now()
    }
    if (typeof plant.lastUpdated !== 'number') {
        plant.lastUpdated = typeof plant.createdAt === 'number' ? plant.createdAt : Date.now()
    }
}

const ensureNumeric = (obj: Record<string, unknown>, key: string, fallback: number): void => {
    if (typeof obj[key] !== 'number') obj[key] = fallback
}

const ensureLegacyHarvestData = (plant: LegacyPlant): void => {
    if (typeof plant.harvestData === 'undefined') {
        plant.harvestData = null
        return
    }

    if (!plant.harvestData || typeof plant.harvestData !== 'object') {
        return
    }

    const harvestData = plant.harvestData as Record<string, unknown>
    const terpeneProfile =
        plant.terpeneProfile && typeof plant.terpeneProfile === 'object'
            ? (plant.terpeneProfile as Record<string, unknown>)
            : {}
    const { stage, isPostHarvest } = resolvePostHarvestStage(plant)
    const isCuringOrFinished = stage === PlantStage.Curing || stage === PlantStage.Finished

    ensureNumeric(harvestData, 'wetWeight', 0)
    ensureNumeric(harvestData, 'dryWeight', 0)
    ensureNumeric(harvestData, 'currentDryDay', stage === PlantStage.Drying ? 1 : 0)
    ensureNumeric(harvestData, 'currentCureDay', isCuringOrFinished ? 1 : 0)
    ensureNumeric(harvestData, 'lastBurpDay', 0)
    ensureNumeric(harvestData, 'jarHumidity', isCuringOrFinished ? 62 : 68)
    ensureNumeric(harvestData, 'chlorophyllPercent', isPostHarvest ? 100 : 0)
    ensureNumeric(harvestData, 'terpeneRetentionPercent', isPostHarvest ? 100 : 0)
    ensureNumeric(harvestData, 'moldRiskPercent', 0)
    ensureNumeric(harvestData, 'finalQuality', 0)

    if (!harvestData.cannabinoidProfile || typeof harvestData.cannabinoidProfile !== 'object') {
        harvestData.cannabinoidProfile = { thc: 0, cbn: 0 }
    } else {
        const cannabinoidProfile = harvestData.cannabinoidProfile as Record<string, unknown>
        ensureNumeric(cannabinoidProfile, 'thc', 0)
        ensureNumeric(cannabinoidProfile, 'cbn', 0)
    }

    if (!harvestData.terpeneProfile || typeof harvestData.terpeneProfile !== 'object') {
        harvestData.terpeneProfile = { ...terpeneProfile }
    }
}

const ensureLegacyEnvironment = (plant: LegacyPlant): void => {
    if (!plant.environment || typeof plant.environment !== 'object') {
        plant.environment = {
            internalTemperature: 24,
            internalHumidity: 65,
            vpd: 0,
            co2Level: 400,
        }
        return
    }

    const environment = plant.environment as Record<string, unknown>
    if (typeof environment.internalTemperature !== 'number') environment.internalTemperature = 24
    if (typeof environment.internalHumidity !== 'number') environment.internalHumidity = 65
    if (typeof environment.vpd !== 'number') environment.vpd = 0
    if (typeof environment.co2Level !== 'number') environment.co2Level = 400
}

const ensureLegacyRootSystem = (plant: LegacyPlant): void => {
    if (!plant.rootSystem || typeof plant.rootSystem !== 'object') {
        plant.rootSystem = { health: 100, rootMass: 0.01 }
        return
    }

    const rootSystem = plant.rootSystem as Record<string, unknown>
    if (typeof rootSystem.health !== 'number') rootSystem.health = 100
    if (typeof rootSystem.rootMass !== 'number') rootSystem.rootMass = 0.01
}

const ensureLegacyStressCounters = (plant: LegacyPlant): void => {
    if (!plant.stressCounters || typeof plant.stressCounters !== 'object') {
        plant.stressCounters = { vpd: 0, ph: 0, ec: 0, moisture: 0 }
        return
    }

    const stressCounters = plant.stressCounters as Record<string, unknown>
    if (typeof stressCounters.vpd !== 'number') stressCounters.vpd = 0
    if (typeof stressCounters.ph !== 'number') stressCounters.ph = 0
    if (typeof stressCounters.ec !== 'number') stressCounters.ec = 0
    if (typeof stressCounters.moisture !== 'number') stressCounters.moisture = 0
}

const ensureLegacyCannabinoidProfile = (plant: LegacyPlant): void => {
    if (!plant.cannabinoidProfile || typeof plant.cannabinoidProfile !== 'object') {
        plant.cannabinoidProfile = { thc: 0, cbd: 0, cbn: 0 }
        return
    }

    const cannabinoidProfile = plant.cannabinoidProfile as Record<string, unknown>
    if (typeof cannabinoidProfile.thc !== 'number') cannabinoidProfile.thc = 0
    if (typeof cannabinoidProfile.cbd !== 'number') cannabinoidProfile.cbd = 0
    if (typeof cannabinoidProfile.cbn !== 'number') cannabinoidProfile.cbn = 0
}

const ensureLegacyStructuralModel = (plant: LegacyPlant): void => {
    if (!plant.structuralModel || typeof plant.structuralModel !== 'object') {
        plant.structuralModel = { branches: 1, nodes: 1 }
        return
    }

    const structuralModel = plant.structuralModel as Record<string, unknown>
    if (typeof structuralModel.branches !== 'number') structuralModel.branches = 1
    if (typeof structuralModel.nodes !== 'number') structuralModel.nodes = 1
}

const ensureLegacyMedium = (plant: LegacyPlant): void => {
    if (!plant.medium || typeof plant.medium !== 'object') {
        plant.medium = {
            ph: 6.5,
            ec: 0.8,
            moisture: 80,
            microbeHealth: 80,
            substrateWater: 0,
            nutrientConcentration: { nitrogen: 100, phosphorus: 100, potassium: 100 },
        }
        return
    }

    const medium = plant.medium as Record<string, unknown>
    if (typeof medium.ph !== 'number') medium.ph = 6.5
    if (typeof medium.ec !== 'number') medium.ec = 0.8
    if (typeof medium.moisture !== 'number') medium.moisture = 80
    if (typeof medium.microbeHealth !== 'number') medium.microbeHealth = 80
    if (typeof medium.substrateWater !== 'number') medium.substrateWater = 0
    if (!medium.nutrientConcentration || typeof medium.nutrientConcentration !== 'object') {
        medium.nutrientConcentration = {
            nitrogen: 100,
            phosphorus: 100,
            potassium: 100,
        }
        return
    }

    const nutrientConcentration = medium.nutrientConcentration as Record<string, unknown>
    if (typeof nutrientConcentration.nitrogen !== 'number') nutrientConcentration.nitrogen = 100
    if (typeof nutrientConcentration.phosphorus !== 'number') {
        nutrientConcentration.phosphorus = 100
    }
    if (typeof nutrientConcentration.potassium !== 'number') nutrientConcentration.potassium = 100
}

const ensureLegacyNutrientPool = (plant: LegacyPlant): void => {
    if (!plant.nutrientPool || typeof plant.nutrientPool !== 'object') {
        plant.nutrientPool = { nitrogen: 5, phosphorus: 5, potassium: 5 }
        return
    }

    const nutrientPool = plant.nutrientPool as Record<string, unknown>
    if (typeof nutrientPool.nitrogen !== 'number') nutrientPool.nitrogen = 5
    if (typeof nutrientPool.phosphorus !== 'number') nutrientPool.phosphorus = 5
    if (typeof nutrientPool.potassium !== 'number') nutrientPool.potassium = 5
}

const ensureLegacySimulationClock = (plant: LegacyPlant): void => {
    if (!plant.simulationClock || typeof plant.simulationClock !== 'object') {
        plant.simulationClock = { accumulatedDayMs: 0 }
        return
    }

    const simulationClock = plant.simulationClock as Record<string, unknown>
    if (typeof simulationClock.accumulatedDayMs !== 'number') simulationClock.accumulatedDayMs = 0
}

const ensureLegacyHistory = (plant: LegacyPlant): void => {
    if (!Array.isArray(plant.history)) {
        plant.history = []
    }
}

const ensureLegacyPhenotypeModifiers = (plant: LegacyPlant): void => {
    const legacyStrain = plant.strain as Record<string, unknown> | undefined
    if (!plant.phenotypeModifiers && legacyStrain?.geneticModifiers) {
        plant.phenotypeModifiers = { ...(legacyStrain.geneticModifiers as object) }
    }
}

export const patchLegacyPlantShape = (plant: LegacyPlant): void => {
    ensureLegacyPlantTimestamps(plant)
    ensureLegacyHarvestData(plant)
    ensureLegacyEnvironment(plant)
    ensureLegacyRootSystem(plant)
    ensureLegacyStressCounters(plant)
    ensureLegacyCannabinoidProfile(plant)
    if (!plant.terpeneProfile || typeof plant.terpeneProfile !== 'object') {
        plant.terpeneProfile = {}
    }
    ensureLegacyStructuralModel(plant)
    ensureLegacyMedium(plant)
    ensureLegacyNutrientPool(plant)
    ensureLegacySimulationClock(plant)
    ensureLegacyHistory(plant)
    ensureLegacyPhenotypeModifiers(plant)
}
