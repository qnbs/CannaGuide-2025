import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { Input, Select } from '../common'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { PlantStage } from '@/types'
import {
    addReading,
    setAiLoading,
    setAiRecommendation,
} from '@/stores/slices/nutrientPlannerSlice'
import type { EcPhReading, OptimalRange } from '@/stores/slices/nutrientPlannerSlice'
import { selectActivePlants, selectSettings } from '@/stores/selectors'
import { aiService } from '@/services/aiFacade'
import { OptimalRangeBar, StageLabel } from './EcPhSubcomponents'

export interface EcPhMonitorTabProps {
    medium: string
    currentStage: PlantStage
    optimalRange: OptimalRange
    plantOptions: { value: string; label: string }[]
    selectedPlantId: string | null
    onSelectedPlantIdChange: (plantId: string | null) => void
    readingType: 'input' | 'runoff'
    onReadingTypeChange: (readingType: 'input' | 'runoff') => void
    inputEc: number
    onInputEcChange: (value: number) => void
    inputPh: number
    onInputPhChange: (value: number) => void
    inputWaterTemp: number
    onInputWaterTempChange: (value: number) => void
    recentReadings: EcPhReading[]
    autoAdjust: boolean
    autoAdjustRecommendation: string | null
    aiLoading: boolean
    aiRecommendation: string | null
}

export const EcPhMonitorTab: React.FC<EcPhMonitorTabProps> = memo(
    ({
        medium,
        currentStage,
        optimalRange,
        plantOptions,
        selectedPlantId,
        onSelectedPlantIdChange,
        readingType,
        onReadingTypeChange,
        inputEc,
        onInputEcChange,
        inputPh,
        onInputPhChange,
        inputWaterTemp,
        onInputWaterTempChange,
        recentReadings,
        autoAdjust,
        autoAdjustRecommendation,
        aiLoading,
        aiRecommendation,
    }) => {
        const { t } = useTranslation()
        const dispatch = useAppDispatch()
        const activePlants = useAppSelector(selectActivePlants)
        const settings = useAppSelector(selectSettings)

        const handleAddReading = useCallback(() => {
            dispatch(
                addReading({
                    plantId: selectedPlantId,
                    ec: inputEc,
                    ph: inputPh,
                    waterTempC: inputWaterTemp,
                    readingType,
                    notes: '',
                }),
            )
        }, [dispatch, selectedPlantId, inputEc, inputPh, inputWaterTemp, readingType])

        const handleGetAiRecommendation = useCallback(async () => {
            dispatch(setAiLoading(true))
            try {
                const lang = settings.general.language ?? 'en'
                const plantContext = selectedPlantId
                    ? activePlants.find((p) => p.id === selectedPlantId)
                    : null

                const recommendation = await aiService.getNutrientRecommendation(
                    {
                        medium,
                        stage: currentStage,
                        currentEc: inputEc,
                        currentPh: inputPh,
                        optimalRange,
                        readings: recentReadings.slice(0, 5),
                        plant: plantContext ?? undefined,
                    },
                    lang,
                )
                dispatch(setAiRecommendation(recommendation))
            } catch {
                dispatch(setAiRecommendation(null))
            }
        }, [
            dispatch,
            settings.general.language,
            selectedPlantId,
            activePlants,
            medium,
            currentStage,
            inputEc,
            inputPh,
            optimalRange,
            recentReadings,
        ])

        return (
            <div className="space-y-4">
                <Card className="!p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <PhosphorIcons.CheckCircle className="w-4 h-4 text-primary-400" />
                        {t('equipmentView.calculators.ecPhPlanner.optimalRange')} ({medium} –{' '}
                        <StageLabel stage={currentStage} />)
                    </h4>
                    <OptimalRangeBar
                        label="EC"
                        value={inputEc}
                        min={optimalRange.ecMin}
                        max={optimalRange.ecMax}
                        absoluteMin={0}
                        absoluteMax={3.0}
                        unit="mS/cm"
                    />
                    <OptimalRangeBar
                        label="pH"
                        value={inputPh}
                        min={optimalRange.phMin}
                        max={optimalRange.phMax}
                        absoluteMin={4.0}
                        absoluteMax={8.0}
                        unit=""
                    />
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                        label={t('equipmentView.calculators.ecPhPlanner.plant')}
                        options={plantOptions}
                        value={selectedPlantId ?? ''}
                        onChange={(e) => onSelectedPlantIdChange(String(e.target.value) || null)}
                    />
                    <Select
                        label={t('equipmentView.calculators.ecPhPlanner.readingType')}
                        options={[
                            {
                                value: 'input',
                                label: t('equipmentView.calculators.ecPhPlanner.input'),
                            },
                            {
                                value: 'runoff',
                                label: t('equipmentView.calculators.ecPhPlanner.runoff'),
                            },
                        ]}
                        value={readingType}
                        onChange={(e) =>
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            onReadingTypeChange(String(e.target.value) as 'input' | 'runoff')
                        }
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                        label={t('equipmentView.calculators.ecPhPlanner.ecValue')}
                        type="number"
                        unit="mS/cm"
                        step="0.1"
                        min="0"
                        max="5"
                        value={inputEc}
                        onChange={(e) => onInputEcChange(Number(e.target.value))}
                        tooltip={t('equipmentView.calculators.ecPhPlanner.ecTooltip')}
                    />
                    <Input
                        label={t('equipmentView.calculators.ecPhPlanner.phValue')}
                        type="number"
                        unit=""
                        step="0.1"
                        min="0"
                        max="14"
                        value={inputPh}
                        onChange={(e) => onInputPhChange(Number(e.target.value))}
                        tooltip={t('equipmentView.calculators.ecPhPlanner.phTooltip')}
                    />
                    <Input
                        label={t('equipmentView.calculators.ecPhPlanner.waterTemp')}
                        type="number"
                        unit="°C"
                        step="0.5"
                        min="0"
                        max="40"
                        value={inputWaterTemp}
                        onChange={(e) => onInputWaterTempChange(Number(e.target.value))}
                    />
                </div>
                <Button variant="primary" onClick={handleAddReading} className="w-full">
                    <PhosphorIcons.Plus className="w-4 h-4 mr-2" />
                    {t('equipmentView.calculators.ecPhPlanner.logReading')}
                </Button>

                {autoAdjust && autoAdjustRecommendation && (
                    <Card className="!p-4 space-y-2 border-amber-500/20 bg-amber-900/10">
                        <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                            <PhosphorIcons.ArrowClockwise className="w-4 h-4" />
                            {t('equipmentView.calculators.ecPhPlanner.autoAdjust')}
                        </h4>
                        <p className="text-sm text-slate-300">{autoAdjustRecommendation}</p>
                    </Card>
                )}

                <Card className="!p-4 space-y-3 border-primary-500/20">
                    <h4 className="text-sm font-semibold text-primary-300 flex items-center gap-2">
                        <PhosphorIcons.Sparkle className="w-4 h-4" />
                        {t('equipmentView.calculators.ecPhPlanner.aiRecommendation')}
                    </h4>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleGetAiRecommendation}
                        disabled={aiLoading}
                        className="w-full"
                    >
                        {aiLoading ? (
                            <>
                                <PhosphorIcons.ArrowClockwise className="w-4 h-4 mr-2 animate-spin" />
                                {t('ai.generating')}
                            </>
                        ) : (
                            <>
                                <PhosphorIcons.Lightning className="w-4 h-4 mr-2" />
                                {t('equipmentView.calculators.ecPhPlanner.getAiAdvice')}
                            </>
                        )}
                    </Button>
                    {aiRecommendation && (
                        <div
                            className="prose prose-sm prose-invert max-w-none text-slate-300 bg-slate-800/30 rounded-lg p-3"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(aiRecommendation),
                            }}
                        />
                    )}
                </Card>
            </div>
        )
    },
)
EcPhMonitorTab.displayName = 'EcPhMonitorTab'
