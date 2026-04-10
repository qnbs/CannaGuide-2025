import type { Plant, JournalEntry, MetricsReading, DiagnosisRecord } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JsPDFWithAutoTable = {
    addPage: () => void
    setFontSize: (size: number) => void
    setFont: (family: string, style?: string) => void
    setTextColor: (r: number, g?: number, b?: number) => void
    setDrawColor: (r: number) => void
    setFillColor: (r: number, g: number, b: number) => void
    text: (text: string, x: number, y: number, opts?: Record<string, unknown>) => void
    line: (x1: number, y1: number, x2: number, y2: number) => void
    rect: (x: number, y: number, w: number, h: number, style?: string) => void
    addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void
    save: (filename: string) => void
    output: (type: string) => ArrayBuffer
    autoTable: (options: Record<string, unknown>) => void
    lastAutoTable: { finalY: number }
    internal: { getNumberOfPages: () => number; pageSize: { getHeight: () => number } }
    splitTextToSize: (text: string, maxWidth: number) => string[]
    getTextWidth: (text: string) => number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_W = 210
const LM = 15
const RM = 15
const CONTENT_W = PAGE_W - LM - RM

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-CA')
}

function truncate(text: string, max: number): string {
    if (text.length <= max) return text
    return `${text.slice(0, max - 3)}...`
}

function buildFilename(plant: Plant): string {
    const slug = plant.name.toLowerCase().replace(/\s+/g, '-')
    const date = formatDate(Date.now())
    return `cannaguide-${slug}-${date}.pdf`
}

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

/**
 * Generates a structured PDF grow report for a plant.
 * Uses lazy dynamic import of jsPDF to avoid bundle size impact.
 */
export async function generateGrowReport(
    plant: Plant,
    entries: JournalEntry[],
): Promise<{ blob: Blob; filename: string }> {
    const { default: JsPDFBase } = await import('jspdf')
    await import('jspdf-autotable')
    // Safe cast: jspdf-autotable augments JsPDF at runtime but lacks merged types
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const doc = new JsPDFBase() as unknown as JsPDFWithAutoTable

    const today = formatDate(Date.now())
    const startDate = formatDate(plant.createdAt)
    const filename = buildFilename(plant)

    let y = 20

    // -------------------------------------------------------------------------
    // 1. Header
    // -------------------------------------------------------------------------
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('CannaGuide 2025', LM, y - 10)
    doc.text(`Generated: ${today}`, PAGE_W - RM, y - 10, { align: 'right' })
    doc.setDrawColor(50)
    doc.line(LM, y - 7, PAGE_W - RM, y - 7)
    doc.setTextColor(0)

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 40)
    doc.text(plant.name, LM, y)
    y += 8

    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    doc.text(`Strain: ${plant.strain.name}`, LM, y)
    y += 6

    doc.setDrawColor(120)
    doc.line(LM, y, PAGE_W - RM, y)
    y += 8
    doc.setTextColor(0)

    // -------------------------------------------------------------------------
    // 2. Plant data
    // -------------------------------------------------------------------------
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 40)
    doc.text('Plant Information', LM, y)
    y += 6

    const plantInfoRows: [string, string][] = [
        ['Start Date', startDate],
        ['Current Stage', plant.stage],
        ['Age (days)', String(plant.age)],
        ['Health', `${Math.round(plant.health)}%`],
        ['Type', plant.strain.type],
        ['THC', `${plant.strain.thc}%`],
        ['CBD', `${plant.strain.cbd}%`],
    ]

    doc.autoTable({
        startY: y,
        head: [['Field', 'Value']],
        body: plantInfoRows,
        theme: 'striped',
        headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
        margin: { left: LM, right: RM },
    })
    y = doc.lastAutoTable.finalY + 10

    // -------------------------------------------------------------------------
    // 3. Journal entries
    // -------------------------------------------------------------------------
    if (y > 230) {
        doc.addPage()
        y = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 40)
    doc.text('Journal Entries', LM, y)
    y += 6

    if (entries.length === 0) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text('No journal entries recorded.', LM, y)
        y += 8
    } else {
        const journalRows = entries.map((e) => [
            formatDate(e.createdAt),
            e.type,
            truncate(e.notes, 80),
        ])

        doc.autoTable({
            startY: y,
            head: [['Date', 'Type', 'Notes']],
            body: journalRows,
            theme: 'striped',
            headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 35 },
                2: { cellWidth: CONTENT_W - 65 },
            },
            margin: { left: LM, right: RM },
        })
        y = doc.lastAutoTable.finalY + 10
    }

    // -------------------------------------------------------------------------
    // 4. Harvest data (if available)
    // -------------------------------------------------------------------------
    if (plant.harvestData !== null) {
        if (y > 230) {
            doc.addPage()
            y = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 60, 40)
        doc.text('Harvest Results', LM, y)
        y += 6

        const hd = plant.harvestData
        const harvestRows: [string, string][] = [
            ['Wet Weight', `${hd.wetWeight} g`],
            ['Dry Weight', `${hd.dryWeight} g`],
            ['Final Quality', `${Math.round(hd.finalQuality)}%`],
            ['THC at Harvest', `${hd.cannabinoidProfile.thc.toFixed(1)}%`],
        ]

        doc.autoTable({
            startY: y,
            head: [['Field', 'Value']],
            body: harvestRows,
            theme: 'striped',
            headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
            margin: { left: LM, right: RM },
        })
        y = doc.lastAutoTable.finalY + 10
    }

    // -------------------------------------------------------------------------
    // 5. Footer on last page
    // -------------------------------------------------------------------------
    const totalPages = doc.internal.getNumberOfPages()
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
        `Generated by CannaGuide 2025 -- Page ${totalPages} of ${totalPages}`,
        PAGE_W / 2,
        295,
        { align: 'center' },
    )

    // Return as Blob (browser download)
    const pdfBuffer = doc.output('arraybuffer')
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    return { blob, filename }
}

// ---------------------------------------------------------------------------
// Enhanced PDF Report helpers
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
    none: [76, 175, 80],
    mild: [255, 193, 7],
    moderate: [255, 152, 0],
    severe: [244, 67, 54],
}

export interface MetricStats {
    label: string
    min: string
    max: string
    avg: string
    unit: string
}

export function computeMetricStats(readings: MetricsReading[]): MetricStats[] {
    const stats: MetricStats[] = []
    const fields: Array<{
        key: keyof MetricsReading
        label: string
        unit: string
        decimals: number
    }> = [
        { key: 'height', label: 'Height', unit: 'cm', decimals: 1 },
        { key: 'potWeight', label: 'Pot Weight', unit: 'g', decimals: 0 },
        { key: 'co2', label: 'CO2', unit: 'ppm', decimals: 0 },
    ]

    for (const field of fields) {
        const values = readings
            .map((r) => r[field.key])
            .filter((v): v is number => typeof v === 'number')
        if (values.length === 0) continue
        const min = Math.min(...values)
        const max = Math.max(...values)
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        stats.push({
            label: field.label,
            min: min.toFixed(field.decimals),
            max: max.toFixed(field.decimals),
            avg: avg.toFixed(field.decimals),
            unit: field.unit,
        })
    }
    return stats
}

export interface DiagnosisSummaryRow {
    date: string
    label: string
    severity: string
    confidence: string
}

export function buildDiagnosisRows(records: DiagnosisRecord[]): DiagnosisSummaryRow[] {
    return records
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((r) => ({
            date: formatDate(r.timestamp),
            label: truncate(r.label, 40),
            severity: r.severity,
            confidence: `${Math.round(r.confidence * 100)}%`,
        }))
}

function ensureSpace(doc: JsPDFWithAutoTable, yPos: number, needed: number): number {
    if (yPos + needed > 270) {
        doc.addPage()
        return 20
    }
    return yPos
}

function addSectionHeader(doc: JsPDFWithAutoTable, title: string, yPos: number): number {
    const y = ensureSpace(doc, yPos, 20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 40)
    doc.text(title, LM, y)
    doc.setDrawColor(120)
    doc.line(LM, y + 2, PAGE_W - RM, y + 2)
    return y + 8
}

/** Generates a template-based AI summary (offline-safe fallback). */
export function buildOfflineSummary(
    plant: Plant,
    metrics: MetricsReading[],
    diagnosis: DiagnosisRecord[],
): { summary: string; recommendations: string[] } {
    const age = plant.age
    const health = Math.round(plant.health)
    const stage = plant.stage
    const stats = computeMetricStats(metrics)

    let summary = `${plant.name} (${plant.strain.name}) is ${age} days old in the ${stage} stage with ${health}% health.`

    if (stats.length > 0) {
        const heightStat = stats.find((s) => s.label === 'Height')
        if (heightStat) {
            summary += ` Current height range: ${heightStat.min}-${heightStat.max} ${heightStat.unit}.`
        }
    }

    if (diagnosis.length > 0) {
        const latest = diagnosis[diagnosis.length - 1]
        if (latest) {
            summary += ` Latest diagnosis: ${latest.label} (${latest.severity}, ${Math.round(latest.confidence * 100)}% confidence).`
        }
    }

    const recommendations: string[] = []
    if (health < 70) {
        recommendations.push('Monitor plant health closely -- consider environment adjustments.')
    }
    if (diagnosis.some((d) => d.severity === 'severe')) {
        recommendations.push('Address severe diagnosis findings immediately.')
    }
    if (metrics.length < 5) {
        recommendations.push('Log more metrics regularly for better trend analysis.')
    }
    if (recommendations.length === 0) {
        recommendations.push('Plant is progressing well -- maintain current care routine.')
    }

    return { summary, recommendations }
}

/**
 * Attempts to generate an AI-powered plant summary.
 * Falls back to an offline template when AI is unavailable.
 */
async function generatePlantSummary(
    plant: Plant,
    metrics: MetricsReading[],
    diagnosis: DiagnosisRecord[],
): Promise<{ summary: string; recommendations: string[] }> {
    try {
        const { aiService } = await import('@/services/aiFacade')
        const response = await aiService.getPlantAdvice(plant, 'en')
        if (response?.content) {
            const lines = response.content.split('\n').filter((l: string) => l.trim())
            const summary = lines.slice(0, 3).join(' ')
            const recommendations = lines.slice(3, 8).map((l: string) => l.replace(/^[-*]\s*/, ''))
            if (summary.length > 20) {
                return {
                    summary: truncate(summary, 500),
                    recommendations:
                        recommendations.length > 0
                            ? recommendations
                            : ['Follow the AI-suggested care plan above.'],
                }
            }
        }
    } catch {
        // AI unavailable -- use offline fallback
        console.debug('[pdfReport] AI summary unavailable, using offline fallback')
    }
    return buildOfflineSummary(plant, metrics, diagnosis)
}

// ---------------------------------------------------------------------------
// Metrics chart rendering via canvas
// ---------------------------------------------------------------------------

function renderMetricsCanvas(
    readings: MetricsReading[],
    width: number,
    height: number,
): string | undefined {
    if (readings.length < 2) return undefined

    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    ctx.scale(2, 2)

    // Background
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, width, height)

    const chartLeft = 45
    const chartRight = width - 15
    const chartTop = 25
    const chartBottom = height - 30
    const chartW = chartRight - chartLeft
    const chartH = chartBottom - chartTop

    // Extract height data
    const heightValues = readings
        .map((r, i) => ({ x: i, y: r.height }))
        .filter((p): p is { x: number; y: number } => typeof p.y === 'number')

    // Extract CO2 data
    const co2Values = readings
        .map((r, i) => ({ x: i, y: r.co2 }))
        .filter((p): p is { x: number; y: number } => typeof p.y === 'number')

    const drawLine = (
        values: Array<{ x: number; y: number }>,
        color: string,
        label: string,
    ): void => {
        if (values.length < 2) return

        const minVal = Math.min(...values.map((v) => v.y))
        const maxVal = Math.max(...values.map((v) => v.y))
        const range = maxVal - minVal || 1

        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()

        for (let i = 0; i < values.length; i++) {
            const v = values[i]
            if (!v) continue
            const px = chartLeft + (v.x / (readings.length - 1)) * chartW
            const py = chartBottom - ((v.y - minVal) / range) * chartH
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
        }
        ctx.stroke()

        // Legend dot + label
        const legendY = chartTop - 10
        const legendX = label === 'Height' ? chartLeft : chartLeft + 100
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(legendX, legendY, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '11px sans-serif'
        ctx.fillText(label, legendX + 8, legendY + 4)
    }

    // Grid lines
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
        const gy = chartTop + (i / 4) * chartH
        ctx.beginPath()
        ctx.moveTo(chartLeft, gy)
        ctx.lineTo(chartRight, gy)
        ctx.stroke()
    }

    // X-axis labels (first, middle, last timestamps)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    const first = readings[0]
    const last = readings[readings.length - 1]
    if (first) ctx.fillText(formatDate(first.timestamp), chartLeft, chartBottom + 15)
    if (last) ctx.fillText(formatDate(last.timestamp), chartRight - 60, chartBottom + 15)

    // Axis label
    ctx.save()
    ctx.translate(12, chartTop + chartH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.fillText('Value', 0, 0)
    ctx.restore()

    // Draw data lines
    drawLine(heightValues, '#4ade80', 'Height (cm)')
    drawLine(co2Values, '#38bdf8', 'CO2 (ppm)')

    return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// Diagnosis severity chart via canvas
// ---------------------------------------------------------------------------

const SEVERITY_VALUES: Record<string, number> = {
    none: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
}

function renderDiagnosisCanvas(
    records: DiagnosisRecord[],
    width: number,
    height: number,
): string | undefined {
    if (records.length === 0) return undefined

    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    ctx.scale(2, 2)

    // Background
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, width, height)

    const chartLeft = 45
    const chartRight = width - 15
    const chartTop = 20
    const chartBottom = height - 30
    const chartW = chartRight - chartLeft
    const chartH = chartBottom - chartTop

    const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp)
    const barWidth = Math.max(6, Math.min(30, chartW / sorted.length - 2))

    // Y-axis labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    const labels = ['None', 'Mild', 'Moderate', 'Severe']
    for (let i = 0; i < labels.length; i++) {
        const ly = chartBottom - (i / 3) * chartH
        ctx.fillText(labels[i] ?? '', 2, ly + 3)
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(chartLeft, ly)
        ctx.lineTo(chartRight, ly)
        ctx.stroke()
    }

    // Bars
    for (let i = 0; i < sorted.length; i++) {
        const rec = sorted[i]
        if (!rec) continue
        const sevVal = SEVERITY_VALUES[rec.severity] ?? 0
        const barH = (sevVal / 3) * chartH
        const x = chartLeft + (i / sorted.length) * chartW + 1
        const y = chartBottom - barH

        const colors: Record<string, string> = {
            none: '#4caf50',
            mild: '#ffc107',
            moderate: '#ff9800',
            severe: '#f44336',
        }
        ctx.fillStyle = colors[rec.severity] ?? '#94a3b8'
        ctx.fillRect(x, y, barWidth, barH)
    }

    // X-axis date labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    if (sorted[0]) ctx.fillText(formatDate(sorted[0].timestamp), chartLeft, chartBottom + 15)
    const lastRec = sorted[sorted.length - 1]
    if (lastRec) ctx.fillText(formatDate(lastRec.timestamp), chartRight - 60, chartBottom + 15)

    return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// Enhanced PDF generation
// ---------------------------------------------------------------------------

/**
 * Generates an enhanced PDF grow report with metrics charts,
 * diagnosis trends, and an AI-powered growth summary.
 *
 * Falls back gracefully when data is missing (offline-first).
 */
export async function generateEnhancedGrowReport(
    plant: Plant,
    entries: JournalEntry[],
    metrics: MetricsReading[],
    diagnosisRecords: DiagnosisRecord[],
): Promise<{ blob: Blob; filename: string }> {
    const { default: JsPDFBase } = await import('jspdf')
    await import('jspdf-autotable')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const doc = new JsPDFBase() as unknown as JsPDFWithAutoTable

    const today = formatDate(Date.now())
    const startDate = formatDate(plant.createdAt)
    const filename = `cannaguide-enhanced-${plant.name.toLowerCase().replace(/\s+/g, '-')}-${today}.pdf`

    let y = 20

    // =====================================================================
    // 1. Header
    // =====================================================================
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('CannaGuide 2025 -- Enhanced Grow Report', LM, y - 10)
    doc.text(`Generated: ${today}`, PAGE_W - RM, y - 10, { align: 'right' })
    doc.setDrawColor(50)
    doc.line(LM, y - 7, PAGE_W - RM, y - 7)
    doc.setTextColor(0)

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 40)
    doc.text(plant.name, LM, y)
    y += 8

    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    doc.text(`Strain: ${plant.strain.name}`, LM, y)
    y += 6

    doc.setDrawColor(120)
    doc.line(LM, y, PAGE_W - RM, y)
    y += 8
    doc.setTextColor(0)

    // =====================================================================
    // 2. Plant Information
    // =====================================================================
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 40)
    doc.text('Plant Information', LM, y)
    y += 6

    const plantInfoRows: [string, string][] = [
        ['Start Date', startDate],
        ['Current Stage', plant.stage],
        ['Age (days)', String(plant.age)],
        ['Health', `${Math.round(plant.health)}%`],
        ['Type', plant.strain.type],
        ['THC', `${plant.strain.thc}%`],
        ['CBD', `${plant.strain.cbd}%`],
    ]

    doc.autoTable({
        startY: y,
        head: [['Field', 'Value']],
        body: plantInfoRows,
        theme: 'striped',
        headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
        margin: { left: LM, right: RM },
    })
    y = doc.lastAutoTable.finalY + 12

    // =====================================================================
    // 3. Metrics Overview (chart + stats table)
    // =====================================================================
    if (metrics.length > 0) {
        y = addSectionHeader(doc, 'Metrics Overview', y)

        const chartImg = renderMetricsCanvas(metrics, 520, 200)
        if (chartImg) {
            y = ensureSpace(doc, y, 80)
            doc.addImage(chartImg, 'PNG', LM, y, CONTENT_W, 60)
            y += 65
        }

        // Stats table
        const stats = computeMetricStats(metrics)
        if (stats.length > 0) {
            y = ensureSpace(doc, y, 30)
            doc.autoTable({
                startY: y,
                head: [['Metric', 'Min', 'Max', 'Avg', 'Unit']],
                body: stats.map((s) => [s.label, s.min, s.max, s.avg, s.unit]),
                theme: 'striped',
                headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9 },
                margin: { left: LM, right: RM },
            })
            y = doc.lastAutoTable.finalY + 12
        }
    }

    // =====================================================================
    // 4. Diagnosis Trend (chart + table)
    // =====================================================================
    if (diagnosisRecords.length > 0) {
        y = addSectionHeader(doc, 'Diagnosis Trend', y)

        const diagChart = renderDiagnosisCanvas(diagnosisRecords, 520, 180)
        if (diagChart) {
            y = ensureSpace(doc, y, 70)
            doc.addImage(diagChart, 'PNG', LM, y, CONTENT_W, 55)
            y += 60
        }

        // Diagnosis table
        const rows = buildDiagnosisRows(diagnosisRecords)
        y = ensureSpace(doc, y, 30)

        doc.autoTable({
            startY: y,
            head: [['Date', 'Finding', 'Severity', 'Confidence']],
            body: rows.map((r) => [r.date, r.label, r.severity, r.confidence]),
            theme: 'striped',
            headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 25 }, 3: { cellWidth: 25 } },
            margin: { left: LM, right: RM },
            didParseCell: (data: {
                section: string
                column: { index: number }
                cell: { styles: { textColor: number[] } }
                row: { raw: string[] }
            }) => {
                if (data.section === 'body' && data.column.index === 2) {
                    const sev = data.row.raw[2] ?? 'none'
                    const color = SEVERITY_COLORS[sev]
                    if (color) {
                        data.cell.styles.textColor = [...color]
                    }
                }
            },
        })
        y = doc.lastAutoTable.finalY + 12
    }

    // =====================================================================
    // 5. Journal Entries
    // =====================================================================
    if (entries.length > 0) {
        y = addSectionHeader(doc, 'Journal Entries', y)

        const journalRows = entries.map((e) => [
            formatDate(e.createdAt),
            e.type,
            truncate(e.notes, 80),
        ])

        doc.autoTable({
            startY: y,
            head: [['Date', 'Type', 'Notes']],
            body: journalRows,
            theme: 'striped',
            headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 35 },
                2: { cellWidth: CONTENT_W - 65 },
            },
            margin: { left: LM, right: RM },
        })
        y = doc.lastAutoTable.finalY + 12
    }

    // =====================================================================
    // 6. AI Growth Summary
    // =====================================================================
    const { summary, recommendations } = await generatePlantSummary(
        plant,
        metrics,
        diagnosisRecords,
    )

    y = addSectionHeader(doc, 'AI Growth Summary', y)
    y = ensureSpace(doc, y, 40)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40)
    const summaryLines = doc.splitTextToSize(summary, CONTENT_W)
    doc.text(summaryLines.join('\n'), LM, y)
    y += summaryLines.length * 5 + 6

    if (recommendations.length > 0) {
        y = ensureSpace(doc, y, 20)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 60, 40)
        doc.text('Recommendations', LM, y)
        y += 6

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60)
        for (const rec of recommendations) {
            y = ensureSpace(doc, y, 8)
            const recLines = doc.splitTextToSize(`-- ${rec}`, CONTENT_W - 5)
            doc.text(recLines.join('\n'), LM + 3, y)
            y += recLines.length * 4.5 + 2
        }
    }

    // =====================================================================
    // 7. Harvest Results (if available)
    // =====================================================================
    if (plant.harvestData !== null) {
        y = addSectionHeader(doc, 'Harvest Results', y)

        const hd = plant.harvestData
        const harvestRows: [string, string][] = [
            ['Wet Weight', `${hd.wetWeight} g`],
            ['Dry Weight', `${hd.dryWeight} g`],
            ['Final Quality', `${Math.round(hd.finalQuality)}%`],
            ['THC at Harvest', `${hd.cannabinoidProfile.thc.toFixed(1)}%`],
        ]

        doc.autoTable({
            startY: y,
            head: [['Field', 'Value']],
            body: harvestRows,
            theme: 'striped',
            headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
            margin: { left: LM, right: RM },
        })
    }

    // =====================================================================
    // 8. Footer on all pages
    // =====================================================================
    const totalPages = doc.internal.getNumberOfPages()
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
        `CannaGuide 2025 Enhanced Report -- Page ${totalPages} of ${totalPages}`,
        PAGE_W / 2,
        295,
        { align: 'center' },
    )

    const pdfBuffer = doc.output('arraybuffer')
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    return { blob, filename }
}
