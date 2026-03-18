import { describe, expect, it } from 'vitest'
import { PlantStage } from '@/types'
import { photoTimelineService } from './photoTimelineService'

describe('photoTimelineService', () => {
    it('builds a week/day timeline label from the plant timeline', () => {
        const plant = {
            id: 'plant-1',
            name: 'Alpha',
            createdAt: new Date('2026-01-01T00:00:00Z').getTime(),
            age: 10,
            stage: PlantStage.Vegetative,
        } as any

        const metadata = photoTimelineService.buildPhotoTimelineMetadata(plant, new Date('2026-01-15T00:00:00Z').getTime())

        expect(metadata.timelineLabel).toBe('W03 / D15')
        expect(metadata.weekLabel).toBe('W03')
        expect(metadata.dayLabel).toBe('D15')
    })
})