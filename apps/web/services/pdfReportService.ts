import type { Plant, JournalEntry } from '@/types'

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
    save: (filename: string) => void
    output: (type: string) => ArrayBuffer
    autoTable: (options: Record<string, unknown>) => void
    lastAutoTable: { finalY: number }
    internal: { getNumberOfPages: () => number }
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
