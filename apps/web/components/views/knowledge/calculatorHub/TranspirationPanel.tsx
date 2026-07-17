import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    calculateTranspiration,
    type TranspirationResult,
} from '@/services/knowledgeCalculatorService'
import { RagExplainBox, SimulationPanel } from './shared'

export const TranspirationPanel: React.FC = () => {
    const { t } = useTranslation()
    const [vpd, setVpd] = useState(1.0)
    const [gsmmol, setGsmmol] = useState(200)
    const [lai, setLai] = useState(3)
    const [hoursPerDay, setHoursPerDay] = useState(18)

    let result: TranspirationResult | null = null
    try {
        result = calculateTranspiration({ vpd, gsmmol, lai, hoursPerDay })
    } catch {
        result = null
    }

    const statusColors = {
        low: 'text-blue-400 bg-blue-900/40 border-blue-700',
        optimal: 'text-green-400 bg-green-900/40 border-green-700',
        high: 'text-red-400 bg-red-900/40 border-red-700',
    }

    return (
        <div className="space-y-4">
            <p className="text-xs text-slate-400">
                {t('knowledgeView.rechner.transpiration.description')}
            </p>
            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.transpiration.vpd')}
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={vpd}
                        onChange={(e) => {
                            setVpd(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-3xs text-slate-500 text-center">kPa</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.transpiration.gsmmol')}
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={1000}
                        step={10}
                        value={gsmmol}
                        onChange={(e) => {
                            setGsmmol(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-3xs text-slate-500 text-center">mmol/m2/s</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.transpiration.lai')}
                    </span>
                    <input
                        type="number"
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={lai}
                        onChange={(e) => {
                            setLai(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-3xs text-slate-500 text-center">LAI</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.transpiration.hours')}
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
            </div>

            {result && (
                <div
                    className={`rounded-lg p-3 border space-y-1 ${statusColors[result.status]}`}
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.transpiration.leafRate')}
                        </span>
                        <strong>{result.leafRate.toFixed(2)} mmol/m2/s</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.transpiration.canopyRate')}
                        </span>
                        <strong>{result.canopyRate.toFixed(2)} mmol/m2/s</strong>
                    </div>
                    <div className="flex justify-between text-sm border-t border-white/10 pt-1 mt-1">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.transpiration.dailyWater')}
                        </span>
                        <strong>{result.dailyWaterMlPerM2} mL/m2/day</strong>
                    </div>
                </div>
            )}

            <SimulationPanel
                command="SIMULATE_TRANSPIRATION"
                payload={{ vpd, gsmmol, lai, hoursPerDay }}
                color="#34d399"
                unit="mmol/m2/s"
                i18nPrefix="knowledgeView.rechner.transpiration"
            />
            {result && (
                <RagExplainBox
                    calculator="transpiration"
                    values={{
                        leafRate: result.leafRate.toFixed(2),
                        canopyRate: result.canopyRate.toFixed(2),
                        dailyWater: result.dailyWaterMlPerM2,
                        status: result.status,
                    }}
                    i18nPrefix="knowledgeView.rechner.transpiration"
                    suggestedPathId="environment-mastery"
                />
            )}
        </div>
    )
}
