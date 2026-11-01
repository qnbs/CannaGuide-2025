import { Strain, SavedStrainTip } from '@/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { TFunction } from 'i18next'
import { generateTxt } from './exportDownload'
import type { JsPDFWithAutoTable } from './types'

export function exportStrainsAsPdf(strains: Strain[], fileName: string, t: TFunction) {
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
        printKeyValuePair(
            t('strainsView.table.thc'),
            strain.thcRange ||
                (typeof strain.thc === 'number' && Number.isFinite(strain.thc)
                    ? `${strain.thc}%`
                    : t('common.unknown')),
        )
        printKeyValuePair(
            t('strainsView.table.cbd'),
            strain.cbdRange ||
                (typeof strain.cbd === 'number' && Number.isFinite(strain.cbd)
                    ? `${strain.cbd}%`
                    : t('common.unknown')),
        )

        printSectionTitle(t('strainsView.strainModal.agronomicData'))
        printKeyValuePair(
            t('strainsView.table.difficulty'),
            strain.agronomic?.difficulty
                ? t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)
                : t('common.unknown'),
        )
        printKeyValuePair(
            t('strainsView.table.flowering'),
            strain.floweringTimeRange
                ? `${strain.floweringTimeRange} ${t('common.units.weeks')}`
                : typeof strain.floweringTime === 'number' && Number.isFinite(strain.floweringTime)
                  ? `${strain.floweringTime} ${t('common.units.weeks')}`
                  : t('common.unknown'),
        )
        printKeyValuePair(
            t('strainsView.strainModal.yieldIndoor'),
            t(`strainsData.${strain.id}.yieldDetails.indoor`, {
                defaultValue: strain.agronomic?.yieldDetails?.indoor ?? t('common.unknown'),
            }),
        )
        printKeyValuePair(
            t('strainsView.strainModal.yieldOutdoor'),
            t(`strainsData.${strain.id}.yieldDetails.outdoor`, {
                defaultValue: strain.agronomic?.yieldDetails?.outdoor ?? t('common.unknown'),
            }),
        )
        printKeyValuePair(
            t('strainsView.strainModal.heightIndoor'),
            t(`strainsData.${strain.id}.heightDetails.indoor`, {
                defaultValue: strain.agronomic?.heightDetails?.indoor ?? t('common.unknown'),
            }),
        )
        printKeyValuePair(
            t('strainsView.strainModal.heightOutdoor'),
            t(`strainsData.${strain.id}.heightDetails.outdoor`, {
                defaultValue: strain.agronomic?.heightDetails?.outdoor ?? t('common.unknown'),
            }),
        )

        printSectionTitle(t('strainsView.strainDetail.aromaProfile'))
        printKeyValuePair(
            t('strainsView.strainModal.aromas'),
            (strain.aromas ?? [])
                .map((a) => t(`common.aromas.${a}`, { defaultValue: a }))
                .join(', '),
        )
        printKeyValuePair(
            t('strainsView.strainModal.dominantTerpenes'),
            (strain.dominantTerpenes ?? [])
                .map((terp) => t(`common.terpenes.${terp}`, { defaultValue: terp }))
                .join(', '),
        )

        const description = t(`strainsData.${strain.id}.description`, {
            defaultValue: strain.description ?? '',
        })
        printTextBlock(t('common.description'), description)
    })

    // --- Add Footers to all pages ---
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const pageCount = (doc as JsPDFWithAutoTable).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`${t('common.generated')}: ${new Date().toLocaleString()}`, leftMargin, 297 - 10)
        doc.text(`${t('common.page')} ${i} / ${pageCount}`, 210 - rightMargin, 297 - 10, {
            align: 'right',
        })
    }

    doc.save(`${fileName}.pdf`)
}

export function exportStrainsAsTxt(strains: Strain[], fileName: string, t: TFunction) {
    let content = `CannaGuide 2025 - ${t('strainsView.exportModal.title')}\n`
    content += `${t('common.generated')}: ${new Date().toLocaleString()}\n\n`

    strains.forEach((s) => {
        const typeDetailsLabel = t(`strainsData.${s.id}.typeDetails`, {
            defaultValue: s.typeDetails ?? s.type ?? t('common.unknown'),
        })
        const geneticsLabel = t(`strainsData.${s.id}.genetics`, {
            defaultValue: s.genetics ?? 'N/A',
        })
        const difficultyLabel = s.agronomic?.difficulty
            ? t(`strainsView.difficulty.${s.agronomic.difficulty.toLowerCase()}`)
            : t('common.unknown')
        const yieldIndoorLabel = t(`strainsData.${s.id}.yieldDetails.indoor`, {
            defaultValue: s.agronomic?.yieldDetails?.indoor ?? t('common.unknown'),
        })
        const yieldOutdoorLabel = t(`strainsData.${s.id}.yieldDetails.outdoor`, {
            defaultValue: s.agronomic?.yieldDetails?.outdoor ?? t('common.unknown'),
        })
        const heightIndoorLabel = t(`strainsData.${s.id}.heightDetails.indoor`, {
            defaultValue: s.agronomic?.heightDetails?.indoor ?? t('common.unknown'),
        })
        const heightOutdoorLabel = t(`strainsData.${s.id}.heightDetails.outdoor`, {
            defaultValue: s.agronomic?.heightDetails?.outdoor ?? t('common.unknown'),
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
        content += `${t('strainsView.table.thc')}: ${s.thcRange ?? (typeof s.thc === 'number' && Number.isFinite(s.thc) ? `${s.thc}%` : t('common.unknown'))}\n`
        content += `${t('strainsView.table.cbd')}: ${s.cbdRange ?? (typeof s.cbd === 'number' && Number.isFinite(s.cbd) ? `${s.cbd}%` : t('common.unknown'))}\n\n`

        content += `--- ${t('strainsView.strainModal.agronomicData')} ---\n`
        content += `${t('strainsView.table.difficulty')}: ${difficultyLabel}\n`
        content += `${t('strainsView.table.flowering')}: ${
            s.floweringTimeRange
                ? `${s.floweringTimeRange} ${t('common.units.weeks')}`
                : typeof s.floweringTime === 'number' && Number.isFinite(s.floweringTime)
                  ? `${s.floweringTime} ${t('common.units.weeks')}`
                  : t('common.unknown')
        }\n`
        content += `${t('strainsView.strainModal.yieldIndoor')}: ${yieldIndoorLabel}\n`
        content += `${t('strainsView.strainModal.yieldOutdoor')}: ${yieldOutdoorLabel}\n`
        content += `${t('strainsView.strainModal.heightIndoor')}: ${heightIndoorLabel}\n`
        content += `${t('strainsView.strainModal.heightOutdoor')}: ${heightOutdoorLabel}\n\n`

        content += `--- ${t('strainsView.strainDetail.aromaProfile')} ---\n`
        content += `${t('strainsView.strainModal.aromas')}: ${(s.aromas ?? []).map((a) => t(`common.aromas.${a}`, { defaultValue: a })).join(', ')}\n`
        content += `${t('strainsView.strainModal.dominantTerpenes')}: ${(s.dominantTerpenes ?? []).map((terp) => t(`common.terpenes.${terp}`, { defaultValue: terp })).join(', ')}\n\n`

        content += `--- ${t('common.description')} ---\n`
        content += `${descriptionLabel}\n\n\n`
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
