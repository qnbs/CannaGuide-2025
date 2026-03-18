import { Plant } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000

export interface PhotoTimelineMetadata {
    capturedAt: number
    weekLabel: string
    dayLabel: string
    timelineLabel: string
    source: 'exif' | 'timestamp'
}

const clampTimestamp = (value: number): number => {
    if (!Number.isFinite(value) || value <= 0) {
        return Date.now()
    }

    return value > Date.now() + DAY_MS ? Date.now() : value
}

const formatExifDateString = (value: string): number | null => {
    const normalized = value.trim().replace(/^\0+/, '').replace(/:/g, '-', 2)
    const parsed = Date.parse(normalized.replace(' ', 'T'))
    return Number.isFinite(parsed) ? parsed : null
}

const readAscii = (view: DataView, offset: number, length: number): string => {
    let result = ''
    for (let index = 0; index < length; index += 1) {
        const code = view.getUint8(offset + index)
        if (code === 0) {
            break
        }
        result += String.fromCharCode(code)
    }
    return result
}

const readUint16 = (view: DataView, offset: number, littleEndian: boolean): number => view.getUint16(offset, littleEndian)
const readUint32 = (view: DataView, offset: number, littleEndian: boolean): number => view.getUint32(offset, littleEndian)

const extractExifTimestampFromJpeg = async (file: File): Promise<number | null> => {
    if (!file.type.toLowerCase().includes('jpeg') && !file.name.toLowerCase().match(/\.(jpe?g)$/)) {
        return null
    }

    const buffer = await file.arrayBuffer()
    const view = new DataView(buffer)

    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
        return null
    }

    let offset = 2
    while (offset + 4 < view.byteLength) {
        if (view.getUint8(offset) !== 0xff) {
            offset += 1
            continue
        }

        const marker = view.getUint8(offset + 1)
        const segmentLength = view.getUint16(offset + 2, false)
        if (marker === 0xe1) {
            const exifHeader = readAscii(view, offset + 4, 6)
            if (exifHeader !== 'Exif\0\0') {
                return null
            }

            const tiffStart = offset + 10
            const byteOrder = readAscii(view, tiffStart, 2)
            const littleEndian = byteOrder === 'II'
            if (!littleEndian && byteOrder !== 'MM') {
                return null
            }

            const ifd0Offset = readUint32(view, tiffStart + 4, littleEndian)
            const ifd0Entries = readUint16(view, tiffStart + ifd0Offset, littleEndian)

            let exifIfdOffset = 0
            for (let index = 0; index < ifd0Entries; index += 1) {
                const entryOffset = tiffStart + ifd0Offset + 2 + index * 12
                const tag = readUint16(view, entryOffset, littleEndian)
                if (tag === 0x8769) {
                    exifIfdOffset = readUint32(view, entryOffset + 8, littleEndian)
                    break
                }
            }

            if (!exifIfdOffset) {
                return null
            }

            const exifEntries = readUint16(view, tiffStart + exifIfdOffset, littleEndian)
            const candidateTags = [0x9003, 0x9004, 0x0132]

            for (const candidateTag of candidateTags) {
                for (let index = 0; index < exifEntries; index += 1) {
                    const entryOffset = tiffStart + exifIfdOffset + 2 + index * 12
                    const tag = readUint16(view, entryOffset, littleEndian)
                    if (tag !== candidateTag) {
                        continue
                    }

                    const type = readUint16(view, entryOffset + 2, littleEndian)
                    const count = readUint32(view, entryOffset + 4, littleEndian)
                    if (type !== 2 || count === 0) {
                        continue
                    }

                    const valueOffset = count <= 4
                        ? entryOffset + 8
                        : tiffStart + readUint32(view, entryOffset + 8, littleEndian)
                    const rawValue = readAscii(view, valueOffset, count)
                    const parsed = formatExifDateString(rawValue)
                    if (parsed) {
                        return parsed
                    }
                }
            }
        }

        if (segmentLength < 2) {
            break
        }

        offset += 2 + segmentLength
    }

    return null
}

export const buildPhotoTimelineMetadata = (plant: Plant, capturedAt: number): PhotoTimelineMetadata => {
    const normalizedCapturedAt = clampTimestamp(capturedAt)
    const plantDay = Math.max(1, Math.round((normalizedCapturedAt - plant.createdAt) / DAY_MS) + 1)
    const plantWeek = Math.max(1, Math.ceil(plantDay / 7))

    return {
        capturedAt: normalizedCapturedAt,
        weekLabel: `W${String(plantWeek).padStart(2, '0')}`,
        dayLabel: `D${String(plantDay).padStart(2, '0')}`,
        timelineLabel: `W${String(plantWeek).padStart(2, '0')} / D${String(plantDay).padStart(2, '0')}`,
        source: 'timestamp',
    }
}

export const photoTimelineService = {
    async readCaptureTimestamp(file: File): Promise<number | null> {
        try {
            const exifTimestamp = await extractExifTimestampFromJpeg(file)
            if (exifTimestamp) {
                return exifTimestamp
            }
        } catch {
            return null
        }

        return Number.isFinite(file.lastModified) && file.lastModified > 0 ? file.lastModified : null
    },
    buildPhotoTimelineMetadata,
}