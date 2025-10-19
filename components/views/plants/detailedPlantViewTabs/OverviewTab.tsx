import React from 'react'
import { Plant, ModalType } from '@/types'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { PlantVisualizer } from '../PlantVisualizer'
import { HistoryChart } from '../HistoryChart'
import { VPDGauge } from '../VPDGauge'
import { RealtimeStatus } from '../RealtimeStatus'
import { EquipmentControls } from '../EquipmentControls'
import { ActionToolbar } from '../ActionToolbar'
import { VitalBar } from '../VitalBar'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectHighlightedElement } from '@/stores/selectors'
import { openActionModal as openActionModalAction } from '@/stores/slices/uiSlice'

interface OverviewTabProps {
    plant: Plant
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ plant }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const highlightedElement = useAppSelector(selectHighlightedElement)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                        {t('plantsView.detailedView.growthAndVisuals')}
                    </h3>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div
                                className={`h-48 md:h-64 rounded-lg transition-all duration-300 ${
                                    highlightedElement === 'history-chart' ? 'animate-pulse-glow' : ''
                                }`}
                                data-highlight-id="history-chart"
                            >
                                <HistoryChart
                                    history={plant.history}
                                    journal={plant.journal}
                                    plantCreatedAt={plant.createdAt}
                                />
                            </div>
                            <div className="h-48 md:h-64 flex items-center justify-center">
                                <PlantVisualizer plant={plant} className="w-48 h-48" />
                            </div>
                        </div>
                    </div>
                </Card>
                <Card>
                     <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                        {t('common.actions')}
                    </h3>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                        <ActionToolbar
                            onLogAction={(type: ModalType) =>
                                dispatch(openActionModalAction({ plantId: plant.id, type }))
                            }
                        />
                    </div>
                </Card>
                <Card>
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                        {t('plantsView.detailedView.substrateAndRoots')}
                    </h3>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <VitalBar
                                value={plant.medium.ph}
                                min={5.8}
                                max={6.8}
                                label={t('plantsView.vitals.ph')}
                                highlightId="ph-vital"
                            />
                            <VitalBar
                                value={plant.medium.ec}
                                min={0.8}
                                max={1.8}
                                label={t('plantsView.vitals.ec')}
                                highlightId="ec-vital"
                            />
                            <VitalBar
                                value={plant.medium.moisture}
                                min={20}
                                max={80}
                                label={t('plantsView.vitals.moisture')}
                                unit="%"
                                highlightId="moisture-vital"
                            />
                            <VitalBar
                                value={plant.rootSystem.health}
                                min={80}
                                max={100}
                                label={t('plantsView.detailedView.rootHealth')}
                                unit="%"
                                highlightId="root-health-vital"
                            />
                        </div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <RealtimeStatus createdAt={plant.createdAt} />
                <Card
                    className={`transition-all duration-300 ${
                        highlightedElement === 'vpd-gauge' ? 'animate-pulse-glow' : ''
                    }`}
                    data-highlight-id="vpd-gauge"
                >
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                        VPD
                    </h3>
                     <div className="p-3 bg-slate-800/50 rounded-lg">
                        <VPDGauge
                            temperature={plant.environment.internalTemperature}
                            humidity={plant.environment.internalHumidity}
                        />
                    </div>
                </Card>
                <EquipmentControls plant={plant} />
            </div>
        </div>
    )
}