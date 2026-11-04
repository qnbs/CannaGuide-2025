import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SIM_SECONDS_PER_DAY } from '@/constants'
import { plantSimulationService } from '@/services/plantSimulationService'
import { normalizePlant } from '@/services/simulation/plantNormalization'
import { recordedStageStart } from '@/services/simulation/stageStart'
import { currentStageStart } from '@/services/taskSchedulerService'
import { JournalEntryType, PlantStage, StrainType, type Plant, type Strain } from '@/types'

const DAY = SIM_SECONDS_PER_DAY * 1000
const T0 = Date.parse('2025-01-01T00:00:00Z')

const strain: Strain = {
    id: 'strain-test',
    name: 'Test Strain',
    type: StrainType.Hybrid,
    thc: 20,
    cbd: 1,
    floweringTime: 56,
    floweringType: 'Photoperiod',
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1,
        vpdTolerance: { min: 0.8, max: 1.6 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
}

const setup = {
    lightType: 'LED' as const,
    lightWattage: 400,
    lightHours: 18,
    ventilation: 'high' as const,
    hasCirculationFan: true,
    potSize: 11,
    potType: 'Fabric' as const,
    medium: 'Soil' as const,
    dynamicLighting: false,
}

const newPlant = (): Plant => plantSimulationService.createPlant(strain, setup, 'Test')

/** One catch-up over `days` simulated days, the way the app runs after being closed. */
const catchUp = (plant: Plant, millis: number): Plant => {
    vi.setSystemTime(plant.lastUpdated + millis)
    return plantSimulationService.calculateStateForTimeDelta(plant, millis).updatedPlant
}

describe('durable stage start (GH #659)', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(T0)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('records the first stage when the plant is created', () => {
        expect(newPlant().stageStart).toEqual({ stage: PlantStage.Seed, at: T0 })
    })

    it('records the simulated day a stage began, not the time the catch-up ran', () => {
        // Seed lasts 1 day and Germination 3: the plant is a Seedling from day 4 on.
        const plant = catchUp(newPlant(), 10 * DAY)

        expect(plant.stage).toBe(PlantStage.Seedling)
        expect(plant.stageStart).toEqual({ stage: PlantStage.Seedling, at: T0 + 4 * DAY })
    })

    it('counts the day boundaries from the part of a day already simulated', () => {
        const plant = { ...newPlant(), simulationClock: { accumulatedDayMs: 6 * 3_600_000 } }

        const next = catchUp(plant, 10 * DAY)

        // 18 hours finish the started day; the change comes 3 whole days later.
        expect(next.stageStart?.at).toBe(T0 + 18 * 3_600_000 + 3 * DAY)
    })

    it('keeps the stage start when the plant stays in its stage', () => {
        const seedling = catchUp(newPlant(), 5 * DAY)

        const later = catchUp(seedling, 2 * DAY)

        expect(later.stage).toBe(PlantStage.Seedling)
        expect(later.stageStart).toEqual(seedling.stageStart)
    })

    it('does not depend on the journal: stage-change logging off or the entry archived', () => {
        const plant = { ...catchUp(newPlant(), 10 * DAY), journal: [] }

        expect(currentStageStart(plant, T0 + 99 * DAY)).toEqual({ at: T0 + 4 * DAY, known: true })
    })

    it('survives a reload', () => {
        const plant = catchUp(newPlant(), 10 * DAY)

        const reloaded = normalizePlant(JSON.parse(JSON.stringify(plant)) as Plant)

        expect(reloaded.stageStart).toEqual(plant.stageStart)
        expect(currentStageStart(reloaded).at).toBe(T0 + 4 * DAY)
    })

    it('records drying when the grower starts it', () => {
        const harvested: Plant = {
            ...newPlant(),
            stage: PlantStage.Harvest,
            stageStart: { stage: PlantStage.Harvest, at: T0 },
        }
        vi.setSystemTime(T0 + 3 * DAY)

        const { updatedPlant } = plantSimulationService.advancePostHarvestState(harvested, 'dry')

        expect(updatedPlant.stage).toBe(PlantStage.Drying)
        expect(updatedPlant.stageStart).toEqual({ stage: PlantStage.Drying, at: T0 + 3 * DAY })
    })
})

describe('reading the stage start', () => {
    const base = { createdAt: 1_000, journal: [] }

    it('ignores a record of another stage', () => {
        const plant = {
            ...base,
            stage: PlantStage.Flowering,
            stageStart: { stage: PlantStage.Vegetative, at: 5_000 },
        }

        expect(recordedStageStart(plant)).toBeUndefined()
        expect(currentStageStart(plant, 9_000)).toEqual({ at: 9_000, known: false })
    })

    it('ignores a damaged record', () => {
        const plant = {
            ...base,
            stage: PlantStage.Flowering,
            stageStart: { stage: PlantStage.Flowering, at: Number.NaN },
        }

        expect(recordedStageStart(plant)).toBeUndefined()
    })

    it('prefers the recorded start to the journal entry', () => {
        const plant = {
            ...base,
            stage: PlantStage.Vegetative,
            stageStart: { stage: PlantStage.Vegetative, at: 4_000 },
            journal: [
                {
                    id: 'j1',
                    createdAt: 7_000,
                    type: JournalEntryType.System,
                    notes: '',
                    details: { from: PlantStage.Seedling, to: PlantStage.Vegetative },
                },
            ],
        } as Pick<Plant, 'stage' | 'stageStart' | 'createdAt' | 'journal'>

        expect(currentStageStart(plant)).toEqual({ at: 4_000, known: true })
    })

    it('says the start is unknown instead of presenting today as the stage start', () => {
        expect(currentStageStart({ ...base, stage: PlantStage.Flowering }, 9_000)).toEqual({
            at: 9_000,
            known: false,
        })
    })
})
