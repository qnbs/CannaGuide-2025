import React, { useState, useMemo, memo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, Input, Select, ResultDisplay } from './common'
import {
    calculateLightHanging,
    LightHangingInputSchema,
    LIGHT_EFFICIENCY,
    type LightHangingInput,
    type LightType,
} from '@/services/equipmentCalculatorService'
import { useCalculatorSessionStore } from '@/stores/useCalculatorSessionStore'
import { dbService } from '@/services/dbService'
import { CalculatorHistoryPanel } from './CalculatorHistoryPanel'

const LIGHT_TYPES: LightType[] = ['led', 'hps', 'cmh', 't5']

export const LightHangingCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const sharedLightWattage = useCalculatorSessionStore((s) => s.sharedLightWattage)
    const setSharedLightWattage = useCalculatorSessionStore((s) => s.setSharedLightWattage)
    const [lightType, setLightType] = useState<LightType>('led')
    const [targetPpfd, setTargetPpfd] = useState(600)
    const [historyToken, setHistoryToken] = useState(0)
    const savedResultRef = useRef<string | null>(null)

    const lightTypeOptions = LIGHT_TYPES.map((lt) => ({
        value: lt,
        label: t(`equipmentView.calculators.lightHanging.type.${lt}`),
    }))

    const efficiencyLabel = LIGHT_EFFICIENCY[lightType].toFixed(1)

    const result = useMemo(() => {
        const input: LightHangingInput = { wattage: sharedLightWattage, lightType, targetPpfd }
        const parsed = LightHangingInputSchema.safeParse(input)
        if (!parsed.success) return null
        return calculateLightHanging(parsed.data)
    }, [sharedLightWattage, lightType, targetPpfd])

    const handleSave = useCallback(() => {
        if (!result) return
        const key = JSON.stringify({ sharedLightWattage, lightType, targetPpfd, result })
        if (savedResultRef.current === key) return
        savedResultRef.current = key
        const entry = {
            id: `lightHanging-${Date.now()}`,
            calculatorId: 'lightHanging',
            inputs: { wattage: sharedLightWattage, lightType, targetPpfd },
            result: {
                recommendedCm: result.recommendedCm,
                ppfdActual: result.ppfdAtRecommended,
                dli18h: result.dli18h,
                status: result.status,
            },
            timestamp: Date.now(),
        }
        dbService
            .saveCalculatorHistoryEntry(entry)
            .then(() => {
                setHistoryToken((n) => n + 1)
            })
            .catch((err: unknown) => {
                console.debug('[LightHangingCalculator] history save error', err)
            })
    }, [result, sharedLightWattage, lightType, targetPpfd])

    const statusColor =
        result?.status === 'optimal'
            ? 'text-emerald-400'
            : result?.status === 'close'
              ? 'text-amber-400'
              : 'text-sky-400'

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.lightHanging.title')}
            description={t('equipmentView.calculators.lightHanging.description')}
        >
            <Select
                label={t('equipmentView.calculators.lightHanging.lightType')}
                options={lightTypeOptions}
                value={lightType}
                onChange={(e) => setLightType(e.target.value as LightType)}
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={t('equipmentView.calculators.lightHanging.wattage')}
                    type="number"
                    unit="W"
                    value={sharedLightWattage}
                    min={10}
                    max={10000}
                    step={50}
                    onChange={(e) => setSharedLightWattage(Number(e.target.value))}
                    tooltip={t('equipmentView.calculators.lightHanging.wattageTooltip', {
                        eff: efficiencyLabel,
                    })}
                />
                <Input
                    label={t('equipmentView.calculators.lightHanging.targetPpfd')}
                    type="number"
                    unit="umol"
                    value={targetPpfd}
                    min={50}
                    max={2000}
                    step={50}
                    onChange={(e) => setTargetPpfd(Number(e.target.value))}
                    tooltip={t('equipmentView.calculators.lightHanging.ppfdTooltip')}
                />
            </div>

            {result && (
                <div className="space-y-3">
                    <ResultDisplay
                        label={t('equipmentView.calculators.lightHanging.recommended')}
                        value={result.recommendedCm.toString()}
                        unit="cm"
                    >
                        <p className={`text-sm font-semibold mt-1 ${statusColor}`}>
                            {t(`equipmentView.calculators.lightHanging.status.${result.status}`)}
                        </p>
                    </ResultDisplay>
                    <div className="grid grid-cols-3 gap-3">
                        <ResultDisplay
                            label={t('equipmentView.calculators.lightHanging.min')}
                            value={result.minCm.toString()}
                            unit="cm"
                        />
                        <ResultDisplay
                            label={t('equipmentView.calculators.lightHanging.ppfdActual')}
                            value={result.ppfdAtRecommended.toString()}
                            unit="umol"
                        />
                        <ResultDisplay
                            label={t('equipmentView.calculators.lightHanging.dli')}
                            value={result.dli18h.toFixed(1)}
                            unit="mol/d"
                        />
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                        {t('equipmentView.calculators.lightHanging.note')}
                    </p>
                </div>
            )}
            {result && (
                <button
                    type="button"
                    onClick={handleSave}
                    className="mt-2 w-full rounded py-1.5 text-xs font-medium text-primary-400 border border-primary-700/40 hover:bg-primary-900/30 transition-colors"
                >
                    {t('equipmentView.calculators.history.save')}
                </button>
            )}
            <CalculatorHistoryPanel calculatorId="lightHanging" refreshToken={historyToken} />
        </CalculatorSection>
    )
})
LightHangingCalculator.displayName = 'LightHangingCalculator'
