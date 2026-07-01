import type { DiagnosisRecord, JournalEntry, MetricsReading, Plant } from '@/types'
import { renderDiagnosisCanvas, renderMetricsCanvas } from './pdfCharts'
import { addSectionHeader, ensureSpace } from './pdfFormatting'
import { buildDiagnosisRows, computeMetricStats } from './pdfStats'
import { generatePlantSummary } from './pdfSummary'
import {
    CONTENT_W,
    LM,
    PAGE_W,
    RM,
    SEVERITY_COLORS,
    createPdfDoc,
    formatDate,
    truncate,
} from './pdfTypes'

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
    const doc = await createPdfDoc()

    const today = formatDate(Date.now())
    const startDate = formatDate(plant.createdAt)
    const filename = `cannaguide-enhanced-${plant.name.toLowerCase().replace(/\s+/g, '-')}-${today}.pdf`

    let y = 20

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

    if (metrics.length > 0) {
        y = addSectionHeader(doc, 'Metrics Overview', y)

        const chartImg = renderMetricsCanvas(metrics, 520, 200)
        if (chartImg) {
            y = ensureSpace(doc, y, 80)
            doc.addImage(chartImg, 'PNG', LM, y, CONTENT_W, 60)
            y += 65
        }

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

    if (diagnosisRecords.length > 0) {
        y = addSectionHeader(doc, 'Diagnosis Trend', y)

        const diagChart = renderDiagnosisCanvas(diagnosisRecords, 520, 180)
        if (diagChart) {
            y = ensureSpace(doc, y, 70)
            doc.addImage(diagChart, 'PNG', LM, y, CONTENT_W, 55)
            y += 60
        }

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
