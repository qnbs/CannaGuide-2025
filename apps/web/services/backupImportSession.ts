import JSZip from 'jszip'
import { openDB } from '@/services/db/connection'
import {
    type DependentStoreWrite,
    replacePrimaryPersistedSnapshotForRecovery,
} from '@/services/persistedStateService'
import {
    ARCHIVED_JOURNAL_FILENAME,
    type ArchivedJournal,
    archivedEntriesOf,
    combineDependentWrites,
    createArchivedJournalRestoreWrite,
    parseArchivedJournal,
} from '@/services/backupArchivedJournal'
import { getT } from '@/i18n'
import { normalizeImageDataUrl } from '@/utils/imageDataUrl'
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
import type {
    BackupImportErrorCode,
    BackupImportResult,
    BackupMetadata,
} from '@/services/backupArchiveTypes'

export const STATE_FILENAME = 'cannaguide-state.json'
export const IMAGES_DIR = 'images/'
export const METADATA_FILENAME = 'backup-meta.json'

const MAX_IMPORT_SIZE_BYTES = 512 * 1024 * 1024
const FILENAME_SAFE_REGEX = /^[a-zA-Z0-9._-]+$/
const IMAGE_JSON_SUFFIX = '.json'
const MAX_STORED_IMAGE_ID_LENGTH = 255
const MAX_IMAGE_ENTRY_NAME_LENGTH = MAX_STORED_IMAGE_ID_LENGTH + IMAGE_JSON_SUFFIX.length

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const hasSafeImageIdCharacters = (value: string): boolean => {
    if (value.length === 0 || value.length > MAX_STORED_IMAGE_ID_LENGTH) return false
    if (value.includes('..')) return false
    return FILENAME_SAFE_REGEX.test(value)
}

export const isSafeStoredImageId = (value: unknown): value is string =>
    typeof value === 'string' && hasSafeImageIdCharacters(value)

/**
 * `images/<id>.json` keeps the 255-character id. The `.json` suffix sits
 * outside that cap, so a maximum-length id still round-trips.
 */
export const isSafeImageEntryName = (name: string): boolean => {
    if (!name.endsWith(IMAGE_JSON_SUFFIX) || name.includes('..')) return false
    if (name.length > MAX_IMAGE_ENTRY_NAME_LENGTH) return false
    return isSafeStoredImageId(name.slice(0, -IMAGE_JSON_SUFFIX.length))
}

export const imageArchiveEntryName = (
    id: string,
    usedNames: ReadonlySet<string> = new Set(),
): string | undefined => {
    if (!isSafeStoredImageId(id)) return undefined
    const entryName = `${id}${IMAGE_JSON_SUFFIX}`
    if (!isSafeImageEntryName(entryName) || usedNames.has(entryName)) return undefined
    return entryName
}

const pathPartsArePresent = (parts: readonly string[]): boolean =>
    parts.every((part) => part.length > 0 && !part.includes('..'))

/**
 * A flat `id.json` may be 260 characters so a 255-character id still fits.
 * Directory segments stay on the 255-character allowlist, which is what lets
 * an already-exported nested name be read and then rejected on its raw id.
 */
const isSafeImageEntryPath = (relativeName: string): boolean => {
    const parts = relativeName.split('/')
    const entryName = parts[parts.length - 1]
    if (!entryName || !pathPartsArePresent(parts)) return false
    if (!isSafeImageEntryName(entryName)) return false
    return parts.slice(0, -1).every((part) => part.length <= 255 && FILENAME_SAFE_REGEX.test(part))
}

const getStoredImageId = (image: unknown): string | undefined =>
    isRecord(image) && isSafeStoredImageId(image.id) ? image.id : undefined

const isNonNegativeTimestamp = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const isStoredImageShape = (image: unknown): image is StoredImageData => {
    if (!isRecord(image) || !isSafeStoredImageId(image.id)) return false
    return typeof image.data === 'string' && isNonNegativeTimestamp(image.createdAt)
}

const boundedImageUrl = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    if (value.length > MAX_IMAGE_DATA_URL_LENGTH) return undefined
    return value
}

const normalizeSafeSavedTipImageUrl = async (value: unknown): Promise<string | undefined> => {
    const raw = boundedImageUrl(value)
    if (!raw) return undefined
    const normalized = boundedImageUrl(normalizeImageDataUrl(raw))
    if (!normalized) return undefined
    if (!(await isSafeRasterImageDataUrl(normalized))) return undefined
    return normalized
}

export const plantEntitiesOf = (plants: unknown): unknown[] => {
    if (Array.isArray(plants)) return plants
    if (!isRecord(plants) || !isRecord(plants.entities)) return []
    return Object.values(plants.entities)
}

const dropRejectedImageId = (
    details: Record<string, unknown>,
    rejectedImageIds: ReadonlySet<string>,
): boolean => {
    if (typeof details.imageId !== 'string' || !rejectedImageIds.has(details.imageId)) return false
    delete details.imageId
    return true
}

const dropUnsafeJournalImage = async (
    details: Record<string, unknown>,
    referencesRejectedImage: boolean,
): Promise<number> => {
    if (!('imageUrl' in details)) return 0
    if (await isSafeRasterImageDataUrl(details.imageUrl)) return 0
    delete details.imageUrl
    return referencesRejectedImage ? 0 : 1
}

const sanitizeJournalEntry = (
    entry: unknown,
    rejectedImageIds: ReadonlySet<string>,
): Promise<number> => {
    if (!isRecord(entry) || !isRecord(entry.details)) return Promise.resolve(0)
    const referencesRejectedImage = dropRejectedImageId(entry.details, rejectedImageIds)
    return dropUnsafeJournalImage(entry.details, referencesRejectedImage)
}

const journalEntriesOf = (plant: unknown): unknown[] => {
    if (!isRecord(plant) || !Array.isArray(plant.journal)) return []
    return plant.journal
}

const sanitizePlantJournals = async (
    plants: unknown,
    rejectedImageIds: ReadonlySet<string>,
): Promise<number> => {
    let rejectedInlineImageCount = 0
    for (const plant of plantEntitiesOf(plants)) {
        for (const entry of journalEntriesOf(plant)) {
            rejectedInlineImageCount += await sanitizeJournalEntry(entry, rejectedImageIds)
        }
    }
    return rejectedInlineImageCount
}

const sanitizeSavedStrainTip = async (tip: unknown): Promise<number> => {
    if (!isRecord(tip) || !('imageUrl' in tip)) return 0
    const normalizedImageUrl = await normalizeSafeSavedTipImageUrl(tip.imageUrl)
    if (normalizedImageUrl) {
        tip.imageUrl = normalizedImageUrl
        return 0
    }
    delete tip.imageUrl
    return 1
}

const savedTipEntities = (savedItems: unknown): unknown[] => {
    if (!isRecord(savedItems) || !isRecord(savedItems.savedStrainTips)) return []
    const entities = savedItems.savedStrainTips.entities
    if (!isRecord(entities)) return []
    return Object.values(entities)
}

const sanitizeSavedStrainTips = async (savedItems: unknown): Promise<number> => {
    let rejectedInlineImageCount = 0
    for (const tip of savedTipEntities(savedItems)) {
        rejectedInlineImageCount += await sanitizeSavedStrainTip(tip)
    }
    return rejectedInlineImageCount
}

const sanitizeImportedStateImageReferences = async (
    state: unknown,
    rejectedImageIds: ReadonlySet<string>,
): Promise<number> => {
    if (!isRecord(state)) return 0
    const fromPlants = isRecord(state.simulation)
        ? await sanitizePlantJournals(state.simulation.plants, rejectedImageIds)
        : 0
    const fromTips = await sanitizeSavedStrainTips(state.savedItems)
    return fromPlants + fromTips
}

const isSameImage = (stored: unknown, image: StoredImageData): boolean =>
    isRecord(stored) && stored.data === image.data && stored.createdAt === image.createdAt

const keepNewImage = (
    imagesToWrite: StoredImageData[],
    existing: unknown,
    image: StoredImageData,
): void => {
    if (existing === undefined) {
        imagesToWrite.push(image)
        return
    }
    if (isSameImage(existing, image)) return
    throw new Error(String(getT()('settingsView.data.restoreBlocked')))
}

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
        keepNewImage(imagesToWrite, existingImages[index], image)
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
        queueRequests(tx.objectStore('images'))
    } catch (error) {
        tx.abort()
        transactionComplete.catch(() => undefined)
        throw error
    }
    await transactionComplete
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

interface ImportedImages {
    images: StoredImageData[]
    rejectedImageIds: Set<string>
    unidentifiedRejectedImageCount: number
}

const noteUnusableImage = (
    parsedImage: unknown,
    rejectedImageIds: Set<string>,
    tally: ImportedImages,
): void => {
    const rawImageId =
        isRecord(parsedImage) && typeof parsedImage.id === 'string' ? parsedImage.id : undefined
    if (rawImageId) {
        rejectedImageIds.add(rawImageId)
        return
    }
    tally.unidentifiedRejectedImageCount += 1
}

const duplicateImportedImage = (
    imageId: string | undefined,
    seenImageIds: Set<string>,
    imagesById: Map<string, StoredImageData>,
    tally: ImportedImages,
): boolean => {
    if (!imageId || !seenImageIds.has(imageId)) return false
    tally.rejectedImageIds.add(imageId)
    imagesById.delete(imageId)
    return true
}

const usableImportedImage = async (parsedImage: unknown): Promise<StoredImageData | undefined> => {
    if (!isStoredImageShape(parsedImage)) return undefined
    if (!(await isSafeRasterImageDataUrl(parsedImage.data))) return undefined
    return parsedImage
}

const keepImportedImage = (
    imageId: string | undefined,
    image: StoredImageData,
    imagesById: Map<string, StoredImageData>,
    tally: ImportedImages,
): void => {
    if (!imageId || tally.rejectedImageIds.has(imageId)) return
    imagesById.set(imageId, image)
}

const acceptImportedImage = async (
    parsedImage: unknown,
    seenImageIds: Set<string>,
    imagesById: Map<string, StoredImageData>,
    tally: ImportedImages,
): Promise<void> => {
    const imageId = getStoredImageId(parsedImage)
    if (duplicateImportedImage(imageId, seenImageIds, imagesById, tally)) return
    if (imageId) seenImageIds.add(imageId)
    const usable = await usableImportedImage(parsedImage)
    if (!usable) {
        noteUnusableImage(parsedImage, tally.rejectedImageIds, tally)
        return
    }
    keepImportedImage(imageId, usable, imagesById, tally)
}

const readImportedImage = async (
    zip: JSZip,
    imgPath: string,
    limits: Readonly<BackupImportLimits>,
    budget: { remaining: number },
    seenImageIds: Set<string>,
    imagesById: Map<string, StoredImageData>,
    tally: ImportedImages,
): Promise<void> => {
    const imgFile = zip.file(imgPath)
    if (!imgFile) return
    try {
        const imgString = await readEntryText(imgFile, limits.maxImageEntryBytes, budget)
        const parsedImage: unknown = JSON.parse(imgString)
        await acceptImportedImage(parsedImage, seenImageIds, imagesById, tally)
    } catch (error) {
        // A corrupt photo is skipped; an oversized one fails the whole import
        // before anything is written (#671).
        if (error instanceof BackupImportLimitError) throw error
        tally.unidentifiedRejectedImageCount += 1
        console.debug(`[backupService] Skipping corrupt image: ${imgPath}`)
    }
}

const countUnrestorableImageName = (name: string, tally: ImportedImages): boolean => {
    if (!name.startsWith(IMAGES_DIR) || !name.endsWith(IMAGE_JSON_SUFFIX)) return false
    if (isSafeImageEntryPath(name.slice(IMAGES_DIR.length))) return false
    tally.unidentifiedRejectedImageCount += 1
    return true
}

const imageEntryPaths = (zip: JSZip, tally: ImportedImages): string[] =>
    Object.keys(zip.files).filter((name) => {
        if (countUnrestorableImageName(name, tally)) return false
        return name.startsWith(IMAGES_DIR) && isSafeImageEntryPath(name.slice(IMAGES_DIR.length))
    })

const collectImportedImages = async (
    zip: JSZip,
    limits: Readonly<BackupImportLimits>,
    budget: { remaining: number },
): Promise<ImportedImages> => {
    const imagesById = new Map<string, StoredImageData>()
    const seenImageIds = new Set<string>()
    const tally: ImportedImages = {
        images: [],
        rejectedImageIds: new Set<string>(),
        unidentifiedRejectedImageCount: 0,
    }
    for (const imgPath of imageEntryPaths(zip, tally)) {
        await readImportedImage(zip, imgPath, limits, budget, seenImageIds, imagesById, tally)
    }
    tally.images = [...imagesById.values()]
    return tally
}

const limitExceededResult = (): BackupImportResult => ({
    success: false,
    metadata: null,
    rejectedImageCount: 0,
    error: 'Backup exceeds the import limits',
    errorCode: 'limitExceeded',
})

const failedImport = (error: string, errorCode?: BackupImportErrorCode): BackupImportResult => ({
    success: false,
    metadata: null,
    rejectedImageCount: 0,
    error,
    ...(errorCode === undefined ? {} : { errorCode }),
})

interface ImportTally {
    rejectedImageIds: Set<string>
    unidentifiedRejectedImageCount: number
    rejectedInlineImageCount: number
}

const rejectedTotal = (tally: ImportTally): number =>
    tally.rejectedImageIds.size +
    tally.unidentifiedRejectedImageCount +
    tally.rejectedInlineImageCount

const emptyTally = (): ImportTally => ({
    rejectedImageIds: new Set<string>(),
    unidentifiedRejectedImageCount: 0,
    rejectedInlineImageCount: 0,
})

type StopOr<T> = { kind: 'value'; value: T } | { kind: 'stop'; result: BackupImportResult }

const rejectOversizedBackup = (file: File): BackupImportResult | undefined => {
    if (file.size <= MAX_IMPORT_SIZE_BYTES) return undefined
    const sizeMb = (file.size / 1024 / 1024).toFixed(1)
    const maxMb = MAX_IMPORT_SIZE_BYTES / 1024 / 1024
    return failedImport(`File too large (${sizeMb} MB). Max ${maxMb} MB.`, 'limitExceeded')
}

const openBackupZip = async (
    file: File,
    limits: Readonly<BackupImportLimits>,
): Promise<StopOr<JSZip>> => {
    const oversized = rejectOversizedBackup(file)
    if (oversized) return { kind: 'stop', result: oversized }
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    if (Object.keys(zip.files).length > limits.maxEntries) {
        return { kind: 'stop', result: limitExceededResult() }
    }
    return { kind: 'value', value: zip }
}

const parseBackupState = (raw: string): StopOr<object> => {
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return { kind: 'stop', result: failedImport('Invalid backup: corrupt state JSON') }
    }
    if (typeof parsed !== 'object' || parsed === null) {
        return { kind: 'stop', result: failedImport('Invalid backup: state is not an object') }
    }
    return { kind: 'value', value: parsed }
}

const readBackupState = async (
    zip: JSZip,
    limits: Readonly<BackupImportLimits>,
    budget: { remaining: number },
): Promise<StopOr<object>> => {
    const stateFile = zip.file(STATE_FILENAME)
    if (!stateFile)
        return { kind: 'stop', result: failedImport('Invalid backup: missing state file') }
    const raw = await readEntryText(stateFile, limits.maxStateBytes, budget)
    return parseBackupState(raw)
}

const readBackupMetadata = async (
    zip: JSZip,
    limits: Readonly<BackupImportLimits>,
    budget: { remaining: number },
): Promise<BackupMetadata | null> => {
    const metaFile = zip.file(METADATA_FILENAME)
    if (!metaFile) return null
    try {
        const metaString = await readEntryText(metaFile, limits.maxMetadataBytes, budget)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return JSON.parse(metaString) as BackupMetadata
    } catch (error) {
        if (error instanceof BackupImportLimitError) throw error
        return null
    }
}

/**
 * The archived plant journals of the backup (GH #667), or undefined for a backup
 * that has none (older ones, or a journal that never outgrew the retention
 * limit). A corrupt entry refuses the whole import before anything is written:
 * restoring everything but the journal would drop data without saying so.
 */
const readBackupArchivedJournal = async (
    zip: JSZip,
    limits: Readonly<BackupImportLimits>,
    budget: { remaining: number },
): Promise<ArchivedJournal | undefined> => {
    const file = zip.file(ARCHIVED_JOURNAL_FILENAME)
    if (!file) return undefined
    const raw = await readEntryText(file, limits.maxStateBytes, budget)
    try {
        return parseArchivedJournal(raw)
    } catch (error) {
        throw new Error('Invalid backup: corrupt archived journal', { cause: error })
    }
}

/** Archived entries refer to photos like live ones; drop what the import rejected. */
const sanitizeArchivedJournal = async (
    archive: ArchivedJournal | undefined,
    rejectedImageIds: ReadonlySet<string>,
): Promise<number> => {
    if (!archive) return 0
    let rejectedInlineImageCount = 0
    for (const entry of archivedEntriesOf(archive)) {
        rejectedInlineImageCount += await sanitizeJournalEntry(entry, rejectedImageIds)
    }
    return rejectedInlineImageCount
}

const imageWritePlan = async (
    images: StoredImageData[],
): Promise<{ imageDb: IDBDatabase | undefined; imagesToWrite: StoredImageData[] }> => {
    if (images.length === 0) return { imageDb: undefined, imagesToWrite: images }
    const imageDb = await openDB()
    if (!imageDb.objectStoreNames.contains('images')) {
        throw new Error('Image storage unavailable; backup images were not restored')
    }
    return { imageDb, imagesToWrite: await findImagesToWrite(imageDb, images) }
}

const dependentImageWrite = (
    imageDb: IDBDatabase | undefined,
    images: StoredImageData[],
): DependentStoreWrite | undefined => {
    if (!imageDb || images.length === 0) return undefined
    return createImageRestoreWrite(imageDb, images)
}

const restoreOutcome = (
    restoreResult: { success: boolean; reloadRequired: boolean },
    metadata: BackupMetadata | null,
    rejectedImageCount: number,
): BackupImportResult => {
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
}

const importFailure = (error: unknown, tally: ImportTally): BackupImportResult => {
    if (error instanceof BackupImportLimitError) return limitExceededResult()
    const message = error instanceof Error ? error.message : 'Unknown import error'
    console.error('[backupService] Import failed:', message)
    return {
        success: false,
        metadata: null,
        rejectedImageCount: rejectedTotal(tally),
        error: message,
    }
}

const commitBackupRestore = async (
    zip: JSZip,
    limits: Readonly<BackupImportLimits>,
    budget: { remaining: number },
    parsedState: object,
    metadata: BackupMetadata | null,
    tally: ImportTally,
): Promise<BackupImportResult> => {
    const imported = await collectImportedImages(zip, limits, budget)
    const archivedJournal = await readBackupArchivedJournal(zip, limits, budget)
    tally.rejectedImageIds = imported.rejectedImageIds
    tally.unidentifiedRejectedImageCount = imported.unidentifiedRejectedImageCount
    tally.rejectedInlineImageCount =
        (await sanitizeImportedStateImageReferences(parsedState, tally.rejectedImageIds)) +
        (await sanitizeArchivedJournal(archivedJournal, tally.rejectedImageIds))
    const prepared = await imageWritePlan(imported.images)
    const restoreResult = await replacePrimaryPersistedSnapshotForRecovery(
        JSON.stringify(parsedState),
        combineDependentWrites([
            dependentImageWrite(prepared.imageDb, prepared.imagesToWrite),
            archivedJournal ? createArchivedJournalRestoreWrite(archivedJournal) : undefined,
        ]),
    )
    return restoreOutcome(restoreResult, metadata, rejectedTotal(tally))
}

const restoreBackupArchive = async (
    file: File,
    limits: Readonly<BackupImportLimits>,
    tally: ImportTally,
): Promise<BackupImportResult> => {
    const opened = await openBackupZip(file, limits)
    if (opened.kind === 'stop') return opened.result
    const budget = { remaining: limits.maxTotalBytes }
    const state = await readBackupState(opened.value, limits, budget)
    if (state.kind === 'stop') return state.result
    const metadata = await readBackupMetadata(opened.value, limits, budget)
    return commitBackupRestore(opened.value, limits, budget, state.value, metadata, tally)
}

export const importBackupArchive = async (
    file: File,
    limits: Readonly<BackupImportLimits> = BACKUP_IMPORT_LIMITS,
): Promise<BackupImportResult> => {
    const tally = emptyTally()
    try {
        return await restoreBackupArchive(file, limits, tally)
    } catch (error) {
        return importFailure(error, tally)
    }
}
