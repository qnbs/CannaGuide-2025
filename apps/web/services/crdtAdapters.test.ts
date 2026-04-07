import { describe, it, expect } from 'vitest'
import {
    plantToYMap,
    yMapToPlant,
    journalEntryToYMap,
    yMapToJournalEntry,
    nutrientEntryToYMap,
    yMapToNutrientEntry,
    ecPhReadingToYMap,
    yMapToEcPhReading,
} from './crdtAdapters'
import type { Plant, JournalEntry } from '@/types'
import { PlantStage, JournalEntryType } from '@/types'
import type { NutrientScheduleEntry, EcPhReading } from '@/stores/slices/nutrientPlannerSlice'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makePlant = (overrides: Partial<Plant> = {}): Plant => ({
    id: 'plant-1',
    name: 'Northern Lights #1',
    strain: { id: 's1', name: 'Northern Lights', type: 'Indica' } as Plant['strain'],
    mediumType: 'Soil',
    createdAt: 1700000000000,
    lastUpdated: 1700001000000,
    age: 14,
    stage: PlantStage.Vegetative,
    health: 85,
    stressLevel: 10,
    height: 30,
    biomass: { total: 100, stem: 30, leaves: 50, flowers: 20 },
    leafAreaIndex: 3.5,
    isTopped: false,
    lstApplied: 0,
    environment: { internalTemperature: 25, internalHumidity: 60, vpd: 1.2, co2Level: 400 },
    medium: {
        ph: 6.2,
        ec: 1.1,
        moisture: 65,
        microbeHealth: 80,
        substrateWater: 2000,
        nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.3, potassium: 0.4 },
    },
    nutrientPool: { nitrogen: 50, phosphorus: 30, potassium: 40 },
    rootSystem: { health: 90, rootMass: 15 },
    equipment: {
        light: { type: 'LED', wattage: 300, isOn: true, lightHours: 18 },
        exhaustFan: { power: 'medium', isOn: true },
        circulationFan: { isOn: true },
        potSize: 11,
        potType: 'Fabric',
    },
    problems: [],
    journal: [],
    tasks: [],
    harvestData: null,
    structuralModel: { branches: 4, nodes: 8 },
    history: [
        {
            day: 1,
            health: 90,
            height: 5,
            stressLevel: 0,
            medium: { ph: 6.5, ec: 0.5, moisture: 70 },
        },
    ],
    cannabinoidProfile: { thc: 0.1, cbd: 0.05, cbn: 0 },
    terpeneProfile: { myrcene: 0.3, limonene: 0.2 },
    stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
    simulationClock: { accumulatedDayMs: 500000 },
    ...overrides,
})

const makeJournalEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
    id: 'journal-plant-1-1700000000000',
    createdAt: 1700000000000,
    type: JournalEntryType.Watering,
    notes: 'Watered with pH 6.2',
    details: { amountMl: 500, ph: 6.2, ec: 1.0 },
    ...overrides,
})

const makeNutrientEntry = (
    overrides: Partial<NutrientScheduleEntry> = {},
): NutrientScheduleEntry => ({
    id: 'schedule-vegetative',
    stage: PlantStage.Vegetative,
    targetEc: 1.2,
    targetPh: 6.3,
    npkRatio: { n: 3, p: 1, k: 2 },
    notes: 'Week 3-4',
    ...overrides,
})

const makeReading = (overrides: Partial<EcPhReading> = {}): EcPhReading => ({
    id: 'reading-1700000000000-abc12345',
    plantId: 'plant-1',
    timestamp: 1700000000000,
    ec: 1.3,
    ph: 6.1,
    waterTempC: 22,
    readingType: 'input',
    notes: 'Before feeding',
    ...overrides,
})

// ---------------------------------------------------------------------------
// Plant adapter tests
// ---------------------------------------------------------------------------

describe('plantToYMap / yMapToPlant', () => {
    it('round-trips a plant correctly', () => {
        const plant = makePlant()
        const serialized = plantToYMap(plant)
        const deserialized = yMapToPlant(serialized)

        expect(deserialized).not.toBeNull()
        expect(deserialized!.id).toBe(plant.id)
        expect(deserialized!.name).toBe(plant.name)
        expect(deserialized!.stage).toBe(plant.stage)
        expect(deserialized!.health).toBe(plant.health)
        expect(deserialized!.createdAt).toBe(plant.createdAt)
        expect(deserialized!.lastUpdated).toBe(plant.lastUpdated)
        expect(deserialized!.biomass).toEqual(plant.biomass)
        expect(deserialized!.environment).toEqual(plant.environment)
        expect(deserialized!.medium).toEqual(plant.medium)
        expect(deserialized!.equipment).toEqual(plant.equipment)
        expect(deserialized!.cannabinoidProfile).toEqual(plant.cannabinoidProfile)
        expect(deserialized!.terpeneProfile).toEqual(plant.terpeneProfile)
        expect(deserialized!.stressCounters).toEqual(plant.stressCounters)
    })

    it('preserves Unix timestamps correctly', () => {
        const plant = makePlant({ createdAt: 1700000000001, lastUpdated: 1700000000002 })
        const serialized = plantToYMap(plant)
        const deserialized = yMapToPlant(serialized)

        expect(deserialized!.createdAt).toBe(1700000000001)
        expect(deserialized!.lastUpdated).toBe(1700000000002)
    })

    it('handles harvestData: null correctly', () => {
        const plant = makePlant({ harvestData: null })
        const serialized = plantToYMap(plant)
        const deserialized = yMapToPlant(serialized)

        expect(deserialized!.harvestData).toBeNull()
    })

    it('handles plant without phenotypeModifiers', () => {
        const plant = makePlant()
        delete (plant as unknown as Record<string, unknown>)['phenotypeModifiers']
        const serialized = plantToYMap(plant)
        const deserialized = yMapToPlant(serialized)

        expect(deserialized).not.toBeNull()
    })

    it('preserves journal and tasks arrays', () => {
        const entry = makeJournalEntry()
        const plant = makePlant({
            journal: [entry],
            tasks: [
                {
                    id: 'task-1',
                    title: 'Water plant',
                    description: 'Time to water',
                    isCompleted: false,
                    createdAt: 1700000000000,
                    priority: 'medium',
                },
            ],
        })
        const serialized = plantToYMap(plant)
        const deserialized = yMapToPlant(serialized)

        expect(deserialized!.journal).toHaveLength(1)
        expect(deserialized!.journal[0]!.id).toBe(entry.id)
        expect(deserialized!.tasks).toHaveLength(1)
    })

    it('provides default simulationClock when missing', () => {
        const plant = makePlant()
        const serialized = plantToYMap(plant)
        // simulationClock is excluded from serialization
        expect(serialized['simulationClock']).toBeUndefined()
        const deserialized = yMapToPlant(serialized)
        expect(deserialized!.simulationClock).toEqual({ accumulatedDayMs: 0 })
    })

    it('provides default history when missing', () => {
        const plant = makePlant()
        const serialized = plantToYMap(plant)
        // history is excluded from serialization
        expect(serialized['history']).toBeUndefined()
        const deserialized = yMapToPlant(serialized)
        expect(deserialized!.history).toEqual([])
    })

    it('returns null for empty data', () => {
        expect(yMapToPlant({})).toBeNull()
    })

    it('returns null for missing required fields', () => {
        expect(yMapToPlant({ id: 'x' })).toBeNull()
    })

    it('returns null for invalid stage value', () => {
        const plant = makePlant()
        const serialized = plantToYMap(plant)
        serialized['stage'] = 'INVALID_STAGE'
        expect(yMapToPlant(serialized)).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// JournalEntry adapter tests
// ---------------------------------------------------------------------------

describe('journalEntryToYMap / yMapToJournalEntry', () => {
    it('round-trips a journal entry correctly', () => {
        const entry = makeJournalEntry()
        const serialized = journalEntryToYMap(entry)
        const deserialized = yMapToJournalEntry(serialized)

        expect(deserialized).not.toBeNull()
        expect(deserialized!.id).toBe(entry.id)
        expect(deserialized!.createdAt).toBe(entry.createdAt)
        expect(deserialized!.type).toBe(entry.type)
        expect(deserialized!.notes).toBe(entry.notes)
        expect(deserialized!.details).toEqual(entry.details)
    })

    it('handles entry without details', () => {
        const entry = makeJournalEntry({ details: undefined })
        const serialized = journalEntryToYMap(entry)
        const deserialized = yMapToJournalEntry(serialized)

        expect(deserialized).not.toBeNull()
    })

    it('returns null for empty data', () => {
        expect(yMapToJournalEntry({})).toBeNull()
    })

    it('returns null for invalid type', () => {
        const serialized = journalEntryToYMap(makeJournalEntry())
        serialized['type'] = 'INVALID'
        expect(yMapToJournalEntry(serialized)).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// NutrientScheduleEntry adapter tests
// ---------------------------------------------------------------------------

describe('nutrientEntryToYMap / yMapToNutrientEntry', () => {
    it('round-trips a nutrient entry correctly', () => {
        const entry = makeNutrientEntry()
        const serialized = nutrientEntryToYMap(entry)
        const deserialized = yMapToNutrientEntry(serialized)

        expect(deserialized).not.toBeNull()
        expect(deserialized!.id).toBe(entry.id)
        expect(deserialized!.stage).toBe(entry.stage)
        expect(deserialized!.targetEc).toBe(entry.targetEc)
        expect(deserialized!.targetPh).toBe(entry.targetPh)
        expect(deserialized!.npkRatio).toEqual(entry.npkRatio)
        expect(deserialized!.notes).toBe(entry.notes)
    })

    it('returns null for empty data', () => {
        expect(yMapToNutrientEntry({})).toBeNull()
    })

    it('returns null for missing required fields', () => {
        expect(yMapToNutrientEntry({ id: 'x' })).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// EcPhReading adapter tests
// ---------------------------------------------------------------------------

describe('ecPhReadingToYMap / yMapToEcPhReading', () => {
    it('round-trips a reading correctly', () => {
        const reading = makeReading()
        const serialized = ecPhReadingToYMap(reading)
        const deserialized = yMapToEcPhReading(serialized)

        expect(deserialized).not.toBeNull()
        expect(deserialized!.id).toBe(reading.id)
        expect(deserialized!.plantId).toBe(reading.plantId)
        expect(deserialized!.timestamp).toBe(reading.timestamp)
        expect(deserialized!.ec).toBe(reading.ec)
        expect(deserialized!.ph).toBe(reading.ph)
        expect(deserialized!.waterTempC).toBe(reading.waterTempC)
        expect(deserialized!.readingType).toBe(reading.readingType)
    })

    it('handles null plantId', () => {
        const reading = makeReading({ plantId: null })
        const serialized = ecPhReadingToYMap(reading)
        const deserialized = yMapToEcPhReading(serialized)

        expect(deserialized!.plantId).toBeNull()
    })

    it('handles null waterTempC', () => {
        const reading = makeReading({ waterTempC: null })
        const serialized = ecPhReadingToYMap(reading)
        const deserialized = yMapToEcPhReading(serialized)

        expect(deserialized!.waterTempC).toBeNull()
    })

    it('returns null for empty data', () => {
        expect(yMapToEcPhReading({})).toBeNull()
    })

    it('returns null for invalid readingType', () => {
        const serialized = ecPhReadingToYMap(makeReading())
        serialized['readingType'] = 'INVALID'
        expect(yMapToEcPhReading(serialized)).toBeNull()
    })
})
