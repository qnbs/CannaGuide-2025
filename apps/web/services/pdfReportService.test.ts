import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    generateGrowReport,
    buildOfflineSummary,
    computeMetricStats,
    buildDiagnosisRows,
} from './pdfReportService'
import type {
    Plant,
    JournalEntry,
    JournalEntryType,
    MetricsReading,
    DiagnosisRecord,
} from '@/types'
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
    default: vi.fn(function JsPDF(this: Record<string, unknown>) {
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
    growId: 'default-grow',
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

// ---------------------------------------------------------------------------
// Enhanced report helpers
// ---------------------------------------------------------------------------

function makeReading(overrides?: Partial<MetricsReading>): MetricsReading {
    return {
        id: 'reading-1',
        plantId: 'plant-1',
        timestamp: Date.now(),
        height: 30,
        co2: 400,
        ...overrides,
         
    } as MetricsReading
}

function makeDiagnosis(overrides?: Partial<DiagnosisRecord>): DiagnosisRecord {
    return {
        id: 'diag-1',
        plantId: 'plant-1',
        timestamp: Date.now(),
        label: 'Nitrogen deficiency',
        confidence: 0.85,
        severity: 'mild',
        harvestScore: 75,
        ...overrides,
         
    } as DiagnosisRecord
}

// ---------------------------------------------------------------------------
// computeMetricStats
// ---------------------------------------------------------------------------

describe('computeMetricStats', () => {
    it('returns empty array for no readings', () => {
        expect(computeMetricStats([])).toEqual([])
    })

    it('computes height stats from readings', () => {
        const readings = [
            makeReading({ height: 20 }),
            makeReading({ id: 'r2', height: 40 }),
            makeReading({ id: 'r3', height: 30 }),
        ]
        const stats = computeMetricStats(readings)
        const heightStat = stats.find((s) => s.label === 'Height')
        expect(heightStat).toBeDefined()
        expect(heightStat?.min).toBe('20.0')
        expect(heightStat?.max).toBe('40.0')
        expect(heightStat?.avg).toBe('30.0')
        expect(heightStat?.unit).toBe('cm')
    })

    it('computes CO2 stats from readings', () => {
        const readings = [makeReading({ co2: 300 }), makeReading({ id: 'r2', co2: 600 })]
        const stats = computeMetricStats(readings)
        const co2Stat = stats.find((s) => s.label === 'CO2')
        expect(co2Stat).toBeDefined()
        expect(co2Stat?.min).toBe('300')
        expect(co2Stat?.max).toBe('600')
        expect(co2Stat?.avg).toBe('450')
        expect(co2Stat?.unit).toBe('ppm')
    })

    it('skips fields with no values', () => {
        const readings = [makeReading({ height: 25, co2: undefined, potWeight: undefined })]
        const stats = computeMetricStats(readings)
        expect(stats).toHaveLength(1)
        expect(stats[0]?.label).toBe('Height')
    })

    it('handles single reading correctly', () => {
        const readings = [makeReading({ height: 50 })]
        const stats = computeMetricStats(readings)
        const heightStat = stats.find((s) => s.label === 'Height')
        expect(heightStat?.min).toBe('50.0')
        expect(heightStat?.max).toBe('50.0')
        expect(heightStat?.avg).toBe('50.0')
    })
})

// ---------------------------------------------------------------------------
// buildDiagnosisRows
// ---------------------------------------------------------------------------

describe('buildDiagnosisRows', () => {
    it('returns empty array for no records', () => {
        expect(buildDiagnosisRows([])).toEqual([])
    })

    it('sorts records by timestamp ascending', () => {
        const records = [
            makeDiagnosis({ id: 'd1', timestamp: 3000, label: 'Third' }),
            makeDiagnosis({ id: 'd2', timestamp: 1000, label: 'First' }),
            makeDiagnosis({ id: 'd3', timestamp: 2000, label: 'Second' }),
        ]
        const rows = buildDiagnosisRows(records)
        expect(rows[0]?.label).toBe('First')
        expect(rows[1]?.label).toBe('Second')
        expect(rows[2]?.label).toBe('Third')
    })

    it('formats confidence as percentage', () => {
        const records = [makeDiagnosis({ confidence: 0.923 })]
        const rows = buildDiagnosisRows(records)
        expect(rows[0]?.confidence).toBe('92%')
    })

    it('truncates long labels to 40 chars', () => {
        const longLabel = 'A'.repeat(60)
        const records = [makeDiagnosis({ label: longLabel })]
        const rows = buildDiagnosisRows(records)
        expect(rows[0]?.label.length).toBeLessThanOrEqual(43) // 40 + '...'
    })

    it('preserves severity string as-is', () => {
        const records = [makeDiagnosis({ severity: 'severe' })]
        const rows = buildDiagnosisRows(records)
        expect(rows[0]?.severity).toBe('severe')
    })
})

// ---------------------------------------------------------------------------
// buildOfflineSummary
// ---------------------------------------------------------------------------

describe('buildOfflineSummary', () => {
    it('includes plant name, stage, and health', () => {
        const result = buildOfflineSummary(basePlant, [], [])
        expect(result.summary).toContain('White Widow')
        expect(result.summary).toContain(PlantStage.Flowering)
        expect(result.summary).toContain('85%')
    })

    it('includes height range when metrics are available', () => {
        const metrics = [makeReading({ height: 20 }), makeReading({ id: 'r2', height: 40 })]
        const result = buildOfflineSummary(basePlant, metrics, [])
        expect(result.summary).toContain('20.0')
        expect(result.summary).toContain('40.0')
    })

    it('includes latest diagnosis info', () => {
        const diagnosis = [
            makeDiagnosis({
                label: 'Calcium deficiency',
                severity: 'moderate',
                confidence: 0.9,
            }),
        ]
        const result = buildOfflineSummary(basePlant, [], diagnosis)
        expect(result.summary).toContain('Calcium deficiency')
        expect(result.summary).toContain('moderate')
    })

    it('recommends monitoring when health is low', () => {
        const lowHealthPlant = { ...basePlant, health: 50 }
        const result = buildOfflineSummary(lowHealthPlant, [], [])
        expect(result.recommendations).toContainEqual(
            expect.stringContaining('Monitor plant health'),
        )
    })

    it('recommends addressing severe diagnosis', () => {
        const diagnosis = [makeDiagnosis({ severity: 'severe' })]
        const result = buildOfflineSummary(basePlant, [], diagnosis)
        expect(result.recommendations).toContainEqual(expect.stringContaining('severe diagnosis'))
    })

    it('recommends more metrics when few readings exist', () => {
        const metrics = [makeReading()]
        const result = buildOfflineSummary(basePlant, metrics, [])
        expect(result.recommendations).toContainEqual(expect.stringContaining('Log more metrics'))
    })

    it('gives positive feedback when plant is healthy', () => {
        const healthyPlant = { ...basePlant, health: 95 }
        const metrics = Array.from({ length: 10 }, (_, i) =>
            makeReading({ id: `r-${i}`, height: 25 + i }),
        )
        const result = buildOfflineSummary(healthyPlant, metrics, [])
        expect(result.recommendations).toContainEqual(expect.stringContaining('progressing well'))
    })

    it('always returns at least one recommendation', () => {
        const result = buildOfflineSummary(basePlant, [], [])
        expect(result.recommendations.length).toBeGreaterThanOrEqual(1)
    })

    it('summary and recommendations are strings', () => {
        const result = buildOfflineSummary(basePlant, [], [])
        expect(typeof result.summary).toBe('string')
        expect(result.summary.length).toBeGreaterThan(10)
        for (const rec of result.recommendations) {
            expect(typeof rec).toBe('string')
        }
    })
})
