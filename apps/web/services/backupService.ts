// ---------------------------------------------------------------------------
// backupService -- ZIP Backup Export/Import for CannaGuide 2025
//
// Exports the full Redux state + IndexedDB image data as a single ZIP file.
// Imports restore the state and re-hydrate images.
//
// Security: Validates JSON structure on import, rejects oversized payloads,
// sanitises filenames via allowlist, and keeps imported image URLs local.
// No eval(), no dynamic code execution.
// ---------------------------------------------------------------------------

import JSZip from 'jszip'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'
import { openDB } from '@/services/db/connection'
import { redactSnapshotSecrets } from '@/utils/redactSecrets'
import type { BackupImportLimits } from '@/services/backupImportLimits'
import { BACKUP_IMPORT_LIMITS } from '@/services/backupImportLimits'
import {
    ARCHIVED_JOURNAL_FILENAME,
    type ArchivedJournal,
    archivedEntriesOf,
    readArchivedJournalForExport,
    serializeArchivedJournal,
} from '@/services/backupArchivedJournal'
import {
    IMAGES_DIR,
    METADATA_FILENAME,
    STATE_FILENAME,
    imageArchiveEntryName,
    importBackupArchive,
    isRecord,
    plantEntitiesOf,
} from '@/services/backupImportSession'
import type {
    BackupExportErrorCode,
    BackupExportResult,
    BackupImportResult,
    BackupMetadata,
} from '@/services/backupArchiveTypes'

export type {
    BackupExportErrorCode,
    BackupExportResult,
    BackupImportErrorCode,
    BackupImportResult,
    BackupMetadata,
} from '@/services/backupArchiveTypes'

const failedExport = (error: string, errorCode?: BackupExportErrorCode): BackupExportResult => ({
    success: false,
    blob: null,
    filename: '',
    metadata: null,
    error,
    ...(errorCode === undefined ? {} : { errorCode }),
})

const createBackupFilename = (): string => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toISOString().slice(11, 19).replace(/:/g, '-')
    return `cannaguide-backup-${date}_${time}.zip`
}

// Deliberately looser than the restore shape: the export keeps every photo
// row it can address; restore applies the strict checks.
const isExportableImage = (row: unknown): row is { id: string; data: string } =>
    isRecord(row) && typeof row.id === 'string' && typeof row.data === 'string'

/**
 * Every row of `CannaGuideDB.images`, or a rejection when they cannot all be
 * read: the database does not open, the store is missing, the request fails
 * or the transaction aborts. Resolves only on transaction completion, so an
 * abort after the request cannot pass as a complete read (#665).
 */
const readAllStoredImages = async (): Promise<unknown[]> => {
    const db = await openDB()
    if (!db.objectStoreNames.contains('images')) {
        throw new Error('The images store is missing')
    }
    return new Promise((resolve, reject) => {
        let rows: unknown[] | null = null
        const tx = db.transaction('images', 'readonly')
        const request = tx.objectStore('images').getAll()
        request.onsuccess = () => {
            const result: unknown = request.result
            rows = Array.isArray(result) ? result : null
        }
        request.onerror = () => reject(request.error ?? new Error('Reading images failed'))
        tx.onabort = () => reject(tx.error ?? new Error('Reading images was aborted'))
        tx.oncomplete = () =>
            rows === null ? reject(new Error('Reading images returned no rows')) : resolve(rows)
    })
}

const restorableImageEntries = (
    storedImages: readonly unknown[],
): { img: { id: string; data: string }; entryName: string }[] | undefined => {
    const entries: { img: { id: string; data: string }; entryName: string }[] = []
    const usedNames = new Set<string>()
    for (const img of storedImages) {
        if (!isExportableImage(img)) continue
        const entryName = imageArchiveEntryName(img.id, usedNames)
        if (!entryName) return undefined
        usedNames.add(entryName)
        entries.push({ img, entryName })
    }
    return entries
}

const appendStoredImages = (zip: JSZip, storedImages: readonly unknown[]): number | undefined => {
    const entries = restorableImageEntries(storedImages)
    if (!entries) return undefined
    for (const entry of entries) {
        zip.file(`${IMAGES_DIR}${entry.entryName}`, JSON.stringify(entry.img))
    }
    return entries.length
}

const simulationPlantCount = (parsed: unknown): number => {
    if (!isRecord(parsed) || !isRecord(parsed.simulation)) return 0
    return plantEntitiesOf(parsed.simulation.plants).length
}

const plantCountFromState = (stateString: string): number => {
    try {
        return simulationPlantCount(JSON.parse(stateString))
    } catch {
        return 0
    }
}

const readExportImages = async (): Promise<unknown[] | BackupExportResult> => {
    try {
        return await readAllStoredImages()
    } catch (error) {
        console.error(
            '[backupService] Stored photos could not be read; no backup created:',
            error instanceof Error ? error.message : error,
        )
        return failedExport('Stored photos could not be read', 'imagesUnreadable')
    }
}

const readExportArchivedJournal = async (): Promise<
    ArchivedJournal | undefined | BackupExportResult
> => {
    try {
        return await readArchivedJournalForExport()
    } catch (error) {
        console.error(
            '[backupService] Archived journal could not be read; no backup created:',
            error instanceof Error ? error.message : error,
        )
        return failedExport(
            'Archived journal entries could not be read',
            'archivedJournalUnreadable',
        )
    }
}

const isExportFailure = (value: unknown): value is BackupExportResult =>
    isRecord(value) && typeof value.success === 'boolean' && 'blob' in value

/**
 * Older journal entries live outside the Redux snapshot; without them the backup
 * would silently lose them (#667). Adds them to the ZIP and returns the metadata
 * that declares their number, or the failure when they cannot be read.
 */
const addArchivedJournal = async (
    zip: JSZip,
): Promise<Pick<BackupMetadata, 'archivedJournalEntryCount'> | BackupExportResult> => {
    const archivedJournal = await readExportArchivedJournal()
    if (isExportFailure(archivedJournal)) return archivedJournal
    if (!archivedJournal) return {}
    zip.file(ARCHIVED_JOURNAL_FILENAME, serializeArchivedJournal(archivedJournal))
    return { archivedJournalEntryCount: archivedEntriesOf(archivedJournal).length }
}

const buildExportArchive = async (stateString: string): Promise<BackupExportResult> => {
    const zip = new JSZip()
    // A legacy plaintext Cloud TTS key never leaves in a backup (#654).
    zip.file(STATE_FILENAME, redactSnapshotSecrets(stateString))

    // A backup that leaves out photos the state refers to is worse than
    // no backup. An empty photo store is still complete (#665).
    const storedImages = await readExportImages()
    if (!Array.isArray(storedImages)) return storedImages
    const imageCount = appendStoredImages(zip, storedImages)
    if (imageCount === undefined) {
        return failedExport(
            'A stored photo has no restorable archive name',
            'imageNameNotRestorable',
        )
    }
    const archived = await addArchivedJournal(zip)
    if (isExportFailure(archived)) return archived
    const metadata: BackupMetadata = {
        version: '1.0',
        exportedAt: Date.now(),
        appVersion: '1.6.0',
        plantCount: plantCountFromState(stateString),
        imageCount,
        ...archived,
    }
    zip.file(METADATA_FILENAME, JSON.stringify(metadata, null, 2))
    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    })
    return { success: true, blob, filename: createBackupFilename(), metadata }
}

export const backupService = {
    /**
     * Export the full app state as a ZIP file.
     * Returns a Blob that can be saved via FileSaver or download link.
     */
    async exportBackup(): Promise<BackupExportResult> {
        try {
            const stateString = await indexedDBStorage.getItem(REDUX_STATE_KEY)
            if (!stateString) return failedExport('No saved state found in IndexedDB')
            return await buildExportArchive(stateString)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown export error'
            console.error('[backupService] Export failed:', message)
            return failedExport(message)
        }
    },

    /**
     * Import a backup ZIP, restoring state and images.
     * CAUTION: This overwrites all current data.
     */
    importBackup(
        file: File,
        limits: Readonly<BackupImportLimits> = BACKUP_IMPORT_LIMITS,
    ): Promise<BackupImportResult> {
        return importBackupArchive(file, limits)
    },

    /**
     * Trigger a browser download for the given Blob.
     */
    downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob)
        const downloadLink = document.createElement('a')
        downloadLink.href = url
        downloadLink.download = filename
        downloadLink.style.display = 'none'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        setTimeout(() => {
            URL.revokeObjectURL(url)
            document.body.removeChild(downloadLink)
        }, 1000)
    },
}
