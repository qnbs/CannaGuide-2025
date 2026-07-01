import { Plant } from '@/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { TFunction } from 'i18next'
import type { JsPDFWithAutoTable } from './types'

export async function exportPlantReportPdf(params: {
    plant: Plant
    t: TFunction
    chartElement?: HTMLElement | null
    photos?: string[]
    fileName?: string
}) {
    const { plant, t, chartElement, photos = [], fileName } = params
    const doc = new jsPDF()
    const leftMargin = 15
    const rightMargin = 15
    let y = 20

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`Grow Report - ${plant.name}`, leftMargin, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${t('common.generated')}: ${new Date().toLocaleString()}`, leftMargin, y)
    y += 6
    doc.text(`${t('common.type')}: ${plant.strain.name}`, leftMargin, y)
    y += 6
    doc.text(`Stage: ${plant.stage} | Day: ${plant.age}`, leftMargin, y)
    y += 6
    doc.text(
        `VPD: ${plant.environment.vpd.toFixed(2)} kPa | Temp: ${plant.environment.internalTemperature.toFixed(1)} C | RH: ${plant.environment.internalHumidity.toFixed(1)}%`,
        leftMargin,
        y,
    )
    y += 8

    const summaryRows = [
        ['Stage', plant.stage],
        ['Growth day', `${plant.age} ${t('common.days')}`],
        ['VPD', `${plant.environment.vpd.toFixed(2)} kPa`],
        ['Temperature', `${plant.environment.internalTemperature.toFixed(1)} °C`],
        ['Humidity', `${plant.environment.internalHumidity.toFixed(1)} % RH`],
    ]

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    ;(doc as JsPDFWithAutoTable).autoTable({
        startY: y,
        body: summaryRows,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5, overflow: 'linebreak' },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: 50, cellWidth: 55 },
            1: { textColor: 20 },
        },
        margin: { left: leftMargin, right: rightMargin },
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8

    const journalRows = plant.journal
        .toReversed()
        .slice(0, 30)
        .map((entry) => [
            new Date(entry.createdAt).toLocaleDateString(),
            entry.type,
            entry.notes,
        ])

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    ;(doc as JsPDFWithAutoTable).autoTable({
        startY: y,
        head: [['Date', 'Type', 'Notes']],
        body: journalRows,
        theme: 'striped',
        headStyles: { fillColor: [40, 50, 70] },
        styles: { fontSize: 9, overflow: 'linebreak' },
        margin: { left: leftMargin, right: rightMargin },
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8

    if (chartElement) {
        if (y > 230) {
            doc.addPage()
            y = 20
        }

        const { default: html2canvas } = await import('html2canvas')
        const chartCanvas = await html2canvas(chartElement, {
            backgroundColor: '#0f172a',
            scale: 2,
            useCORS: true,
        })
        const chartImage = chartCanvas.toDataURL('image/png')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('VPD / Growth Graph', leftMargin, y)
        y += 4

        const chartWidth = 180
        const chartHeight = 95
        doc.addImage(chartImage, 'PNG', leftMargin, y, chartWidth, chartHeight)
        y += chartHeight + 8
    }

    const maxPhotos = Math.min(photos.length, 6)
    if (maxPhotos > 0) {
        doc.addPage()
        y = 20
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.text('Grow Photos', leftMargin, y)
        y += 8

        const cellWidth = 85
        const cellHeight = 60
        for (let i = 0; i < maxPhotos; i++) {
            const col = i % 2
            const row = Math.floor(i / 2)
            const x = leftMargin + col * (cellWidth + 6)
            const imgY = y + row * (cellHeight + 6)
            const format = photos[i]!.startsWith('data:image/png') ? 'PNG' : 'JPEG'
            doc.addImage(photos[i]!, format, x, imgY, cellWidth, cellHeight)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const pageCount = (doc as JsPDFWithAutoTable).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`${t('common.page')} ${i} / ${pageCount}`, 210 - rightMargin, 297 - 10, {
            align: 'right',
        })
    }

    doc.save(`${fileName || `${plant.name.replace(/\s+/g, '-')}-grow-report`}.pdf`)
}
