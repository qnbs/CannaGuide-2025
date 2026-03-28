import { describe, expect, it } from 'vitest'
import { PlantStage } from '@/types'
import { buildPhotoTimelineMetadata, photoTimelineService } from './photoTimelineService'

const DAY_MS = 86_400_000

const makePlant = (createdAt: number) =>
    ({
        id: 'plant-1',
        name: 'Alpha',
        createdAt,
        age: 10,
        stage: PlantStage.Vegetative,
    }) as any

describe('photoTimelineService', () => {
    describe('buildPhotoTimelineMetadata', () => {
        it('builds a week/day timeline label from the plant timeline', () => {
            const plant = makePlant(new Date('2026-01-01T00:00:00Z').getTime())
            const metadata = photoTimelineService.buildPhotoTimelineMetadata(
                plant,
                new Date('2026-01-15T00:00:00Z').getTime(),
            )

            expect(metadata.timelineLabel).toBe('W03 / D15')
            expect(metadata.weekLabel).toBe('W03')
            expect(metadata.dayLabel).toBe('D15')
        })

        it('returns W01/D01 for a photo taken on the same day as plant creation', () => {
            const now = Date.now()
            const result = buildPhotoTimelineMetadata(makePlant(now), now)

            expect(result.weekLabel).toBe('W01')
            expect(result.dayLabel).toBe('D01')
            expect(result.source).toBe('timestamp')
        })

        it('ensures minimum day is always 1', () => {
            const now = Date.now()
            const result = buildPhotoTimelineMetadata(makePlant(now + DAY_MS * 5), now)

            expect(result.dayLabel).toBe('D01')
            expect(result.weekLabel).toBe('W01')
        })

        it('clamps zero timestamp to current time', () => {
            const now = Date.now()
            const result = buildPhotoTimelineMetadata(makePlant(now), 0)

            expect(result.capturedAt).toBeGreaterThan(0)
        })

        it('clamps negative timestamp to current time', () => {
            const result = buildPhotoTimelineMetadata(makePlant(Date.now() - DAY_MS), -1)

            expect(result.capturedAt).toBeGreaterThan(0)
            expect(result.weekLabel).toMatch(/^W\d{2}$/)
        })

        it('pads single-digit week and day numbers', () => {
            const created = new Date('2026-03-01T00:00:00Z').getTime()
            const captured = new Date('2026-03-03T00:00:00Z').getTime()
            const result = buildPhotoTimelineMetadata(makePlant(created), captured)

            expect(result.dayLabel).toBe('D03')
            expect(result.weekLabel).toBe('W01')
        })
    })

    describe('readCaptureTimestamp', () => {
        it('returns lastModified for a non-JPEG file', async () => {
            const file = new File(['test'], 'photo.png', { type: 'image/png' })
            Object.defineProperty(file, 'lastModified', { value: 1700000000000 })

            const result = await photoTimelineService.readCaptureTimestamp(file)

            expect(result).toBe(1700000000000)
        })

        it('returns null when lastModified is 0 for non-JPEG', async () => {
            const file = new File(['data'], 'photo.png', { type: 'image/png' })
            Object.defineProperty(file, 'lastModified', { value: 0 })

            const result = await photoTimelineService.readCaptureTimestamp(file)

            expect(result).toBeNull()
        })

        it('returns lastModified for a JPEG without EXIF data', async () => {
            // Build a minimal buffer with JPEG magic bytes (0xFF 0xD8) but no EXIF APP1 segment
            const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
            const file = new File([jpegBytes], 'photo.jpeg', { type: 'image/jpeg' })
            Object.defineProperty(file, 'lastModified', { value: 1700000000000 })
            // jsdom File may lack arrayBuffer -- provide a polyfill
            if (typeof file.arrayBuffer !== 'function') {
                Object.defineProperty(file, 'arrayBuffer', {
                    value: () => Promise.resolve(jpegBytes.buffer),
                })
            }

            const result = await photoTimelineService.readCaptureTimestamp(file)

            expect(result).toBe(1700000000000)
        })

        it('handles arrayBuffer errors gracefully', async () => {
            const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
            Object.defineProperty(file, 'arrayBuffer', {
                value: () => Promise.reject(new Error('read error')),
                configurable: true,
            })
            Object.defineProperty(file, 'lastModified', { value: 0 })

            const result = await photoTimelineService.readCaptureTimestamp(file)

            expect(result).toBeNull()
        })
    })
})
