import React, { useState, useMemo, memo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, ResultDisplay, Select } from './common'
import {
    calculateTimerSchedule,
    TimerScheduleInputSchema,
    type TimerScheduleInput,
    type TimerGrowthStage,
} from '@/services/equipmentCalculatorService'
import { dbService } from '@/services/dbService'
import { CalculatorHistoryPanel } from './CalculatorHistoryPanel'

const STAGE_OPTIONS: { value: TimerGrowthStage; labelKey: string }[] = [
    { value: 'seedling', labelKey: 'equipmentView.calculators.timerSchedule.stages.seedling' },
    { value: 'veg', labelKey: 'equipmentView.calculators.timerSchedule.stages.veg' },
    { value: 'flower', labelKey: 'equipmentView.calculators.timerSchedule.stages.flower' },
    { value: 'autoflower', labelKey: 'equipmentView.calculators.timerSchedule.stages.autoflower' },
]

export const TimerScheduleCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const [growthStage, setGrowthStage] = useState<TimerGrowthStage>('veg')
    const [ppfdValue, setPpfdValue] = useState('')
    const [targetDliValue, setTargetDliValue] = useState('')
    const [historyToken, setHistoryToken] = useState(0)
    const savedResultRef = useRef<string | null>(null)

    const ppfd = ppfdValue !== '' ? Number(ppfdValue) : undefined
    const targetDli = targetDliValue !== '' ? Number(targetDliValue) : undefined

    const result = useMemo(() => {
        const input: TimerScheduleInput = {
            growthStage,
            ppfd,
            targetDliMolPerM2: targetDli,
        }
        const parsed = TimerScheduleInputSchema.safeParse(input)
        if (!parsed.success) return null
        return calculateTimerSchedule(parsed.data)
    }, [growthStage, ppfd, targetDli])

    const handleSave = useCallback(() => {
        if (!result) return
        const key = JSON.stringify({ growthStage, ppfd, targetDli, ...result })
        if (savedResultRef.current === key) return
        savedResultRef.current = key
        const entry = {
            id: `timer-${Date.now()}`,
            calculatorId: 'timerSchedule',
            inputs: {
                growthStage,
                ...(ppfd !== undefined ? { ppfd } : {}),
                ...(targetDli !== undefined ? { targetDli } : {}),
            },
            result: {
                onHours: result.onHours,
                offHours: result.offHours,
                ...(result.dli !== null ? { dli: result.dli } : {}),
            },
            timestamp: Date.now(),
        }
        dbService
            .saveCalculatorHistoryEntry(entry)
            .then(() => setHistoryToken((n) => n + 1))
            .catch((err: unknown) => {
                console.debug('[TimerScheduleCalculator] history save error', err)
            })
    }, [result, growthStage, ppfd, targetDli])

    const dliStatusColor =
        result?.dliStatus === 'optimal'
            ? 'text-emerald-400'
            : result?.dliStatus === 'low'
              ? 'text-yellow-400'
              : result?.dliStatus === 'high'
                ? 'text-red-400'
                : 'text-slate-400'

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.timerSchedule.title')}
            description={t('equipmentView.calculators.timerSchedule.description')}
        >
            <Select
                label={t('equipmentView.calculators.timerSchedule.growthStage')}
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value as TimerGrowthStage)}
                options={STAGE_OPTIONS.map((s) => ({
                    value: s.value,
                    label: t(s.labelKey),
                }))}
            />

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">
                        {t('equipmentView.calculators.timerSchedule.ppfd')}
                        <span className="ml-1 text-slate-500">
                            ({t('equipmentView.calculators.timerSchedule.optional')})
                        </span>
                    </label>
                    <input
                        type="number"
                        className="w-full bg-slate-700 text-slate-100 rounded px-2 py-1.5 text-sm"
                        placeholder="e.g. 600"
                        value={ppfdValue}
                        min={50}
                        max={2000}
                        step={10}
                        onChange={(e) => setPpfdValue(e.target.value)}
                    />
                    <span className="text-xs text-slate-500">umol/m2/s</span>
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">
                        {t('equipmentView.calculators.timerSchedule.targetDli')}
                        <span className="ml-1 text-slate-500">
                            ({t('equipmentView.calculators.timerSchedule.optional')})
                        </span>
                    </label>
                    <input
                        type="number"
                        className="w-full bg-slate-700 text-slate-100 rounded px-2 py-1.5 text-sm"
                        placeholder="e.g. 30"
                        value={targetDliValue}
                        min={1}
                        max={80}
                        step={1}
                        onChange={(e) => setTargetDliValue(e.target.value)}
                    />
                    <span className="text-xs text-slate-500">mol/m2/day</span>
                </div>
            </div>

            {result && (
                <div className="mt-4 space-y-3">
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-inset ring-primary-500/30">
                        <div className="text-center">
                            <span className="text-3xl font-bold text-primary-300">
                                {result.schedule}
                            </span>
                            <p className="text-xs text-slate-400 mt-1">
                                {t('equipmentView.calculators.timerSchedule.recommended')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <ResultDisplay
                            label={t('equipmentView.calculators.timerSchedule.onHours')}
                            value={String(result.onHours)}
                            unit={t('equipmentView.calculators.timerSchedule.hoursUnit')}
                        />
                        <ResultDisplay
                            label={t('equipmentView.calculators.timerSchedule.offHours')}
                            value={String(result.offHours)}
                            unit={t('equipmentView.calculators.timerSchedule.hoursUnit')}
                        />
                    </div>

                    {result.dli !== null && (
                        <div className="grid grid-cols-2 gap-3">
                            <ResultDisplay
                                label={t('equipmentView.calculators.timerSchedule.dli')}
                                value={String(result.dli)}
                                unit="mol/m2/day"
                            />
                            <div className="rounded-lg bg-slate-800/40 px-3 py-2">
                                <p className="text-xs text-slate-400 mb-1">
                                    {t('equipmentView.calculators.timerSchedule.dliStatus')}
                                </p>
                                <span className={`text-sm font-semibold ${dliStatusColor}`}>
                                    {t(
                                        `equipmentView.calculators.timerSchedule.dliStatuses.${result.dliStatus}`,
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-slate-500">
                        {t('equipmentView.calculators.timerSchedule.dliRangeNote', {
                            min: result.recommendedDliRange.min,
                            max: result.recommendedDliRange.max,
                        })}
                    </p>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full rounded-md bg-primary-700/40 hover:bg-primary-700/60 text-primary-200 text-sm py-1.5 transition-colors"
                    >
                        {t('equipmentView.calculators.history.save')}
                    </button>
                </div>
            )}

            <CalculatorHistoryPanel calculatorId="timerSchedule" refreshToken={historyToken} />
        </CalculatorSection>
    )
})

TimerScheduleCalculator.displayName = 'TimerScheduleCalculator'
