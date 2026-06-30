import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    calculateCannabinoidRatio,
    type CannabinoidRatioResult,
} from '@/services/knowledgeCalculatorService'
import { RagExplainBox } from './shared'

export const CannabinoidRatioPanel: React.FC = () => {
    const { t } = useTranslation()
    const [thc, setThc] = useState(22)
    const [cbd, setCbd] = useState(2)
    const [cbg, setCbg] = useState(1)

    let result: CannabinoidRatioResult | null = null
    try {
        result = calculateCannabinoidRatio({ thc, cbd, cbg })
    } catch {
        result = null
    }

    const harmonyColor = result
        ? result.harmonyScore >= 70
            ? 'text-green-400'
            : result.harmonyScore >= 40
              ? 'text-amber-400'
              : 'text-red-400'
        : 'text-slate-400'

    return (
        <div className="space-y-4">
            <p className="text-xs text-slate-400">
                {t('knowledgeView.rechner.cannabinoidRatio.description')}
            </p>

            <div className="grid grid-cols-3 gap-3">
                {[
                    {
                        label: `${t('knowledgeView.rechner.terpeneEntourage.thcLabel')} %`,
                        val: thc,
                        set: setThc,
                        max: 40,
                    },
                    {
                        label: `${t('knowledgeView.rechner.terpeneEntourage.cbdLabel')} %`,
                        val: cbd,
                        set: setCbd,
                        max: 40,
                    },
                    {
                        label: `${t('knowledgeView.rechner.terpeneEntourage.cbgLabel')} %`,
                        val: cbg,
                        set: setCbg,
                        max: 20,
                    },
                ].map(({ label, val, set, max }) => (
                    <label key={label} className="flex flex-col gap-1">
                        <span className="text-xs text-slate-400">{label}</span>
                        <input
                            type="number"
                            min={0}
                            max={max}
                            step={0.5}
                            value={val}
                            onChange={(e) => {
                                set(Number(e.target.value))
                            }}
                            className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </label>
                ))}
            </div>

            {result && (
                <div
                    className="rounded-lg bg-slate-800/60 border border-white/10 p-3 space-y-2"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.cannabinoidRatio.ratio')}
                        </span>
                        <strong className="text-white font-mono text-xs">{result.ratioLabel}</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.cannabinoidRatio.profile')}
                        </span>
                        <strong className="text-amber-300">{result.profileType}</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                            {t('knowledgeView.rechner.cannabinoidRatio.harmony')}
                        </span>
                        <strong className={harmonyColor}>
                            {result.harmonyScore}
                            <span className="text-xs font-normal text-slate-500">/100</span>
                        </strong>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center text-xs border-t border-white/10 pt-2">
                        <div>
                            <div className="text-slate-500">
                                {t('knowledgeView.rechner.terpeneEntourage.thcLabel')}
                            </div>
                            <div className="text-white font-bold">{result.thcPct}%</div>
                        </div>
                        <div>
                            <div className="text-slate-500">
                                {t('knowledgeView.rechner.terpeneEntourage.cbdLabel')}
                            </div>
                            <div className="text-white font-bold">{result.cbdPct}%</div>
                        </div>
                        <div>
                            <div className="text-slate-500">
                                {t('knowledgeView.rechner.terpeneEntourage.cbgLabel')}
                            </div>
                            <div className="text-white font-bold">{result.cbgPct}%</div>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 border-t border-white/10 pt-2">
                        {result.entourageNote}
                    </p>
                </div>
            )}

            {result && (
                <RagExplainBox
                    calculator="cannabinoidRatio"
                    values={{
                        thcPct: thc,
                        cbdPct: cbd,
                        cbgPct: cbg,
                        profileType: result.profileType,
                        harmony: result.harmonyScore,
                    }}
                    i18nPrefix="knowledgeView.rechner.cannabinoidRatio"
                    suggestedPathId="advanced-training"
                />
            )}
        </div>
    )
}
