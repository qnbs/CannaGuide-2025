// ---------------------------------------------------------------------------
// backupService -- ZIP Backup Export/Import for CannaGuide 2025
//
// Exports the full Redux state + IndexedDB image data as a single ZIP file.
// Imports restore the state and re-hydrate images.
//
// Security: Validates JSON structure on import, rejects oversized payloads,
// sanitises filenames via allowlist. No eval(), no dynamic code execution.
// ---------------------------------------------------------------------------

import JSZip from 'jszip'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATE_FILENAME = 'cannaguide-state.json'
const IMAGES_DIR = 'images/'
const METADATA_FILENAME = 'backup-meta.json'
const MAX_IMPORT_SIZE_BYTES = 512 * 1024 * 1024 // 512 MB hard limit
const FILENAME_SAFE_REGEX = /^[a-zA-Z0-9._-]+$/

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

            // 4. Restore state to IndexedDB
            await indexedDBStorage.setItem(REDUX_STATE_KEY, stateString)

            // 5. Restore images
            const imageFiles = Object.keys(zip.files).filter(
                (name) =>
                    name.startsWith(IMAGES_DIR) &&
                    name.endsWith('.json') &&
                    isSafeFilename(name.slice(IMAGES_DIR.length)),
            )

            if (imageFiles.length > 0) {
                try {
                    const db = await new Promise<IDBDatabase>((resolve, reject) => {
                        const request = indexedDB.open('CannaGuideDB')
                        request.onsuccess = () => resolve(request.result)
                        request.onerror = () => reject(request.error)
                    })

                    if (db.objectStoreNames.contains('images')) {
                        const tx = db.transaction('images', 'readwrite')
                        const store = tx.objectStore('images')

                        for (const imgPath of imageFiles) {
                            const imgFile = zip.file(imgPath)
                            if (!imgFile) continue
                            try {
                                const imgString = await imgFile.async('string')
                                const imgData = JSON.parse(imgString)
                                if (
                                    imgData &&
                                    typeof imgData === 'object' &&
                                    'id' in imgData &&
                                    typeof imgData.id === 'string'
                                ) {
                                    store.put(imgData)
                                }
                            } catch {
                                console.debug(`[backupService] Skipping corrupt image: ${imgPath}`)
                            }
                        }

                        await new Promise<void>((resolve, reject) => {
                            tx.oncomplete = () => resolve()
                            tx.onerror = () => reject(tx.error)
                        })
                    }
                    db.close()
                } catch {
                    console.debug('[backupService] Could not restore images')
                }
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
