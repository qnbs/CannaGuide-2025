// ---------------------------------------------------------------------------
// csvExportService -- CSV Export for CannaGuide 2025
//
// Generates RFC 4180 compliant CSV files with UTF-8 BOM for Excel
// compatibility. Supports exporting plants, readings, tasks, and seeds.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CsvExportType = 'plants' | 'readings' | 'tasks' | 'seeds' | 'issues'

interface CsvColumn<T> {
    header: string
    accessor: (row: T) => string | number | boolean | null | undefined
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UTF8_BOM = '\uFEFF'
const NEWLINE = '\r\n'

/** Escape a CSV field per RFC 4180 */
const escapeField = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

/** Build a CSV string from rows and column definitions */
function buildCsv<T>(columns: Array<CsvColumn<T>>, rows: T[]): string {
    const header = columns.map((col) => escapeField(col.header)).join(',')
    const dataRows = rows.map((row) =>
        columns.map((col) => escapeField(col.accessor(row))).join(','),
    )
    return UTF8_BOM + [header, ...dataRows].join(NEWLINE) + NEWLINE
}

const formatTimestamp = (ts: number | undefined): string => {
    if (!ts) return ''
    return new Date(ts).toISOString()
}

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

interface PlantRow {
    id: string
    name: string
    strain: string
    stage: string
    startDate?: number | undefined
    notes?: string | undefined
    growId?: string | undefined
}

const PLANT_COLUMNS: Array<CsvColumn<PlantRow>> = [
    { header: 'ID', accessor: (r) => r.id },
    { header: 'Name', accessor: (r) => r.name },
    { header: 'Strain', accessor: (r) => r.strain },
    { header: 'Stage', accessor: (r) => r.stage },
    { header: 'Start Date', accessor: (r) => formatTimestamp(r.startDate) },
    { header: 'Grow ID', accessor: (r) => r.growId ?? '' },
    { header: 'Notes', accessor: (r) => r.notes ?? '' },
]

interface ReadingRow {
    id: string
    plantId: string | null
    timestamp: number
    ec: number
    ph: number
    waterTempC: number | null
    readingType: string
    notes: string
}

const READING_COLUMNS: Array<CsvColumn<ReadingRow>> = [
    { header: 'ID', accessor: (r) => r.id },
    { header: 'Plant ID', accessor: (r) => r.plantId ?? '' },
    { header: 'Timestamp', accessor: (r) => formatTimestamp(r.timestamp) },
    { header: 'EC (mS/cm)', accessor: (r) => r.ec },
    { header: 'pH', accessor: (r) => r.ph },
    { header: 'Water Temp (C)', accessor: (r) => r.waterTempC ?? '' },
    { header: 'Type', accessor: (r) => r.readingType },
    { header: 'Notes', accessor: (r) => r.notes },
]

interface TaskRow {
    id: string
    plantId: string
    type: string
    scheduledAt: number
    completedAt?: number | undefined
    recurring: boolean
    notes?: string | undefined
}

const TASK_COLUMNS: Array<CsvColumn<TaskRow>> = [
    { header: 'ID', accessor: (r) => r.id },
    { header: 'Plant ID', accessor: (r) => r.plantId },
    { header: 'Type', accessor: (r) => r.type },
    { header: 'Scheduled', accessor: (r) => formatTimestamp(r.scheduledAt) },
    { header: 'Completed', accessor: (r) => formatTimestamp(r.completedAt) },
    { header: 'Recurring', accessor: (r) => r.recurring },
    { header: 'Notes', accessor: (r) => r.notes ?? '' },
]

interface SeedRow {
    id: string
    strainName: string
    quantity: number
    seedType: string
    breeder?: string | undefined
    acquiredAt: number
    notes?: string | undefined
}

const SEED_COLUMNS: Array<CsvColumn<SeedRow>> = [
    { header: 'ID', accessor: (r) => r.id },
    { header: 'Strain', accessor: (r) => r.strainName },
    { header: 'Quantity', accessor: (r) => r.quantity },
    { header: 'Type', accessor: (r) => r.seedType },
    { header: 'Breeder', accessor: (r) => r.breeder ?? '' },
    { header: 'Acquired', accessor: (r) => formatTimestamp(r.acquiredAt) },
    { header: 'Notes', accessor: (r) => r.notes ?? '' },
]

interface IssueRow {
    id: string
    plantId: string
    category: string
    status: string
    severity: string
    title: string
    detectedAt: number
    resolvedAt?: number | undefined
    description?: string | undefined
}

const ISSUE_COLUMNS: Array<CsvColumn<IssueRow>> = [
    { header: 'ID', accessor: (r) => r.id },
    { header: 'Plant ID', accessor: (r) => r.plantId },
    { header: 'Category', accessor: (r) => r.category },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Severity', accessor: (r) => r.severity },
    { header: 'Title', accessor: (r) => r.title },
    { header: 'Detected', accessor: (r) => formatTimestamp(r.detectedAt) },
    { header: 'Resolved', accessor: (r) => formatTimestamp(r.resolvedAt) },
    { header: 'Description', accessor: (r) => r.description ?? '' },
]

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const csvExportService = {
    /** Export plants to CSV string */
    exportPlants(plants: PlantRow[]): string {
        return buildCsv(PLANT_COLUMNS, plants)
    },

    /** Export EC/pH readings to CSV string */
    exportReadings(readings: ReadingRow[]): string {
        return buildCsv(READING_COLUMNS, readings)
    },

    /** Export planner tasks to CSV string */
    exportTasks(tasks: TaskRow[]): string {
        return buildCsv(TASK_COLUMNS, tasks)
    },

    /** Export seed inventory to CSV string */
    exportSeeds(seeds: SeedRow[]): string {
        return buildCsv(SEED_COLUMNS, seeds)
    },

    /** Export issues to CSV string */
    exportIssues(issues: IssueRow[]): string {
        return buildCsv(ISSUE_COLUMNS, issues)
    },

    /** Trigger a browser download for a CSV string */
    downloadCsv(csvContent: string, filename: string): void {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
            URL.revokeObjectURL(url)
            document.body.removeChild(a)
        }, 1000)
    },
}
