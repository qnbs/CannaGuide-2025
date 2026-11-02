import type { Plant, GeneticModifiers } from '@/types'
import { equipmentWithPolicy, reportedFloweringMode } from '@/services/simulation/floweringMode'
import { normalizeGeneticModifiers } from '@/services/simulation/geneticModifiers'
import {
    simClamp,
    simFiniteOr,
    simFiniteOrClamped,
    simFiniteOrMin,
} from '@/services/simulation/simulationMath'

export function getPlantGeneticModifiers(plant: Plant): GeneticModifiers {
    return normalizeGeneticModifiers(plant.phenotypeModifiers ?? plant.strain.geneticModifiers)
}

/** Reported coefficients stay on the cultivar. A missing set is not filled with defaults. */
const strainWithReportedModifiers = (strain: Plant['strain']): Plant['strain'] => {
    if (!strain?.geneticModifiers) return { ...strain }
    return {
        ...strain,
        geneticModifiers: normalizeGeneticModifiers(strain.geneticModifiers),
    }
}

function normalizeEnvironment(plant: Plant): Plant['environment'] {
    return {
        internalTemperature: simFiniteOr(plant.environment?.internalTemperature, 24),
        internalHumidity: simFiniteOrClamped(plant.environment?.internalHumidity, 65, 0, 100),
        vpd: simFiniteOr(plant.environment?.vpd, 0),
        co2Level: simFiniteOrClamped(plant.environment?.co2Level, 400, 200, 1500),
    }
}

function normalizeMedium(plant: Plant, waterCapacity: number): Plant['medium'] {
    return {
        ph: simFiniteOr(plant.medium?.ph, 6.5),
        ec: simFiniteOrMin(plant.medium?.ec, 0.8, 0),
        moisture: simFiniteOrClamped(plant.medium?.moisture, 100, 0, 100),
        microbeHealth: simFiniteOrClamped(plant.medium?.microbeHealth, 80, 0, 100),
        substrateWater: simFiniteOrMin(plant.medium?.substrateWater, waterCapacity, 0),
        nutrientConcentration: {
            nitrogen: simFiniteOrMin(plant.medium?.nutrientConcentration?.nitrogen, 100, 0),
            phosphorus: simFiniteOrMin(plant.medium?.nutrientConcentration?.phosphorus, 100, 0),
            potassium: simFiniteOrMin(plant.medium?.nutrientConcentration?.potassium, 100, 0),
        },
    }
}

function normalizeNutrientPool(plant: Plant): Plant['nutrientPool'] {
    return {
        nitrogen: simFiniteOrMin(plant.nutrientPool?.nitrogen, 5, 0),
        phosphorus: simFiniteOrMin(plant.nutrientPool?.phosphorus, 5, 0),
        potassium: simFiniteOrMin(plant.nutrientPool?.potassium, 5, 0),
    }
}

function normalizeRootSystem(plant: Plant): Plant['rootSystem'] {
    return {
        health: simFiniteOrClamped(plant.rootSystem?.health, 100, 0, 100),
        rootMass: simFiniteOrMin(plant.rootSystem?.rootMass, 0.01, 0.01),
    }
}

const finiteOr = (value: number | undefined, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

const lightEquipment = (plant: Plant): Plant['equipment']['light'] => ({
    type: plant.equipment?.light?.type ?? 'LED',
    wattage: Math.max(10, finiteOr(plant.equipment?.light?.wattage, 300)),
    isOn: Boolean(plant.equipment?.light?.isOn ?? true),
    lightHours: simClamp(finiteOr(plant.equipment?.light?.lightHours, 18), 0, 24),
})

const fanEquipment = (plant: Plant) => ({
    exhaustFan: {
        power: plant.equipment?.exhaustFan?.power ?? 'medium',
        isOn: Boolean(plant.equipment?.exhaustFan?.isOn ?? true),
    },
    circulationFan: {
        isOn: Boolean(plant.equipment?.circulationFan?.isOn ?? true),
    },
})

const potEquipment = (plant: Plant) => ({
    potSize: Math.max(1, finiteOr(plant.equipment?.potSize, 11)),
    potType: plant.equipment?.potType ?? 'Fabric',
})

const normalizeEquipment = (plant: Plant): Plant['equipment'] => {
    return equipmentWithPolicy(
        {
            light: lightEquipment(plant),
            ...fanEquipment(plant),
            ...potEquipment(plant),
        },
        reportedFloweringMode(plant.equipment?.floweringPolicy),
    )
}

function normalizeStructuralModel(plant: Plant): Plant['structuralModel'] {
    return {
        branches: Math.max(
            1,
            Number.isFinite(plant.structuralModel?.branches) ? plant.structuralModel.branches : 1,
        ),
        nodes: Math.max(
            1,
            Number.isFinite(plant.structuralModel?.nodes) ? plant.structuralModel.nodes : 1,
        ),
    }
}

function normalizeCannabinoidProfile(plant: Plant): Plant['cannabinoidProfile'] {
    return {
        thc: Math.max(
            0,
            Number.isFinite(plant.cannabinoidProfile?.thc) ? plant.cannabinoidProfile.thc : 0,
        ),
        cbd: Math.max(
            0,
            Number.isFinite(plant.cannabinoidProfile?.cbd) ? plant.cannabinoidProfile.cbd : 0,
        ),
        cbn: Math.max(
            0,
            Number.isFinite(plant.cannabinoidProfile?.cbn) ? plant.cannabinoidProfile.cbn : 0,
        ),
    }
}

function normalizeStressCounters(plant: Plant): Plant['stressCounters'] {
    return {
        vpd: Math.max(0, Number.isFinite(plant.stressCounters?.vpd) ? plant.stressCounters.vpd : 0),
        ph: Math.max(0, Number.isFinite(plant.stressCounters?.ph) ? plant.stressCounters.ph : 0),
        ec: Math.max(0, Number.isFinite(plant.stressCounters?.ec) ? plant.stressCounters.ec : 0),
        moisture: Math.max(
            0,
            Number.isFinite(plant.stressCounters?.moisture) ? plant.stressCounters.moisture : 0,
        ),
    }
}

function normalizeSimulationClock(plant: Plant): Plant['simulationClock'] {
    return {
        accumulatedDayMs: Math.max(
            0,
            Number.isFinite(plant.simulationClock?.accumulatedDayMs)
                ? plant.simulationClock.accumulatedDayMs
                : 0,
        ),
    }
}

const timestampOrNow = (value: number | undefined): number =>
    Number.isFinite(value) ? value : Date.now()

const listOrEmpty = <T>(value: T[] | undefined): T[] => (Array.isArray(value) ? value : [])

const potLiters = (plant: Plant): number => plant.equipment?.potSize ?? 11

const substrateFactor = (plant: Plant): number =>
    (plant.equipment?.potType ?? 'Fabric') === 'Fabric' ? 0.28 : 0.35

const waterCapacityOf = (plant: Plant): number =>
    Math.max(1, potLiters(plant) * 1000 * substrateFactor(plant))

const normalizeBiomass = (plant: Plant): Plant['biomass'] => ({
    total: finiteOr(plant.biomass?.total, 0.01),
    stem: finiteOr(plant.biomass?.stem, 0.01),
    leaves: finiteOr(plant.biomass?.leaves, 0),
    flowers: finiteOr(plant.biomass?.flowers, 0),
})

const normalizeIdentity = (
    plant: Plant,
): Pick<
    Plant,
    | 'mediumType'
    | 'createdAt'
    | 'lastUpdated'
    | 'age'
    | 'health'
    | 'stressLevel'
    | 'height'
    | 'leafAreaIndex'
> => ({
    mediumType: plant.mediumType ?? 'Soil',
    createdAt: timestampOrNow(plant.createdAt),
    lastUpdated: timestampOrNow(plant.lastUpdated),
    age: finiteOr(plant.age, 0),
    health: simClamp(finiteOr(plant.health, 100), 0, 100),
    stressLevel: simClamp(finiteOr(plant.stressLevel, 0), 0, 100),
    height: finiteOr(plant.height, 0),
    leafAreaIndex: finiteOr(plant.leafAreaIndex, 0.01),
})

const reportedPhenotype = (plant: Plant): GeneticModifiers =>
    normalizeGeneticModifiers(plant.phenotypeModifiers ?? plant.strain?.geneticModifiers)

const terpeneProfileOf = (plant: Plant): Plant['terpeneProfile'] =>
    plant.terpeneProfile && typeof plant.terpeneProfile === 'object' ? plant.terpeneProfile : {}

const harvestDataOf = (plant: Plant): Plant['harvestData'] => plant.harvestData ?? null

/** Reported cultivar coefficients stay on the strain. A missing set is not filled here. */
export const normalizePlant = (plant: Plant): Plant => ({
    ...plant,
    ...normalizeIdentity(plant),
    biomass: normalizeBiomass(plant),
    environment: normalizeEnvironment(plant),
    medium: normalizeMedium(plant, waterCapacityOf(plant)),
    nutrientPool: normalizeNutrientPool(plant),
    rootSystem: normalizeRootSystem(plant),
    equipment: normalizeEquipment(plant),
    problems: listOrEmpty(plant.problems),
    journal: listOrEmpty(plant.journal),
    tasks: listOrEmpty(plant.tasks),
    harvestData: harvestDataOf(plant),
    structuralModel: normalizeStructuralModel(plant),
    phenotypeModifiers: reportedPhenotype(plant),
    strain: strainWithReportedModifiers(plant.strain),
    history: listOrEmpty(plant.history),
    cannabinoidProfile: normalizeCannabinoidProfile(plant),
    terpeneProfile: terpeneProfileOf(plant),
    stressCounters: normalizeStressCounters(plant),
    simulationClock: normalizeSimulationClock(plant),
})
