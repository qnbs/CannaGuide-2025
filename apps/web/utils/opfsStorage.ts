/**
 * OPFS (Origin Private File System) storage utilities for ML model persistence.
 *
 * OPFS is more resistant to automatic browser eviction than IndexedDB,
 * making it suitable for caching large ML models (Whisper, CLIP, MiniLM)
 * that would be expensive to re-download on mobile devices.
 *
 * Browser support:
 * - Chrome 86+, Edge 86+, Firefox 111+, Safari 15.2+
 * - Requires secure context (HTTPS or localhost)
 *
 * Usage: import { opfsStorage } from '@/utils/opfsStorage'
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
 */

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------

/** Check if OPFS is available in the current browser. */
export function isOpfsAvailable(): boolean {
    return (
        typeof navigator !== 'undefined' &&
        'storage' in navigator &&
        typeof navigator.storage.getDirectory === 'function'
    )
}

// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------

const CANNAGUIDE_DIR = 'cannaguide-ml-cache'

/** Get the CG-scoped OPFS directory handle, creating it if needed. */
async function getRootDir(): Promise<FileSystemDirectoryHandle> {
    const root = await navigator.storage.getDirectory()
    return root.getDirectoryHandle(CANNAGUIDE_DIR, { create: true })
}

/**
 * Write a blob/ArrayBuffer to OPFS under the given key.
 * Overwrites existing files with the same key.
 */
export async function writeModel(key: string, data: ArrayBuffer | Blob): Promise<void> {
    const dir = await getRootDir()
    const fileHandle = await dir.getFileHandle(key, { create: true })
    const writable = await fileHandle.createWritable()
    try {
        await writable.write(data)
    } finally {
        await writable.close()
    }
}

/**
 * Read a model from OPFS by key. Returns null if not found.
 */
export async function readModel(key: string): Promise<ArrayBuffer | null> {
    try {
        const dir = await getRootDir()
        const fileHandle = await dir.getFileHandle(key)
        const file = await fileHandle.getFile()
        return await file.arrayBuffer()
    } catch {
        // NotFoundError or other FS errors
        return null
    }
}

/**
 * Check if a model exists in OPFS and return its size in bytes.
 * Returns null if not found.
 */
export async function getModelInfo(key: string): Promise<{ size: number } | null> {
    try {
        const dir = await getRootDir()
        const fileHandle = await dir.getFileHandle(key)
        const file = await fileHandle.getFile()
        return { size: file.size }
    } catch {
        return null
    }
}

/** Delete a specific model from OPFS. */
export async function deleteModel(key: string): Promise<boolean> {
    try {
        const dir = await getRootDir()
        await dir.removeEntry(key)
        return true
    } catch {
        return false
    }
}

/** List all cached model keys in OPFS. */
export async function listModels(): Promise<string[]> {
    const dir = await getRootDir()
    const keys: string[] = []
    // FileSystemDirectoryHandle async iteration via for-await
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const iterable = dir as unknown as AsyncIterable<[string, FileSystemHandle]>
    for await (const [name] of iterable) {
        keys.push(name)
    }
    return keys
}

/** Get total OPFS cache size in bytes. */
export async function getCacheSize(): Promise<number> {
    const keys = await listModels()
    let total = 0
    for (const key of keys) {
        const info = await getModelInfo(key)
        if (info) total += info.size
    }
    return total
}

/** Clear all cached models from OPFS. */
export async function clearCache(): Promise<void> {
    const keys = await listModels()
    const dir = await getRootDir()
    for (const key of keys) {
        try {
            await dir.removeEntry(key)
        } catch {
            // Ignore individual deletion errors
        }
    }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const opfsStorage = {
    isAvailable: isOpfsAvailable,
    write: writeModel,
    read: readModel,
    getInfo: getModelInfo,
    delete: deleteModel,
    list: listModels,
    getCacheSize,
    clear: clearCache,
} as const
