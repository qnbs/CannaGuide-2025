// ---------------------------------------------------------------------------
// taskSchedulerService -- Auto-Task Generation for CannaGuide 2025
//
// Generates PlannerTask entries based on strain, growth phase, grow medium,
// and optional nutrient brand schedule. Uses growScheduleTemplates as the
// base, then optionally overlays nutrient feeding tasks from a brand.
// ---------------------------------------------------------------------------

import {
    JournalEntryType,
    type PlannerTask,
    type GrowAction,
    PlantStage,
    type Plant,
} from '@/types'
import { findBestTemplate, type ScheduleStep } from '@/data/growScheduleTemplates'
import { findBrandSchedule } from '@/data/nutrientBrands'
import { isTimestamp, recordedStageStart } from '@/services/simulation/stageStart'
import type { NutrientWeek } from '@/services/pluginService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskSchedulerInput {
    plantId: string
    strainType: 'Sativa' | 'Indica' | 'Hybrid'
    floweringType: 'Photoperiod' | 'Autoflower'
    currentStage: PlantStage
    stageStartDate: number
    medium?: 'Soil' | 'Coco' | 'Hydro' | undefined
    brandScheduleId?: string | undefined
}

export interface TaskSchedulerResult {
    tasks: PlannerTask[]
    templateUsed: string | null
    brandUsed: string | null
    /**
     * The id prefix every generated task of this plant and stage shares. An open
     * task under it that this run does not produce comes from another schedule
     * (another template, brand or template version).
     */
    scope: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generated tasks get ids from what they are, not when they were made: the same
 * plant, stage and template step always give the same id. Running Auto Schedule
 * again therefore yields tasks the planner already has, and it skips them
 * instead of adding a second copy (GH #659).
 */
const autoTaskId = (plantId: string, stage: PlantStage, source: string): string =>
    `auto-${plantId}-${stage}-${source}`

const stepsToTasks = (
    steps: ScheduleStep[],
    plantId: string,
    stageStartDate: number,
    stage: PlantStage,
    templateId: string,
): PlannerTask[] =>
    steps.map((step, index) => ({
        id: autoTaskId(
            plantId,
            stage,
            `step-${templateId}-${index}-${step.action}-${step.dayOffset}`,
        ),
        plantId,
        type: step.action,
        scheduledAt: stageStartDate + step.dayOffset * 86_400_000,
        recurring: false,
        notes: step.notes,
    }))

const nutrientWeeksToTasks = (
    weeks: NutrientWeek[],
    plantId: string,
    stageStartDate: number,
    targetStage: string,
    feedIdPrefix: { stage: PlantStage; brand: string },
): PlannerTask[] => {
    const relevantWeeks = weeks.filter((w) => {
        const lower = w.stage.toLowerCase()
        const target = targetStage.toLowerCase()
        return lower.includes(target) || target.includes(lower)
    })

    // Brand weeks are numbered across the whole grow (Seedling 1-2, Vegetative 3-5,
    // Flowering 6-10, ...): the stage's first week starts with the stage.
    const firstWeek = Math.min(...relevantWeeks.map(({ week }) => week))

    return relevantWeeks.map((week) => {
        const products = week.products.map((p) => `${p.name} ${p.dosageMlPerLiter} ml/L`).join(', ')
        const notes = [
            `Week ${week.week}: ${products}`,
            week.ecTarget != null ? `EC target: ${week.ecTarget}` : '',
            week.notes ?? '',
        ]
            .filter(Boolean)
            .join(' | ')

        return {
            id: autoTaskId(plantId, feedIdPrefix.stage, `feed-${feedIdPrefix.brand}-w${week.week}`),
            plantId,
            type: 'feed' as GrowAction,
            scheduledAt: stageStartDate + (week.week - firstWeek) * 7 * 86_400_000,
            recurring: false,
            notes,
        }
    })
}

/** A stage-change entry's details name the stage the plant moved to. */
const isStageChangeTo = (details: unknown, stage: PlantStage): boolean =>
    typeof details === 'object' && details !== null && 'to' in details && details.to === stage

export interface CurrentStageStart {
    /** When the schedule for the current stage starts. */
    at: number
    /** False when the stage start was not recorded and `at` is only today. */
    known: boolean
}

/** When the simulation's stage-change journal entry says the stage began. */
const journaledStageStart = (plant: Pick<Plant, 'stage' | 'journal'>): number | undefined => {
    const entered = plant.journal
        .filter(
            (entry) =>
                entry.type === JournalEntryType.System &&
                isStageChangeTo(entry.details, plant.stage) &&
                isTimestamp(entry.createdAt),
        )
        .reduce((latest, entry) => Math.max(latest, entry.createdAt), Number.NEGATIVE_INFINITY)
    return Number.isFinite(entered) ? entered : undefined
}

/** A plant in its first stage has been in it since it was created. */
const firstStageStart = (plant: Pick<Plant, 'stage' | 'createdAt'>): number | undefined =>
    plant.stage === PlantStage.Seed ? plant.createdAt : undefined

/**
 * When the plant entered its current stage, to lay the schedule out from there
 * instead of from the moment Auto Schedule is pressed (GH #659). In order: the
 * stage start the simulation recorded on the plant; the plant's creation for its
 * first stage; the stage-change journal entry, for plants saved before the start
 * was recorded. When none of them exists the start is unknown: the schedule then
 * starts today, and `known: false` lets the caller say so instead of presenting
 * today as the stage start.
 */
export const currentStageStart = (
    plant: Pick<Plant, 'stage' | 'stageStart' | 'createdAt' | 'journal'>,
    now: number = Date.now(),
): CurrentStageStart => {
    // A time a Date cannot hold (a damaged import) would give tasks invalid dates.
    const at = [recordedStageStart(plant), firstStageStart(plant), journaledStageStart(plant)].find(
        isTimestamp,
    )
    return at === undefined ? { at: now, known: false } : { at, known: true }
}

/** Which template steps and which brand-schedule label belong to a plant stage. */
const STAGE_KEYS: readonly {
    match: string
    steps: 'seedlingSteps' | 'vegetativeSteps' | 'floweringSteps'
    label: string
}[] = [
    { match: 'seed', steps: 'seedlingSteps', label: 'seedling' },
    { match: 'clone', steps: 'seedlingSteps', label: 'seedling' },
    { match: 'veg', steps: 'vegetativeSteps', label: 'vegetative' },
    { match: 'flower', steps: 'floweringSteps', label: 'flowering' },
    { match: 'bloom', steps: 'floweringSteps', label: 'flowering' },
]

const stageKeyOf = (stage: PlantStage) =>
    STAGE_KEYS.find(({ match }) => stage.toLowerCase().includes(match))

const templateTasks = (
    input: TaskSchedulerInput,
): { tasks: PlannerTask[]; used: string | null } => {
    const template = findBestTemplate(input.strainType, input.floweringType)
    if (!template) return { tasks: [], used: null }
    const key = stageKeyOf(input.currentStage)
    const steps = key ? template[key.steps] : []
    return {
        tasks: stepsToTasks(
            steps,
            input.plantId,
            input.stageStartDate,
            input.currentStage,
            template.id,
        ),
        used: template.name,
    }
}

const NO_TASKS = { tasks: [] as PlannerTask[], used: null }

const brandTasks = (input: TaskSchedulerInput): { tasks: PlannerTask[]; used: string | null } => {
    if (!input.brandScheduleId) return NO_TASKS
    const brand = findBrandSchedule(input.brandScheduleId)
    // A stage without a feeding phase (germination, harvest, drying, curing)
    // gets no brand weeks; it used to fall back to the vegetative weeks.
    const label = stageKeyOf(input.currentStage)?.label
    if (!brand || label === undefined) return NO_TASKS
    return {
        tasks: nutrientWeeksToTasks(brand.data.weeks, input.plantId, input.stageStartDate, label, {
            stage: input.currentStage,
            brand: input.brandScheduleId,
        }),
        used: brand.data.brand,
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const taskSchedulerService = {
    /**
     * Generate tasks for a plant based on its strain, stage, and optional
     * nutrient brand schedule.
     *
     * Returns the tasks and their scope, ready for `addGeneratedTasks`.
     */
    generateTasks(input: TaskSchedulerInput): TaskSchedulerResult {
        const base = templateTasks(input)
        const feed = brandTasks(input)
        const tasks = [...base.tasks, ...feed.tasks].sort((a, b) => a.scheduledAt - b.scheduledAt)
        return {
            tasks,
            templateUsed: base.used,
            brandUsed: feed.used,
            scope: autoTaskId(input.plantId, input.currentStage, ''),
        }
    },
}
