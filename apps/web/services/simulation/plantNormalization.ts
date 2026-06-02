import type { Plant, GeneticModifiers } from '@/types'
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

function normalizeEquipment(plant: Plant): Plant['equipment'] {
    return {
        light: {
            type: plant.equipment?.light?.type ?? 'LED',
            wattage: Math.max(
                10,
                Number.isFinite(plant.equipment?.light?.wattage)
                    ? plant.equipment.light.wattage
                    : 300,
            ),
            isOn: Boolean(plant.equipment?.light?.isOn ?? true),
            lightHours: simClamp(
                Number.isFinite(plant.equipment?.light?.lightHours)
                    ? plant.equipment.light.lightHours
                    : 18,
                0,
                24,
            ),
        },
        exhaustFan: {
            power: plant.equipment?.exhaustFan?.power ?? 'medium',
            isOn: Boolean(plant.equipment?.exhaustFan?.isOn ?? true),
        },
        circulationFan: {
            isOn: Boolean(plant.equipment?.circulationFan?.isOn ?? true),
        },
        potSize: Math.max(
            1,
            Number.isFinite(plant.equipment?.potSize) ? plant.equipment.potSize : 11,
        ),
        potType: plant.equipment?.potType ?? 'Fabric',
    }
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

export function normalizePlant(plant: Plant): Plant {
    const waterCapacity = Math.max(
        1,
        (plant.equipment?.potSize ?? 11) *
            1000 *
            ((plant.equipment?.potType ?? 'Fabric') === 'Fabric' ? 0.28 : 0.35),
    )
    const strainModifiers = normalizeGeneticModifiers(plant.strain?.geneticModifiers)
    const phenotypeModifiers = normalizeGeneticModifiers(
        plant.phenotypeModifiers ?? strainModifiers,
    )

    return {
        ...plant,
        mediumType: plant.mediumType ?? 'Soil',
        createdAt: Number.isFinite(plant.createdAt) ? plant.createdAt : Date.now(),
        lastUpdated: Number.isFinite(plant.lastUpdated) ? plant.lastUpdated : Date.now(),
        age: Number.isFinite(plant.age) ? plant.age : 0,
        health: simClamp(Number.isFinite(plant.health) ? plant.health : 100, 0, 100),
        stressLevel: simClamp(Number.isFinite(plant.stressLevel) ? plant.stressLevel : 0, 0, 100),
        height: Number.isFinite(plant.height) ? plant.height : 0,
        biomass: {
            total: Number.isFinite(plant.biomass?.total) ? plant.biomass.total : 0.01,
            stem: Number.isFinite(plant.biomass?.stem) ? plant.biomass.stem : 0.01,
            leaves: Number.isFinite(plant.biomass?.leaves) ? plant.biomass.leaves : 0,
            flowers: Number.isFinite(plant.biomass?.flowers) ? plant.biomass.flowers : 0,
        },
        leafAreaIndex: Number.isFinite(plant.leafAreaIndex) ? plant.leafAreaIndex : 0.01,
        environment: normalizeEnvironment(plant),
        medium: normalizeMedium(plant, waterCapacity),
        nutrientPool: normalizeNutrientPool(plant),
        rootSystem: normalizeRootSystem(plant),
        equipment: normalizeEquipment(plant),
        problems: Array.isArray(plant.problems) ? plant.problems : [],
        journal: Array.isArray(plant.journal) ? plant.journal : [],
        tasks: Array.isArray(plant.tasks) ? plant.tasks : [],
        harvestData: plant.harvestData ?? null,
        structuralModel: normalizeStructuralModel(plant),
        phenotypeModifiers,
        strain: {
            ...plant.strain,
            geneticModifiers: strainModifiers,
        },
        history: Array.isArray(plant.history) ? plant.history : [],
        cannabinoidProfile: normalizeCannabinoidProfile(plant),
        terpeneProfile:
            plant.terpeneProfile && typeof plant.terpeneProfile === 'object'
                ? plant.terpeneProfile
                : {},
        stressCounters: normalizeStressCounters(plant),
        simulationClock: normalizeSimulationClock(plant),
    }
}
