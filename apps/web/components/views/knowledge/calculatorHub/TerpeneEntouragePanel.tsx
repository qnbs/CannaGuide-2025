import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    calculateTerpeneEntourage,
    type TerpeneEntourageResult,
} from '@/services/knowledgeCalculatorService'
import { RagExplainBox } from './shared'

const KNOWN_TERPENES = [
    'Myrcene',
    'Limonene',
    'Caryophyllene',
    'Linalool',
    'Pinene',
    'Terpinolene',
    'Humulene',
    'Ocimene',
    'Bisabolol',
    'Nerolidol',
    'Valencene',
    'Geraniol',
]

export const TerpeneEntouragePanel: React.FC = () => {
    const { t } = useTranslation()
    const [terpenes, setTerpenes] = useState([
        { name: 'Myrcene', percentage: 40 },
        { name: 'Limonene', percentage: 30 },
        { name: 'Caryophyllene', percentage: 20 },
    ])
    const [thc, setThc] = useState(22)
    const [cbd, setCbd] = useState(1)
    const [cbg, setCbg] = useState(0.5)

    let result: TerpeneEntourageResult | null = null
    try {
        result = calculateTerpeneEntourage({ terpenes, thc, cbd, cbg })
    } catch {
        result = null
    }

    const scoreColor = result
        ? result.entourageScore >= 70
            ? 'text-green-400'
            : result.entourageScore >= 40
              ? 'text-amber-400'
              : 'text-red-400'
        : 'text-slate-400'

    return (
        <div className="space-y-4">
            <p className="text-xs text-slate-400">
                {t('knowledgeView.rechner.terpeneEntourage.description')}
            </p>

            <div className="space-y-2">
                {terpenes.map((tp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <select
                            value={tp.name}
                            onChange={(e) => {
                                const up = [...terpenes]
                                if (up[idx]) up[idx] = { ...up[idx]!, name: e.target.value }
                                setTerpenes(up)
                            }}
                            className="flex-1 rounded bg-slate-700 border border-slate-600 text-slate-100 py-1.5 px-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            aria-label={t('knowledgeView.rechner.terpeneEntourage.terpeneName')}
                        >
                            {KNOWN_TERPENES.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={tp.percentage}
                            onChange={(e) => {
                                const up = [...terpenes]
                                if (up[idx])
                                    up[idx] = { ...up[idx]!, percentage: Number(e.target.value) }
                                setTerpenes(up)
                            }}
                            className="w-20 rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            aria-label={t('knowledgeView.rechner.terpeneEntourage.terpenePercent')}
                        />
                        <span className="text-xs text-slate-500">%</span>
                        {terpenes.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setTerpenes(terpenes.filter((_, i) => i !== idx))
                                }}
                                className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
                                aria-label={t('knowledgeView.rechner.terpeneEntourage.remove')}
                            >
                                x
                            </button>
                        )}
                    </div>
                ))}
                {terpenes.length < 12 && (
                    <button
                        type="button"
                        onClick={() => {
                            setTerpenes([...terpenes, { name: 'Humulene', percentage: 10 }])
                        }}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                    >
                        + {t('knowledgeView.rechner.terpeneEntourage.addTerpene')}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2">
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
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                            {t('knowledgeView.rechner.terpeneEntourage.score')}
                        </span>
                        <span className={`text-2xl font-bold font-display ${scoreColor}`}>
                            {result.entourageScore}
                            <span className="text-xs font-normal text-slate-500">/100</span>
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                        <span>
                            {t('knowledgeView.rechner.terpeneEntourage.dominant')}:{' '}
                            <strong className="text-white">{result.dominantTerpene}</strong>
                        </span>
                        <span>
                            {t('knowledgeView.rechner.terpeneEntourage.profile')}:{' '}
                            <strong className="text-amber-300">{result.profileType}</strong>
                        </span>
                    </div>
                    {result.synergyPairs.length > 0 && (
                        <div className="text-[10px] text-slate-500 space-y-0.5 border-t border-white/10 pt-2">
                            <p className="text-slate-400 font-semibold text-xs">
                                {t('knowledgeView.rechner.terpeneEntourage.synergyMatrix')}
                            </p>
                            {result.synergyPairs.slice(0, 4).map((pair, i) => (
                                <div key={i} className="flex justify-between">
                                    <span>
                                        {pair.a} + {pair.b}
                                    </span>
                                    <span
                                        className={
                                            pair.strength === 'high'
                                                ? 'text-green-400'
                                                : pair.strength === 'medium'
                                                  ? 'text-amber-400'
                                                  : 'text-slate-400'
                                        }
                                    >
                                        {pair.strength}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <RagExplainBox
                calculator="terpeneEntourage"
                values={{
                    score: result?.entourageScore ?? 0,
                    profile: result?.profileType ?? '',
                    dominant: result?.dominantTerpene ?? '',
                    diversity: (terpenes.length / 12).toFixed(2),
                }}
                i18nPrefix="knowledgeView.rechner.terpeneEntourage"
                suggestedPathId="advanced-training"
            />
        </div>
    )
}
