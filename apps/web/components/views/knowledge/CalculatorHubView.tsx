import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { calculateVPD } from '@/lib/vpd/calculator'
import {
    calculateTerpeneEntourage,
    calculateTranspiration,
    calculateEcTds,
    calculateLightSpectrum,
    calculateCannabinoidRatio,
    type TerpeneEntourageResult,
    type TranspirationResult,
    type EcTdsResult,
    type LightSpectrumResult,
    type CannabinoidRatioResult,
} from '@/services/knowledgeCalculatorService'
import SparklineChart from '@/components/common/SparklineChart'
import { workerBus } from '@/services/workerBus'
import { knowledgeRagService, type CalculatorName } from '@/services/knowledgeRagService'
import type {
    VpdSimulationResult,
    TranspirationSimulationResult,
    EcDriftSimulationResult,
    LightSpectrumSimulationResult,
} from '@/workers/calculation.worker'

// ---------------------------------------------------------------------------
// Lazy worker registration
// ---------------------------------------------------------------------------

function ensureCalcWorker(): boolean {
    if (workerBus.has('calculation')) return true
    try {
        workerBus.register(
            'calculation',
            new Worker(new URL('../../../workers/calculation.worker.ts', import.meta.url), {
                type: 'module',
            }),
        )
        return true
    } catch {
        return false
    }
}

// ---------------------------------------------------------------------------
// Shared sub-components: RagExplainBox + SimulationPanel
// ---------------------------------------------------------------------------

interface RagExplainBoxProps {
    calculator: CalculatorName
    values: Record<string, number | string>
    /** i18n base key prefix, e.g. 'knowledgeView.rechner.transpiration' */
    i18nPrefix: string
    /** Learning path id prefilled from service */
    suggestedPathId: string | null
}

const RagExplainBox: React.FC<RagExplainBoxProps> = ({
    calculator,
    values,
    i18nPrefix,
    suggestedPathId,
}) => {
    const { t } = useTranslation()
    const [explanation, setExplanation] = useState('')
    const [loading, setLoading] = useState(false)
    const [pathId, setPathId] = useState(suggestedPathId)

    const handleExplain = useCallback(async () => {
        setLoading(true)
        setExplanation('')
        try {
            const result = await knowledgeRagService.explain(calculator, values)
            setExplanation(result.explanation)
            if (result.suggestedPathId) setPathId(result.suggestedPathId)
        } catch {
            // silent -- no error display
        } finally {
            setLoading(false)
        }
    }, [calculator, values])

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => {
                    void handleExplain()
                }}
                disabled={loading}
                className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
                aria-label={t(`${i18nPrefix}.explainAi`)}
            >
                <span className="w-3.5 h-3.5">
                    <PhosphorIcons.Brain />
                </span>
                {loading ? t(`${i18nPrefix}.aiLoading`) : t(`${i18nPrefix}.explainAi`)}
            </button>

            {explanation && (
                <div className="rounded-lg bg-primary-900/30 border border-primary-700/40 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-primary-300">
                        {t(`${i18nPrefix}.aiExplanationTitle`)}
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed">{explanation}</p>
                    {pathId && (
                        <a
                            href={`#knowledge?tab=lernpfad`}
                            className="inline-flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-200 transition-colors"
                        >
                            <span className="w-3 h-3">
                                <PhosphorIcons.GraduationCap />
                            </span>
                            {t(`${i18nPrefix}.deepDive`)}
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}

RagExplainBox.displayName = 'RagExplainBox'

interface SimulationPanelProps {
    /** Worker command name (upper-snake-case) */
    command: string
    payload: Record<string, unknown>
    color?: string
    unit: string
    i18nPrefix: string
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({
    command,
    payload,
    color,
    unit,
    i18nPrefix,
}) => {
    const { t } = useTranslation()
    const [points, setPoints] = useState<Array<{ day: number; value: number }> | null>(null)
    const [running, setRunning] = useState(false)

    const handleSimulate = useCallback(async () => {
        if (!ensureCalcWorker()) return
        setRunning(true)
        try {
            const raw = await workerBus.dispatch<
                | VpdSimulationResult
                | TranspirationSimulationResult
                | EcDriftSimulationResult
                | LightSpectrumSimulationResult
            >('calculation', command, payload)
            // All result types expose a `points` array
            const anyRaw = raw as unknown as Record<string, unknown>
            const rawPoints = anyRaw['points'] as Array<{ day: number; value: number }> | undefined
            if (Array.isArray(rawPoints)) setPoints(rawPoints)
        } catch {
            // silent
        } finally {
            setRunning(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [command, JSON.stringify(payload)])

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => {
                    void handleSimulate()
                }}
                disabled={running}
                className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                aria-label={t(`${i18nPrefix}.simulate`)}
            >
                <span className="w-3.5 h-3.5">
                    <PhosphorIcons.ChartLineUp />
                </span>
                {running ? '...' : t(`${i18nPrefix}.simulate`)}
            </button>

            {points && (
                <div className="rounded-lg bg-slate-800/60 border border-white/10 p-2">
                    <p className="text-[10px] text-slate-400 mb-1">
                        {t(`${i18nPrefix}.simulationTitle`)}
                    </p>
                    <SparklineChart
                        points={points}
                        label={t(`${i18nPrefix}.simulationTitle`)}
                        color={color ?? '#f59e0b'}
                        unit={unit}
                        showArea={true}
                        showDots={false}
                        highlightLast={true}
                        height={80}
                    />
                </div>
            )}
        </div>
    )
}

SimulationPanel.displayName = 'SimulationPanel'

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

            <SimulationPanel
                command="SIMULATE_VPD"
                payload={{ temp, humidity, leafOffset }}
                color="#22c55e"
                unit="kPa"
                i18nPrefix="knowledgeView.rechner.vpd"
            />
            <RagExplainBox
                calculator="vpd"
                values={{ vpd: vpd.toFixed(2), status, temp, humidity, leafOffset }}
                i18nPrefix="knowledgeView.rechner.vpd"
                suggestedPathId="environment-mastery"
            />
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

type TabId =
    | 'vpd'
    | 'nutrient'
    | 'ph'
    | 'terpeneEntourage'
    | 'transpiration'
    | 'ecTds'
    | 'lightSpectrum'
    | 'cannabinoidRatio'

// ---------------------------------------------------------------------------
// Terpene Entourage Panel
// ---------------------------------------------------------------------------

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

const TerpeneEntouragePanel: React.FC = () => {
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
                    { label: 'THC %', val: thc, set: setThc, max: 40 },
                    { label: 'CBD %', val: cbd, set: setCbd, max: 40 },
                    { label: 'CBG %', val: cbg, set: setCbg, max: 20 },
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

// ---------------------------------------------------------------------------
// Transpiration Rate Panel
// ---------------------------------------------------------------------------

const TranspirationPanel: React.FC = () => {
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
                    <span className="text-[10px] text-slate-500 text-center">kPa</span>
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
                    <span className="text-[10px] text-slate-500 text-center">mmol/m2/s</span>
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
                    <span className="text-[10px] text-slate-500 text-center">LAI</span>
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
                    <span className="text-[10px] text-slate-500 text-center">h/day</span>
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

// ---------------------------------------------------------------------------
// EC / TDS Converter Panel
// ---------------------------------------------------------------------------

const EcTdsPanel: React.FC = () => {
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
                <span className="text-[10px] text-slate-500 text-center">mS/cm</span>
            </label>

            {result && (
                <div
                    className="rounded-lg bg-slate-800/60 border border-white/10 p-3 space-y-2"
                    role="status"
                    aria-live="polite"
                >
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                            <div className="text-[10px] text-slate-500 mb-0.5">
                                {t('knowledgeView.rechner.ecTds.tds500')}
                            </div>
                            <div className="font-bold text-white">{result.tds500} ppm</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 mb-0.5">
                                {t('knowledgeView.rechner.ecTds.tds640')}
                            </div>
                            <div className="font-bold text-white">{result.tds640} ppm</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 mb-0.5">
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
                <span className="text-[10px] text-slate-500">
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

// ---------------------------------------------------------------------------
// Light Spectrum Panel
// ---------------------------------------------------------------------------

const LightSpectrumPanel: React.FC = () => {
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
                    <span className="text-[10px] text-slate-500 text-center">umol/m2/s</span>
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
                    <span className="text-[10px] text-slate-500 text-center">h/day</span>
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
                    <span className="text-[10px] text-slate-500 text-center">% (600-700 nm)</span>
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
                    <span className="text-[10px] text-slate-500 text-center">% (400-500 nm)</span>
                </label>
            </div>

            <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">
                    {t('knowledgeView.rechner.lightSpectrum.stage')}
                </span>
                <select
                    value={stage}
                    onChange={(e) => {
                        setStage(e.target.value as typeof stage)
                    }}
                    className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 py-1.5 px-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                    <option value="seedling">{t('knowledgeView.rechner.nutrient.seedling')}</option>
                    <option value="veg">{t('knowledgeView.rechner.nutrient.veg')}</option>
                    <option value="flower">
                        {t('knowledgeView.rechner.nutrient.earlyFlower')}
                    </option>
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

// ---------------------------------------------------------------------------
// Cannabinoid Ratio Panel
// ---------------------------------------------------------------------------

const CannabinoidRatioPanel: React.FC = () => {
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
                    { label: 'THC %', val: thc, set: setThc, max: 40 },
                    { label: 'CBD %', val: cbd, set: setCbd, max: 40 },
                    { label: 'CBG %', val: cbg, set: setCbg, max: 20 },
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
                        <strong className="text-white font-mono text-xs">
                            {result.ratioLabel}
                        </strong>
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
                            <div className="text-slate-500">THC</div>
                            <div className="text-white font-bold">{result.thcPct}%</div>
                        </div>
                        <div>
                            <div className="text-slate-500">CBD</div>
                            <div className="text-white font-bold">{result.cbdPct}%</div>
                        </div>
                        <div>
                            <div className="text-slate-500">CBG</div>
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
        {
            id: 'terpeneEntourage',
            label: t('knowledgeView.rechner.terpeneEntourageTab'),
            icon: <PhosphorIcons.MagicWand />,
        },
        {
            id: 'transpiration',
            label: t('knowledgeView.rechner.transpirationTab'),
            icon: <PhosphorIcons.Fan />,
        },
        {
            id: 'ecTds',
            label: t('knowledgeView.rechner.ecTdsTab'),
            icon: <PhosphorIcons.Flask />,
        },
        {
            id: 'lightSpectrum',
            label: t('knowledgeView.rechner.lightSpectrumTab'),
            icon: <PhosphorIcons.Sun />,
        },
        {
            id: 'cannabinoidRatio',
            label: t('knowledgeView.rechner.cannabinoidRatioTab'),
            icon: <PhosphorIcons.ChartPieSlice />,
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
                {activeTab === 'terpeneEntourage' && <TerpeneEntouragePanel />}
                {activeTab === 'transpiration' && <TranspirationPanel />}
                {activeTab === 'ecTds' && <EcTdsPanel />}
                {activeTab === 'lightSpectrum' && <LightSpectrumPanel />}
                {activeTab === 'cannabinoidRatio' && <CannabinoidRatioPanel />}
            </div>

            <p className="text-xs text-slate-500 text-center">
                {t('knowledgeView.rechner.equipmentLink')}
            </p>
        </div>
    )
}

CalculatorHubViewComponent.displayName = 'CalculatorHubView'

export default CalculatorHubViewComponent
