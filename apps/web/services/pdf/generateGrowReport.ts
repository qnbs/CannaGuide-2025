import type { HydroReading, JournalEntry, Plant } from '@/types'
import {
    CONTENT_W,
    LM,
    PAGE_W,
    RM,
    buildFilename,
    createPdfDoc,
    formatDate,
    truncate,
} from './pdfTypes'

/**
 * Generates a structured PDF grow report for a plant.
 * Uses lazy dynamic import of jsPDF to avoid bundle size impact.
 */
export async function generateGrowReport(
    plant: Plant,
    entries: JournalEntry[],
    hydroReadings?: HydroReading[] | undefined,
): Promise<{ blob: Blob; filename: string }> {
    const doc = await createPdfDoc()

    const today = formatDate(Date.now())
    const startDate = formatDate(plant.createdAt)
    const filename = buildFilename(plant)

    let y = 20

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

    if (hydroReadings && hydroReadings.length > 0) {
        if (y > 230) {
            doc.addPage()
            y = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 60, 40)
        doc.text('Hydroponic Readings', LM, y)
        y += 6

        const phValues = hydroReadings.map((r) => r.ph)
        const ecValues = hydroReadings.map((r) => r.ec)
        const tempValues = hydroReadings.map((r) => r.waterTemp)

        const hydroRows: [string, string, string, string][] = [
            [
                'pH',
                Math.min(...phValues).toFixed(2),
                Math.max(...phValues).toFixed(2),
                (phValues.reduce((a, b) => a + b, 0) / phValues.length).toFixed(2),
            ],
            [
                'EC (mS/cm)',
                Math.min(...ecValues).toFixed(2),
                Math.max(...ecValues).toFixed(2),
                (ecValues.reduce((a, b) => a + b, 0) / ecValues.length).toFixed(2),
            ],
            [
                'Water Temp (C)',
                Math.min(...tempValues).toFixed(1),
                Math.max(...tempValues).toFixed(1),
                (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1),
            ],
        ]

        doc.autoTable({
            startY: y,
            head: [['Metric', 'Min', 'Max', 'Avg']],
            body: hydroRows,
            theme: 'striped',
            headStyles: { fillColor: [40, 100, 60], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
            margin: { left: LM, right: RM },
        })
        y = doc.lastAutoTable.finalY + 4

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120)
        doc.text(`${hydroReadings.length} readings recorded`, LM, y)
    }

    const totalPages = doc.internal.getNumberOfPages()
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
        `Generated by CannaGuide 2025 -- Page ${totalPages} of ${totalPages}`,
        PAGE_W / 2,
        295,
        { align: 'center' },
    )

    const pdfBuffer = doc.output('arraybuffer')
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    return { blob, filename }
}
