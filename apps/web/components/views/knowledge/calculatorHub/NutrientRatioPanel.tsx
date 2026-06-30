import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface NutrientResult {
    n: number
    p: number
    k: number
}

export const NutrientRatioPanel: React.FC = () => {
    const { t } = useTranslation()
    const [stage, setStage] = useState<'seedling' | 'veg' | 'earlyFlower' | 'lateFlower'>('veg')
    const [volume, setVolume] = useState(5)

    const RATIOS: Record<typeof stage, NutrientResult & { desc: string }> = {
        seedling: { n: 1, p: 1, k: 1, desc: t('knowledgeView.rechner.nutrient.seedlingDesc') },
        veg: { n: 3, p: 1, k: 2, desc: t('knowledgeView.rechner.nutrient.vegDesc') },
        earlyFlower: {
            n: 1,
            p: 2,
            k: 2,
            desc: t('knowledgeView.rechner.nutrient.earlyFlowerDesc'),
        },
        lateFlower: {
            n: 0.5,
            p: 3,
            k: 3,
            desc: t('knowledgeView.rechner.nutrient.lateFlowerDesc'),
        },
    }

    const ratio = RATIOS[stage]
    const total = ratio.n + ratio.p + ratio.k
    const targetEc =
        stage === 'seedling' ? 0.8 : stage === 'veg' ? 1.4 : stage === 'earlyFlower' ? 1.8 : 2.0
    const mlPerLitre = 2.5

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.nutrient.growStage')}
                    </span>
                    <select
                        value={stage}
                        onChange={(e) => {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            setStage(e.target.value as typeof stage)
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 py-1.5 px-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        aria-label={t('knowledgeView.rechner.nutrient.growStage')}
                    >
                        <option value="seedling">
                            {t('knowledgeView.rechner.nutrient.seedling')}
                        </option>
                        <option value="veg">{t('knowledgeView.rechner.nutrient.veg')}</option>
                        <option value="earlyFlower">
                            {t('knowledgeView.rechner.nutrient.earlyFlower')}
                        </option>
                        <option value="lateFlower">
                            {t('knowledgeView.rechner.nutrient.lateFlower')}
                        </option>
                    </select>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.nutrient.volume')}
                    </span>
                    <input
                        type="number"
                        min={1}
                        max={100}
                        step={0.5}
                        value={volume}
                        onChange={(e) => {
                            setVolume(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        aria-label={t('knowledgeView.rechner.nutrient.volume')}
                    />
                    <span className="text-[10px] text-slate-500 text-center">
                        {t('knowledgeView.rechner.nutrient.unitLiter')}
                    </span>
                </label>
            </div>

            <div className="rounded-lg bg-slate-800/60 border border-white/10 p-3 space-y-3">
                <p className="text-xs text-slate-400 italic">{ratio.desc}</p>
                <div className="flex gap-2 text-center">
                    {(['n', 'p', 'k'] as const).map((nutrient) => {
                        const value = ratio[nutrient]
                        const pct = Math.round((value / total) * 100)
                        const colors = { n: 'bg-green-600', p: 'bg-purple-600', k: 'bg-orange-600' }
                        const labels = { n: 'N', p: 'P', k: 'K' }
                        return (
                            <div key={nutrient} className="flex-1">
                                <div className="text-lg font-bold text-slate-100">{pct}%</div>
                                <div className="h-2 rounded-full my-1">
                                    <div
                                        className={`h-2 rounded-full ${colors[nutrient]}`}
                                        style={{ width: `${pct}%` }}
                                        role="meter"
                                        aria-valuenow={pct}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    />
                                </div>
                                <div className="text-xs text-slate-400">{labels[nutrient]}</div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between text-xs text-slate-300 border-t border-white/10 pt-2">
                    <span>
                        {t('knowledgeView.rechner.nutrient.targetEc')}:{' '}
                        <strong className="text-white">{targetEc.toFixed(1)} mS/cm</strong>
                    </span>
                    <span>
                        {t('knowledgeView.rechner.nutrient.dosage')}:{' '}
                        <strong className="text-white">
                            {(mlPerLitre * volume).toFixed(0)} ml / {volume}
                            {t('knowledgeView.rechner.nutrient.unitLiter')}
                        </strong>
                    </span>
                </div>
            </div>

            <p className="text-[10px] text-slate-500">
                {t('knowledgeView.rechner.nutrient.disclaimer')}
            </p>
        </div>
    )
}
