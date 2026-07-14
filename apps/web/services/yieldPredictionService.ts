import { getT } from '@/i18n'
import { Plant, PlantStage, YieldPredictionResult } from '@/types'

const TARGET_SCALE = 1000

const stageOrder: PlantStage[] = [
    PlantStage.Seed,
    PlantStage.Germination,
    PlantStage.Seedling,
    PlantStage.Vegetative,
    PlantStage.Flowering,
    PlantStage.Harvest,
    PlantStage.Drying,
    PlantStage.Curing,
    PlantStage.Finished,
]

const mediumTypes: Record<Plant['mediumType'], number[]> = {
    Soil: [1, 0, 0],
    Coco: [0, 1, 0],
    Hydro: [0, 0, 1],
    Aeroponics: [0, 0, 1],
}

const strainTypeOrder = ['Indica', 'Sativa', 'Hybrid', 'Ruderalis'] as const

const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value))

const stageToIndex = (stage: PlantStage): number => Math.max(0, stageOrder.indexOf(stage))

const normalize = (value: number, scale: number): number => clamp(value / scale, 0, 2)

const getStrainTypeOneHot = (type: string | undefined): number[] => {
    const index = strainTypeOrder.findIndex(
        (candidate) => candidate.toLowerCase() === (type ?? '').toLowerCase(),
    )
    return strainTypeOrder.map((_value, candidateIndex) => (candidateIndex === index ? 1 : 0))
}

const buildFeatureVector = (plant: Plant): number[] => [
    normalize(plant.age, 180),
    stageToIndex(plant.stage) / (stageOrder.length - 1),
    normalize(plant.health, 100),
    normalize(plant.stressLevel, 100),
    normalize(plant.height, 300),
    normalize(plant.biomass.total, 500),
    normalize(plant.biomass.flowers, 450),
    normalize(plant.leafAreaIndex, 12),
    normalize(plant.environment.internalTemperature, 40),
    normalize(plant.environment.internalHumidity, 100),
    normalize(plant.environment.vpd, 3),
    normalize(plant.medium.ph, 14),
    normalize(plant.medium.ec, 4),
    normalize(plant.medium.moisture, 100),
    normalize(plant.rootSystem.health, 100),
    normalize(plant.equipment.light.wattage, 1200),
    normalize(plant.equipment.light.lightHours, 24),
    normalize(plant.equipment.potSize, 60),
    ...(mediumTypes[plant.mediumType] ?? mediumTypes.Soil),
    ...getStrainTypeOneHot(plant.strain?.type),
    normalize(plant.strain?.thc ?? 0, 35),
    normalize(plant.strain?.cbd ?? 0, 35),
    normalize(plant.strain?.floweringTime ?? 0, 20),
    normalize(plant.problems.filter((problem) => problem.status === 'active').length, 12),
]

const estimateHeuristicYield = (plant: Plant): number => {
    if (plant.harvestData?.dryWeight) {
        return plant.harvestData.dryWeight
    }

    const healthFactor = clamp(plant.health / 100, 0.45, 1.15)
    const stressFactor = clamp(1 - plant.stressLevel / 160, 0.35, 1.05)
    const stageFactor = stageToIndex(plant.stage) >= stageToIndex(PlantStage.Flowering) ? 1 : 0.72
    return Math.max(0, plant.biomass.flowers * 0.22 * healthFactor * stressFactor * stageFactor)
}

const collectTrainingSamples = (plants: Plant[]): Array<{ features: number[]; target: number }> => {
    return plants.flatMap((plant) => {
        if (!plant.harvestData?.dryWeight) {
            return []
        }

        const target = plant.harvestData.dryWeight / TARGET_SCALE
        const historySamples = plant.history.map((snapshot) => ({
            features: [
                normalize(snapshot.day, 180),
                stageToIndex(plant.stage) / (stageOrder.length - 1),
                normalize(snapshot.health, 100),
                normalize(snapshot.stressLevel, 100),
                normalize(snapshot.height, 300),
                normalize(plant.biomass.total, 500),
                normalize(plant.biomass.flowers, 450),
                normalize(plant.leafAreaIndex, 12),
                normalize(plant.environment.internalTemperature, 40),
                normalize(plant.environment.internalHumidity, 100),
                normalize(plant.environment.vpd, 3),
                normalize(snapshot.medium.ph, 14),
                normalize(snapshot.medium.ec, 4),
                normalize(snapshot.medium.moisture, 100),
                normalize(plant.rootSystem.health, 100),
                normalize(plant.equipment.light.wattage, 1200),
                normalize(plant.equipment.light.lightHours, 24),
                normalize(plant.equipment.potSize, 60),
                ...(mediumTypes[plant.mediumType] ?? mediumTypes.Soil),
                ...getStrainTypeOneHot(plant.strain?.type),
                normalize(plant.strain?.thc ?? 0, 35),
                normalize(plant.strain?.cbd ?? 0, 35),
                normalize(plant.strain?.floweringTime ?? 0, 20),
                normalize(
                    plant.problems.filter((problem) => problem.status === 'active').length,
                    12,
                ),
            ],
            target,
        }))

        return [
            ...historySamples,
            {
                features: buildFeatureVector(plant),
                target,
            },
        ]
    })
}

/**
 * Yield is projected heuristically from each plant's own stage, age and vitals.
 *
 * A TensorFlow.js regression used to run here once enough history had been
 * recorded, but @tensorflow/tfjs was never actually a dependency of this app --
 * the dynamic import resolved against nothing, so the model path threw for every
 * user who reached it while the tests, which run with no history, never touched
 * it. The path is gone rather than resurrected: it would have cost a
 * multi-megabyte download to train a 3-layer net on a handful of samples.
 *
 * History still raises confidence -- it just no longer feeds a model.
 */
export const predictYield = (
    historicalPlants: Plant[],
    activePlants: Plant[],
): Promise<YieldPredictionResult> => {
    const translate = getT()
    const heuristicYield = activePlants.reduce(
        (sum, plant) => sum + estimateHeuristicYield(plant),
        0,
    )
    // One sample per history snapshot of each harvested plant -- not one per
    // harvest. The UI labels it "historical samples" for the same reason.
    const sampleCount = collectTrainingSamples(historicalPlants).length

    return Promise.resolve({
        predictedDryWeight: heuristicYield,
        heuristicDryWeight: heuristicYield,
        confidence: sampleCount === 0 ? 0.2 : clamp(0.25 + sampleCount / 60, 0.25, 0.55),
        sampleCount,
        explanation:
            sampleCount === 0
                ? translate('plantsView.growStats.explanationNoHistory')
                : translate('plantsView.growStats.explanationHeuristic', { count: sampleCount }),
    })
}

export const yieldPredictionService = {
    predictYield,
    buildFeatureVector,
    collectTrainingSamples,
    estimateHeuristicYield,
}
