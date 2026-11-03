import { metadataStore } from '@/services/db/metadataStore'
import { ARCHIVED_LOGS_METADATA_KEY } from '@/services/db/types'
import type { DependentStoreWrite } from '@/services/persistedStateService'

/**
 * Archived plant journals (GH #667).
 *
 * When a plant's journal outgrows the retention limit, the older entries leave
 * the persisted Redux snapshot and are kept in `CannaGuideDB.metadata` under
 * `archived_plant_logs_v1` (services/db/simulationPersistence.ts). The ZIP
 * backup used to carry only the snapshot and the photos, so a backup silently
 * lost every archived entry. This module reads that map for the export, checks
 * it on import, and writes it back as one more dependent store write of the
 * restore (services/persistedStateService.ts), so a failed restore undoes it.
 */

export const ARCHIVED_JOURNAL_FILENAME = 'archived-journal.json'

/** Bumped when the layout of the archive file changes; an unknown version is refused. */
export const ARCHIVED_JOURNAL_FORMAT_VERSION = 1

/** Plant id -> the journal entries that were archived for that plant. */
export type ArchivedJournal = Record<string, unknown[]>

/** A plain object, as JSON and a structured clone of one produce; not a Date, Map or class instance. */
const isRecord = (value: unknown): value is Record<string, unknown> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
    const prototype: unknown = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

/** A journal entry is a plain object with the string id every `JournalEntry` has. */
const isEntry = (value: unknown): boolean => isRecord(value) && typeof value.id === 'string'

// Array.from turns a hole into undefined, which `every` would otherwise skip: a
// sparse array survives a structured clone, becomes null in the ZIP, and the import
// refuses it.
const isEntryList = (value: unknown): value is unknown[] =>
    Array.isArray(value) && Array.from(value).every(isEntry)

/** The archive as a plain map, or a TypeError naming what is wrong with it. */
const toArchivedJournal = (value: unknown): ArchivedJournal => {
    if (!isRecord(value)) throw new TypeError('Archived journal must be an object.')
    const pairs: [string, unknown[]][] = []
    for (const [plantId, entries] of Object.entries(value)) {
        if (!isEntryList(entries)) {
            throw new TypeError('Archived journal for a plant must be a list of entries.')
        }
        pairs.push([plantId, entries])
    }
    // fromEntries defines own properties; assigning archive["__proto__"] would
    // change the prototype and silently drop that plant's journal.
    return Object.fromEntries(pairs)
}

/** Every archived entry, for the caller that cleans up photo references. */
export const archivedEntriesOf = (archive: ArchivedJournal): unknown[] =>
    Object.values(archive).flat()

const hasEntries = (archive: ArchivedJournal): boolean => archivedEntriesOf(archive).length > 0

/**
 * The stored archive for the export, or `undefined` when there is nothing to
 * keep. Throws when it cannot be read or has an unexpected shape: a backup that
 * leaves out data the app holds is worse than no backup (#665, #667).
 */
export const readArchivedJournalForExport = async (): Promise<ArchivedJournal | undefined> => {
    const stored = await metadataStore.getMetadata(ARCHIVED_LOGS_METADATA_KEY)
    if (stored === undefined) return undefined
    const archive = toArchivedJournal(stored)
    return hasEntries(archive) ? archive : undefined
}

/** The text of the archive file: a versioned envelope around the map. */
export const serializeArchivedJournal = (archive: ArchivedJournal): string =>
    JSON.stringify({ version: ARCHIVED_JOURNAL_FORMAT_VERSION, journals: archive })

/**
 * Parses the archive entry of an imported backup. Throws on text that is not
 * JSON, on a bad shape, and on a version this build does not know: restoring
 * around a file it cannot read would drop data without saying so.
 */
export const parseArchivedJournal = (raw: string): ArchivedJournal => {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== ARCHIVED_JOURNAL_FORMAT_VERSION) {
        throw new TypeError('Archived journal has an unsupported version.')
    }
    return toArchivedJournal(parsed.journals)
}

/**
 * A backup that says it holds archived entries must hold exactly that many. A
 * truncated or edited ZIP would otherwise restore without them and report
 * success, and so would a declared zero next to a file that holds entries. A
 * backup made before the archive was exported declares nothing, so an absent
 * number passes; a number that is present but not a count (a string, a
 * negative, a fraction, null) is a damaged declaration and refuses the import,
 * rather than being read as "nothing declared".
 */
const isDeclaredCount = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

export const assertArchivedJournalComplete = (
    declaredEntryCount: unknown,
    archive: ArchivedJournal = {},
): void => {
    if (declaredEntryCount === undefined) return
    if (!isDeclaredCount(declaredEntryCount)) {
        throw new Error('Invalid backup: the archived journal count is not valid')
    }
    if (archivedEntriesOf(archive).length !== declaredEntryCount) {
        throw new Error('Invalid backup: archived journal is missing or incomplete')
    }
}

const entryKey = (entry: unknown): string =>
    isRecord(entry) && typeof entry.id === 'string' ? `id:${entry.id}` : JSON.stringify(entry)

/** `JournalEntry.createdAt` (packages/ai-core/src/domain/plant.ts); infinite when it is unusable. */
const timeOf = (entry: unknown): number =>
    isRecord(entry) && typeof entry.createdAt === 'number' && Number.isFinite(entry.createdAt)
        ? entry.createdAt
        : Number.POSITIVE_INFINITY

/** Oldest first; an entry without a usable createdAt keeps its place after the dated ones. */
const byTime = (entries: readonly unknown[]): unknown[] =>
    [...entries].sort((left, right) => {
        const leftTime = timeOf(left)
        const rightTime = timeOf(right)
        if (leftTime === rightTime) return 0
        return leftTime < rightTime ? -1 : 1
    })

/** The entries of `incoming` that `stored` does not hold yet, each only once. */
const newEntries = (stored: readonly unknown[], incoming: readonly unknown[]): unknown[] => {
    const known = new Set(stored.map(entryKey))
    return incoming.filter((entry) => {
        const key = entryKey(entry)
        if (known.has(key)) return false
        known.add(key)
        return true
    })
}

/**
 * Entries are kept oldest first, because the app trims a plant's archive from
 * the front (services/db/simulationPersistence.ts keeps the last 1200). Adding
 * older entries after newer ones would let the next trim drop the newer ones.
 * When the backup adds nothing, the stored list stays exactly as it was.
 */
const mergePlantEntries = (stored: unknown[], incoming: unknown[]): unknown[] => {
    const added = newEntries(stored, incoming)
    if (added.length === 0) return stored
    // A plant with nothing stored takes the backup's list in the order it has.
    return stored.length === 0 ? added : byTime([...stored, ...added])
}

/**
 * The stored archive first, then what the backup adds: an entry whose id is
 * already there stays as it is (a restore never overwrites user data), and a
 * plant the backup does not mention keeps its entries.
 */
export const mergeArchivedJournals = (
    existing: ArchivedJournal,
    incoming: ArchivedJournal,
): ArchivedJournal => {
    const merged = new Map<string, unknown[]>()
    for (const [plantId, entries] of Object.entries(existing)) merged.set(plantId, [...entries])
    for (const [plantId, entries] of Object.entries(incoming)) {
        merged.set(plantId, mergePlantEntries(merged.get(plantId) ?? [], entries))
    }
    return Object.fromEntries(merged)
}

const sameArchive = (left: unknown, right: unknown): boolean =>
    JSON.stringify(left) === JSON.stringify(right)

/**
 * The restore's write of the archive: the stored archive plus the backup's.
 * `apply` remembers what was there before and refuses to touch an archive it
 * cannot read; `revert` puts the previous one back, but only while the key still
 * holds exactly what this restore wrote, so a concurrent writer's newer archive
 * is not undone.
 */
export const createArchivedJournalRestoreWrite = (
    incoming: ArchivedJournal,
): DependentStoreWrite => {
    let previous: unknown
    let written: ArchivedJournal | undefined
    return {
        apply: async () => {
            previous = await metadataStore.getMetadata(ARCHIVED_LOGS_METADATA_KEY)
            const existing = previous === undefined ? {} : toArchivedJournal(previous)
            written = mergeArchivedJournals(existing, incoming)
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, written)
        },
        revert: async () => {
            if (written === undefined) return
            const current = await metadataStore.getMetadata(ARCHIVED_LOGS_METADATA_KEY)
            if (!sameArchive(current, written)) return
            if (previous === undefined) {
                await metadataStore.deleteMetadata(ARCHIVED_LOGS_METADATA_KEY)
                return
            }
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, previous)
        },
    }
}

/**
 * Runs the writes in order. When a later one fails, the earlier ones are undone
 * in reverse order before the error is passed on, so `apply` leaves nothing
 * half-done; `revert` undoes all of them, newest first, and reports the first
 * failure only after it has tried every one.
 */
export const combineDependentWrites = (
    writes: readonly (DependentStoreWrite | undefined)[],
): DependentStoreWrite | undefined => {
    const present = writes.filter((write): write is DependentStoreWrite => write !== undefined)
    if (present.length === 0) return undefined
    if (present.length === 1) return present[0]
    const revertAll = async (done: readonly DependentStoreWrite[]): Promise<void> => {
        let firstError: unknown
        for (const write of [...done].reverse()) {
            try {
                await write.revert()
            } catch (error) {
                firstError ??= error
            }
        }
        if (firstError !== undefined) throw firstError
    }
    return {
        apply: async () => {
            const done: DependentStoreWrite[] = []
            for (const write of present) {
                try {
                    await write.apply()
                } catch (error) {
                    await revertAll(done).catch(() => undefined)
                    throw error
                }
                done.push(write)
            }
        },
        revert: () => revertAll(present),
    }
}
