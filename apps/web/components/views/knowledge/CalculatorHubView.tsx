import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { calculateVPD } from '@/lib/vpd/calculator'

interface VpdResult {
    vpd: number
    status: 'low' | 'ok' | 'high'
}

function getVpdStatus(vpd: number): VpdResult['status'] {
    if (vpd < 0.4) return 'low'
    if (vpd > 1.6) return 'high'
    return 'ok'
}

const VpdCalculatorPanel: React.FC = () => {
    const { t } = useTranslation()
    const [temp, setTemp] = useState(25)
    const [humidity, setHumidity] = useState(60)
    const [leafOffset, setLeafOffset] = useState(2)

    const vpd = calculateVPD(temp, humidity, leafOffset)
    const status = getVpdStatus(vpd)

    const statusConfig = {
        low: {
            label: t('knowledgeView.rechner.vpd.statusLow'),
            color: 'text-blue-400',
            bg: 'bg-blue-900/40 border-blue-700',
        },
        ok: {
            label: t('knowledgeView.rechner.vpd.statusOk'),
            color: 'text-green-400',
            bg: 'bg-green-900/40 border-green-700',
        },
        high: {
            label: t('knowledgeView.rechner.vpd.statusHigh'),
            color: 'text-red-400',
            bg: 'bg-red-900/40 border-red-700',
        },
    }[status]

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.vpd.temperature')}
                    </span>
                    <input
                        type="number"
                        min={15}
                        max={40}
                        step={0.5}
                        value={temp}
                        onChange={(e) => {
                            setTemp(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        aria-label={t('knowledgeView.rechner.vpd.temperature')}
                    />
                    <span className="text-[10px] text-slate-500 text-center">
                        {t('knowledgeView.rechner.vpd.celsius')}
                    </span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.vpd.humidity')}
                    </span>
                    <input
                        type="number"
                        min={10}
                        max={99}
                        step={1}
                        value={humidity}
                        onChange={(e) => {
                            setHumidity(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        aria-label={t('knowledgeView.rechner.vpd.humidity')}
                    />
                    <span className="text-[10px] text-slate-500 text-center">%</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.vpd.leafOffset')}
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.5}
                        value={leafOffset}
                        onChange={(e) => {
                            setLeafOffset(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        aria-label={t('knowledgeView.rechner.vpd.leafOffset')}
                    />
                    <span className="text-[10px] text-slate-500 text-center">
                        {t('knowledgeView.rechner.vpd.celsius')}
                    </span>
                </label>
            </div>

            <div
                className={`rounded-lg p-4 border text-center ${statusConfig.bg}`}
                role="status"
                aria-live="polite"
            >
                <p className="text-4xl font-bold font-display text-slate-100">
                    {vpd.toFixed(2)}
                    <span className="text-sm font-normal text-slate-400 ml-1">kPa</span>
                </p>
                <p className={`text-sm font-semibold mt-1 ${statusConfig.color}`}>
                    {statusConfig.label}
                </p>
            </div>

            <div className="text-xs text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                    <span className="text-blue-400">
                        {t('knowledgeView.rechner.vpd.rangeSeedling')}
                    </span>
                    <span>0.4 - 0.8 kPa</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-green-400">
                        {t('knowledgeView.rechner.vpd.rangeVeg')}
                    </span>
                    <span>0.6 - 1.0 kPa</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-amber-400">
                        {t('knowledgeView.rechner.vpd.rangeFlower')}
                    </span>
                    <span>0.8 - 1.2 kPa</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-orange-400">
                        {t('knowledgeView.rechner.vpd.rangeLateFlower')}
                    </span>
                    <span>1.0 - 1.5 kPa</span>
                </div>
            </div>
        </div>
    )
}

interface NutrientResult {
    n: number
    p: number
    k: number
}

const NutrientRatioPanel: React.FC = () => {
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
                    <span className="text-[10px] text-slate-500 text-center">Liter</span>
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
                            {(mlPerLitre * volume).toFixed(0)} ml / {volume}L
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

const PhQuickGuidePanel: React.FC = () => {
    const { t } = useTranslation()
    const ranges = [
        { medium: 'Soil', phMin: 6.0, phMax: 7.0, ecMin: 1.0, ecMax: 2.0 },
        { medium: 'Coco', phMin: 5.8, phMax: 6.3, ecMin: 1.2, ecMax: 2.2 },
        { medium: 'Hydro', phMin: 5.5, phMax: 6.2, ecMin: 1.0, ecMax: 2.5 },
        { medium: 'Aeroponics', phMin: 5.5, phMax: 6.0, ecMin: 1.0, ecMax: 2.0 },
    ]

    return (
        <div className="space-y-2">
            <p className="text-xs text-slate-400">{t('knowledgeView.rechner.ph.intro')}</p>
            <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/10 bg-slate-800/80">
                            <th className="text-left px-3 py-2 text-slate-400 font-semibold">
                                {t('knowledgeView.rechner.ph.medium')}
                            </th>
                            <th className="text-center px-3 py-2 text-slate-400 font-semibold">
                                {t('knowledgeView.rechner.ph.phRange')}
                            </th>
                            <th className="text-center px-3 py-2 text-slate-400 font-semibold">
                                {t('knowledgeView.rechner.ph.ecRange')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranges.map((r) => (
                            <tr
                                key={r.medium}
                                className="border-b border-white/5 hover:bg-slate-700/40 transition-colors"
                            >
                                <td className="px-3 py-2 font-medium text-slate-200">{r.medium}</td>
                                <td className="px-3 py-2 text-center text-green-300">
                                    {r.phMin.toFixed(1)} - {r.phMax.toFixed(1)}
                                </td>
                                <td className="px-3 py-2 text-center text-blue-300">
                                    {r.ecMin.toFixed(1)} - {r.ecMax.toFixed(1)} mS/cm
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[10px] text-slate-500">{t('knowledgeView.rechner.ph.note')}</p>
        </div>
    )
}

type TabId = 'vpd' | 'nutrient' | 'ph'

const CalculatorHubViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<TabId>('vpd')

    const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
        {
            id: 'vpd',
            label: t('knowledgeView.rechner.vpdTab'),
            icon: <PhosphorIcons.Thermometer />,
        },
        {
            id: 'nutrient',
            label: t('knowledgeView.rechner.nutrientTab'),
            icon: <PhosphorIcons.Drop />,
        },
        {
            id: 'ph',
            label: t('knowledgeView.rechner.phTab'),
            icon: <PhosphorIcons.TestTube />,
        },
    ]

    return (
        <div className="space-y-5">
            <div
                className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                role="tablist"
                aria-label={t('knowledgeView.rechner.title')}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`rechner-tab-${tab.id}`}
                        aria-controls={`rechner-panel-${tab.id}`}
                        aria-selected={activeTab === tab.id}
                        onClick={() => {
                            setActiveTab(tab.id)
                        }}
                        className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-lg'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        <span className="w-4 h-4">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div
                id={`rechner-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`rechner-tab-${activeTab}`}
            >
                {activeTab === 'vpd' && <VpdCalculatorPanel />}
                {activeTab === 'nutrient' && <NutrientRatioPanel />}
                {activeTab === 'ph' && <PhQuickGuidePanel />}
            </div>

            <p className="text-xs text-slate-500 text-center">
                {t('knowledgeView.rechner.equipmentLink')}
            </p>
        </div>
    )
}

CalculatorHubViewComponent.displayName = 'CalculatorHubView'

export default CalculatorHubViewComponent
