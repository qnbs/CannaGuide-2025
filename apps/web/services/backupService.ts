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
import { replacePrimaryPersistedSnapshot } from '@/services/persistedStateService'
import { getT } from '@/i18n'
import type { StoredImageData } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATE_FILENAME = 'cannaguide-state.json'
const IMAGES_DIR = 'images/'
const METADATA_FILENAME = 'backup-meta.json'
const MAX_IMPORT_SIZE_BYTES = 512 * 1024 * 1024 // 512 MB hard limit
const FILENAME_SAFE_REGEX = /^[a-zA-Z0-9._-]+$/
const SAFE_IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,([a-z0-9+/]+={0,2})$/iu
const MAX_IMAGE_DATA_URL_BYTES = 10 * 1024 * 1024
const MAX_IMAGE_DATA_URL_LENGTH = 64 + Math.ceil(MAX_IMAGE_DATA_URL_BYTES / 3) * 4
const MAX_IMAGE_DIMENSION = 8192
const MAX_IMAGE_PIXELS = 32 * 1024 * 1024
const JPEG_START_OF_FRAME_MARKERS = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
])

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackupMetadata {
    version: string
    exportedAt: number
    appVersion: string
    plantCount: number
    imageCount: number
}

export interface BackupExportResult {
    success: boolean
    blob: Blob | null
    filename: string
    metadata: BackupMetadata | null
    error?: string | undefined
}

export interface BackupImportResult {
    success: boolean
    metadata: BackupMetadata | null
    error?: string | undefined
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const readUint32BigEndian = (bytes: Uint8Array, offset: number): number =>
    bytes[offset]! * 0x1000000 +
    bytes[offset + 1]! * 0x10000 +
    bytes[offset + 2]! * 0x100 +
    bytes[offset + 3]!

const readUint24LittleEndian = (bytes: Uint8Array, offset: number): number =>
    bytes[offset]! + bytes[offset + 1]! * 0x100 + bytes[offset + 2]! * 0x10000

const readAscii = (bytes: Uint8Array, offset: number, value: string): boolean =>
    [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0))

const readJpegDimensions = (bytes: Uint8Array): { width: number; height: number } | undefined => {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined

    let offset = 2
    while (offset < bytes.length) {
        if (bytes[offset] !== 0xff) return undefined
        while (bytes[offset] === 0xff) offset += 1
        if (offset >= bytes.length) return undefined

        const marker = bytes[offset++]!
        if (marker === 0xd9 || marker === 0xda) return undefined
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
        if (offset + 2 > bytes.length) return undefined

        const segmentLength = bytes[offset]! * 0x100 + bytes[offset + 1]!
        if (segmentLength < 2 || offset + segmentLength > bytes.length) return undefined
        if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
            if (segmentLength < 7) return undefined
            return {
                height: bytes[offset + 3]! * 0x100 + bytes[offset + 4]!,
                width: bytes[offset + 5]! * 0x100 + bytes[offset + 6]!,
            }
        }
        offset += segmentLength
    }

    return undefined
}

const readImageDimensions = (
    mimeType: string,
    bytes: Uint8Array,
): { width: number; height: number } | undefined => {
    if (mimeType === 'image/png') {
        if (
            bytes.length < 24 ||
            !readAscii(bytes, 1, 'PNG\r\n\x1a\n') ||
            readUint32BigEndian(bytes, 8) !== 13 ||
            !readAscii(bytes, 12, 'IHDR')
        ) {
            return undefined
        }
        return { width: readUint32BigEndian(bytes, 16), height: readUint32BigEndian(bytes, 20) }
    }

    if (mimeType === 'image/gif') {
        if (
            bytes.length < 10 ||
            (!readAscii(bytes, 0, 'GIF87a') && !readAscii(bytes, 0, 'GIF89a'))
        ) {
            return undefined
        }
        return {
            width: bytes[6]! + bytes[7]! * 0x100,
            height: bytes[8]! + bytes[9]! * 0x100,
        }
    }

    if (mimeType === 'image/jpeg') return readJpegDimensions(bytes)

    if (mimeType === 'image/webp') {
        if (bytes.length < 25 || !readAscii(bytes, 0, 'RIFF') || !readAscii(bytes, 8, 'WEBP')) {
            return undefined
        }
        const riffSize = bytes[4]! + bytes[5]! * 0x100 + bytes[6]! * 0x10000 + bytes[7]! * 0x1000000
        if (riffSize + 8 > bytes.length) return undefined

        if (readAscii(bytes, 12, 'VP8X') && bytes.length >= 30) {
            return {
                width: readUint24LittleEndian(bytes, 24) + 1,
                height: readUint24LittleEndian(bytes, 27) + 1,
            }
        }
        if (
            readAscii(bytes, 12, 'VP8 ') &&
            bytes.length >= 30 &&
            readAscii(bytes, 23, '\x9d\x01\x2a')
        ) {
            return {
                width: (bytes[26]! + bytes[27]! * 0x100) & 0x3fff,
                height: (bytes[28]! + bytes[29]! * 0x100) & 0x3fff,
            }
        }
        if (readAscii(bytes, 12, 'VP8L') && bytes[20] === 0x2f && bytes.length >= 25) {
            return {
                width: 1 + bytes[21]! + ((bytes[22]! & 0x3f) << 8),
                height:
                    1 +
                    ((bytes[22]! & 0xc0) >> 6) +
                    (bytes[23]! << 2) +
                    ((bytes[24]! & 0x0f) << 10),
            }
        }
    }

    return undefined
}

const isWithinImageBounds = (width: number, height: number): boolean =>
    Number.isSafeInteger(width) &&
    Number.isSafeInteger(height) &&
    width > 0 &&
    height > 0 &&
    width <= MAX_IMAGE_DIMENSION &&
    height <= MAX_IMAGE_DIMENSION &&
    width * height <= MAX_IMAGE_PIXELS

const isSafeRasterImageDataUrl = async (value: unknown): Promise<boolean> => {
    if (typeof value !== 'string' || value.length > MAX_IMAGE_DATA_URL_LENGTH) return false
    const match = SAFE_IMAGE_DATA_URL.exec(value)
    if (!match) return false

    const mimeType = `image/${match[1]!.toLowerCase()}`
    const base64 = match[2]!
    if (base64.length % 4 !== 0 || base64.length > Math.ceil(MAX_IMAGE_DATA_URL_BYTES / 3) * 4) {
        return false
    }

    let binary: string
    try {
        binary = atob(base64)
    } catch {
        return false
    }
    if (binary.length === 0 || binary.length > MAX_IMAGE_DATA_URL_BYTES) return false

    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }

    const dimensions = readImageDimensions(mimeType, bytes)
    if (!dimensions || !isWithinImageBounds(dimensions.width, dimensions.height)) return false

    const decode = globalThis.createImageBitmap
    if (typeof decode !== 'function') return false
    let bitmap: ImageBitmap | undefined
    try {
        bitmap = await decode(new Blob([bytes], { type: mimeType }))
        const dimensionsMatch =
            (bitmap.width === dimensions.width && bitmap.height === dimensions.height) ||
            (bitmap.width === dimensions.height && bitmap.height === dimensions.width)
        return dimensionsMatch && isWithinImageBounds(bitmap.width, bitmap.height)
    } catch {
        return false
    } finally {
        bitmap?.close()
    }
}

const sanitizeImportedStateImageReferences = async (
    state: unknown,
    rejectedImageIds: ReadonlySet<string>,
): Promise<void> => {
    if (!isRecord(state)) return

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
                if (
                    typeof entry.details.imageId === 'string' &&
                    rejectedImageIds.has(entry.details.imageId)
                ) {
                    delete entry.details.imageId
                }
                if (
                    'imageUrl' in entry.details &&
                    !(await isSafeRasterImageDataUrl(entry.details.imageUrl))
                ) {
                    delete entry.details.imageUrl
                }
            }
        }
    }

    if (!isRecord(state.savedItems) || !isRecord(state.savedItems.savedStrainTips)) return
    const entities = state.savedItems.savedStrainTips.entities
    if (!isRecord(entities)) return
    for (const tip of Object.values(entities)) {
        if (!isRecord(tip) || !('imageUrl' in tip)) continue
        if (!(await isSafeRasterImageDataUrl(tip.imageUrl))) delete tip.imageUrl
    }
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
        const existing = existingImages[index]
        if (existing === undefined) {
            imagesToWrite.push(image)
            continue
        }
        if (
            isRecord(existing) &&
            existing.data === image.data &&
            existing.createdAt === image.createdAt
        ) {
            continue
        }
        throw new Error(String(getT()('settingsView.data.restoreBlocked')))
    }

    return imagesToWrite
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

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

            zip.file(STATE_FILENAME, stateString)

            // 2. Images from IndexedDB (CannaGuideDB.images)
            let imageCount = 0
            try {
                const db = await new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open('CannaGuideDB')
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })

                if (db.objectStoreNames.contains('images')) {
                    const tx = db.transaction('images', 'readonly')
                    const store = tx.objectStore('images')
                    const allImages = await new Promise<Array<{ id: string; data: string }>>(
                        (resolve, reject) => {
                            const request = store.getAll()
                            request.onsuccess = () =>
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                resolve(request.result as Array<{ id: string; data: string }>)
                            request.onerror = () => reject(request.error)
                        },
                    )

                    for (const img of allImages) {
                        if (typeof img.id === 'string' && typeof img.data === 'string') {
                            const safeName = img.id.replace(/[^a-zA-Z0-9._-]/g, '_')
                            zip.file(`${IMAGES_DIR}${safeName}.json`, JSON.stringify(img))
                            imageCount++
                        }
                    }
                }
                db.close()
            } catch {
                console.debug('[backupService] Could not export images -- skipping')
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
    async importBackup(file: File): Promise<BackupImportResult> {
        let imageDb: IDBDatabase | undefined
        try {
            // Size guard
            if (file.size > MAX_IMPORT_SIZE_BYTES) {
                return {
                    success: false,
                    metadata: null,
                    error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_IMPORT_SIZE_BYTES / 1024 / 1024} MB.`,
                }
            }

            const arrayBuffer = await file.arrayBuffer()
            const zip = await JSZip.loadAsync(arrayBuffer)

            // 1. Validate structure
            const stateFile = zip.file(STATE_FILENAME)
            if (!stateFile) {
                return {
                    success: false,
                    metadata: null,
                    error: 'Invalid backup: missing state file',
                }
            }

            // 2. Parse and validate state JSON
            const stateString = await stateFile.async('string')
            let parsedState: unknown
            try {
                parsedState = JSON.parse(stateString)
            } catch {
                return {
                    success: false,
                    metadata: null,
                    error: 'Invalid backup: corrupt state JSON',
                }
            }

            if (typeof parsedState !== 'object' || parsedState === null) {
                return {
                    success: false,
                    metadata: null,
                    error: 'Invalid backup: state is not an object',
                }
            }

            // 3. Read metadata (optional)
            let metadata: BackupMetadata | null = null
            const metaFile = zip.file(METADATA_FILENAME)
            if (metaFile) {
                try {
                    const metaString = await metaFile.async('string')
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    metadata = JSON.parse(metaString) as BackupMetadata
                } catch {
                    // Non-critical
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
            const rejectedImageIds = new Set<string>()

            for (const imgPath of imageFiles) {
                const imgFile = zip.file(imgPath)
                if (!imgFile) continue
                try {
                    const imgString = await imgFile.async('string')
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
                        if (imageId) rejectedImageIds.add(imageId)
                        continue
                    }
                    if (imageId && !rejectedImageIds.has(imageId)) {
                        imagesById.set(imageId, parsedImage)
                    }
                } catch {
                    console.debug(`[backupService] Skipping corrupt image: ${imgPath}`)
                }
            }

            const images = [...imagesById.values()]
            await sanitizeImportedStateImageReferences(parsedState, rejectedImageIds)
            const sanitizedStateString = JSON.stringify(parsedState)
            let imagesToWrite = images

            // Check image storage before replacing the current state. Keep the
            // connection, but open the write transaction only when ready to write.
            if (images.length > 0) {
                imageDb = await new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open('CannaGuideDB')
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })
                if (!imageDb.objectStoreNames.contains('images')) {
                    throw new Error('Image storage unavailable; backup images were not restored')
                }
                imagesToWrite = await findImagesToWrite(imageDb, images)
            }

            // 4. Restore state to IndexedDB
            const stateRestored = await replacePrimaryPersistedSnapshot(sanitizedStateString)
            if (!stateRestored) {
                return {
                    success: false,
                    metadata,
                    error: String(getT()('settingsView.data.restoreBlocked')),
                }
            }

            // 5. Restore images
            if (imageDb && imagesToWrite.length > 0) {
                const tx = imageDb.transaction('images', 'readwrite')
                const store = tx.objectStore('images')
                const transactionComplete = new Promise<void>((resolve, reject) => {
                    tx.oncomplete = () => resolve()
                    tx.onerror = () => reject(tx.error)
                    tx.onabort = () => reject(tx.error)
                })

                // Queue writes synchronously so the transaction remains active.
                for (const image of imagesToWrite) store.add(image)
                await transactionComplete
            }

            return {
                success: true,
                metadata,
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown import error'
            console.error('[backupService] Import failed:', msg)
            return {
                success: false,
                metadata: null,
                error: msg,
            }
        } finally {
            imageDb?.close()
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
