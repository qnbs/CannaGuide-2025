import React, { useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import type { Plant } from '@/types'

interface PlantTagGeneratorProps {
    plants: Plant[]
}

interface PlantTagCardProps {
    plant: Plant
}

const PlantTagCard: React.FC<PlantTagCardProps> = memo(({ plant }) => {
    const { t } = useTranslation()
    const qrValue = `cannaguide://plant/${plant.id}`

    return (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-black print:break-inside-avoid print:border print:border-slate-300">
            <QRCodeSVG
                value={qrValue}
                size={120}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
            />
            <div className="text-center">
                <p className="text-sm font-bold truncate max-w-[140px]">{plant.name}</p>
                <p className="text-xs text-slate-600 truncate max-w-[140px]">{plant.strain.name}</p>
                <p className="text-[10px] text-slate-400">
                    {t(`plantStages.${plant.stage}`)} -- {t('plantsView.plantCard.day')} {plant.age}
                </p>
            </div>
        </div>
    )
})
PlantTagCard.displayName = 'PlantTagCard'

export const PlantTagGenerator: React.FC<PlantTagGeneratorProps> = memo(({ plants }) => {
    const { t } = useTranslation()

    const handlePrint = useCallback(() => {
        window.print()
    }, [])

    const handlePdfExport = useCallback(async () => {
        try {
            const { default: jsPDF } = await import('jspdf')
            const doc = new jsPDF('p', 'mm', 'a4')
            const pageWidth = doc.internal.pageSize.getWidth()
            const colWidth = (pageWidth - 30) / 2
            const rowHeight = 55

            doc.setFontSize(14)
            doc.text('CannaGuide Plant Tags', 15, 15)

            for (let i = 0; i < plants.length; i++) {
                const plant = plants[i]
                if (!plant) continue
                const col = i % 2
                const row = Math.floor((i % 4) / 2)
                const x = 15 + col * (colWidth + 10)
                const y = 25 + row * (rowHeight + 5)

                if (i > 0 && i % 4 === 0) {
                    doc.addPage()
                }

                // Draw tag border
                doc.setDrawColor(200, 200, 200)
                doc.rect(x, y, colWidth, rowHeight)

                // Plant info
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text(plant.name, x + 45, y + 15, { maxWidth: colWidth - 50 })
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(8)
                doc.text(plant.strain.name, x + 45, y + 22, { maxWidth: colWidth - 50 })
                doc.text(`ID: ${plant.id.slice(0, 12)}`, x + 45, y + 29)
                doc.text(`cannaguide://plant/${plant.id}`, x + 5, y + rowHeight - 3, {
                    maxWidth: colWidth - 10,
                })
            }

            doc.save(`cannaguide-plant-tags-${new Date().toISOString().slice(0, 10)}.pdf`)
        } catch (err) {
            console.debug('[PlantTagGenerator] PDF export error:', err)
        }
    }, [plants])

    if (plants.length === 0) {
        return (
            <div className="rounded-xl bg-slate-800/40 p-8 text-center">
                <p className="text-sm text-slate-500">
                    {t('plantsView.tags.noPlants', {
                        defaultValue: 'No plants to generate tags for.',
                    })}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                    {t('plantsView.tags.title', { defaultValue: 'Plant Tags' })}
                </h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-sm text-white transition-colors"
                    >
                        {t('plantsView.tags.print', { defaultValue: 'Print' })}
                    </button>
                    <button
                        type="button"
                        onClick={handlePdfExport}
                        className="rounded-lg bg-primary-600 hover:bg-primary-500 px-3 py-1.5 text-sm text-white transition-colors"
                    >
                        {t('plantsView.tags.exportPdf', { defaultValue: 'Export PDF' })}
                    </button>
                </div>
            </div>

            {/* Tags grid -- 2 cols on screen, 2x2 for print */}
            <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
                {plants.map((plant) => (
                    <PlantTagCard key={plant.id} plant={plant} />
                ))}
            </div>
        </div>
    )
})
PlantTagGenerator.displayName = 'PlantTagGenerator'
