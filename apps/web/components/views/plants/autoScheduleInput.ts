import type { Plant } from '@/types'
import type { CurrentStageStart, TaskSchedulerInput } from '@/services/taskSchedulerService'

type SchedulerMedium = 'Soil' | 'Coco' | 'Hydro'

const isSchedulerMedium = (medium: string | undefined): medium is SchedulerMedium =>
    medium === 'Soil' || medium === 'Coco' || medium === 'Hydro'

/** The grow medium in the form the scheduler knows, or undefined. */
const schedulerMediumOf = (medium: string | undefined): SchedulerMedium | undefined =>
    isSchedulerMedium(medium) ? medium : undefined

/**
 * The scheduler input for a plant: its cultivar, stage, stage start and medium.
 * Without a strain there is none: a schedule for an assumed cultivar would be
 * a guess presented as a plan.
 */
export const autoScheduleInput = (
    plantId: string,
    plant: Plant,
    stageStart: CurrentStageStart,
): TaskSchedulerInput | undefined => {
    const strain: Plant['strain'] | undefined = plant.strain
    if (!strain) return undefined
    return {
        plantId,
        strainType: strain.type,
        floweringType: strain.floweringType,
        currentStage: plant.stage,
        stageStartDate: stageStart.at,
        medium: schedulerMediumOf(plant.mediumType),
    }
}

/** The stage start to attribute old tasks by, or null when it was not recorded. */
export const knownStageStart = (stageStart: CurrentStageStart): number | null =>
    stageStart.known ? stageStart.at : null
