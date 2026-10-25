// Bounded decoding and header validation for raster images imported from backups.

const SAFE_IMAGE_DATA_URL =
    /^data:image\/(jpeg|png|webp|gif|heic|heif);base64,([a-z0-9+/]+={0,2})$/iu
const MAX_IMAGE_DATA_URL_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_DATA_URL_LENGTH = 64 + Math.ceil(MAX_IMAGE_DATA_URL_BYTES / 3) * 4
const MAX_IMAGE_DIMENSION = 8192
const MAX_IMAGE_PIXELS = 32 * 1024 * 1024
const JPEG_START_OF_FRAME_MARKERS = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
])

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

const readHeifDimensions = (
    mimeType: string,
    bytes: Uint8Array,
): Array<{ width: number; height: number }> | undefined => {
    if (bytes.length < 20 || !readAscii(bytes, 4, 'ftyp')) return undefined

    const fileTypeSize = readUint32BigEndian(bytes, 0)
    if (
        fileTypeSize < 16 ||
        fileTypeSize > bytes.length ||
        (fileTypeSize - 16) % 4 !== 0 ||
        (fileTypeSize - 16) / 4 > 256
    ) {
        return undefined
    }

    const heicBrands = new Set(['heic', 'heix', 'hevc', 'hevx'])
    const heifBrands = new Set(['heif', 'mif1', 'msf1'])
    const allowedBrands = mimeType === 'image/heic' ? heicBrands : heifBrands
    const isAllowedBrand = (offset: number): boolean =>
        allowedBrands.has(
            String.fromCharCode(
                bytes[offset]!,
                bytes[offset + 1]!,
                bytes[offset + 2]!,
                bytes[offset + 3]!,
            ),
        )
    let hasAllowedBrand = isAllowedBrand(8)
    for (let offset = 16; !hasAllowedBrand && offset < fileTypeSize; offset += 4) {
        hasAllowedBrand = isAllowedBrand(offset)
    }
    if (!hasAllowedBrand) return undefined

    let visitedBoxes = 0
    const findDimensions = (
        start: number,
        end: number,
        depth: number,
        inImageProperties = false,
    ): Array<{ width: number; height: number }> | undefined => {
        if (depth > 8) return undefined
        let offset = start
        const dimensions: Array<{ width: number; height: number }> = []

        while (offset < end) {
            visitedBoxes += 1
            if (visitedBoxes > 4096 || end - offset < 8) return undefined

            let boxSize = readUint32BigEndian(bytes, offset)
            const boxType = String.fromCharCode(
                bytes[offset + 4]!,
                bytes[offset + 5]!,
                bytes[offset + 6]!,
                bytes[offset + 7]!,
            )
            let headerSize = 8
            if (boxSize === 1) {
                if (end - offset < 16 || readUint32BigEndian(bytes, offset + 8) !== 0) {
                    return undefined
                }
                boxSize = readUint32BigEndian(bytes, offset + 12)
                headerSize = 16
            } else if (boxSize === 0) {
                boxSize = end - offset
            }

            if (boxSize < headerSize || boxSize > end - offset) return undefined
            const payloadStart = offset + headerSize
            const boxEnd = offset + boxSize

            if (boxType === 'ispe' && inImageProperties) {
                if (boxSize < headerSize + 12) return undefined
                dimensions.push({
                    width: readUint32BigEndian(bytes, payloadStart + 4),
                    height: readUint32BigEndian(bytes, payloadStart + 8),
                })
                if (dimensions.length > 256) return undefined
            }

            if (boxType === 'meta' || boxType === 'iprp' || boxType === 'ipco') {
                const childStart = boxType === 'meta' ? payloadStart + 4 : payloadStart
                if (childStart > boxEnd) return undefined
                const childDimensions = findDimensions(
                    childStart,
                    boxEnd,
                    depth + 1,
                    inImageProperties || boxType === 'ipco',
                )
                if (childDimensions === undefined) return undefined
                dimensions.push(...childDimensions)
                if (dimensions.length > 256) return undefined
            }

            offset = boxEnd
        }

        return dimensions
    }

    const dimensions = findDimensions(0, bytes.length, 0)
    return dimensions?.length ? dimensions : undefined
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

export const isSafeRasterImageDataUrl = async (value: unknown): Promise<boolean> => {
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

    const heifDimensions =
        mimeType === 'image/heic' || mimeType === 'image/heif'
            ? readHeifDimensions(mimeType, bytes)
            : undefined
    const dimensions = readImageDimensions(mimeType, bytes)
    const dimensionCandidates = heifDimensions ?? (dimensions ? [dimensions] : [])
    if (
        dimensionCandidates.length === 0 ||
        dimensionCandidates.some(({ width, height }) => !isWithinImageBounds(width, height))
    ) {
        return false
    }

    const decode = globalThis.createImageBitmap
    if (typeof decode !== 'function') return false
    let bitmap: ImageBitmap | undefined
    try {
        bitmap = await decode(new Blob([bytes], { type: mimeType }))
        const dimensionsMatch = dimensionCandidates.some(
            ({ width, height }) =>
                (bitmap.width === width && bitmap.height === height) ||
                (bitmap.width === height && bitmap.height === width),
        )
        return dimensionsMatch && isWithinImageBounds(bitmap.width, bitmap.height)
    } catch {
        return false
    } finally {
        bitmap?.close()
    }
}
