import {
    Strain,
    SavedStrainTip,
    SavedSetup,
    RecommendationCategory,
    RecommendationItem,
    Plant,
} from '@/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { TFunction } from 'i18next'
import html2canvas from 'html2canvas'

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

class ExportService {
    private generateTxt(content: string, fileName: string) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        this.triggerDownload(url, fileName)
    }

    private triggerDownload(url: string, fileName: string) {
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

    public exportStrainsAsPdf(strains: Strain[], fileName: string, t: TFunction) {
        const doc = new jsPDF()
        const leftMargin = 15
        const rightMargin = 15
        const topMargin = 20
        const contentWidth = 210 - leftMargin - rightMargin
        const valueOffset = 50

        strains.forEach((strain, index) => {
            if (index > 0) {
                doc.addPage()
            }

            let y = topMargin

            // --- Header ---
            doc.setFontSize(9)
            doc.setTextColor(150)
            doc.text('CannaGuide 2025', leftMargin, topMargin - 10)
            doc.text(t('strainsView.exportModal.title'), 210 - rightMargin, topMargin - 10, {
                align: 'right',
            })
            doc.setDrawColor(50)
            doc.line(leftMargin, topMargin - 7, 210 - rightMargin, topMargin - 7)
            doc.setTextColor(0)

            // --- Strain Name ---
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(40, 50, 70)
            doc.text(strain.name, leftMargin, y)
            y += 12

            // --- Helper Functions ---
            const printKeyValuePair = (
                key: string,
                value: string | undefined | null,
                keyBold = true,
                valBold = false,
            ) => {
                if (!value) return
                doc.setFontSize(11)
                doc.setFont('helvetica', keyBold ? 'bold' : 'normal')
                doc.setTextColor(50)
                doc.text(key + ':', leftMargin, y)
                doc.setFont('helvetica', valBold ? 'bold' : 'normal')
                doc.setTextColor(20)
                doc.text(value, leftMargin + valueOffset, y)
                y += 7
            }

            const printSectionTitle = (title: string) => {
                y += 8
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(40, 50, 70)
                doc.text(title, leftMargin, y)
                y += 8
            }

            const printTextBlock = (title: string, text: string | undefined | null) => {
                if (!text) return
                printSectionTitle(title)
                doc.setFontSize(11)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(20)
                const splitText = doc.splitTextToSize(text, contentWidth)
                doc.text(splitText, leftMargin, y)
                y += splitText.length * 5 + 5
            }

            // --- Content Sections ---
            printKeyValuePair(
                t('common.type'),
                t(`strainsData.${strain.id}.typeDetails`, {
                    defaultValue: strain.typeDetails || strain.type,
                }),
            )
            printKeyValuePair(
                t('common.genetics'),
                t(`strainsData.${strain.id}.genetics`, { defaultValue: strain.genetics ?? 'N/A' }),
            )

            printSectionTitle(t('strainsView.strainDetail.cannabinoidProfile'))
            printKeyValuePair(t('strainsView.table.thc'), strain.thcRange || `${strain.thc}%`)
            printKeyValuePair(t('strainsView.table.cbd'), strain.cbdRange || `${strain.cbd}%`)

            printSectionTitle(t('strainsView.strainModal.agronomicData'))
            printKeyValuePair(
                t('strainsView.table.difficulty'),
                t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`),
            )
            printKeyValuePair(
                t('strainsView.table.flowering'),
                strain.floweringTimeRange
                    ? `${strain.floweringTimeRange} ${t('common.units.weeks')}`
                    : `${strain.floweringTime} ${t('common.units.weeks')}`,
            )
            printKeyValuePair(
                t('strainsView.strainModal.yieldIndoor'),
                t(`strainsData.${strain.id}.yieldDetails.indoor`, {
                    defaultValue: strain.agronomic.yieldDetails?.indoor ?? 'N/A',
                }),
            )
            printKeyValuePair(
                t('strainsView.strainModal.yieldOutdoor'),
                t(`strainsData.${strain.id}.yieldDetails.outdoor`, {
                    defaultValue: strain.agronomic.yieldDetails?.outdoor ?? 'N/A',
                }),
            )
            printKeyValuePair(
                t('strainsView.strainModal.heightIndoor'),
                t(`strainsData.${strain.id}.heightDetails.indoor`, {
                    defaultValue: strain.agronomic.heightDetails?.indoor ?? 'N/A',
                }),
            )
            printKeyValuePair(
                t('strainsView.strainModal.heightOutdoor'),
                t(`strainsData.${strain.id}.heightDetails.outdoor`, {
                    defaultValue: strain.agronomic.heightDetails?.outdoor ?? 'N/A',
                }),
            )

            printSectionTitle(t('strainsView.strainDetail.aromaProfile'))
            printKeyValuePair(
                t('strainsView.strainModal.aromas'),
                (strain.aromas || [])
                    .map((a) => t(`common.aromas.${a}`, { defaultValue: a }))
                    .join(', '),
            )
            printKeyValuePair(
                t('strainsView.strainModal.dominantTerpenes'),
                (strain.dominantTerpenes || [])
                    .map((terp) => t(`common.terpenes.${terp}`, { defaultValue: terp }))
                    .join(', '),
            )

            const description = t(`strainsData.${strain.id}.description`, {
                defaultValue: strain.description ?? '',
            })
            printTextBlock(t('common.description'), description)
        })

        // --- Add Footers to all pages ---
        const pageCount = (doc as JsPDFWithAutoTable).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150)
            doc.text(
                `${t('common.generated')}: ${new Date().toLocaleString()}`,
                leftMargin,
                297 - 10,
            )
            doc.text(`${t('common.page')} ${i} / ${pageCount}`, 210 - rightMargin, 297 - 10, {
                align: 'right',
            })
        }

        doc.save(`${fileName}.pdf`)
    }

    public exportStrainsAsTxt(strains: Strain[], fileName: string, t: TFunction) {
        let content = `CannaGuide 2025 - ${t('strainsView.exportModal.title')}\n`
        content += `${t('common.generated')}: ${new Date().toLocaleString()}\n\n`

        strains.forEach((s) => {
            const typeDetailsLabel = t(`strainsData.${s.id}.typeDetails`, {
                defaultValue: s.typeDetails || s.type,
            })
            const geneticsLabel = t(`strainsData.${s.id}.genetics`, {
                defaultValue: s.genetics ?? 'N/A',
            })
            const difficultyLabel = t(
                `strainsView.difficulty.${s.agronomic.difficulty.toLowerCase()}`,
            )
            const yieldIndoorLabel = t(`strainsData.${s.id}.yieldDetails.indoor`, {
                defaultValue: s.agronomic.yieldDetails?.indoor ?? 'N/A',
            })
            const yieldOutdoorLabel = t(`strainsData.${s.id}.yieldDetails.outdoor`, {
                defaultValue: s.agronomic.yieldDetails?.outdoor ?? 'N/A',
            })
            const heightIndoorLabel = t(`strainsData.${s.id}.heightDetails.indoor`, {
                defaultValue: s.agronomic.heightDetails?.indoor ?? 'N/A',
            })
            const heightOutdoorLabel = t(`strainsData.${s.id}.heightDetails.outdoor`, {
                defaultValue: s.agronomic.heightDetails?.outdoor ?? 'N/A',
            })
            const descriptionLabel = t(`strainsData.${s.id}.description`, {
                defaultValue: s.description ?? 'N/A',
            })

            content += `========================================\n`
            content += `${s.name.toUpperCase()}\n`
            content += `========================================\n\n`

            content += `${t('common.type')}: ${typeDetailsLabel}\n`
            content += `${t('common.genetics')}: ${geneticsLabel}\n\n`

            content += `--- ${t('strainsView.strainDetail.cannabinoidProfile')} ---\n`
            content += `${t('strainsView.table.thc')}: ${s.thcRange || `${s.thc}%`}\n`
            content += `${t('strainsView.table.cbd')}: ${s.cbdRange || `${s.cbd}%`}\n\n`

            content += `--- ${t('strainsView.strainModal.agronomicData')} ---\n`
            content += `${t('strainsView.table.difficulty')}: ${difficultyLabel}\n`
            content += `${t('strainsView.table.flowering')}: ${s.floweringTimeRange || s.floweringTime} ${t('common.units.weeks')}\n`
            content += `${t('strainsView.strainModal.yieldIndoor')}: ${yieldIndoorLabel}\n`
            content += `${t('strainsView.strainModal.yieldOutdoor')}: ${yieldOutdoorLabel}\n`
            content += `${t('strainsView.strainModal.heightIndoor')}: ${heightIndoorLabel}\n`
            content += `${t('strainsView.strainModal.heightOutdoor')}: ${heightOutdoorLabel}\n\n`

            content += `--- ${t('strainsView.strainDetail.aromaProfile')} ---\n`
            content += `${t('strainsView.strainModal.aromas')}: ${(s.aromas || []).map((a) => t(`common.aromas.${a}`, { defaultValue: a })).join(', ')}\n`
            content += `${t('strainsView.strainModal.dominantTerpenes')}: ${(s.dominantTerpenes || []).map((terp) => t(`common.terpenes.${terp}`, { defaultValue: terp })).join(', ')}\n\n`

            content += `--- ${t('common.description')} ---\n`
            content += `${descriptionLabel}\n\n\n`
        })
        this.generateTxt(content, `${fileName}.txt`)
    }

    public exportStrainTips(
        tips: SavedStrainTip[],
        format: 'pdf' | 'txt',
        fileName: string,
        t: TFunction,
    ) {
        if (format === 'pdf') {
            const doc = new jsPDF()
            doc.text(`${t('strainsView.tips.title')}`, 14, 15)
            let y = 25
            tips.forEach((tip) => {
                if (y > 270) {
                    doc.addPage()
                    y = 20
                }
                doc.setFont('helvetica', 'bold')
                doc.text(tip.title, 14, y)
                y += 7
                doc.setFont('helvetica', 'normal')
                const content = `${t('strainsView.tips.form.categories.nutrientTip')}: ${tip.nutrientTip}\n${t('strainsView.tips.form.categories.trainingTip')}: ${tip.trainingTip}\n${t('strainsView.tips.form.categories.environmentalTip')}: ${tip.environmentalTip}\n${t('strainsView.tips.form.categories.proTip')}: ${tip.proTip}`
                const splitContent = doc.splitTextToSize(content, 180)
                doc.text(splitContent, 14, y)
                y += splitContent.length * 5 + 10
            })
            doc.save(`${fileName}.pdf`)
        } else {
            let content = `${t('strainsView.tips.title')}\n========================\n\n`
            tips.forEach((tip) => {
                content += `${tip.title}\n------------------------\n`
                content += `${t('strainsView.tips.form.categories.nutrientTip')}: ${tip.nutrientTip}\n`
                content += `${t('strainsView.tips.form.categories.trainingTip')}: ${tip.trainingTip}\n`
                content += `${t('strainsView.tips.form.categories.environmentalTip')}: ${tip.environmentalTip}\n`
                content += `${t('strainsView.tips.form.categories.proTip')}: ${tip.proTip}\n\n`
            })
            this.generateTxt(content, `${fileName}.txt`)
        }
    }

    public exportSetupsAsPdf(setups: SavedSetup[], fileName: string, t: TFunction) {
        const doc = new jsPDF()
        const leftMargin = 15
        const rightMargin = 15
        const topMargin = 20
        const contentWidth = 210 - leftMargin - rightMargin

        setups.forEach((setup, index) => {
            if (index > 0) doc.addPage()
            let y = topMargin

            // Header
            doc.setFontSize(9)
            doc.setTextColor(150)
            doc.text('CannaGuide 2025', leftMargin, topMargin - 10)
            doc.text(
                t('equipmentView.savedSetups.pdfReport.title'),
                210 - rightMargin,
                topMargin - 10,
                { align: 'right' },
            )
            doc.setDrawColor(50)
            doc.line(leftMargin, topMargin - 7, 210 - rightMargin, topMargin - 7)

            // Title
            doc.setFontSize(20)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(40, 50, 70)
            doc.text(setup.name, leftMargin, y)
            y += 8

            doc.setFontSize(9)
            doc.setTextColor(150)
            doc.text(
                `${t('common.generated')}: ${new Date(setup.createdAt).toLocaleString()}`,
                leftMargin,
                y,
            )
            y += 10

            // Source details
            if (setup.sourceDetails) {
                const prioritiesLabel = setup.sourceDetails.priorities
                    .map((p) => t(`equipmentView.configurator.priorities.${p}`))
                    .join(', ')
                const resolvedPrioritiesLabel =
                    prioritiesLabel.length > 0 ? prioritiesLabel : t('common.none')
                const resolvedCustomNotes = setup.sourceDetails.customNotes ?? t('common.none')
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(40, 50, 70)
                doc.text(t('equipmentView.savedSetups.pdfReport.sourceDetails'), leftMargin, y)
                y += 7

                const sourceDetails = [
                    [
                        t('equipmentView.savedSetups.pdfReport.plantCount'),
                        setup.sourceDetails.plantCount,
                    ],
                    [
                        t('equipmentView.savedSetups.pdfReport.experience'),
                        t(
                            `strainsView.tips.form.experienceOptions.${setup.sourceDetails.experience}`,
                        ),
                    ],
                    [
                        t('equipmentView.savedSetups.pdfReport.budget'),
                        `${setup.sourceDetails.budget} ${t('common.units.currency_eur')}`,
                    ],
                    [
                        t('equipmentView.savedSetups.pdfReport.priorities'),
                        resolvedPrioritiesLabel,
                    ],
                    [
                        t('equipmentView.savedSetups.pdfReport.customNotes'),
                        resolvedCustomNotes,
                    ],
                ]
                ;(doc as JsPDFWithAutoTable).autoTable({
                    startY: y,
                    body: sourceDetails,
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
                y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10
            }

            // Equipment Table
            if (setup.recommendation) {
                const body: (string | number | undefined)[][] = []
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

                ;(doc as JsPDFWithAutoTable).autoTable({
                    startY: y,
                    head: [
                        [
                            t('common.type'),
                            t('equipmentView.savedSetups.pdfReport.product'),
                            t('equipmentView.savedSetups.pdfReport.price'),
                            t('equipmentView.savedSetups.pdfReport.rationale'),
                        ],
                    ],
                    body: body,
                    theme: 'striped',
                    headStyles: { fillColor: [40, 50, 70] },
                    didDrawPage: (data: { cursor: { y: number } }) => {
                        y = data.cursor.y
                    },
                })
                y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10

                // Pro Tip
                if (setup.recommendation.proTip) {
                    if (y > 250) {
                        doc.addPage()
                        y = topMargin
                    }
                    doc.setFontSize(12)
                    doc.setFont('helvetica', 'bold')
                    doc.text(t('strainsView.tips.form.categories.proTip'), leftMargin, y)
                    y += 6
                    doc.setFontSize(10)
                    doc.setFont('helvetica', 'normal')
                    const splitText = doc.splitTextToSize(setup.recommendation.proTip, contentWidth)
                    doc.text(splitText, leftMargin, y)
                    y += splitText.length * 5 + 5
                }
            }

            // Total Cost
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text(
                `${t('equipmentView.savedSetups.pdfReport.totalCost')}: ${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}`,
                210 - rightMargin,
                y,
                { align: 'right' },
            )
        })

        const pageCount = (doc as JsPDFWithAutoTable).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150)
            doc.text(`${t('common.page')} ${i} / ${pageCount}`, 210 - rightMargin, 297 - 10, {
                align: 'right',
            })
        }

        doc.save(`${fileName}.pdf`)
    }

    public exportSetupsAsTxt(setups: SavedSetup[], fileName: string, t: TFunction) {
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

        this.generateTxt(content, `${fileName}.txt`)
    }

    public async exportPlantReportPdf(params: {
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

        y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8

        const journalRows = plant.journal
            .toReversed()
            .slice(0, 30)
            .map((entry) => [
                new Date(entry.createdAt).toLocaleDateString(),
                entry.type,
                entry.notes,
            ])

        ;(doc as JsPDFWithAutoTable).autoTable({
            startY: y,
            head: [['Date', 'Type', 'Notes']],
            body: journalRows,
            theme: 'striped',
            headStyles: { fillColor: [40, 50, 70] },
            styles: { fontSize: 9, overflow: 'linebreak' },
            margin: { left: leftMargin, right: rightMargin },
        })

        y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8

        if (chartElement) {
            if (y > 230) {
                doc.addPage()
                y = 20
            }

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
}

export const exportService = new ExportService()
