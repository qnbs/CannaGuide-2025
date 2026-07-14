import { describe, expect, it } from 'vitest'
import { csvExportService, escapeCsvField } from './csvExportService'

const UTF8_BOM = '\uFEFF'

describe('csvExportService', () => {
    describe('exportPlants', () => {
        it('generates header row', () => {
            const csv = csvExportService.exportPlants([])
            expect(csv.startsWith(UTF8_BOM)).toBe(true)
            expect(csv).toContain('ID,Name,Strain,Stage')
        })

        it('exports plant rows', () => {
            const plants = [
                {
                    id: 'p1',
                    name: 'OG Kush #1',
                    strain: 'OG Kush',
                    stage: 'FLOWERING',
                    startDate: 1700000000000,
                    growId: 'g1',
                },
                { id: 'p2', name: 'Haze', strain: 'Silver Haze', stage: 'VEGETATIVE' },
            ]
            const csv = csvExportService.exportPlants(plants)
            expect(csv).toContain('p1,OG Kush #1,OG Kush,FLOWERING')
            expect(csv).toContain('p2,Haze,Silver Haze,VEGETATIVE')
        })

        it('escapes fields with commas', () => {
            const plants = [{ id: 'p1', name: 'Kush, OG', strain: 'Test', stage: 'SEED' }]
            const csv = csvExportService.exportPlants(plants)
            expect(csv).toContain('"Kush, OG"')
        })

        it('escapes fields with double quotes', () => {
            const plants = [{ id: 'p1', name: 'The "Best"', strain: 'Test', stage: 'SEED' }]
            const csv = csvExportService.exportPlants(plants)
            expect(csv).toContain('"The ""Best"""')
        })

        it('handles undefined optional fields', () => {
            const plants = [{ id: 'p1', name: 'Test', strain: 'S', stage: 'SEED' }]
            const csv = csvExportService.exportPlants(plants)
            // growId and notes should be empty strings
            const lines = csv.split('\r\n')
            const dataLine = lines[1]
            expect(dataLine).toBeDefined()
            expect(dataLine?.endsWith(',,')).toBe(true)
        })
    })

    describe('exportReadings', () => {
        it('generates header with correct columns', () => {
            const csv = csvExportService.exportReadings([])
            expect(csv).toContain('EC (mS/cm)')
            expect(csv).toContain('pH')
            expect(csv).toContain('Water Temp (C)')
        })

        it('exports reading data', () => {
            const readings = [
                {
                    id: 'r1',
                    plantId: 'p1',
                    timestamp: 1700000000000,
                    ec: 1.2,
                    ph: 6.5,
                    waterTempC: 22,
                    readingType: 'manual',
                    notes: 'ok',
                },
            ]
            const csv = csvExportService.exportReadings(readings)
            expect(csv).toContain('r1')
            expect(csv).toContain('1.2')
            expect(csv).toContain('6.5')
        })

        it('handles null plantId and waterTempC', () => {
            const readings = [
                {
                    id: 'r1',
                    plantId: null,
                    timestamp: 1700000000000,
                    ec: 1.0,
                    ph: 6.0,
                    waterTempC: null,
                    readingType: 'auto',
                    notes: '',
                },
            ]
            const csv = csvExportService.exportReadings(readings)
            expect(csv).toContain('r1')
        })
    })

    describe('exportTasks', () => {
        it('exports task rows', () => {
            const tasks = [
                {
                    id: 't1',
                    plantId: 'p1',
                    type: 'water',
                    scheduledAt: 1700000000000,
                    recurring: true,
                    notes: 'daily',
                },
            ]
            const csv = csvExportService.exportTasks(tasks)
            expect(csv).toContain('t1')
            expect(csv).toContain('water')
            expect(csv).toContain('true')
        })

        it('handles optional completedAt', () => {
            const tasks = [
                {
                    id: 't1',
                    plantId: 'p1',
                    type: 'feed',
                    scheduledAt: 1700000000000,
                    completedAt: 1700001000000,
                    recurring: false,
                },
            ]
            const csv = csvExportService.exportTasks(tasks)
            const lines = csv.split('\r\n')
            expect(lines.length).toBeGreaterThan(1)
        })
    })

    describe('exportSeeds', () => {
        it('exports seed inventory', () => {
            const seeds = [
                {
                    id: 's1',
                    strainName: 'Northern Lights',
                    quantity: 10,
                    seedType: 'feminized',
                    breeder: 'Sensi Seeds',
                    acquiredAt: 1700000000000,
                },
            ]
            const csv = csvExportService.exportSeeds(seeds)
            expect(csv).toContain('Northern Lights')
            expect(csv).toContain('10')
            expect(csv).toContain('feminized')
            expect(csv).toContain('Sensi Seeds')
        })
    })

    describe('exportIssues', () => {
        it('exports issue rows', () => {
            const issues = [
                {
                    id: 'i1',
                    plantId: 'p1',
                    category: 'pest',
                    status: 'active',
                    severity: 'high',
                    title: 'Spider mites',
                    detectedAt: 1700000000000,
                    description: 'Found on leaves',
                },
            ]
            const csv = csvExportService.exportIssues(issues)
            expect(csv).toContain('Spider mites')
            expect(csv).toContain('pest')
            expect(csv).toContain('high')
        })

        it('handles undefined resolvedAt', () => {
            const issues = [
                {
                    id: 'i1',
                    plantId: 'p1',
                    category: 'deficiency',
                    status: 'resolved',
                    severity: 'low',
                    title: 'N deficiency',
                    detectedAt: 1700000000000,
                    resolvedAt: 1700005000000,
                },
            ]
            const csv = csvExportService.exportIssues(issues)
            expect(csv).toContain('resolved')
        })
    })

    describe('CRLF line endings', () => {
        it('uses CRLF per RFC 4180', () => {
            const csv = csvExportService.exportPlants([
                { id: 'p1', name: 'A', strain: 'B', stage: 'SEED' },
            ])
            expect(csv).toContain('\r\n')
            expect(csv.endsWith('\r\n')).toBe(true)
        })
    })

    describe('escapeField edge cases', () => {
        it('escapes newlines in fields', () => {
            const plants = [{ id: 'p1', name: 'Line1\nLine2', strain: 'S', stage: 'SEED' }]
            const csv = csvExportService.exportPlants(plants)
            expect(csv).toContain('"Line1\nLine2"')
        })
    })

    describe('escapeCsvField -- formula injection (CWE-1236)', () => {
        // Plant and strain names are user-supplied and land in exported cells. A cell
        // opening with =, +, -, @ or a control char is evaluated as a formula by Excel
        // and Sheets when the file is opened.
        /** Unwrap RFC 4180 quoting so the assertion sees the cell's actual content. */
        const cellContent = (escaped: string): string =>
            escaped.startsWith('"') ? escaped.slice(1, -1).replace(/""/g, '"') : escaped

        it.each(['=1+1', '+1', '-1+1', '@SUM(A1)', '\tcmd', '\rcmd'])(
            'neutralizes the formula lead in %j',
            (payload) => {
                expect(cellContent(escapeCsvField(payload)).startsWith("'")).toBe(true)
            },
        )

        it('neutralizes a formula-leading plant name in a real export', () => {
            const plants = [
                { id: 'p1', name: '=HYPERLINK("http://evil","click")', strain: 'S', stage: 'SEED' },
            ]
            const csv = csvExportService.exportPlants(plants)
            expect(csv).toContain('"\'=HYPERLINK(""http://evil"",""click"")"')
            expect(csv).not.toContain(',=HYPERLINK')
        })

        it('leaves negative numbers alone -- they are values, not formulas', () => {
            expect(escapeCsvField(-5)).toBe('-5')
            expect(escapeCsvField(-0.5)).toBe('-0.5')
        })

        it('leaves ordinary text alone', () => {
            expect(escapeCsvField('OG Kush')).toBe('OG Kush')
            expect(escapeCsvField(42)).toBe('42')
            expect(escapeCsvField(null)).toBe('')
        })
    })
})
