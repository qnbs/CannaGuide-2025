import { describe, it, expect, vi } from 'vitest'
import { escapeXml, resolveStyle } from './strainImageSvgUtils'

vi.mock('@/utils/random', () => ({
    secureRandom: vi.fn(() => 0.99),
}))

describe('strainImageSvgUtils', () => {
    describe('escapeXml', () => {
        it('escapes XML special characters', () => {
            expect(escapeXml('Tom & "Jerry"')).toBe('Tom &amp; &quot;Jerry&quot;')
        })

        it('preserves plain text with ampersands', () => {
            expect(escapeXml('N-P-K & Ca')).toBe('N-P-K &amp; Ca')
        })

        it('strips HTML tags via DOMPurify', () => {
            expect(escapeXml('<b>bold</b>')).toBe('bold')
        })
    })

    describe('resolveStyle', () => {
        it('returns concrete style unchanged', () => {
            expect(resolveStyle('botanical')).toBe('botanical')
            expect(resolveStyle('cyberpunk')).toBe('cyberpunk')
        })

        it('picks a random style when style is random', () => {
            expect(resolveStyle('random')).toBe('cyberpunk')
        })
    })
})
