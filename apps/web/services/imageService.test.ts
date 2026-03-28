import { describe, expect, it } from 'vitest'

import { base64ToMimeType, validateImageFile } from '@/services/imageService'

describe('imageService', () => {
    it('accepts supported image files and rejects invalid formats', () => {
        const png = new File(['x'], 'photo.png', { type: 'image/png' })
        const txt = new File(['x'], 'notes.txt', { type: 'text/plain' })

        expect(validateImageFile(png)).toBeNull()
        expect(validateImageFile(txt)).toBe('invalidFormat')
    })

    it('rejects files larger than 10MB', () => {
        const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.jpg', {
            type: 'image/jpeg',
        })

        expect(validateImageFile(big)).toBe('tooLarge')
    })

    it('maps base64 signatures to expected mime types', () => {
        expect(base64ToMimeType('R0lGODdhAAAA')).toBe('image/gif')
        expect(base64ToMimeType('iVBORw0KGgoAAA')).toBe('image/png')
        expect(base64ToMimeType('/9j/4AAQSk')).toBe('image/jpeg')
        expect(base64ToMimeType('unknown-signature')).toBe('image/jpeg')
    })
})
