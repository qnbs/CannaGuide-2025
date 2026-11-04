import { PlantStage, type Plant, type PlantStageStart } from '@/types'

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

const isStage = (value: unknown): value is PlantStage =>
    Object.values(PlantStage).some((stage) => stage === value)

const hasStageAndTime = (value: unknown): value is { stage: unknown; at: unknown } =>
    typeof value === 'object' && value !== null && 'stage' in value && 'at' in value

const isStageStart = (value: unknown): value is PlantStageStart =>
    hasStageAndTime(value) && isStage(value.stage) && isTimestamp(value.at)

/**
 * A stage start stored as JSON (the sync record), or undefined when it is
 * missing or damaged. A damaged field is dropped; it never discards the plant.
 */
export const parseStageStart = (value: unknown): PlantStageStart | undefined => {
    if (typeof value !== 'string') return undefined
    try {
        const parsed: unknown = JSON.parse(value)
        return isStageStart(parsed) ? parsed : undefined
    } catch {
        return undefined
    }
}

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
