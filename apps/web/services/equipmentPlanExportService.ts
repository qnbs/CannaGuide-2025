import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { Recommendation, RecommendationCategory } from '@/types'
import type { RoomDimensions } from '@/stores/useCalculatorSessionStore'

type AutoTableOptions = {
    startY?: number
    head?: (string | number)[][]
    body?: (string | number | undefined)[][]
    theme?: string
    headStyles?: Record<string, unknown>
    styles?: Record<string, unknown>
    columnStyles?: Record<string, unknown>
    margin?: Record<string, number>
    didDrawPage?: (data: { cursor: { y: number } }) => void
}
type JsPDFWithAutoTable = jsPDF & {
    autoTable: (options: AutoTableOptions) => void
    lastAutoTable: { finalY: number }
    internal: jsPDF['internal'] & { getNumberOfPages: () => number }
}

export interface EquipmentPlanExportData {
    roomDimensions: RoomDimensions
    sharedLightWattage: number
    ventilationM3h?: number
    co2BoostL?: number
    lightHeightCm?: number
    recommendation?: Recommendation
    budgetItems?: Record<string, number>
    budgetTotal?: number
}

const RECOMMENDATION_CATEGORIES: RecommendationCategory[] = [
    'tent',
    'light',
    'ventilation',
    'circulationFan',
    'pots',
    'soil',
    'nutrients',
    'extra',
]

function triggerDownload(url: string, fileName: string): void {
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
        a.remove()
        URL.revokeObjectURL(url)
    }, 100)
}

export function exportEquipmentPlanPdf(data: EquipmentPlanExportData, lang: string): void {
    const doc = new jsPDF() as JsPDFWithAutoTable
    const LEFT = 15
    const RIGHT = 195
    const now = new Date()
    const dateStr = now.toLocaleDateString(lang, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })

    // Header
    doc.setFontSize(9)
    doc.setTextColor(130, 130, 130)
    doc.text('CannaGuide 2025', LEFT, 12)
    doc.text(dateStr, RIGHT, 12, { align: 'right' })
    doc.setDrawColor(200, 200, 200)
    doc.line(LEFT, 14, RIGHT, 14)

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Equipment Plan', LEFT, 24)

    // Section 1: Room Setup
    let y = 34
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text('Room Setup', LEFT, y)
    y += 2

    const { width, depth, height } = data.roomDimensions
    const vol = ((width / 100) * (depth / 100) * (height / 100)).toFixed(2)

    doc.autoTable({
        startY: y,
        head: [['Parameter', 'Value']],
        body: [
            ['Width', `${width} cm`],
            ['Depth', `${depth} cm`],
            ['Height', `${height} cm`],
            ['Volume', `${vol} m3`],
            ['Light Wattage', `${data.sharedLightWattage} W`],
            ...(data.ventilationM3h !== undefined
                ? [['Required Ventilation', `${data.ventilationM3h} m3/h`]]
                : []),
            ...(data.co2BoostL !== undefined
                ? [['CO2 Initial Boost', `${data.co2BoostL.toFixed(2)} L`]]
                : []),
            ...(data.lightHeightCm !== undefined
                ? [['Light Height', `${data.lightHeightCm} cm`]]
                : []),
        ],
        theme: 'striped',
        headStyles: { fillColor: [40, 100, 60] },
        margin: { left: LEFT, right: 15 },
        didDrawPage: (d) => {
            y = d.cursor.y
        },
    })
    y = doc.lastAutoTable.finalY + 8

    // Section 2: Budget (if present)
    if (data.budgetItems !== undefined) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(60, 60, 60)
        doc.text('Equipment Budget', LEFT, y)
        y += 2

        const budgetRows = Object.entries(data.budgetItems).map(([cat, price]) => [
            cat.charAt(0).toUpperCase() + cat.slice(1),
            `EUR ${price.toFixed(2)}`,
        ])
        if (data.budgetTotal !== undefined) {
            budgetRows.push(['TOTAL', `EUR ${data.budgetTotal.toFixed(2)}`])
        }

        doc.autoTable({
            startY: y,
            head: [['Category', 'Price']],
            body: budgetRows,
            theme: 'striped',
            headStyles: { fillColor: [40, 100, 60] },
            margin: { left: LEFT, right: 15 },
            columnStyles: { 1: { halign: 'right' } },
        })
        y = doc.lastAutoTable.finalY + 8
    }

    // Section 3: AI Shopping List (if present)
    if (data.recommendation !== undefined) {
        const rec = data.recommendation
        const presentCategories = RECOMMENDATION_CATEGORIES.filter(
            (cat) => rec[cat]?.name !== undefined,
        )

        if (presentCategories.length > 0) {
            if (y > 240) {
                doc.addPage()
                y = 20
            }

            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(60, 60, 60)
            doc.text('AI Shopping List', LEFT, y)
            y += 2

            const shoppingRows = presentCategories.map((cat) => {
                const item = rec[cat]
                return [
                    cat.charAt(0).toUpperCase() + cat.slice(1),
                    item?.name ?? '',
                    item?.price !== undefined ? `EUR ${item.price.toFixed(2)}` : '-',
                    item?.rationale ?? '',
                ]
            })
            const aiTotal = presentCategories.reduce((sum, cat) => sum + (rec[cat]?.price ?? 0), 0)
            shoppingRows.push(['', 'TOTAL', `EUR ${aiTotal.toFixed(2)}`, ''])

            doc.autoTable({
                startY: y,
                head: [['Category', 'Product', 'Price', 'Rationale']],
                body: shoppingRows,
                theme: 'striped',
                headStyles: { fillColor: [40, 100, 60] },
                margin: { left: LEFT, right: 15 },
                columnStyles: { 2: { halign: 'right' }, 3: { cellWidth: 60 } },
                styles: { overflow: 'linebreak', fontSize: 8 },
            })
            y = doc.lastAutoTable.finalY + 8

            if (rec.proTip) {
                doc.setFontSize(9)
                doc.setFont('helvetica', 'italic')
                doc.setTextColor(80, 80, 80)
                const lines = doc.splitTextToSize(`Pro Tip: ${rec.proTip}`, RIGHT - LEFT)
                doc.text(lines, LEFT, y)
            }
        }
    }

    // Footer with page numbers
    const pages = doc.internal.getNumberOfPages()
    for (let p = 1; p <= pages; p++) {
        doc.setPage(p)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Page ${p} / ${pages}`, RIGHT, 290, { align: 'right' })
    }

    const fileName = `cannaguide-equipment-plan-${now.toISOString().slice(0, 10)}.pdf`
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    triggerDownload(url, fileName)
}
