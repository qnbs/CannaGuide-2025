import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    calculateLightSpectrum,
    type LightSpectrumResult,
} from '@/services/knowledgeCalculatorService'
import { RagExplainBox, SimulationPanel } from './shared'

export const LightSpectrumPanel: React.FC = () => {
    const { t } = useTranslation()
    const [ppfd, setPpfd] = useState(600)
    const [redPercent, setRedPercent] = useState(65)
    const [bluePercent, setBluePercent] = useState(20)
    const [hoursPerDay, setHoursPerDay] = useState(18)
    const [stage, setStage] = useState<'seedling' | 'veg' | 'flower' | 'lateFlower'>('veg')

    let result: LightSpectrumResult | null = null
    try {
        result = calculateLightSpectrum({ ppfd, redPercent, bluePercent, hoursPerDay, stage })
    } catch {
        result = null
    }

    const statusColor = result
        ? result.status === 'optimal'
            ? 'text-green-400'
            : result.status === 'good'
              ? 'text-amber-400'
              : 'text-red-400'
        : 'text-slate-400'

    return (
        <div className="space-y-4">
            <p className="text-xs text-slate-400">
                {t('knowledgeView.rechner.lightSpectrum.description')}
            </p>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.lightSpectrum.ppfd')}
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={2500}
                        step={50}
                        value={ppfd}
                        onChange={(e) => {
                            setPpfd(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-3xs text-slate-500 text-center">umol/m2/s</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.lightSpectrum.hours')}
                    </span>
                    <input
                        type="number"
                        min={1}
                        max={24}
                        step={1}
                        value={hoursPerDay}
                        onChange={(e) => {
                            setHoursPerDay(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-3xs text-slate-500 text-center">h/day</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.lightSpectrum.redPercent')}
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={redPercent}
                        onChange={(e) => {
                            setRedPercent(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-3xs text-slate-500 text-center">% (600-700 nm)</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.lightSpectrum.bluePercent')}
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={bluePercent}
                        onChange={(e) => {
                            setBluePercent(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-3xs text-slate-500 text-center">% (400-500 nm)</span>
                </label>
            </div>

            <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">
                    {t('knowledgeView.rechner.lightSpectrum.stage')}
                </span>
                <select
                    value={stage}
                    onChange={(e) => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        setStage(e.target.value as typeof stage)
                    }}
                    className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 py-1.5 px-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                    <option value="seedling">{t('knowledgeView.rechner.nutrient.seedling')}</option>
                    <option value="veg">{t('knowledgeView.rechner.nutrient.veg')}</option>
                    <option value="flower">{t('knowledgeView.rechner.nutrient.earlyFlower')}</option>
                    <option value="lateFlower">
                        {t('knowledgeView.rechner.nutrient.lateFlower')}
                    </option>
                </select>
            </label>

            {result && (
                <div
                    className="rounded-lg bg-slate-800/60 border border-white/10 p-3 space-y-2"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.lightSpectrum.dli')}
                        </span>
                        <strong className="text-white">{result.dli} mol/m2/day</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.lightSpectrum.efficiency')}
                        </span>
                        <strong className={statusColor}>
                            {result.photosyntheticEfficiency}% ({result.status})
                        </strong>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.lightSpectrum.terpeneBoost')}
                        </span>
                        <strong className="text-purple-300">+{result.terpeneBoostPercent}%</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 border-t border-white/10 pt-1">
                        <span>
                            {t('knowledgeView.rechner.lightSpectrum.recommended')}:{' '}
                            {result.recommendedRatio}
                        </span>
                        {result.ratioGap !== 0 && (
                            <span className="text-amber-400">
                                gap: {result.ratioGap > 0 ? '+' : ''}
                                {result.ratioGap}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <SimulationPanel
                command="SIMULATE_LIGHT_SPECTRUM"
                payload={{ ppfd, redPercent, bluePercent, hoursPerDay, stage }}
                color="#a78bfa"
                unit="mol/m2/d"
                i18nPrefix="knowledgeView.rechner.lightSpectrum"
            />
            {result && (
                <RagExplainBox
                    calculator="lightSpectrum"
                    values={{
                        ppfd,
                        dli: result.dli,
                        efficiency: result.photosyntheticEfficiency,
                        terpeneBoost: result.terpeneBoostPercent,
                        status: result.status,
                    }}
                    i18nPrefix="knowledgeView.rechner.lightSpectrum"
                    suggestedPathId="environment-mastery"
                />
            )}
        </div>
    )
}
