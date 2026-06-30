import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import SparklineChart from '@/components/common/SparklineChart'
import { workerBus } from '@/services/workerBus'
import { knowledgeRagService, type CalculatorName } from '@/services/knowledgeRagService'
import type {
    VpdSimulationResult,
    TranspirationSimulationResult,
    EcDriftSimulationResult,
    LightSpectrumSimulationResult,
} from '@/workers/calculation.worker'

/** W-06: WorkerPool auto-spawns on first dispatch -- always returns true. */
export function ensureCalcWorker(): boolean {
    return typeof Worker !== 'undefined'
}

interface RagExplainBoxProps {
    calculator: CalculatorName
    values: Record<string, number | string>
    /** i18n base key prefix, e.g. 'knowledgeView.rechner.transpiration' */
    i18nPrefix: string
    /** Learning path id prefilled from service */
    suggestedPathId: string | null
}

export const RagExplainBox: React.FC<RagExplainBoxProps> = ({
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

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const anyRaw = raw as unknown as Record<string, unknown>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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
