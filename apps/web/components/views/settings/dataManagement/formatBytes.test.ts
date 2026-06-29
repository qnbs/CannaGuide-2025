import { describe, expect, it } from 'vitest'
import { formatBytes } from './formatBytes'

describe('formatBytes', () => {
    it('formats zero bytes', () => {
        expect(formatBytes(0)).toBe('0 Bytes')
    })

    it('formats kilobytes', () => {
        expect(formatBytes(1024)).toBe('1 KB')
    })

    it('formats megabytes with one decimal', () => {
        expect(formatBytes(1_572_864)).toBe('1.5 MB')
    })

    it('formats gigabytes', () => {
        expect(formatBytes(1_073_741_824)).toBe('1 GB')
    })

    it('formats bytes below one KB', () => {
        expect(formatBytes(512)).toBe('512 Bytes')
    })
})
