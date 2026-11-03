/** Why an export produced no archive, where the UI can say more than "failed". */
export type BackupExportErrorCode =
    'imagesUnreadable' | 'imageNameNotRestorable' | 'archivedJournalUnreadable'

export interface BackupMetadata {
    version: string
    exportedAt: number
    appVersion: string
    plantCount: number
    imageCount: number
    /** Archived journal entries in `archived-journal.json`; absent when there are none (#667). */
    archivedJournalEntryCount?: number
}

export interface BackupExportResult {
    success: boolean
    blob: Blob | null
    filename: string
    metadata: BackupMetadata | null
    // Absent when unused. Callers with `string | undefined` omit the key
    // instead of assigning undefined (exactOptionalPropertyTypes).
    error?: string
    errorCode?: BackupExportErrorCode
}

/** Why an import was refused, where the UI can say more than "corrupted". */
export type BackupImportErrorCode = 'limitExceeded'

export interface BackupImportResult {
    success: boolean
    metadata: BackupMetadata | null
    rejectedImageCount: number
    reloadRequired?: boolean
    error?: string
    errorCode?: BackupImportErrorCode
}
