import React, { useState } from 'react'
import { Plant, ModalType, JournalEntryType } from '@/types'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { HistoryChart } from '../HistoryChart'
import { EquipmentControls } from '../EquipmentControls'
import { ActionToolbar } from '../ActionToolbar'
import { useAppDispatch } from '@/stores/store'
import { openActionModal, openDiagnosticsModal } from '@/stores/slices/uiSlice'
import { PlantLifecycleTimeline } from '../PlantLifecycleTimeline'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { PlantVisualizer } from '../PlantVisualizer'
import { exportService } from '@/services/exportService'
import { dbService } from '@/services/dbService'

interface OverviewTabProps {
    plant: Plant
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ plant }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [isExporting, setIsExporting] = useState(false)

    const openActionModalAction = (type: ModalType) => {
        dispatch(openActionModal({ plantId: plant.id, type }))
    }

    const handleExportReport = async () => {
        setIsExporting(true)
        try {
            const photoEntries = plant.journal
                .filter((entry) => entry.type === JournalEntryType.Photo)
                .slice(-6)

            const photoDataUrls: string[] = []
            for (const entry of photoEntries) {
                const details = entry.details as { imageUrl?: string; imageId?: string } | undefined
                if (details?.imageUrl) {
                    photoDataUrls.push(details.imageUrl)
                    continue
                }
                if (details?.imageId) {
                    const storedImage = await dbService.getImage(details.imageId)
                    if (storedImage?.data) {
                        photoDataUrls.push(storedImage.data)
                    }
                }
            }

            await exportService.exportPlantReportPdf({
                plant,
                t,
                chartElement: document.getElementById(`history-chart-${plant.id}`),
                photos: photoDataUrls,
            })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* 1. Visualizer */}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                    {t('plantsView.detailedView.growthAndVisuals')}
                </h3>
                <div className="h-64 md:h-80 flex items-center justify-center">
                    <PlantVisualizer plant={plant} className="w-64 h-64" />
                </div>
            </Card>

            {/* 2. Lifecycle */}
            <Card>
                <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
            </Card>

            {/* 3. Actions */}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                    {t('common.actions')}
                </h3>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                    <ActionToolbar onLogAction={openActionModalAction} />
                </div>
                <Button
                    onClick={() => dispatch(openDiagnosticsModal(plant.id))}
                    size="sm"
                    className="w-full mt-4"
                >
                    <PhosphorIcons.Sparkle className="w-5 h-5 mr-2" />
                    {t('plantsView.aiDiagnostics.diagnoseProblem')}
                </Button>
            </Card>

            {/* 4. Equipment Controls */}
            <EquipmentControls plant={plant} />

            {/* 5. Growth History Chart */}
            <Card>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-xl font-bold font-display text-primary-400">
                        {t('plantsView.detailedView.history')}
                    </h3>
                    <Button size="sm" variant="secondary" onClick={handleExportReport} disabled={isExporting}>
                        <PhosphorIcons.FilePdf className="w-5 h-5 mr-1" />
                        {isExporting ? 'Exporting...' : 'Export PDF'}
                    </Button>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="h-64 rounded-lg" data-highlight-id="history-chart" id={`history-chart-${plant.id}`}>
                        <HistoryChart
                            history={plant.history}
                            journal={plant.journal}
                            plantCreatedAt={plant.createdAt}
                        />
                    </div>
                </div>
            </Card>
        </div>
    )
}
