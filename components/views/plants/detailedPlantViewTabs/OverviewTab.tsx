import React from 'react'
import { Plant, ModalType } from '@/types'
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

interface OverviewTabProps {
    plant: Plant
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ plant }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const openActionModalAction = (type: ModalType) => {
        dispatch(openActionModal({ plantId: plant.id, type }))
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
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                    {t('plantsView.detailedView.history')}
                </h3>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="h-64 rounded-lg" data-highlight-id="history-chart">
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
