import { Strain, SavedStrainTip } from '@/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { TFunction } from 'i18next'
import { generateTxt } from './exportDownload'
import type { JsPDFWithAutoTable } from './types'

const translatedOr = (value: string | undefined, fallback: string): string =>
    typeof value === 'string' && value.trim().length > 0 ? value : fallback

const percentText = (range: string | undefined, value: unknown, unknownLabel: string): string => {
    if (range) return range
    if (typeof value === 'number' && Number.isFinite(value)) return `${value}%`
    return unknownLabel
}

const floweringExportText = (strain: Strain, unknownLabel: string, weeksLabel: string): string => {
    if (strain.floweringTimeRange) return `${strain.floweringTimeRange} ${weeksLabel}`
    if (typeof strain.floweringTime === 'number' && Number.isFinite(strain.floweringTime)) {
        return `${strain.floweringTime} ${weeksLabel}`
    }
    return unknownLabel
}

const difficultyExportText = (strain: Strain, t: TFunction): string => {
    const difficulty = strain.agronomic?.difficulty
    if (!difficulty) return t('common.unknown')
    return t(`strainsView.difficulty.${difficulty.toLowerCase()}`)
}

const localizedList = (values: string[] | undefined, t: TFunction, prefix: string): string =>
    (values ?? []).map((item) => t(`${prefix}.${item}`, { defaultValue: item })).join(', ')

const catalogText = (strain: Strain, t: TFunction, field: string, fallback: string): string =>
    t(`strainsData.${strain.id}.${field}`, { defaultValue: fallback })

const typeExportFallback = (strain: Strain, unknownLabel: string): string =>
    translatedOr(strain.typeDetails, translatedOr(strain.type, unknownLabel))

const detailExportFallback = (
    details: { indoor?: string | undefined; outdoor?: string | undefined } | undefined,
    key: 'indoor' | 'outdoor',
    unknownLabel: string,
): string => {
    if (!details) return unknownLabel
    return translatedOr(details[key], unknownLabel)
}

const agronomicDetailFallback = (
    strain: Strain,
    group: 'yieldDetails' | 'heightDetails',
    key: 'indoor' | 'outdoor',
    unknownLabel: string,
): string => {
    const agronomic = strain.agronomic
    if (!agronomic) return unknownLabel
    return detailExportFallback(agronomic[group], key, unknownLabel)
}

const formatStrainTxt = (strain: Strain, t: TFunction): string => {
    const unknownLabel = t('common.unknown')
    const weeksLabel = t('common.units.weeks')
    const lines = [
        '========================================',
        strain.name.toUpperCase(),
        '========================================',
        '',
        `${t('common.type')}: ${catalogText(strain, t, 'typeDetails', typeExportFallback(strain, unknownLabel))}`,
        `${t('common.genetics')}: ${catalogText(strain, t, 'genetics', translatedOr(strain.genetics, 'N/A'))}`,
        '',
        `--- ${t('strainsView.strainDetail.cannabinoidProfile')} ---`,
        `${t('strainsView.table.thc')}: ${percentText(strain.thcRange, strain.thc, unknownLabel)}`,
        `${t('strainsView.table.cbd')}: ${percentText(strain.cbdRange, strain.cbd, unknownLabel)}`,
        '',
        `--- ${t('strainsView.strainModal.agronomicData')} ---`,
        `${t('strainsView.table.difficulty')}: ${difficultyExportText(strain, t)}`,
        `${t('strainsView.table.flowering')}: ${floweringExportText(strain, unknownLabel, weeksLabel)}`,
        `${t('strainsView.strainModal.yieldIndoor')}: ${catalogText(strain, t, 'yieldDetails.indoor', agronomicDetailFallback(strain, 'yieldDetails', 'indoor', unknownLabel))}`,
        `${t('strainsView.strainModal.yieldOutdoor')}: ${catalogText(strain, t, 'yieldDetails.outdoor', agronomicDetailFallback(strain, 'yieldDetails', 'outdoor', unknownLabel))}`,
        `${t('strainsView.strainModal.heightIndoor')}: ${catalogText(strain, t, 'heightDetails.indoor', agronomicDetailFallback(strain, 'heightDetails', 'indoor', unknownLabel))}`,
        `${t('strainsView.strainModal.heightOutdoor')}: ${catalogText(strain, t, 'heightDetails.outdoor', agronomicDetailFallback(strain, 'heightDetails', 'outdoor', unknownLabel))}`,
        '',
        `--- ${t('strainsView.strainDetail.aromaProfile')} ---`,
        `${t('strainsView.strainModal.aromas')}: ${localizedList(strain.aromas, t, 'common.aromas')}`,
        `${t('strainsView.strainModal.dominantTerpenes')}: ${localizedList(strain.dominantTerpenes, t, 'common.terpenes')}`,
        '',
        `--- ${t('common.description')} ---`,
        catalogText(strain, t, 'description', translatedOr(strain.description, 'N/A')),
        '',
        '',
    ]
    return lines.join('\n')
}

const writePdfBanner = (
    doc: jsPDF,
    t: TFunction,
    left: number,
    right: number,
    top: number,
): void => {
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('CannaGuide 2025', left, top - 10)
    doc.text(t('strainsView.exportModal.title'), 210 - right, top - 10, { align: 'right' })
    doc.setDrawColor(50)
    doc.line(left, top - 7, 210 - right, top - 7)
    doc.setTextColor(0)
}

const writeKeyValue = (
    doc: jsPDF,
    left: number,
    valueOffset: number,
    y: number,
    key: string,
    value: string,
): number => {
    if (!value) return y
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50)
    doc.text(`${key}:`, left, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20)
    doc.text(value, left + valueOffset, y)
    return y + 7
}

const writeSectionTitle = (doc: jsPDF, left: number, y: number, title: string): number => {
    const titleY = y + 8
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 50, 70)
    doc.text(title, left, titleY)
    return titleY + 8
}

const writeTextBlock = (
    doc: jsPDF,
    left: number,
    width: number,
    y: number,
    title: string,
    text: string,
): number => {
    if (!text) return y
    const textY = writeSectionTitle(doc, left, y, title)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20)
    const splitText = doc.splitTextToSize(text, width)
    doc.text(splitText, left, textY)
    return textY + splitText.length * 5 + 5
}

const writeStrainPdfPage = (doc: jsPDF, strain: Strain, t: TFunction): void => {
    const left = 15
    const right = 15
    const top = 20
    const width = 210 - left - right
    const valueOffset = 50
    const unknownLabel = t('common.unknown')
    writePdfBanner(doc, t, left, right, top)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 50, 70)
    doc.text(strain.name, left, top)
    let y = top + 12
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('common.type'),
        catalogText(strain, t, 'typeDetails', typeExportFallback(strain, unknownLabel)),
    )
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('common.genetics'),
        catalogText(strain, t, 'genetics', translatedOr(strain.genetics, 'N/A')),
    )
    y = writeSectionTitle(doc, left, y, t('strainsView.strainDetail.cannabinoidProfile'))
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.table.thc'),
        percentText(strain.thcRange, strain.thc, unknownLabel),
    )
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.table.cbd'),
        percentText(strain.cbdRange, strain.cbd, unknownLabel),
    )
    y = writeSectionTitle(doc, left, y, t('strainsView.strainModal.agronomicData'))
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.table.difficulty'),
        difficultyExportText(strain, t),
    )
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.table.flowering'),
        floweringExportText(strain, unknownLabel, t('common.units.weeks')),
    )
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.strainModal.yieldIndoor'),
        catalogText(
            strain,
            t,
            'yieldDetails.indoor',
            agronomicDetailFallback(strain, 'yieldDetails', 'indoor', unknownLabel),
        ),
    )
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.strainModal.yieldOutdoor'),
        catalogText(
            strain,
            t,
            'yieldDetails.outdoor',
            agronomicDetailFallback(strain, 'yieldDetails', 'outdoor', unknownLabel),
        ),
    )
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.strainModal.heightIndoor'),
        catalogText(
            strain,
            t,
            'heightDetails.indoor',
            agronomicDetailFallback(strain, 'heightDetails', 'indoor', unknownLabel),
        ),
    )
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.strainModal.heightOutdoor'),
        catalogText(
            strain,
            t,
            'heightDetails.outdoor',
            agronomicDetailFallback(strain, 'heightDetails', 'outdoor', unknownLabel),
        ),
    )
    y = writeSectionTitle(doc, left, y, t('strainsView.strainDetail.aromaProfile'))
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.strainModal.aromas'),
        localizedList(strain.aromas, t, 'common.aromas'),
    )
    y = writeKeyValue(
        doc,
        left,
        valueOffset,
        y,
        t('strainsView.strainModal.dominantTerpenes'),
        localizedList(strain.dominantTerpenes, t, 'common.terpenes'),
    )
    writeTextBlock(
        doc,
        left,
        width,
        y,
        t('common.description'),
        catalogText(strain, t, 'description', translatedOr(strain.description, '')),
    )
}

const writePdfFooters = (doc: jsPDF, t: TFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const pageCount = (doc as JsPDFWithAutoTable).internal.getNumberOfPages()
    for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`${t('common.generated')}: ${new Date().toLocaleString()}`, 15, 297 - 10)
        doc.text(`${t('common.page')} ${page} / ${pageCount}`, 210 - 15, 297 - 10, {
            align: 'right',
        })
    }
}

export const exportStrainsAsPdf = (strains: Strain[], fileName: string, t: TFunction): void => {
    const doc = new jsPDF()
    strains.forEach((strain, index) => {
        if (index > 0) doc.addPage()
        writeStrainPdfPage(doc, strain, t)
    })
    writePdfFooters(doc, t)
    doc.save(`${fileName}.pdf`)
}

export const exportStrainsAsTxt = (strains: Strain[], fileName: string, t: TFunction): void => {
    let content = `CannaGuide 2025 - ${t('strainsView.exportModal.title')}\n`
    content += `${t('common.generated')}: ${new Date().toLocaleString()}\n\n`
    strains.forEach((strain) => {
        content += formatStrainTxt(strain, t)
    })
    generateTxt(content, `${fileName}.txt`)
}

export function exportStrainTips(
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
        generateTxt(content, `${fileName}.txt`)
    }
}
