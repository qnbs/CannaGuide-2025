import { z } from 'zod'
import { MAX_GROWS } from '@/constants'
import { PlantStage, type Grow, type Plant } from '@/types'
import { normalizePlant } from '@/services/simulation/plantNormalization'

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
}

const PLANT_STAGES: ReadonlySet<string> = new Set(Object.values(PlantStage))

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0

const hasCultivarIdentity = (strain: unknown): boolean =>
    isRecord(strain) && isNonEmptyString(strain.id) && isNonEmptyString(strain.name)

/** The fields placing and simulating a plant relies on; nested state is repaired by normalizePlant. */
const isImportablePlant = (value: unknown): value is Plant =>
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    typeof value.stage === 'string' &&
    PLANT_STAGES.has(value.stage) &&
    hasCultivarIdentity(value.strain) &&
    Number.isFinite(value.createdAt) &&
    Number.isFinite(value.lastUpdated)

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

const toGrow = (grow: z.infer<typeof growSchema>, now: number): Grow => ({
    id: grow.id,
    name: grow.name,
    isActive: grow.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    ...(grow.description === undefined ? {} : { description: grow.description }),
    ...(grow.color === undefined ? {} : { color: grow.color }),
    ...(grow.emoji === undefined ? {} : { emoji: grow.emoji }),
    ...(grow.archived === undefined ? {} : { archived: grow.archived }),
})

const freeSlotIndexes = (slots: readonly (string | null)[]): number[] =>
    slots.flatMap((slot, index) => (slot === null ? [index] : []))

export interface GrowImportOptions {
    now?: number
    /** Id for an imported grow whose own id is already taken. */
    newGrowId?: () => string
}

const defaultGrowId = (): string => `grow-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

/** Decides a per-grow import against the current store; never changes anything. */
export const planGrowImport = (
    raw: unknown,
    target: GrowImportTarget,
    { now = Date.now(), newGrowId = defaultGrowId }: GrowImportOptions = {},
): GrowImportPlan => {
    const parsed = exportSchema.safeParse(raw)
    if (!parsed.success) return { ok: false, reason: 'invalid' }
    const { grow, plants } = parsed.data
    if (target.growIds.length >= MAX_GROWS) return { ok: false, reason: 'growLimit' }
    if (plants.some((plant) => target.plantIds.includes(plant.id))) {
        return { ok: false, reason: 'alreadyPresent' }
    }

    const freeSlots = freeSlotIndexes(target.plantSlots)
    if (plants.length > freeSlots.length) return { ok: false, reason: 'plantLimit' }

    const growId = target.growIds.includes(grow.id) ? newGrowId() : grow.id
    // Pair each plant with one of the free slots; there are at least as many.
    const placements = freeSlots.slice(0, plants.length).flatMap((slotIndex, index) => {
        const plant = plants[index]
        return plant ? [{ plant: normalizePlant({ ...plant, growId }), slotIndex }] : []
    })
    return { ok: true, grow: toGrow({ ...grow, id: growId }, now), plants: placements }
}
