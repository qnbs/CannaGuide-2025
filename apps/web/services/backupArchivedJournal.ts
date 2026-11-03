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

/** Plant id -> the journal entries that were archived for that plant. */
export type ArchivedJournal = Record<string, unknown[]>

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const isEntryList = (value: unknown): value is unknown[] =>
    Array.isArray(value) && value.every(isRecord)

/** The archive as a plain map, or a TypeError naming what is wrong with it. */
const toArchivedJournal = (value: unknown): ArchivedJournal => {
    if (!isRecord(value)) throw new TypeError('Archived journal must be an object.')
    const archive: ArchivedJournal = {}
    for (const [plantId, entries] of Object.entries(value)) {
        if (!isEntryList(entries)) {
            throw new TypeError(`Archived journal for a plant must be a list of entries.`)
        }
        archive[plantId] = entries
    }
    return archive
}

const hasEntries = (archive: ArchivedJournal): boolean =>
    Object.values(archive).some((entries) => entries.length > 0)

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

/** Parses the archive entry of an imported backup; throws on a bad shape. */
export const parseArchivedJournal = (raw: string): ArchivedJournal => {
    const parsed: unknown = JSON.parse(raw)
    return toArchivedJournal(parsed)
}

/** Every archived entry, for the caller that cleans up photo references. */
export const archivedEntriesOf = (archive: ArchivedJournal): unknown[] =>
    Object.values(archive).flat()

const sameArchive = (left: unknown, right: unknown): boolean =>
    JSON.stringify(left) === JSON.stringify(right)

/**
 * The restore's write of the archive. `apply` remembers what was there before;
 * `revert` puts it back, but only while the key still holds exactly what this
 * restore wrote, so a concurrent writer's newer archive is not undone.
 */
export const createArchivedJournalRestoreWrite = (
    archive: ArchivedJournal,
): DependentStoreWrite => {
    let previous: unknown
    return {
        apply: async () => {
            previous = await metadataStore.getMetadata(ARCHIVED_LOGS_METADATA_KEY)
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, archive)
        },
        revert: async () => {
            const current = await metadataStore.getMetadata(ARCHIVED_LOGS_METADATA_KEY)
            if (!sameArchive(current, archive)) return
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
