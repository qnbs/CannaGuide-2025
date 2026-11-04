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
    type PlantStage,
    type Plant,
} from '@/types'
import {
    findBestTemplate,
    type GrowScheduleTemplate,
    type ScheduleStep,
} from '@/data/growScheduleTemplates'
import { findBrandSchedule } from '@/data/nutrientBrands'
import type { NutrientSchedulePlugin, NutrientWeek } from '@/services/pluginService'

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
): PlannerTask[] =>
    steps.map((step, index) => ({
        id: autoTaskId(plantId, stage, `step-${index}-${step.action}-${step.dayOffset}`),
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
            scheduledAt: stageStartDate + (week.week - 1) * 7 * 86_400_000,
            recurring: false,
            notes,
        }
    })
}

/**
 * When the plant entered its current stage: the simulation's stage-change
 * journal entry for that stage, or the plant's creation for its first stage. The
 * schedule is laid out from here, not from the moment Auto Schedule is pressed
 * (GH #659), so a plan made late in a stage does not start over.
 */
/** A stage-change entry's details name the stage the plant moved to. */
const isStageChangeTo = (details: unknown, stage: PlantStage): boolean =>
    typeof details === 'object' && details !== null && 'to' in details && details.to === stage

export const currentStageStartedAt = (
    plant: Pick<Plant, 'stage' | 'createdAt' | 'journal'>,
): number => {
    const entered = plant.journal
        .filter(
            (entry) =>
                entry.type === JournalEntryType.System &&
                isStageChangeTo(entry.details, plant.stage),
        )
        .reduce((latest, entry) => Math.max(latest, entry.createdAt), Number.NEGATIVE_INFINITY)
    return Number.isFinite(entered) ? entered : plant.createdAt
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const taskSchedulerService = {
    /**
     * Generate tasks for a plant based on its strain, stage, and optional
     * nutrient brand schedule.
     *
     * Returns an array of PlannerTask objects ready for dispatch to the
     * growPlannerSlice via bulkAddTasks.
     */
    generateTasks(input: TaskSchedulerInput): TaskSchedulerResult {
        const {
            plantId,
            strainType,
            floweringType,
            currentStage,
            stageStartDate,
            brandScheduleId,
        } = input

        const template: GrowScheduleTemplate | undefined = findBestTemplate(
            strainType,
            floweringType,
        )
        const tasks: PlannerTask[] = []
        let templateUsed: string | null = null
        let brandUsed: string | null = null

        // 1. Generate base tasks from template
        if (template) {
            templateUsed = template.name
            const stageKey = currentStage.toLowerCase()

            let steps: ScheduleStep[] = []
            if (stageKey.includes('seed') || stageKey.includes('clone')) {
                steps = template.seedlingSteps
            } else if (stageKey.includes('veg')) {
                steps = template.vegetativeSteps
            } else if (stageKey.includes('flower') || stageKey.includes('bloom')) {
                steps = template.floweringSteps
            }

            tasks.push(...stepsToTasks(steps, plantId, stageStartDate, currentStage))
        }

        // 2. Overlay nutrient brand tasks
        if (brandScheduleId) {
            const brand: NutrientSchedulePlugin | undefined = findBrandSchedule(brandScheduleId)
            if (brand) {
                brandUsed = brand.data.brand
                const stageKey = currentStage.toLowerCase()
                let stageLabel = 'vegetative'
                if (stageKey.includes('seed') || stageKey.includes('clone')) {
                    stageLabel = 'seedling'
                } else if (stageKey.includes('flower') || stageKey.includes('bloom')) {
                    stageLabel = 'flowering'
                }

                const nutrientTasks = nutrientWeeksToTasks(
                    brand.data.weeks,
                    plantId,
                    stageStartDate,
                    stageLabel,
                    { stage: currentStage, brand: brandScheduleId },
                )
                tasks.push(...nutrientTasks)
            }
        }

        // 3. Sort by scheduled date
        tasks.sort((a, b) => a.scheduledAt - b.scheduledAt)

        return { tasks, templateUsed, brandUsed }
    },
}
