import { describe, expect, it } from 'vitest'
import { formatBytes } from './indexedDbMonitorService'

describe('indexedDbMonitorService', () => {
    describe('formatBytes', () => {
        it('formats bytes', () => {
            expect(formatBytes(0)).toBe('0 B')
            expect(formatBytes(512)).toBe('512 B')
            expect(formatBytes(1023)).toBe('1023 B')
        })

        it('formats kilobytes', () => {
            expect(formatBytes(1024)).toBe('1.0 KB')
            expect(formatBytes(1536)).toBe('1.5 KB')
            expect(formatBytes(10240)).toBe('10.0 KB')
        })

        it('formats megabytes', () => {
            expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
            expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB')
            expect(formatBytes(100 * 1024 * 1024)).toBe('100.0 MB')
        })

        it('formats gigabytes', () => {
            expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB')
            expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB')
        })
    })
})
