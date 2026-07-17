import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateEcTds, type EcTdsResult } from '@/services/knowledgeCalculatorService'
import { RagExplainBox, SimulationPanel } from './shared'

export const EcTdsPanel: React.FC = () => {
    const { t } = useTranslation()
    const [ecMs, setEcMs] = useState(2.0)
    const [phReadings, setPhReadings] = useState('6.5, 6.6, 6.5, 6.7')

    let result: EcTdsResult | null = null
    try {
        const readings = phReadings
            .split(/[,\s]+/)
            .map((s) => parseFloat(s))
            .filter((n) => !isNaN(n) && n >= 0 && n <= 14)
        result = calculateEcTds({ ecMs, phReadings: readings.length >= 2 ? readings : undefined })
    } catch {
        result = null
    }

    const trendColor = result?.phDrift
        ? result.phDrift.trend === 'rising'
            ? 'text-red-400'
            : result.phDrift.trend === 'falling'
              ? 'text-blue-400'
              : 'text-green-400'
        : 'text-slate-400'

    return (
        <div className="space-y-4">
            <p className="text-xs text-slate-400">{t('knowledgeView.rechner.ecTds.description')}</p>

            <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">
                    {t('knowledgeView.rechner.ecTds.ecInput')}
                </span>
                <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={ecMs}
                    onChange={(e) => {
                        setEcMs(Number(e.target.value))
                    }}
                    className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <span className="text-3xs text-slate-500 text-center">mS/cm</span>
            </label>

            {result && (
                <div
                    className="rounded-lg bg-slate-800/60 border border-white/10 p-3 space-y-2"
                    role="status"
                    aria-live="polite"
                >
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                            <div className="text-3xs text-slate-500 mb-0.5">
                                {t('knowledgeView.rechner.ecTds.tds500')}
                            </div>
                            <div className="font-bold text-white">{result.tds500} ppm</div>
                        </div>
                        <div>
                            <div className="text-3xs text-slate-500 mb-0.5">
                                {t('knowledgeView.rechner.ecTds.tds640')}
                            </div>
                            <div className="font-bold text-white">{result.tds640} ppm</div>
                        </div>
                        <div>
                            <div className="text-3xs text-slate-500 mb-0.5">
                                {t('knowledgeView.rechner.ecTds.tds700')}
                            </div>
                            <div className="font-bold text-white">{result.tds700} ppm</div>
                        </div>
                    </div>
                </div>
            )}

            <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">
                    {t('knowledgeView.rechner.ecTds.phReadings')}
                </span>
                <input
                    type="text"
                    value={phReadings}
                    onChange={(e) => {
                        setPhReadings(e.target.value)
                    }}
                    placeholder="e.g. 6.5, 6.6, 6.8, 7.0"
                    className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 py-1.5 px-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <span className="text-3xs text-slate-500">
                    comma-separated readings over multiple days
                </span>
            </label>

            {result?.phDrift && (
                <div
                    className="rounded-lg bg-slate-800/60 border border-white/10 p-3 space-y-1"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.ecTds.drift')}
                        </span>
                        <span className={`font-bold ${trendColor}`}>
                            {result.phDrift.slopePerDay > 0 ? '+' : ''}
                            {result.phDrift.slopePerDay.toFixed(3)} pH/day ({result.phDrift.trend})
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.ecTds.prediction')}
                        </span>
                        <span className="font-bold text-amber-300">
                            pH {result.phDrift.projectedDay7.toFixed(2)} @ day 7
                        </span>
                    </div>
                </div>
            )}

            <SimulationPanel
                command="SIMULATE_EC_DRIFT"
                payload={{
                    ecMs,
                    phReadings: phReadings
                        .split(/[,\s]+/)
                        .map(Number)
                        .filter((n) => !isNaN(n)),
                }}
                color="#60a5fa"
                unit="mS/cm"
                i18nPrefix="knowledgeView.rechner.ecTds"
            />
            {result && (
                <RagExplainBox
                    calculator="ecTds"
                    values={{
                        ecMs,
                        tds500: result.tds500,
                        driftPerDay: result.phDrift?.slopePerDay.toFixed(3) ?? '0',
                        trend: result.phDrift?.trend ?? 'stable',
                    }}
                    i18nPrefix="knowledgeView.rechner.ecTds"
                    suggestedPathId="nutrient-mastery"
                />
            )}
        </div>
    )
}
