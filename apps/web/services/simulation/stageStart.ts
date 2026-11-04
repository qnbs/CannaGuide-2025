import type { Plant, PlantStage } from '@/types'

/**
 * Records when the plant entered its current stage, if `at` is the moment its
 * stage moved on from `previous`. A plant that stayed in its stage keeps the
 * time it already has (GH #659).
 */
export const recordStageStart = (plant: Plant, previous: PlantStage, at: number): void => {
    if (plant.stage === previous) return
    plant.stageStart = { stage: plant.stage, at }
}

const isTimestamp = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

/**
 * The recorded start of the plant's current stage, or undefined. A record for
 * another stage, or with a time that is not a number (a damaged import), is
 * not used: it would date the current stage from a different event.
 */
export const recordedStageStart = (
    plant: Pick<Plant, 'stage' | 'stageStart'>,
): number | undefined => {
    const record = plant.stageStart
    if (record?.stage !== plant.stage || !isTimestamp(record.at)) return undefined
    return record.at
}
