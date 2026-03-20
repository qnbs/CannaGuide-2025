const BASE64_SIGNATURES: Array<[string, string]> = [
    ['R0lGODdh', 'image/gif'],
    ['iVBORw0KGgo', 'image/png'],
    ['/9j/', 'image/jpeg'],
]

const detectMimeTypeFromBase64 = (base64: string): string => {
    for (const [signature, mimeType] of BASE64_SIGNATURES) {
        if (base64.startsWith(signature)) {
            return mimeType
        }
    }

    return 'image/jpeg'
}

export const normalizeImageDataUrl = (value: string | null | undefined): string | undefined => {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return undefined
    }

    if (trimmed.startsWith('data:image/')) {
        const commaIndex = trimmed.indexOf(',')
        if (commaIndex === -1) {
            return trimmed
        }

        const payload = trimmed.slice(commaIndex + 1).trim()
        if (payload.startsWith('data:image/')) {
            return payload
        }

        return trimmed
    }

    if (trimmed.startsWith('data:')) {
        return trimmed
    }

    const mimeType = detectMimeTypeFromBase64(trimmed)
    return `data:${mimeType};base64,${trimmed}`
}
