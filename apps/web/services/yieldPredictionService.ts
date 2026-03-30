import { Plant, PlantStage, YieldPredictionResult } from '@/types'

type TfModule = typeof import('@tensorflow/tfjs')

const TARGET_SCALE = 1000
const MIN_TRAINING_SAMPLES = 10

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

const calculateFeatureStats = (samples: Array<{ features: number[]; target: number }>) => {
    const featureCount = samples[0]?.features.length ?? 0
    const means = Array.from({ length: featureCount }, () => 0)
    const variances = Array.from({ length: featureCount }, () => 0)

    samples.forEach((sample) => {
        sample.features.forEach((value, index) => {
            means[index] = (means[index] ?? 0) + value
        })
    })

    means.forEach((value, index) => {
        means[index] = (value ?? 0) / samples.length
    })

    samples.forEach((sample) => {
        sample.features.forEach((value, index) => {
            variances[index] = (variances[index] ?? 0) + (value - (means[index] ?? 0)) ** 2
        })
    })

    const stdDevs = variances.map((value) =>
        Math.max(Math.sqrt((value ?? 0) / samples.length), 0.05),
    )

    return { means, stdDevs }
}

const normalizeVector = (features: number[], means: number[], stdDevs: number[]) =>
    features.map((value, index) => (value - (means[index] ?? 0)) / (stdDevs[index] ?? 1))

const loadTensorflow = async (): Promise<TfModule> => import('@tensorflow/tfjs')

export const predictYield = async (
    historicalPlants: Plant[],
    activePlants: Plant[],
): Promise<YieldPredictionResult> => {
    const heuristicYield = activePlants.reduce(
        (sum, plant) => sum + estimateHeuristicYield(plant),
        0,
    )
    const trainingSamples = collectTrainingSamples(historicalPlants)

    if (trainingSamples.length < MIN_TRAINING_SAMPLES || activePlants.length === 0) {
        return {
            predictedDryWeight: heuristicYield,
            heuristicDryWeight: heuristicYield,
            confidence:
                trainingSamples.length === 0
                    ? 0.2
                    : clamp(0.25 + trainingSamples.length / 60, 0.25, 0.55),
            sampleCount: trainingSamples.length,
            usedTensorflowModel: false,
            explanation:
                trainingSamples.length === 0
                    ? 'No historical harvest data available yet. Using heuristic projection.'
                    : 'Not enough historical samples for a stable TensorFlow.js model. Using heuristic projection.',
        }
    }

    const tf = await loadTensorflow()
    const { means, stdDevs } = calculateFeatureStats(trainingSamples)
    const normalizedTraining = trainingSamples.map((sample) =>
        normalizeVector(sample.features, means, stdDevs),
    )
    const model = tf.sequential()

    model.add(
        tf.layers.dense({
            inputShape: [normalizedTraining[0]!.length],
            units: 16,
            activation: 'relu',
        }),
    )
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 1 }))

    model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' })

    const inputTensor = tf.tensor2d(normalizedTraining)
    const targetTensor = tf.tensor2d(trainingSamples.map((sample) => [sample.target]))

    const history = await model.fit(inputTensor, targetTensor, {
        epochs: 24,
        batchSize: Math.min(8, trainingSamples.length),
        shuffle: true,
        verbose: 0,
    })

    const lossHistory = history.history.loss
    const latestLossValue = Array.isArray(lossHistory) ? lossHistory.at(-1) : lossHistory
    const latestLoss = Number(latestLossValue ?? 0)

    const activePredictions = activePlants.map((plant) => {
        const features = normalizeVector(buildFeatureVector(plant), means, stdDevs)
        const prediction = tf.tidy(() => {
            const result = model.predict(
                tf.tensor2d([features]),
            ) as import('@tensorflow/tfjs').Tensor
            return (result.dataSync()[0] ?? 0) * TARGET_SCALE
        })

        return Math.max(0, prediction)
    })

    inputTensor.dispose()
    targetTensor.dispose()
    model.dispose()

    const predictedDryWeight = activePredictions.reduce((sum, value) => sum + value, 0)
    const normalizedLoss = clamp((latestLoss * TARGET_SCALE * TARGET_SCALE) / 2500, 0, 1)
    const sampleConfidence = clamp(trainingSamples.length / 30, 0, 1)
    const confidence = clamp(
        0.35 + sampleConfidence * 0.45 + (1 - normalizedLoss) * 0.2,
        0.35,
        0.95,
    )

    return {
        predictedDryWeight,
        heuristicDryWeight: heuristicYield,
        confidence,
        sampleCount: trainingSamples.length,
        usedTensorflowModel: true,
        explanation: `TensorFlow.js model trained on ${trainingSamples.length} historical samples.`,
    }
}

export const yieldPredictionService = {
    predictYield,
    buildFeatureVector,
    collectTrainingSamples,
    estimateHeuristicYield,
}
