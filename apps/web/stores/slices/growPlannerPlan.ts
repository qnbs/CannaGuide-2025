import type { PlannerTask } from '@/types'

export const MAX_TASKS = 500

/**
 * No task, open or completed, is ever removed to make room (GH #659): the old
 * FIFO cut dropped the oldest tasks whatever their state, and even completed
 * tasks are the grower's history. Generated tasks that do not fit are refused
 * with a message instead; clearing tasks is the grower's own action.
 */
const isOpen = (task: PlannerTask): boolean => task.completedAt == null

// ---------------------------------------------------------------------------
// Tasks generated before stable ids
// ---------------------------------------------------------------------------

/**
 * Generated before stable ids existed (GH #659): `auto-<ms time>-<counter>-<8 hex>`,
 * the whole id. A stable id of a plant whose id happens to start with digits
 * does not match, because it goes on after the hex part.
 */
const LEGACY_AUTO_ID = /^auto-(?<stamp>\d{13})-(?<counter>\d+)-[0-9a-f]{8}$/u

/**
 * The old generator read the clock once per task, so one run can span a few
 * milliseconds; a second press of the button comes much later. Rows of one plant
 * at most this far apart from the previous row are one run, whatever happened to
 * the rows between them (completed or deleted).
 */
const MAX_RUN_GAP_MS = 1_000

interface LegacyRow {
    task: PlannerTask
    /** One press of Auto Schedule (one run of the old generator). */
    batch: string
}

interface ParsedLegacyRow {
    task: PlannerTask
    stamp: number
    counter: number
}

const parseLegacy = (task: PlannerTask): ParsedLegacyRow | undefined => {
    const groups = LEGACY_AUTO_ID.exec(task.id)?.groups
    if (!groups) return undefined
    return { task, stamp: Number(groups['stamp']), counter: Number(groups['counter']) }
}

const byPlantThenTime = (left: ParsedLegacyRow, right: ParsedLegacyRow): number =>
    left.task.plantId.localeCompare(right.task.plantId) ||
    left.stamp - right.stamp ||
    left.counter - right.counter

const continuesRun = (previous: ParsedLegacyRow, row: ParsedLegacyRow): boolean =>
    row.task.plantId === previous.task.plantId && row.stamp - previous.stamp <= MAX_RUN_GAP_MS

/** Numbers the runs of rows sorted by plant and time. */
const withRuns = (rows: readonly ParsedLegacyRow[]): (LegacyRow & { stamp: number })[] => {
    const numbered: (LegacyRow & { stamp: number })[] = []
    let run = 0
    let previous: ParsedLegacyRow | undefined
    for (const row of rows) {
        if (previous !== undefined && !continuesRun(previous, row)) run += 1
        numbered.push({ task: row.task, batch: String(run), stamp: row.stamp })
        previous = row
    }
    return numbered
}

/**
 * The old rows that may belong to the current stage. A completed old row counts
 * like a completed stable-id task: the step was scheduled, so it is not added
 * again. Runs are formed from all old rows, so a completed or deleted row inside
 * a run does not split it. The time in an old id is when
 * that run was generated, so a run from before the current stage began belongs
 * to an earlier stage (Seed and Seedling share template steps). Without a
 * recorded stage start no old row is matched: a visible copy is better than a
 * task silently left out.
 */
const legacyRowsOf = (tasks: readonly PlannerTask[], since: number | null): LegacyRow[] => {
    if (since === null) return []
    const parsed = tasks.flatMap((task) => parseLegacy(task) ?? []).sort(byPlantThenTime)
    return withRuns(parsed)
        .filter((row) => row.stamp >= since)
        .map(({ task, batch }) => ({ task, batch }))
}

const taskKey = (task: PlannerTask): string => `${task.plantId}|${task.type}|${task.notes ?? ''}`

interface LegacyMatch {
    rows: LegacyRow[]
    /** Runs with at least one row that stands for a new task. */
    recognised: Set<string>
    claimed: Set<PlannerTask>
    matched: Set<string>
    /** Per batch: the new task's time minus the old row's, from the first match. */
    shifts: Map<string, number>
}

const claim = (match: LegacyMatch, task: PlannerTask, row: LegacyRow): void => {
    match.claimed.add(row.task)
    match.matched.add(task.id)
    match.recognised.add(row.batch)
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

export interface LegacyMatches {
    /** Ids of the new tasks an old row already stands for. */
    matched: Set<string>
    /**
     * Open old rows of this stage in runs that match none of the new tasks: a
     * schedule from another template, or one whose every row was edited. They
     * block the run like tasks of another schedule.
     */
    unrecognisedOpen: number
}

/** Open rows of the given plants in runs of which nothing was recognised. */
const unrecognisedOpenRows = (match: LegacyMatch, plants: ReadonlySet<string>): number =>
    match.rows.filter(
        ({ task, batch }) =>
            isOpen(task) && plants.has(task.plantId) && !match.recognised.has(batch),
    ).length

/**
 * The new tasks that a task with an old random id, open or completed, already
 * stands for. The old ids carry no stage or template, but they come in runs,
 * one press of Auto Schedule each. A new task is an old one when plant, type
 * and notes match. Once a run has one match it is known to be this schedule,
 * and its other rows are matched by type and by the same distance in time, so
 * a row whose notes the grower edited is recognised and not copied. Each old
 * row stands for one new task at most. Only runs generated since the stage
 * began (`since`) are considered.
 */
export const legacyMatches = (
    tasks: readonly PlannerTask[],
    fresh: readonly PlannerTask[],
    since: number | null,
    plants: ReadonlySet<string>,
): LegacyMatches => {
    const match: LegacyMatch = {
        rows: legacyRowsOf(tasks, since),
        recognised: new Set(),
        claimed: new Set(),
        matched: new Set(),
        shifts: new Map(),
    }
    matchByContent(match, fresh)
    matchByShift(match, fresh)
    return { matched: match.matched, unrecognisedOpen: unrecognisedOpenRows(match, plants) }
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
    /**
     * Open tasks of this plant and stage from another schedule, including old
     * random-id runs of this stage that match nothing; nothing is added then.
     */
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
    plants: ReadonlySet<string>,
): number => {
    const produced = new Set(unique.map((task) => task.id))
    return tasks.filter(
        (task) =>
            isOpen(task) &&
            plants.has(task.plantId) &&
            task.id.startsWith(scope) &&
            !produced.has(task.id),
    ).length
}

/** New tasks fit while the planner holds fewer than MAX_TASKS tasks. */
const roomFor = (tasks: readonly PlannerTask[]): number => Math.max(MAX_TASKS - tasks.length, 0)

/**
 * What adding generated tasks does to the planner. A task already scheduled
 * (by id, or as an old random-id row) is skipped. With open tasks of this stage
 * from another schedule, nothing is added. Otherwise the new tasks are added,
 * earliest first, while the planner holds fewer than MAX_TASKS tasks; the rest
 * are refused. No task is ever removed, so a run that adds nothing changes
 * nothing.
 */
export const planNewTasks = (
    tasks: PlannerTask[],
    generated: GeneratedTasks,
): GeneratedTasksPlan => {
    const unique = uniqueById(generated.tasks)
    // Same plant only: the prefix of plant `p` is also how plant `p-SEED`'s ids start.
    const plants = new Set(unique.map((task) => task.plantId))
    const known = new Set(tasks.map((task) => task.id))
    const unknown = unique.filter((task) => !known.has(task.id))
    const legacy = legacyMatches(tasks, unknown, generated.stageStartedAt, plants)
    const fresh = unknown.filter((task) => !legacy.matched.has(task.id))
    const fromOtherSchedule =
        otherScheduleCount(tasks, unique, generated.scope, plants) + legacy.unrecognisedOpen
    const accepted = fromOtherSchedule > 0 ? [] : fresh.slice(0, roomFor(tasks))
    return {
        next: accepted.length === 0 ? tasks : [...tasks, ...accepted],
        added: accepted.length,
        alreadyScheduled: unique.length - fresh.length,
        refusedForCap: fromOtherSchedule > 0 ? 0 : fresh.length - accepted.length,
        fromOtherSchedule,
    }
}
