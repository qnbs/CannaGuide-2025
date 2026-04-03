import React, { useState, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, Input, Select, ResultDisplay } from './common'
import {
    calculateHumidityDeficit,
    HumidityDeficitInputSchema,
    HD_OPTIMAL_RANGES,
    type HumidityDeficitInput,
    type HdGrowthStage,
} from '@/services/equipmentCalculatorService'

const STAGES: HdGrowthStage[] = ['seedling', 'vegetative', 'earlyFlower', 'lateFlower']

export const HumidityDeficitCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const [tempC, setTempC] = useState(25)
    const [rhPercent, setRhPercent] = useState(60)
    const [stage, setStage] = useState<HdGrowthStage>('vegetative')

    const stageOptions = STAGES.map((s) => ({
        value: s,
        label: t(`plants.stage.${s}`),
    }))

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
                onChange={(e) => setStage(e.target.value as HdGrowthStage)}
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={t('equipmentView.calculators.humidityDeficit.temperature')}
                    type="number"
                    unit="degC"
                    value={tempC}
                    min={-10}
                    max={50}
                    step={0.5}
                    onChange={(e) => setTempC(Number(e.target.value))}
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
                    onChange={(e) => setRhPercent(Number(e.target.value))}
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
