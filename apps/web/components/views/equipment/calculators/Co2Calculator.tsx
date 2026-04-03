import React, { useState, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, Input, ResultDisplay } from './common'
import { calculateCo2, Co2InputSchema, type Co2Input } from '@/services/equipmentCalculatorService'

const ROOM_VOLUME_MIN = 0.1
const ROOM_VOLUME_MAX = 500
const PPM_MIN = 300
const PPM_MAX = 5000

export const Co2Calculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const [roomVolume, setRoomVolume] = useState(4)
    const [currentPpm, setCurrentPpm] = useState(400)
    const [targetPpm, setTargetPpm] = useState(1200)
    const [ach, setAch] = useState(1)

    const result = useMemo(() => {
        const input: Co2Input = { roomVolume, currentPpm, targetPpm, ach }
        const parsed = Co2InputSchema.safeParse(input)
        if (!parsed.success) return null
        if (targetPpm <= currentPpm) return null
        return calculateCo2(parsed.data)
    }, [roomVolume, currentPpm, targetPpm, ach])

    const statusColor =
        result?.status === 'enrichment'
            ? 'text-emerald-400'
            : result?.status === 'excess'
              ? 'text-red-400'
              : 'text-slate-400'

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.co2.title')}
            description={t('equipmentView.calculators.co2.description')}
        >
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={t('equipmentView.calculators.co2.roomVolume')}
                    type="number"
                    unit="m3"
                    value={roomVolume}
                    min={ROOM_VOLUME_MIN}
                    max={ROOM_VOLUME_MAX}
                    step={0.1}
                    onChange={(e) => setRoomVolume(Number(e.target.value))}
                    tooltip={t('equipmentView.calculators.co2.roomVolumeTooltip')}
                />
                <Input
                    label={t('equipmentView.calculators.co2.ach')}
                    type="number"
                    unit={t('equipmentView.calculators.co2.achUnit')}
                    value={ach}
                    min={0}
                    max={60}
                    step={0.5}
                    onChange={(e) => setAch(Number(e.target.value))}
                    tooltip={t('equipmentView.calculators.co2.achTooltip')}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={t('equipmentView.calculators.co2.currentPpm')}
                    type="number"
                    unit="ppm"
                    value={currentPpm}
                    min={PPM_MIN}
                    max={PPM_MAX}
                    step={10}
                    onChange={(e) => setCurrentPpm(Number(e.target.value))}
                />
                <Input
                    label={t('equipmentView.calculators.co2.targetPpm')}
                    type="number"
                    unit="ppm"
                    value={targetPpm}
                    min={PPM_MIN}
                    max={PPM_MAX}
                    step={50}
                    onChange={(e) => setTargetPpm(Number(e.target.value))}
                    tooltip={t('equipmentView.calculators.co2.targetPpmTooltip')}
                />
            </div>

            {result ? (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <ResultDisplay
                            label={t('equipmentView.calculators.co2.initialBoost')}
                            value={result.initialBoostLiters.toFixed(1)}
                            unit="L"
                        />
                        <ResultDisplay
                            label={t('equipmentView.calculators.co2.initialBoostGrams')}
                            value={result.initialBoostGrams.toString()}
                            unit="g"
                        />
                    </div>
                    <ResultDisplay
                        label={t('equipmentView.calculators.co2.maintenanceRate')}
                        value={result.maintenanceRatePerHour.toFixed(1)}
                        unit="L/h"
                    >
                        <p className={`text-sm font-semibold mt-1 ${statusColor}`}>
                            {t(`equipmentView.calculators.co2.status.${result.status}`)}
                        </p>
                    </ResultDisplay>
                    <p className="text-xs text-slate-500 text-center">
                        {t('equipmentView.calculators.co2.safetyNote')}
                    </p>
                </div>
            ) : (
                <p className="text-sm text-amber-400 text-center">
                    {t('equipmentView.calculators.co2.targetMustExceedCurrent')}
                </p>
            )}
        </CalculatorSection>
    )
})
Co2Calculator.displayName = 'Co2Calculator'
