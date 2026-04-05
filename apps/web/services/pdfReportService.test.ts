import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateGrowReport } from './pdfReportService'
import type { Plant, JournalEntry, JournalEntryType } from '@/types'
import { PlantStage, StrainType } from '@/types'

// ---------------------------------------------------------------------------
// Mock jsPDF and jspdf-autotable
// ---------------------------------------------------------------------------

const mockLastAutoTable = { finalY: 80 }
const mockDoc = {
    addPage: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setFillColor: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    rect: vi.fn(),
    save: vi.fn(),
    output: vi.fn(() => new ArrayBuffer(100)),
    autoTable: vi.fn(),
    lastAutoTable: mockLastAutoTable,
    internal: { getNumberOfPages: vi.fn(() => 1) },
}

vi.mock('jspdf', () => ({
    default: vi.fn(function JsPDF(this: any) {
        Object.assign(this, mockDoc)
        return mockDoc
    }),
}))

vi.mock('jspdf-autotable', () => ({}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEntry(
    notes: string,
    type: JournalEntryType = 'OBSERVATION' as JournalEntryType,
): JournalEntry {
    return {
        id: `entry-${Date.now()}`,
        createdAt: Date.now(),
        type,
        notes,
    }
}

const basePlant: Plant = {
    id: 'plant-1',
    name: 'White Widow',
    strain: {
        id: 'strain-1',
        name: 'White Widow',
        type: StrainType.Hybrid,
        floweringType: 'Photoperiod',
        thc: 20,
        cbd: 1,
        floweringTime: 63,
        agronomic: { difficulty: 'Medium', yield: 'High', height: 'Medium' },
        geneticModifiers: {
            pestResistance: 1,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1.4,
            vpdTolerance: { min: 0.8, max: 1.4 },
            transpirationFactor: 1,
            stomataSensitivity: 1,
        },
    },
    mediumType: 'Soil',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    lastUpdated: Date.now(),
    age: 30,
    stage: PlantStage.Flowering,
    health: 85,
    stressLevel: 10,
    height: 60,
    biomass: { total: 100, stem: 20, leaves: 50, flowers: 30 },
    leafAreaIndex: 1.5,
    isTopped: false,
    lstApplied: 0,
    environment: {
        internalTemperature: 24,
        internalHumidity: 55,
        vpd: 1.2,
        co2Level: 800,
    },
    medium: {
        ph: 6.2,
        ec: 1.8,
        moisture: 60,
        microbeHealth: 80,
        substrateWater: 50,
        nutrientConcentration: { nitrogen: 100, phosphorus: 50, potassium: 80 },
    },
    nutrientPool: { nitrogen: 100, phosphorus: 50, potassium: 80 },
    rootSystem: { health: 90, rootMass: 50 },
    equipment: {
        light: { type: 'LED', wattage: 400, isOn: true, lightHours: 12 },
        exhaustFan: { power: 'medium', isOn: true },
        circulationFan: { isOn: true },
        potSize: 15,
        potType: 'Fabric',
    },
    problems: [],
    journal: [],
    tasks: [],
    harvestData: null,
    structuralModel: { branches: 4, nodes: 8 },
    history: [],
    cannabinoidProfile: { thc: 18, cbd: 0.5, cbn: 0.1 },
    terpeneProfile: { Myrcene: 0.5, Limonene: 0.3 },
    stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
    simulationClock: { accumulatedDayMs: 0 },
    phenotypeModifiers: undefined,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateGrowReport', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockDoc.output.mockReturnValue(new ArrayBuffer(200))
        mockDoc.lastAutoTable.finalY = 80
    })

    it('returns a Blob', async () => {
        const result = await generateGrowReport(basePlant, [])
        expect(result.blob).toBeInstanceOf(Blob)
    })

    it('returned Blob is not empty', async () => {
        const result = await generateGrowReport(basePlant, [])
        expect(result.blob.size).toBeGreaterThan(0)
    })

    it('filename follows the expected pattern', async () => {
        const result = await generateGrowReport(basePlant, [])
        const today = new Date().toLocaleDateString('en-CA')
        expect(result.filename).toBe(`cannaguide-white-widow-${today}.pdf`)
    })

    it('generates valid PDF with no journal entries', async () => {
        const result = await generateGrowReport({ ...basePlant, journal: [] }, [])
        expect(result.blob).toBeInstanceOf(Blob)
        // autoTable should still have been called for plant info section
        expect(mockDoc.autoTable).toHaveBeenCalled()
    })

    it('includes harvest section when harvestData is present', async () => {
        const plantWithHarvest: Plant = {
            ...basePlant,
            harvestData: {
                wetWeight: 120,
                dryWeight: 40,
                currentDryDay: 7,
                currentCureDay: 0,
                lastBurpDay: 5,
                jarHumidity: 62,
                chlorophyllPercent: 5,
                terpeneRetentionPercent: 85,
                moldRiskPercent: 3,
                finalQuality: 88,
                cannabinoidProfile: { thc: 19.5, cbn: 0.2 },
                terpeneProfile: { Myrcene: 0.6 },
            },
        }
        await generateGrowReport(plantWithHarvest, [])
        // autoTable is called for plant info + harvest
        const calls = mockDoc.autoTable.mock.calls
        expect(calls.length).toBeGreaterThanOrEqual(2)
        // Check that harvest text was written
        const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
        expect(textCalls.some((s: unknown) => typeof s === 'string' && s.includes('Harvest'))).toBe(
            true,
        )
    })

    it('truncates long journal notes to 80 characters', async () => {
        const longNote = 'A'.repeat(120)
        const entries = [makeEntry(longNote)]
        await generateGrowReport(basePlant, entries)
        // autoTable for journal should have body with truncated note
        const journalCall = mockDoc.autoTable.mock.calls[1] // second call is journal
        if (journalCall) {
            const body = journalCall[0].body as string[][]
            const noteCell = body[0]?.[2]
            expect(noteCell).toBeDefined()
            expect(noteCell?.length).toBeLessThanOrEqual(83) // 80 + '...'
        }
    })
})
