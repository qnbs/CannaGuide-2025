import { describe, expect, it } from 'vitest'
import { normalizeImageDataUrl } from '@/utils/imageDataUrl'

describe('normalizeImageDataUrl', () => {
    it('wraps raw base64 in a jpeg data url by default', () => {
        expect(normalizeImageDataUrl(' /9j/abc123 ')).toBe('data:image/jpeg;base64,/9j/abc123')
    })

    it('keeps existing image data urls intact', () => {
        const svgUrl = 'data:image/svg+xml;charset=utf-8,%3Csvg%3Eok%3C/svg%3E'
        expect(normalizeImageDataUrl(svgUrl)).toBe(svgUrl)
    })

    it('repairs legacy nested data urls', () => {
        const legacyUrl =
            'data:image/jpeg;base64,data:image/svg+xml;charset=utf-8,%3Csvg%3Elegacy%3C/svg%3E'
        expect(normalizeImageDataUrl(legacyUrl)).toBe(
            'data:image/svg+xml;charset=utf-8,%3Csvg%3Elegacy%3C/svg%3E',
        )
    })
})
