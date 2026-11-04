import { z } from 'zod'
import { MAX_GROWS, MAX_PLANTS_CANG } from '@/constants'
import { PlantStage, type Grow, type Plant } from '@/types'
import { normalizePlant } from '@/services/simulation/plantNormalization'
import { addGrow } from '@/stores/slices/growsSlice'
import {
    addPlant,
    capCountingPlants,
    countsTowardCap,
    isFreeSlot,
} from '@/stores/slices/simulationSlice'
import type { AppDispatch, RootState } from '@/stores/store'

/**
 * Per-grow JSON import (GH #674).
 *
 * The export holds a grow and its plants. The import used to add only the grow
 * and report success even when the store refused it (grow limit, or an id that
 * already exists, as when the same file is imported twice). This module decides
 * the whole import up front, without touching the store: either every plant and
 * the grow fit, or nothing is added and the caller gets the reason.
 *
 * Every fresh profile has a default grow with the same id, so an export moved
 * to another profile usually carries a grow id that already exists there: the
 * imported grow then gets a new id. Plant ids that already exist mean the same
 * plants are already here (the file was imported before), which is refused.
 *
 * Plants need a free plant slot each. The three slots are where the legal cap of
 * three plants at a time (KCanG Section 9 (1)) is enforced, so an import that
 * needs more slots than are free is refused as a whole, never added in part.
 *
 * Validation covers what placing a plant needs (identity, grow binding, stage,
 * cultivar identity, timestamps); `normalizePlant` then repairs the nested
 * simulation structures the same way the simulation does. Full entity
 * validation of imported data is GH #584.
 */

export type GrowImportRefusal = 'invalid' | 'growLimit' | 'alreadyPresent' | 'plantLimit'

export type GrowImportPlan =
    | { ok: true; grow: Grow; plants: { plant: Plant; slotIndex: number }[] }
    | { ok: false; reason: GrowImportRefusal }

export interface GrowImportTarget {
    growIds: readonly string[]
    plantIds: readonly string[]
    plantSlots: readonly (string | null)[]
    /** Plants in the store that count toward the legal cap, slotted or not. */
    capCountingPlants: number
}

const PLANT_STAGES: ReadonlySet<string> = new Set(Object.values(PlantStage))

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0

const hasCultivarIdentity = (strain: unknown): boolean =>
    isRecord(strain) && isNonEmptyString(strain.id) && isNonEmptyString(strain.name)

/** Absent, or a list of objects: `[null]` would survive normalizePlant and crash the plant view. */
const isRecordListOrAbsent = (value: unknown): boolean =>
    value === undefined || (Array.isArray(value) && value.every(isRecord))

const PLANT_LISTS = ['tasks', 'problems', 'journal', 'history'] as const

/** What placing and simulating a plant relies on; nested state is repaired by normalizePlant. */
const PLANT_CHECKS: readonly ((plant: Record<string, unknown>) => boolean)[] = [
    (plant) => isNonEmptyString(plant.id) && isNonEmptyString(plant.name),
    (plant) => typeof plant.stage === 'string' && PLANT_STAGES.has(plant.stage),
    (plant) => hasCultivarIdentity(plant.strain),
    (plant) => Number.isFinite(plant.createdAt) && Number.isFinite(plant.lastUpdated),
    (plant) => PLANT_LISTS.every((key) => isRecordListOrAbsent(plant[key])),
]

const isImportablePlant = (value: unknown): value is Plant =>
    isRecord(value) && PLANT_CHECKS.every((check) => check(value))

const growSchema = z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    isActive: z.boolean().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    emoji: z.string().optional(),
    archived: z.boolean().optional(),
})

const exportSchema = z.object({
    version: z.literal('2.0'),
    grow: growSchema,
    plants: z.array(z.custom<Plant>(isImportablePlant)),
})

const toGrow = (grow: z.infer<typeof growSchema>, id: string, now: number): Grow => ({
    id,
    name: grow.name,
    isActive: grow.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    description: grow.description,
    color: grow.color,
    emoji: grow.emoji,
    archived: grow.archived,
})

/**
 * The slots a plant may take: free, and within the legal cap. The reducer
 * refuses anything else, so planning from the array length could promise a
 * slot of an overlong stored array that the add then drops.
 */
const freeSlotIndexes = (slots: readonly (string | null)[]): number[] =>
    slots.flatMap((_slot, index) => (isFreeSlot(slots, index) ? [index] : []))

export interface GrowImportOptions {
    now?: number
    /** Id for an imported grow whose own id is already taken. */
    newGrowId?: () => string
}

const defaultGrowId = (): string => `grow-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

const hasDuplicateIds = (plants: readonly Plant[]): boolean =>
    new Set(plants.map((plant) => plant.id)).size !== plants.length

/**
 * Every imported plant needs a free slot, and the ones that count toward the
 * legal cap must fit next to the store's counting plants (slotted or not).
 */
const exceedsPlantLimit = (plants: readonly Plant[], target: GrowImportTarget): boolean =>
    plants.length > freeSlotIndexes(target.plantSlots).length ||
    plants.filter(countsTowardCap).length + target.capCountingPlants > MAX_PLANTS_CANG

/** Why the import cannot go ahead against this store, or null when it can. */
const refusalFor = (
    plants: readonly Plant[],
    target: GrowImportTarget,
): GrowImportRefusal | null => {
    if (hasDuplicateIds(plants)) return 'invalid'
    if (target.growIds.length >= MAX_GROWS) return 'growLimit'
    if (plants.some((plant) => target.plantIds.includes(plant.id))) return 'alreadyPresent'
    return exceedsPlantLimit(plants, target) ? 'plantLimit' : null
}

/** Decides a per-grow import against the current store; never changes anything. */
export const planGrowImport = (
    raw: unknown,
    target: GrowImportTarget,
    { now = Date.now(), newGrowId = defaultGrowId }: GrowImportOptions = {},
): GrowImportPlan => {
    const parsed = exportSchema.safeParse(raw)
    if (!parsed.success) return { ok: false, reason: 'invalid' }
    const { grow, plants } = parsed.data
    const refusal = refusalFor(plants, target)
    if (refusal) return { ok: false, reason: refusal }

    const growId = target.growIds.includes(grow.id) ? newGrowId() : grow.id
    // Pair each plant with one of the free slots; there are at least as many.
    const placements = freeSlotIndexes(target.plantSlots)
        .slice(0, plants.length)
        .flatMap((slotIndex, index) => {
            const plant = plants[index]
            return plant ? [{ plant: normalizePlant({ ...plant, growId }), slotIndex }] : []
        })
    return { ok: true, grow: toGrow(grow, growId, now), plants: placements }
}

/**
 * Plans the import against the store as it is now and, if it is accepted,
 * commits it in the same synchronous step. Reading the state here, not at the
 * render that started the file read, keeps a change in between (another
 * import, a new grow) from reusing slots or a grow id that are no longer free.
 */
export const importGrowFile =
    (raw: unknown, options?: GrowImportOptions) =>
    (dispatch: AppDispatch, getState: () => RootState): GrowImportPlan => {
        const { grows, simulation } = getState()
        const plan = planGrowImport(
            raw,
            {
                growIds: grows.grows.ids,
                plantIds: simulation.plants.ids,
                plantSlots: simulation.plantSlots,
                capCountingPlants: capCountingPlants(simulation),
            },
            options,
        )
        if (!plan.ok) return plan
        dispatch(addGrow(plan.grow))
        for (const placement of plan.plants) dispatch(addPlant(placement))
        return plan
    }
