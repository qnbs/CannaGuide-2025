import React, { useState, useMemo, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, Input, Select, ResultDisplay } from './common'
import {
    calculateHumidityDeficit,
    HumidityDeficitInputSchema,
    HD_OPTIMAL_RANGES,
    type HumidityDeficitInput,
    type HdGrowthStage,
} from '@/services/equipmentCalculatorService'
import { sensorStore } from '@/stores/sensorStore'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const STAGES: HdGrowthStage[] = ['seedling', 'vegetative', 'earlyFlower', 'lateFlower']

export const HumidityDeficitCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const [tempC, setTempC] = useState(25)
    const [rhPercent, setRhPercent] = useState(60)
    const [stage, setStage] = useState<HdGrowthStage>('vegetative')
    const [iotSynced, setIotSynced] = useState(false)

    const stageOptions = STAGES.map((s) => ({
        value: s,
        label: t(`plants.stage.${s}`),
    }))

    const handleIotSync = useCallback(() => {
        const reading = sensorStore.getState().currentReading
        if (reading) {
            setTempC(Math.round(reading.temperatureC * 10) / 10)
            setRhPercent(Math.round(reading.humidityPercent))
            setIotSynced(true)
        }
    }, [])

    const result = useMemo(() => {
        const input: HumidityDeficitInput = { tempC, rhPercent }
        const parsed = HumidityDeficitInputSchema.safeParse(input)
        if (!parsed.success) return null
        return calculateHumidityDeficit(parsed.data, stage)
    }, [tempC, rhPercent, stage])

    const statusColor =
        result?.status === 'optimal'
            ? 'text-emerald-400'
            : result?.status === 'low'
              ? 'text-amber-400'
              : 'text-red-400'

    const optimalRange = HD_OPTIMAL_RANGES[stage]

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.humidityDeficit.title')}
            description={t('equipmentView.calculators.humidityDeficit.description')}
        >
            <Select
                label={t('equipmentView.calculators.humidityDeficit.stage')}
                options={stageOptions}
                value={stage}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                onChange={(e) => setStage(e.target.value as HdGrowthStage)}
            />
            <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                    {t('equipmentView.calculators.humidityDeficit.temperature')} /{' '}
                    {t('equipmentView.calculators.humidityDeficit.humidity')}
                </span>
                <button
                    type="button"
                    onClick={handleIotSync}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/60 hover:bg-slate-600/60 text-xs text-slate-300 transition-colors ring-1 ring-inset ring-white/10"
                    title={t('equipmentView.calculators.iot.syncButton')}
                >
                    <PhosphorIcons.WifiHigh className="w-3.5 h-3.5" />
                    {iotSynced
                        ? t('equipmentView.calculators.iot.synced')
                        : t('equipmentView.calculators.iot.syncButton')}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={t('equipmentView.calculators.humidityDeficit.temperature')}
                    type="number"
                    unit="degC"
                    value={tempC}
                    min={-10}
                    max={50}
                    step={0.5}
                    onChange={(e) => {
                        setIotSynced(false)
                        setTempC(Number(e.target.value))
                    }}
                    tooltip={t('equipmentView.calculators.humidityDeficit.temperatureTooltip')}
                />
                <Input
                    label={t('equipmentView.calculators.humidityDeficit.humidity')}
                    type="number"
                    unit="%"
                    value={rhPercent}
                    min={1}
                    max={100}
                    step={1}
                    onChange={(e) => {
                        setIotSynced(false)
                        setRhPercent(Number(e.target.value))
                    }}
                />
            </div>

            {result && (
                <div className="space-y-3">
                    <ResultDisplay
                        label={t('equipmentView.calculators.humidityDeficit.result')}
                        value={result.hd.toFixed(1)}
                        unit="g/m3"
                    >
                        <p className={`text-sm font-semibold mt-1 ${statusColor}`}>
                            {t(`equipmentView.calculators.humidityDeficit.status.${result.status}`)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {t('equipmentView.calculators.humidityDeficit.optimalRange', {
                                min: optimalRange.min,
                                max: optimalRange.max,
                            })}
                        </p>
                    </ResultDisplay>
                    <div className="grid grid-cols-2 gap-3">
                        <ResultDisplay
                            label={t('equipmentView.calculators.humidityDeficit.ahSat')}
                            value={result.ahSat.toFixed(1)}
                            unit="g/m3"
                        />
                        <ResultDisplay
                            label={t('equipmentView.calculators.humidityDeficit.ahActual')}
                            value={result.ahActual.toFixed(1)}
                            unit="g/m3"
                        />
                    </div>
                </div>
            )}
        </CalculatorSection>
    )
})
HumidityDeficitCalculator.displayName = 'HumidityDeficitCalculator'
