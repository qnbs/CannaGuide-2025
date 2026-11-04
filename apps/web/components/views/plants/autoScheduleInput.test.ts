import { describe, expect, it } from 'vitest'
import { PlantStage, type Plant } from '@/types'
import { autoScheduleInput, knownStageStart } from './autoScheduleInput'

const plant = (overrides: Partial<Plant> = {}): Plant =>
    ({
        stage: PlantStage.Vegetative,
        mediumType: 'Coco',
        strain: { type: 'Indica', floweringType: 'Autoflower' },
        ...overrides,
    }) as unknown as Plant

const start = { at: 5_000, known: true }

describe('autoScheduleInput (GH #659)', () => {
    it('builds the input from the plant, its strain and the stage start', () => {
        expect(autoScheduleInput('p1', plant(), start)).toEqual({
            plantId: 'p1',
            strainType: 'Indica',
            floweringType: 'Autoflower',
            currentStage: PlantStage.Vegetative,
            stageStartDate: 5_000,
            medium: 'Coco',
        })
    })

    it('gives no input for a plant without a strain, instead of assuming a Hybrid', () => {
        const withoutStrain = plant({ strain: undefined as unknown as Plant['strain'] })

        expect(autoScheduleInput('p1', withoutStrain, start)).toBeUndefined()
    })

    it('leaves out a medium the scheduler does not know', () => {
        expect(
            autoScheduleInput('p1', plant({ mediumType: 'Aero' as Plant['mediumType'] }), start)
                ?.medium,
        ).toBeUndefined()
    })

    it('attributes old tasks only by a recorded stage start', () => {
        expect(knownStageStart(start)).toBe(5_000)
        expect(knownStageStart({ at: 9_000, known: false })).toBeNull()
    })
})
