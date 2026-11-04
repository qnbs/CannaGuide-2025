import type { PlannerTask } from '@/types'

export const MAX_TASKS = 500

const isOpen = (task: PlannerTask): boolean => task.completedAt == null

/**
 * How many completed tasks to remove when `count` tasks are added: enough to
 * stay within MAX_TASKS, and never more than the number added. A planner that
 * is already over the cap is not shrunk by deleting its history.
 */
export const evictionsFor = (size: number, count: number): number =>
    Math.max(0, size + count - Math.max(size, MAX_TASKS))

/**
 * Removes up to `count` of the longest-completed tasks. An open task, generated
 * or added by hand, is never removed to make room (GH #659): the old FIFO cut
 * dropped the oldest tasks whatever their state.
 */
export const withoutOldestCompleted = (tasks: PlannerTask[], count: number): PlannerTask[] => {
    if (count <= 0) return tasks
    const removed = new Set(
        tasks
            .filter((task) => !isOpen(task))
            .sort((left, right) => (left.completedAt ?? 0) - (right.completedAt ?? 0))
            .slice(0, count)
            .map((task) => task.id),
    )
    return tasks.filter((task) => !removed.has(task.id))
}

// ---------------------------------------------------------------------------
// Tasks generated before stable ids
// ---------------------------------------------------------------------------

/**
 * Generated before stable ids existed (GH #659): `auto-<ms time>-<counter>-<8 hex>`,
 * the whole id. A stable id of a plant whose id happens to start with digits
 * does not match, because it goes on after the hex part.
 */
const LEGACY_AUTO_ID = /^auto-(?<batch>\d{13})-\d+-[0-9a-f]{8}$/u

interface LegacyRow {
    task: PlannerTask
    /** One press of Auto Schedule: the plant and the time in the id. */
    batch: string
}

const legacyBatchOf = (task: PlannerTask): string | undefined =>
    LEGACY_AUTO_ID.exec(task.id)?.groups?.['batch']

/**
 * The old open rows that may belong to the current stage. The time in an old id
 * is when that batch was generated, so a batch from before the current stage
 * began belongs to an earlier stage (Seed and Seedling share template steps).
 * Without a recorded stage start no old row is matched: a visible copy is
 * better than a task silently left out.
 */
const legacyRowsOf = (tasks: readonly PlannerTask[], since: number | null): LegacyRow[] => {
    if (since === null) return []
    return tasks.filter(isOpen).flatMap((task) => {
        const stamp = legacyBatchOf(task)
        if (stamp === undefined || Number(stamp) < since) return []
        return [{ task, batch: `${task.plantId}|${stamp}` }]
    })
}

const taskKey = (task: PlannerTask): string => `${task.plantId}|${task.type}|${task.notes ?? ''}`

interface LegacyMatch {
    rows: LegacyRow[]
    claimed: Set<PlannerTask>
    matched: Set<string>
    /** Per batch: the new task's time minus the old row's, from the first match. */
    shifts: Map<string, number>
}

const claim = (match: LegacyMatch, task: PlannerTask, row: LegacyRow): void => {
    match.claimed.add(row.task)
    match.matched.add(task.id)
    if (!match.shifts.has(row.batch)) {
        match.shifts.set(row.batch, task.scheduledAt - row.task.scheduledAt)
    }
}

/** Plant, type and notes are those of one template step or brand week. */
const matchByContent = (match: LegacyMatch, fresh: readonly PlannerTask[]): void => {
    for (const task of fresh) {
        const row = match.rows.find(
            (candidate) =>
                !match.claimed.has(candidate.task) && taskKey(candidate.task) === taskKey(task),
        )
        if (row) claim(match, task, row)
    }
}

/** The old row has the new task's type and sits the batch's shift away from it. */
const isShiftedCopy = (match: LegacyMatch, row: LegacyRow, task: PlannerTask): boolean => {
    const shift = match.shifts.get(row.batch)
    return (
        shift !== undefined &&
        !match.claimed.has(row.task) &&
        row.task.type === task.type &&
        task.scheduledAt - row.task.scheduledAt === shift
    )
}

/** The rest of a recognised batch, whose notes the grower may have edited. */
const matchByShift = (match: LegacyMatch, fresh: readonly PlannerTask[]): void => {
    for (const task of fresh.filter((candidate) => !match.matched.has(candidate.id))) {
        const row = match.rows.find((candidate) => isShiftedCopy(match, candidate, task))
        if (row) claim(match, task, row)
    }
}

/**
 * The new tasks that an open task with an old random id already stands for.
 * The old ids carry no stage or template, but they come in batches, one press
 * of Auto Schedule each. A new task is an old one when plant, type and notes
 * match. Once a batch has one match it is known to be this schedule, and its
 * other rows are matched by type and by the same distance in time, so a row
 * whose notes the grower edited is recognised and not copied. Each old row
 * stands for one new task at most. Only batches generated since the stage
 * began (`since`) are considered.
 */
export const legacyMatches = (
    tasks: readonly PlannerTask[],
    fresh: readonly PlannerTask[],
    since: number | null,
): Set<string> => {
    const match: LegacyMatch = {
        rows: legacyRowsOf(tasks, since),
        claimed: new Set(),
        matched: new Set(),
        shifts: new Map(),
    }
    matchByContent(match, fresh)
    matchByShift(match, fresh)
    return match.matched
}

// ---------------------------------------------------------------------------
// Adding generated tasks
// ---------------------------------------------------------------------------

/** What Auto Schedule produced for one plant and stage. */
export interface GeneratedTasks {
    tasks: readonly PlannerTask[]
    /** The id prefix of every generated task of this plant and stage. */
    scope: string
    /** When the plant entered this stage, or null when that was not recorded. */
    stageStartedAt: number | null
}

export interface GeneratedTasksPlan {
    next: PlannerTask[]
    added: number
    alreadyScheduled: number
    refusedForCap: number
    /** Open tasks of this plant and stage from another schedule; nothing is added then. */
    fromOtherSchedule: number
}

const uniqueById = (tasks: readonly PlannerTask[]): PlannerTask[] => {
    const seen = new Set<string>()
    return tasks.filter((task) => {
        if (seen.has(task.id)) return false
        seen.add(task.id)
        return true
    })
}

/** The tasks the planner does not have yet, by id or as an old random-id row. */
const freshTasks = (
    tasks: readonly PlannerTask[],
    unique: PlannerTask[],
    since: number | null,
): PlannerTask[] => {
    const known = new Set(tasks.map((task) => task.id))
    const unknown = unique.filter((task) => !known.has(task.id))
    const legacy = legacyMatches(tasks, unknown, since)
    return unknown.filter((task) => !legacy.has(task.id))
}

/**
 * Open generated tasks of this plant and stage that this run does not produce:
 * they come from another template, brand or template version. Adding next to
 * them would schedule the stage twice, and replacing them could discard rows
 * the grower edited, so the grower removes them first.
 */
const otherScheduleCount = (
    tasks: readonly PlannerTask[],
    unique: PlannerTask[],
    scope: string,
): number => {
    const produced = new Set(unique.map((task) => task.id))
    return tasks.filter(
        (task) => isOpen(task) && task.id.startsWith(scope) && !produced.has(task.id),
    ).length
}

/** New tasks fit while the open tasks stay within the cap; completed ones make room. */
const roomFor = (tasks: readonly PlannerTask[]): number =>
    Math.max(MAX_TASKS - tasks.filter(isOpen).length, 0)

/**
 * What adding generated tasks does to the planner. A task already scheduled
 * (by id, or as an old random-id row) is skipped. With open tasks of this stage
 * from another schedule, nothing is added. Otherwise the new tasks are added
 * while the open tasks stay within MAX_TASKS, earliest first; for each one
 * added, at most one of the longest-completed tasks makes room. When nothing
 * is added, nothing changes, not even the completed tasks.
 */
export const planNewTasks = (
    tasks: PlannerTask[],
    generated: GeneratedTasks,
): GeneratedTasksPlan => {
    const unique = uniqueById(generated.tasks)
    const fresh = freshTasks(tasks, unique, generated.stageStartedAt)
    const fromOtherSchedule = otherScheduleCount(tasks, unique, generated.scope)
    const blocked = fromOtherSchedule > 0
    const accepted = blocked ? [] : fresh.slice(0, roomFor(tasks))
    const next =
        accepted.length === 0
            ? tasks
            : withoutOldestCompleted(
                  [...tasks, ...accepted],
                  evictionsFor(tasks.length, accepted.length),
              )
    return {
        next,
        added: accepted.length,
        alreadyScheduled: unique.length - fresh.length,
        refusedForCap: blocked ? 0 : fresh.length - accepted.length,
        fromOtherSchedule,
    }
}
