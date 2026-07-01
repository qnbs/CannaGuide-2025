import React, { memo, useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection } from '../common'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { PlantStage } from '@/types'
import {
    setMedium,
    toggleAutoAdjust,
    dismissAlert,
    clearAlerts,
    getOptimalRange,
} from '@/stores/slices/nutrientPlannerSlice'
import {
    selectNutrientSchedule,
    selectNutrientReadings,
    selectActiveNutrientAlerts,
    selectNutrientMedium,
    selectNutrientAutoAdjust,
    selectNutrientAiLoading,
    selectNutrientAiRecommendation,
    selectNutrientAutoAdjustRecommendation,
} from '@/stores/selectors'
import { selectActivePlants } from '@/stores/selectors'
import { pluginService } from '@/services/pluginService'
import type { NutrientSchedulePlugin } from '@/services/pluginService'
import {
    EcPhAlertsPanel,
    EcPhMediumToolbar,
    EcPhTabBar,
    type EcPhTabId,
} from './EcPhSubcomponents'
import { EcPhMonitorTab } from './EcPhMonitorTab'
import { EcPhScheduleTab } from './EcPhScheduleTab'
import { EcPhHistoryTab } from './EcPhHistoryTab'

export const EcPhPlannerCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const schedule = useAppSelector(selectNutrientSchedule)
    const readings = useAppSelector(selectNutrientReadings)
    const alerts = useAppSelector(selectActiveNutrientAlerts)
    const medium = useAppSelector(selectNutrientMedium)
    const autoAdjust = useAppSelector(selectNutrientAutoAdjust)
    const aiLoading = useAppSelector(selectNutrientAiLoading)
    const aiRecommendation = useAppSelector(selectNutrientAiRecommendation)
    const autoAdjustRecommendation = useAppSelector(selectNutrientAutoAdjustRecommendation)
    const activePlants = useAppSelector(selectActivePlants)

    const [inputEc, setInputEc] = useState(1.2)
    const [inputPh, setInputPh] = useState(6.2)
    const [inputWaterTemp, setInputWaterTemp] = useState(20)
    const [readingType, setReadingType] = useState<'input' | 'runoff'>('input')
    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<EcPhTabId>('monitor')

    const [nutrientPlugins, setNutrientPlugins] = useState<NutrientSchedulePlugin[]>([])
    useEffect(() => {
        setNutrientPlugins(pluginService.getNutrientSchedules())
    }, [])

    const currentStage = useMemo(() => {
        if (selectedPlantId) {
            const plant = activePlants.find((p) => p.id === selectedPlantId)
            return plant?.stage ?? PlantStage.Vegetative
        }
        return PlantStage.Vegetative
    }, [activePlants, selectedPlantId])

    const optimalRange = useMemo(
        () => getOptimalRange(medium, currentStage),
        [medium, currentStage],
    )

    const recentReadings = useMemo(() => readings.slice(-10).reverse(), [readings])

    const plantOptions = useMemo(
        () => [
            { value: '', label: t('equipmentView.calculators.ecPhPlanner.allPlants') },
            ...activePlants.map((p) => ({ value: p.id, label: p.name })),
        ],
        [activePlants, t],
    )

    const tabs = useMemo(
        () => [
            {
                id: 'monitor' as const,
                label: t('equipmentView.calculators.ecPhPlanner.tabs.monitor'),
                icon: <PhosphorIcons.ChartLineUp className="w-4 h-4" />,
            },
            {
                id: 'schedule' as const,
                label: t('equipmentView.calculators.ecPhPlanner.tabs.schedule'),
                icon: <PhosphorIcons.Book className="w-4 h-4" />,
            },
            {
                id: 'history' as const,
                label: t('equipmentView.calculators.ecPhPlanner.tabs.history'),
                icon: <PhosphorIcons.ChartPieSlice className="w-4 h-4" />,
            },
        ],
        [t],
    )

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.ecPhPlanner.title')}
            description={t('equipmentView.calculators.ecPhPlanner.description')}
        >
            <EcPhMediumToolbar
                medium={medium}
                autoAdjust={autoAdjust}
                onMediumChange={(m) => dispatch(setMedium(m))}
                onToggleAutoAdjust={() => dispatch(toggleAutoAdjust())}
            />

            <EcPhAlertsPanel
                alerts={alerts}
                onDismissAlert={(id) => dispatch(dismissAlert(id))}
                onClearAlerts={() => dispatch(clearAlerts())}
            />

            <EcPhTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'monitor' && (
                <EcPhMonitorTab
                    medium={medium}
                    currentStage={currentStage}
                    optimalRange={optimalRange}
                    plantOptions={plantOptions}
                    selectedPlantId={selectedPlantId}
                    onSelectedPlantIdChange={setSelectedPlantId}
                    readingType={readingType}
                    onReadingTypeChange={setReadingType}
                    inputEc={inputEc}
                    onInputEcChange={setInputEc}
                    inputPh={inputPh}
                    onInputPhChange={setInputPh}
                    inputWaterTemp={inputWaterTemp}
                    onInputWaterTempChange={setInputWaterTemp}
                    recentReadings={recentReadings}
                    autoAdjust={autoAdjust}
                    autoAdjustRecommendation={autoAdjustRecommendation}
                    aiLoading={aiLoading}
                    aiRecommendation={aiRecommendation}
                />
            )}

            {activeTab === 'schedule' && (
                <EcPhScheduleTab
                    nutrientPlugins={nutrientPlugins}
                    schedule={schedule}
                    medium={medium}
                />
            )}

            {activeTab === 'history' && (
                <EcPhHistoryTab
                    recentReadings={recentReadings}
                    medium={medium}
                    currentStage={currentStage}
                />
            )}
        </CalculatorSection>
    )
})

EcPhPlannerCalculator.displayName = 'EcPhPlannerCalculator'
