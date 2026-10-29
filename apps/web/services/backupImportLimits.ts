import type JSZip from 'jszip'
import { MAX_IMAGE_DATA_URL_LENGTH } from '@/services/backupImageValidation'

/**
 * What an imported ZIP may inflate to (#671). Enforced on the bytes JSZip
 * actually produces while reading -- never on the sizes the archive declares,
 * which the file itself controls.
 */
export interface BackupImportLimits {
    maxEntries: number
    maxStateBytes: number
    maxMetadataBytes: number
    maxImageEntryBytes: number
    maxTotalBytes: number
}

const MIB = 1024 * 1024

export const BACKUP_IMPORT_LIMITS: Readonly<BackupImportLimits> = Object.freeze({
    // One entry per photo plus state and metadata: far above any real backup,
    // still cheap to list.
    maxEntries: 20_000,
    // The Redux snapshot of a long grow history is a few MiB.
    maxStateBytes: 128 * MIB,
    maxMetadataBytes: 64 * 1024,
    // One photo entry: its data URL (already capped) plus a small JSON frame.
    maxImageEntryBytes: MAX_IMAGE_DATA_URL_LENGTH + 64 * 1024,
    // Photos are base64 and hardly compress, so a real backup inflates to
    // little more than its compressed size (capped at 512 MiB).
    maxTotalBytes: 768 * MIB,
})

/** An entry, or the archive as a whole, inflates beyond its import limit. */
export class BackupImportLimitError extends Error {
    constructor(readonly entryName: string) {
        super(`[backupService] ${entryName} exceeds the import limits.`)
        this.name = 'BackupImportLimitError'
    }
}

interface InflateStream {
    on(event: 'data', listener: (chunk: Uint8Array) => void): InflateStream
    on(event: 'error', listener: (error: Error) => void): InflateStream
    on(event: 'end', listener: () => void): InflateStream
    pause(): InflateStream
    resume(): InflateStream
}

// JSZip 3 documents ZipObject#internalStream, but its typings omit it.
const hasInflateStream = (
    entry: object,
): entry is { internalStream(type: 'uint8array'): InflateStream } =>
    'internalStream' in entry && typeof entry.internalStream === 'function'

/**
 * Inflates one entry as UTF-8 text, counting bytes as they arrive: the read
 * stops as soon as the entry or the shared budget is exceeded, before the
 * whole text exists in memory (#671).
 */
export const readEntryText = (
    entry: JSZip.JSZipObject,
    maxBytes: number,
    budget: { remaining: number },
): Promise<string> =>
    new Promise((resolve, reject) => {
        if (!hasInflateStream(entry)) {
            reject(new BackupImportLimitError(entry.name))
            return
        }
        const chunks: Uint8Array[] = []
        let size = 0
        let stopped = false
        const stream = entry.internalStream('uint8array')
        stream.on('data', (chunk) => {
            if (stopped) return
            size += chunk.length
            budget.remaining -= chunk.length
            if (size > maxBytes || budget.remaining < 0) {
                stopped = true
                stream.pause()
                reject(new BackupImportLimitError(entry.name))
                return
            }
            chunks.push(chunk)
        })
        stream.on('error', (error) => {
            if (stopped) return
            stopped = true
            reject(error)
        })
        stream.on('end', () => {
            if (stopped) return
            const bytes = new Uint8Array(size)
            let offset = 0
            for (const chunk of chunks) {
                bytes.set(chunk, offset)
                offset += chunk.length
            }
            resolve(new TextDecoder().decode(bytes))
        })
        stream.resume()
    })
