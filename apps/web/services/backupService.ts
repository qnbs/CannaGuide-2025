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
import {
    type DependentStoreWrite,
    replacePrimaryPersistedSnapshotForRecovery,
} from '@/services/persistedStateService'
import { getT } from '@/i18n'
import { normalizeImageDataUrl } from '@/utils/imageDataUrl'
import { redactSnapshotSecrets } from '@/utils/redactSecrets'
import {
    isSafeRasterImageDataUrl,
    MAX_IMAGE_DATA_URL_LENGTH,
} from '@/services/backupImageValidation'
import {
    BACKUP_IMPORT_LIMITS,
    BackupImportLimitError,
    type BackupImportLimits,
    readEntryText,
} from '@/services/backupImportLimits'
import type { StoredImageData } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATE_FILENAME = 'cannaguide-state.json'
const IMAGES_DIR = 'images/'
const METADATA_FILENAME = 'backup-meta.json'
const MAX_IMPORT_SIZE_BYTES = 512 * 1024 * 1024 // 512 MB hard limit
const FILENAME_SAFE_REGEX = /^[a-zA-Z0-9._-]+$/

export interface BackupMetadata {
    version: string
    exportedAt: number
    appVersion: string
    plantCount: number
    imageCount: number
}

/** Why an export produced no archive, where the UI can say more than "failed". */
export type BackupExportErrorCode = 'imagesUnreadable'

export interface BackupExportResult {
    success: boolean
    blob: Blob | null
    filename: string
    metadata: BackupMetadata | null
    error?: string | undefined
    errorCode?: BackupExportErrorCode | undefined
}

/** Why an import was refused, where the UI can say more than "corrupted". */
export type BackupImportErrorCode = 'limitExceeded'

export interface BackupImportResult {
    success: boolean
    metadata: BackupMetadata | null
    rejectedImageCount: number
    reloadRequired?: boolean
    error?: string | undefined
    errorCode?: BackupImportErrorCode | undefined
}

const limitExceededResult = (): BackupImportResult => ({
    success: false,
    metadata: null,
    rejectedImageCount: 0,
    error: 'Backup exceeds the import limits',
    errorCode: 'limitExceeded',
})

const createBackupFilename = (): string => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toISOString().slice(11, 19).replace(/:/g, '-')
    return `cannaguide-backup-${date}_${time}.zip`
}

const isSafeFilename = (name: string): boolean => {
    const parts = name.split('/')
    return parts.every(
        (part) =>
            part.length > 0 &&
            part.length <= 255 &&
            FILENAME_SAFE_REGEX.test(part) &&
            !part.includes('..'),
    )
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const isSafeStoredImageId = (value: unknown): value is string =>
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 255 &&
    FILENAME_SAFE_REGEX.test(value)

const getStoredImageId = (image: unknown): string | undefined =>
    isRecord(image) && isSafeStoredImageId(image.id) ? image.id : undefined

const isStoredImageShape = (image: unknown): image is StoredImageData =>
    isRecord(image) &&
    isSafeStoredImageId(image.id) &&
    typeof image.data === 'string' &&
    typeof image.createdAt === 'number' &&
    Number.isSafeInteger(image.createdAt) &&
    image.createdAt >= 0
const normalizeSafeSavedTipImageUrl = async (value: unknown): Promise<string | undefined> => {
    if (typeof value !== 'string' || value.length > MAX_IMAGE_DATA_URL_LENGTH) return undefined

    const normalized = normalizeImageDataUrl(value)
    if (!normalized || normalized.length > MAX_IMAGE_DATA_URL_LENGTH) return undefined
    return (await isSafeRasterImageDataUrl(normalized)) ? normalized : undefined
}

const sanitizeImportedStateImageReferences = async (
    state: unknown,
    rejectedImageIds: ReadonlySet<string>,
): Promise<number> => {
    let rejectedInlineImageCount = 0
    if (!isRecord(state)) return rejectedInlineImageCount

    if (isRecord(state.simulation)) {
        const plants = state.simulation.plants
        const plantEntities = Array.isArray(plants)
            ? plants
            : isRecord(plants) && isRecord(plants.entities)
              ? Object.values(plants.entities)
              : []

        for (const plant of plantEntities) {
            if (!isRecord(plant) || !Array.isArray(plant.journal)) continue
            for (const entry of plant.journal) {
                if (!isRecord(entry) || !isRecord(entry.details)) continue
                const referencesRejectedImage =
                    typeof entry.details.imageId === 'string' &&
                    rejectedImageIds.has(entry.details.imageId)
                if (referencesRejectedImage) {
                    delete entry.details.imageId
                }
                if (
                    'imageUrl' in entry.details &&
                    !(await isSafeRasterImageDataUrl(entry.details.imageUrl))
                ) {
                    delete entry.details.imageUrl
                    if (!referencesRejectedImage) rejectedInlineImageCount += 1
                }
            }
        }
    }

    if (!isRecord(state.savedItems) || !isRecord(state.savedItems.savedStrainTips)) {
        return rejectedInlineImageCount
    }
    const entities = state.savedItems.savedStrainTips.entities
    if (!isRecord(entities)) return rejectedInlineImageCount
    for (const tip of Object.values(entities)) {
        if (!isRecord(tip) || !('imageUrl' in tip)) continue
        const normalizedImageUrl = await normalizeSafeSavedTipImageUrl(tip.imageUrl)
        if (normalizedImageUrl) {
            tip.imageUrl = normalizedImageUrl
        } else {
            delete tip.imageUrl
            rejectedInlineImageCount += 1
        }
    }
    return rejectedInlineImageCount
}

const isSameImage = (stored: unknown, image: StoredImageData): boolean =>
    isRecord(stored) && stored.data === image.data && stored.createdAt === image.createdAt

const findImagesToWrite = async (
    imageDb: IDBDatabase,
    images: StoredImageData[],
): Promise<StoredImageData[]> => {
    if (images.length === 0) return []

    const tx = imageDb.transaction('images', 'readonly')
    const transactionComplete = new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
    })
    const store = tx.objectStore('images')
    const existingImagesRequest = Promise.all(
        images.map(
            (image) =>
                new Promise<unknown>((resolve, reject) => {
                    const request = store.get(image.id)
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                }),
        ),
    )
    const [existingImages] = await Promise.all([existingImagesRequest, transactionComplete])

    const imagesToWrite: StoredImageData[] = []
    for (const [index, image] of images.entries()) {
        const existing = existingImages[index]
        if (existing === undefined) {
            imagesToWrite.push(image)
            continue
        }
        if (isSameImage(existing, image)) continue
        throw new Error(String(getT()('settingsView.data.restoreBlocked')))
    }

    return imagesToWrite
}

/**
 * Run one readwrite transaction on the images store; any failure aborts all of it.
 * Async so that a throw from transaction() also surfaces as a rejection; everything
 * before the first await still runs synchronously, keeping the transaction active.
 */
const runImageTransaction = async (
    imageDb: IDBDatabase,
    queueRequests: (store: IDBObjectStore) => void,
): Promise<void> => {
    const tx = imageDb.transaction('images', 'readwrite')
    const transactionComplete = new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
    })
    try {
        // Queue requests synchronously so the transaction remains active.
        queueRequests(tx.objectStore('images'))
    } catch (error) {
        // A synchronous throw leaves the requests queued before it pending; abort
        // so they cannot commit as a partial batch.
        tx.abort()
        transactionComplete.catch(() => {})
        throw error
    }
    return transactionComplete
}

/**
 * Backup images as the restore's dependent write. findImagesToWrite returned only
 * IDs absent from the store, so `add` never replaces an existing photo (a racing
 * writer's ID makes it fail, aborting the batch), and `revert` removes only
 * records that still hold exactly what this restore wrote.
 */
const createImageRestoreWrite = (
    imageDb: IDBDatabase,
    images: StoredImageData[],
): DependentStoreWrite => ({
    apply: () =>
        runImageTransaction(imageDb, (store) => {
            for (const image of images) store.add(image)
        }),
    revert: () =>
        runImageTransaction(imageDb, (store) => {
            for (const image of images) {
                const request = store.get(image.id)
                request.onsuccess = () => {
                    if (isSameImage(request.result, image)) store.delete(image.id)
                }
            }
        }),
})

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

// Deliberately looser than isStoredImageShape: the export keeps every photo
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

export const backupService = {
    /**
     * Export the full app state as a ZIP file.
     * Returns a Blob that can be saved via FileSaver or download link.
     */
    async exportBackup(): Promise<BackupExportResult> {
        try {
            const zip = new JSZip()

            // 1. Redux state from IndexedDB
            const stateString = await indexedDBStorage.getItem(REDUX_STATE_KEY)
            if (!stateString) {
                return {
                    success: false,
                    blob: null,
                    filename: '',
                    metadata: null,
                    error: 'No saved state found in IndexedDB',
                }
            }

            // A legacy plaintext Cloud TTS key never leaves in a backup (#654).
            zip.file(STATE_FILENAME, redactSnapshotSecrets(stateString))

            // 2. Images from IndexedDB (CannaGuideDB.images). A backup that leaves
            // out photos the state refers to is worse than no backup: when they
            // cannot be read, fail closed; an empty photo store is complete (#665).
            let storedImages: unknown[]
            try {
                storedImages = await readAllStoredImages()
            } catch (e) {
                console.error(
                    '[backupService] Stored photos could not be read; no backup created:',
                    e instanceof Error ? e.message : e,
                )
                return {
                    success: false,
                    blob: null,
                    filename: '',
                    metadata: null,
                    error: 'Stored photos could not be read',
                    errorCode: 'imagesUnreadable',
                }
            }

            let imageCount = 0
            for (const img of storedImages) {
                if (isExportableImage(img)) {
                    const safeName = img.id.replace(/[^a-zA-Z0-9._-]/g, '_')
                    zip.file(`${IMAGES_DIR}${safeName}.json`, JSON.stringify(img))
                    imageCount++
                }
            }

            // 3. Parse state for metadata
            let plantCount = 0
            try {
                const parsed = JSON.parse(stateString)
                if (
                    parsed &&
                    typeof parsed === 'object' &&
                    'simulation' in parsed &&
                    parsed.simulation &&
                    typeof parsed.simulation === 'object' &&
                    'plants' in parsed.simulation &&
                    Array.isArray(parsed.simulation.plants)
                ) {
                    plantCount = parsed.simulation.plants.length
                }
            } catch {
                // Non-critical
            }

            const metadata: BackupMetadata = {
                version: '1.0',
                exportedAt: Date.now(),
                appVersion: '1.6.0',
                plantCount,
                imageCount,
            }

            zip.file(METADATA_FILENAME, JSON.stringify(metadata, null, 2))

            // 4. Generate ZIP blob
            const blob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 },
            })

            return {
                success: true,
                blob,
                filename: createBackupFilename(),
                metadata,
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown export error'
            console.error('[backupService] Export failed:', msg)
            return {
                success: false,
                blob: null,
                filename: '',
                metadata: null,
                error: msg,
            }
        }
    },

    /**
     * Import a backup ZIP, restoring state and images.
     * CAUTION: This overwrites all current data.
     */
    async importBackup(
        file: File,
        limits: Readonly<BackupImportLimits> = BACKUP_IMPORT_LIMITS,
    ): Promise<BackupImportResult> {
        let imageDb: IDBDatabase | undefined
        const rejectedImageIds = new Set<string>()
        let rejectedInlineImageCount = 0
        let unidentifiedRejectedImageCount = 0
        try {
            // Size guard
            if (file.size > MAX_IMPORT_SIZE_BYTES) {
                return {
                    success: false,
                    metadata: null,
                    rejectedImageCount: 0,
                    error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_IMPORT_SIZE_BYTES / 1024 / 1024} MB.`,
                    errorCode: 'limitExceeded',
                }
            }

            const arrayBuffer = await file.arrayBuffer()
            const zip = await JSZip.loadAsync(arrayBuffer)
            // Nothing is inflated yet; refuse an archive with more entries
            // than any backup has, then read within the byte budget (#671).
            if (Object.keys(zip.files).length > limits.maxEntries) return limitExceededResult()
            const budget = { remaining: limits.maxTotalBytes }

            // 1. Validate structure
            const stateFile = zip.file(STATE_FILENAME)
            if (!stateFile) {
                return {
                    success: false,
                    metadata: null,
                    rejectedImageCount: 0,
                    error: 'Invalid backup: missing state file',
                }
            }

            // 2. Parse and validate state JSON
            const stateString = await readEntryText(stateFile, limits.maxStateBytes, budget)
            let parsedState: unknown
            try {
                parsedState = JSON.parse(stateString)
            } catch {
                return {
                    success: false,
                    metadata: null,
                    rejectedImageCount: 0,
                    error: 'Invalid backup: corrupt state JSON',
                }
            }

            if (typeof parsedState !== 'object' || parsedState === null) {
                return {
                    success: false,
                    metadata: null,
                    rejectedImageCount: 0,
                    error: 'Invalid backup: state is not an object',
                }
            }

            // 3. Read metadata (optional)
            let metadata: BackupMetadata | null = null
            const metaFile = zip.file(METADATA_FILENAME)
            if (metaFile) {
                try {
                    const metaString = await readEntryText(
                        metaFile,
                        limits.maxMetadataBytes,
                        budget,
                    )
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    metadata = JSON.parse(metaString) as BackupMetadata
                } catch (error) {
                    // Unreadable metadata is non-critical; an oversized entry is not.
                    if (error instanceof BackupImportLimitError) throw error
                }
            }

            // ZIP decompression is asynchronous. Resolve every image before opening
            // an IndexedDB transaction, which can auto-commit while awaiting JSZip.
            const imageFiles = Object.keys(zip.files).filter(
                (name) =>
                    name.startsWith(IMAGES_DIR) &&
                    name.endsWith('.json') &&
                    isSafeFilename(name.slice(IMAGES_DIR.length)),
            )
            const imagesById = new Map<string, StoredImageData>()
            const seenImageIds = new Set<string>()

            for (const imgPath of imageFiles) {
                const imgFile = zip.file(imgPath)
                if (!imgFile) continue
                try {
                    const imgString = await readEntryText(
                        imgFile,
                        limits.maxImageEntryBytes,
                        budget,
                    )
                    const parsedImage: unknown = JSON.parse(imgString)
                    const imageId = getStoredImageId(parsedImage)
                    if (imageId && seenImageIds.has(imageId)) {
                        rejectedImageIds.add(imageId)
                        imagesById.delete(imageId)
                        continue
                    }
                    if (imageId) seenImageIds.add(imageId)

                    if (
                        !isStoredImageShape(parsedImage) ||
                        !(await isSafeRasterImageDataUrl(parsedImage.data))
                    ) {
                        const rawImageId =
                            isRecord(parsedImage) && typeof parsedImage.id === 'string'
                                ? parsedImage.id
                                : undefined
                        if (rawImageId) {
                            rejectedImageIds.add(rawImageId)
                        } else {
                            unidentifiedRejectedImageCount += 1
                        }
                        continue
                    }
                    if (imageId && !rejectedImageIds.has(imageId)) {
                        imagesById.set(imageId, parsedImage)
                    }
                } catch (error) {
                    // A corrupt photo is skipped; an oversized one fails the whole
                    // import before anything is written (#671).
                    if (error instanceof BackupImportLimitError) throw error
                    unidentifiedRejectedImageCount += 1
                    console.debug(`[backupService] Skipping corrupt image: ${imgPath}`)
                }
            }

            const images = [...imagesById.values()]
            rejectedInlineImageCount = await sanitizeImportedStateImageReferences(
                parsedState,
                rejectedImageIds,
            )
            const sanitizedStateString = JSON.stringify(parsedState)
            let imagesToWrite = images

            // Check image storage before replacing the current state. Keep the
            // connection, but open the write transaction only when ready to write.
            if (images.length > 0) {
                // The shared database service applies the complete current schema.
                imageDb = await openDB()
                if (!imageDb.objectStoreNames.contains('images')) {
                    throw new Error('Image storage unavailable; backup images were not restored')
                }
                imagesToWrite = await findImagesToWrite(imageDb, images)
            }

            // 4. Write images, then replace state, under the persistence recovery
            // fence. The fence prevents an already-hydrated Redux store from writing
            // stale state before the page reloads after a successful restore; the
            // order keeps the current state intact if the image write fails.
            const restoreResult = await replacePrimaryPersistedSnapshotForRecovery(
                sanitizedStateString,
                imageDb && imagesToWrite.length > 0
                    ? createImageRestoreWrite(imageDb, imagesToWrite)
                    : undefined,
            )
            const rejectedImageCount =
                rejectedImageIds.size + unidentifiedRejectedImageCount + rejectedInlineImageCount
            if (!restoreResult.success) {
                return {
                    success: false,
                    metadata,
                    rejectedImageCount,
                    reloadRequired: restoreResult.reloadRequired,
                    error: String(getT()('settingsView.data.restoreBlocked')),
                }
            }

            return {
                success: true,
                metadata,
                rejectedImageCount,
                reloadRequired: restoreResult.reloadRequired,
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown import error'
            console.error('[backupService] Import failed:', msg)
            // Raised while reading, before anything was written.
            if (e instanceof BackupImportLimitError) return limitExceededResult()
            return {
                success: false,
                metadata: null,
                rejectedImageCount:
                    rejectedImageIds.size +
                    unidentifiedRejectedImageCount +
                    rejectedInlineImageCount,
                error: msg,
            }
        }
    },

    /**
     * Trigger a browser download for the given Blob.
     */
    downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        // Cleanup after a short delay to ensure download starts
        setTimeout(() => {
            URL.revokeObjectURL(url)
            document.body.removeChild(a)
        }, 1000)
    },
}
