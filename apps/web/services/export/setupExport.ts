import { SavedSetup, RecommendationCategory, RecommendationItem } from '@/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { TFunction } from 'i18next'
import { generateTxt } from './exportDownload'
import type { JsPDFWithAutoTable } from './types'

const PDF_MARGINS = { left: 15, right: 15, top: 20 } as const
const PDF_PAGE_WIDTH = 210
const PDF_PAGE_HEIGHT = 297

function pdfContentWidth(): number {
    return PDF_PAGE_WIDTH - PDF_MARGINS.left - PDF_MARGINS.right
}

function renderSetupHeader(doc: jsPDF, setup: SavedSetup, t: TFunction): number {
    const { left: lm, right: rm, top: tm } = PDF_MARGINS
    const pageRight = PDF_PAGE_WIDTH - rm
    let y = tm

    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('CannaGuide 2025', lm, tm - 10)
    doc.text(t('equipmentView.savedSetups.pdfReport.title'), pageRight, tm - 10, {
        align: 'right',
    })
    doc.setDrawColor(50)
    doc.line(lm, tm - 7, pageRight, tm - 7)

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 50, 70)
    doc.text(setup.name, lm, y)
    y += 8

    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(`${t('common.generated')}: ${new Date(setup.createdAt).toLocaleString()}`, lm, y)
    return y + 10
}

function renderSourceDetails(
    doc: JsPDFWithAutoTable,
    setup: SavedSetup,
    startY: number,
    t: TFunction,
): number {
    if (!setup.sourceDetails) return startY
    const lm = PDF_MARGINS.left
    let y = startY

    const prioritiesLabel = setup.sourceDetails.priorities
        .map((p) => t(`equipmentView.configurator.priorities.${p}`))
        .join(', ')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 50, 70)
    doc.text(t('equipmentView.savedSetups.pdfReport.sourceDetails'), lm, y)
    y += 7

    const rows = [
        [t('equipmentView.savedSetups.pdfReport.plantCount'), setup.sourceDetails.plantCount],
        [
            t('equipmentView.savedSetups.pdfReport.experience'),
            t(`strainsView.tips.form.experienceOptions.${setup.sourceDetails.experience}`),
        ],
        [
            t('equipmentView.savedSetups.pdfReport.budget'),
            `${setup.sourceDetails.budget} ${t('common.units.currency_eur')}`,
        ],
        [
            t('equipmentView.savedSetups.pdfReport.priorities'),
            prioritiesLabel.length > 0 ? prioritiesLabel : t('common.none'),
        ],
        [
            t('equipmentView.savedSetups.pdfReport.customNotes'),
            setup.sourceDetails.customNotes ?? t('common.none'),
        ],
    ]
    doc.autoTable({
        startY: y,
        body: rows,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1.5, halign: 'left' },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: 50, cellWidth: 40 },
            1: { textColor: 20 },
        },
        didDrawPage: (data: { cursor: { y: number } }) => {
            y = data.cursor.y
        },
    })
    return doc.lastAutoTable.finalY + 10
}

function renderEquipmentTable(
    doc: JsPDFWithAutoTable,
    setup: SavedSetup,
    startY: number,
    t: TFunction,
): number {
    if (!setup.recommendation) return startY
    const { left: lm, top: tm } = PDF_MARGINS
    let y = startY

    const categoryOrder: RecommendationCategory[] = [
        'tent',
        'light',
        'ventilation',
        'circulationFan',
        'pots',
        'soil',
        'nutrients',
        'extra',
    ]
    const body: (string | number | undefined)[][] = []
    for (const key of categoryOrder) {
        const item = setup.recommendation[key as keyof typeof setup.recommendation] as
            | RecommendationItem
            | string
        if (typeof item === 'object' && item.name) {
            body.push([
                t(`equipmentView.configurator.categories.${key}`),
                item.name,
                `${item.price.toFixed(2)} ${t('common.units.currency_eur')}`,
                item.rationale,
            ])
        }
    }

    doc.autoTable({
        startY: y,
        head: [
            [
                t('common.type'),
                t('equipmentView.savedSetups.pdfReport.product'),
                t('equipmentView.savedSetups.pdfReport.price'),
                t('equipmentView.savedSetups.pdfReport.rationale'),
            ],
        ],
        body,
        theme: 'striped',
        headStyles: { fillColor: [40, 50, 70] },
        didDrawPage: (data: { cursor: { y: number } }) => {
            y = data.cursor.y
        },
    })
    y = doc.lastAutoTable.finalY + 10

    if (setup.recommendation.proTip) {
        if (y > 250) {
            doc.addPage()
            y = tm
        }
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(t('strainsView.tips.form.categories.proTip'), lm, y)
        y += 6
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const splitText = doc.splitTextToSize(setup.recommendation.proTip, pdfContentWidth())
        doc.text(splitText, lm, y)
        y += splitText.length * 5 + 5
    }
    return y
}

function addPageFooters(doc: JsPDFWithAutoTable, t: TFunction): void {
    const rm = PDF_MARGINS.right
    const pageRight = PDF_PAGE_WIDTH - rm
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`${t('common.page')} ${i} / ${pageCount}`, pageRight, PDF_PAGE_HEIGHT - 10, {
            align: 'right',
        })
    }
}

export function exportSetupsAsPdf(setups: SavedSetup[], fileName: string, t: TFunction) {
    const doc = new jsPDF()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const typedDoc = doc as JsPDFWithAutoTable
    const rm = PDF_MARGINS.right
    const pageRight = PDF_PAGE_WIDTH - rm

    setups.forEach((setup, index) => {
        if (index > 0) doc.addPage()

        let y = renderSetupHeader(doc, setup, t)
        y = renderSourceDetails(typedDoc, setup, y, t)
        y = renderEquipmentTable(typedDoc, setup, y, t)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(
            `${t('equipmentView.savedSetups.pdfReport.totalCost')}: ${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}`,
            pageRight,
            y,
            { align: 'right' },
        )
    })

    addPageFooters(typedDoc, t)
    doc.save(`${fileName}.pdf`)
}

export function exportSetupsAsTxt(setups: SavedSetup[], fileName: string, t: TFunction) {
    let content = `CannaGuide 2025 - ${t('equipmentView.savedSetups.pdfReport.title')}\n`
    content += `${t('common.generated')}: ${new Date().toLocaleString()}\n\n`

    setups.forEach((setup) => {
        content += `==============================\n`
        content += `${setup.name.toUpperCase()}\n`
        content += `==============================\n`
        content += `(${t('common.generated')}: ${new Date(setup.createdAt).toLocaleString()})\n\n`

        if (setup.sourceDetails) {
            const experienceLabel = t(
                `strainsView.tips.form.experienceOptions.${setup.sourceDetails.experience}`,
            )
            const prioritiesLabel = setup.sourceDetails.priorities
                .map((p) => t(`equipmentView.configurator.priorities.${p}`))
                .join(', ')
            const resolvedPrioritiesLabel =
                prioritiesLabel.length > 0 ? prioritiesLabel : t('common.none')
            const resolvedCustomNotes = setup.sourceDetails.customNotes ?? t('common.none')
            content += `--- ${t('equipmentView.savedSetups.pdfReport.sourceDetails')} ---\n`
            content += `${t('equipmentView.savedSetups.pdfReport.plantCount')}: ${setup.sourceDetails.plantCount}\n`
            content += `${t('equipmentView.savedSetups.pdfReport.experience')}: ${experienceLabel}\n`
            content += `${t('equipmentView.savedSetups.pdfReport.budget')}: ${setup.sourceDetails.budget} ${t('common.units.currency_eur')}\n`
            content += `${t('equipmentView.savedSetups.pdfReport.priorities')}: ${resolvedPrioritiesLabel}\n`
            content += `${t('equipmentView.savedSetups.pdfReport.customNotes')}: ${resolvedCustomNotes}\n\n`
        }

        if (setup.recommendation) {
            content += `--- EQUIPMENT ---\n`
            const categoryOrder: RecommendationCategory[] = [
                'tent',
                'light',
                'ventilation',
                'circulationFan',
                'pots',
                'soil',
                'nutrients',
                'extra',
            ]
            categoryOrder.forEach((key) => {
                const item = setup.recommendation[key as keyof typeof setup.recommendation] as
                    | RecommendationItem
                    | string
                if (typeof item === 'object' && item.name) {
                    const categoryLabel = t(`equipmentView.configurator.categories.${key}`)
                    content += `${categoryLabel}: ${item.name} (${item.price.toFixed(2)} ${t('common.units.currency_eur')})\n`
                    content += `  - Rationale: ${item.rationale}\n`
                }
            })
            content += `\n--- ${t('strainsView.tips.form.categories.proTip')} ---\n`
            content += `${setup.recommendation.proTip}\n\n`
        }

        content += `TOTAL: ${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}\n\n\n`
    })

    generateTxt(content, `${fileName}.txt`)
}
