import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GenealogyNode } from '@/types'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { workerBus } from '@/services/workerBus'
import { type HighlightMode } from '../genealogyViewUtils'

// ---------------------------------------------------------------------------
// AnalysisPanel – genetic contributions, lineage filter + descendants button.
// ---------------------------------------------------------------------------
export const AnalysisPanel = React.memo<{
    tree: GenealogyNode | null
    onShowDescendants: () => void
    highlightMode: HighlightMode
    onHighlightModeChange: (mode: HighlightMode) => void
}>(({ tree, onShowDescendants, highlightMode, onHighlightModeChange }) => {
    const { t } = useTranslation()

    const [contributions, setContributions] = useState<{ name: string; contribution: number }[]>([])

    useEffect(() => {
        if (!tree) {
            setContributions([])
            return
        }
        const workerName = `genealogy-contributions-${crypto.randomUUID()}`
        workerBus.register(
            workerName,
            new Worker(new URL('../../../../workers/genealogy.worker.ts', import.meta.url), {
                type: 'module',
            }),
        )

        let cancelled = false
        workerBus
            .dispatch<{ contributions: { name: string; contribution: number }[] }>(
                workerName,
                'CONTRIBUTIONS',
                { tree },
            )
            .then((data) => {
                if (!cancelled) {
                    setContributions(
                        Array.isArray(data.contributions) ? data.contributions.slice(0, 5) : [],
                    )
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.debug('[AnalysisPanel] worker error:', err)
                    setContributions([])
                }
            })
            .finally(() => workerBus.unregister(workerName))

        return () => {
            cancelled = true
            workerBus.unregister(workerName)
        }
    }, [tree])

    const toggleMode = (mode: HighlightMode) => {
        onHighlightModeChange(highlightMode === mode ? 'none' : mode)
    }

    const highlightOptions: Array<{
        mode: Exclude<HighlightMode, 'none'>
        activeClass: string
        Icon: React.ComponentType<{ className?: string }>
        label: string
    }> = [
        {
            mode: 'landraces',
            activeClass: 'bg-green-900/50 text-green-300 ring-1 ring-green-500/40',
            Icon: PhosphorIcons.Leafy,
            label: t('strainsView.genealogyView.highlightLandraces'),
        },
        {
            mode: 'sativa',
            activeClass: 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-500/40',
            Icon: PhosphorIcons.Sun,
            label: t('strainsView.genealogyView.traceSativa'),
        },
        {
            mode: 'indica',
            activeClass: 'bg-indigo-900/50 text-indigo-300 ring-1 ring-indigo-500/40',
            Icon: PhosphorIcons.Star,
            label: t('strainsView.genealogyView.traceIndica'),
        },
    ]

    return (
        <div className="space-y-4">
            {/* Analysis Tools */}
            <Card className="!p-3">
                <h4 className="font-bold text-slate-200 mb-3 text-sm uppercase tracking-wider">
                    {t('strainsView.genealogyView.analysisTools')}
                </h4>
                <div className="space-y-1.5">
                    {highlightOptions.map(({ mode, activeClass, Icon, label }) => {
                        const isActive = highlightMode === mode
                        const buttonClass = isActive
                            ? activeClass
                            : 'text-slate-300 hover:bg-slate-700/50'

                        return (
                            <button
                                key={mode}
                                type="button"
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${buttonClass}`}
                                onClick={() => toggleMode(mode)}
                            >
                                <Icon className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                                {label}
                            </button>
                        )
                    })}
                    {highlightMode !== 'none' && (
                        <button
                            type="button"
                            className="w-full text-left px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => onHighlightModeChange('none')}
                        >
                            <PhosphorIcons.X className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                            {t('strainsView.genealogyView.clearHighlight')}
                        </button>
                    )}
                </div>
            </Card>

            {/* Genetic Influence */}
            <Card className="!p-3">
                <h4 className="font-bold text-slate-200 mb-2 text-sm uppercase tracking-wider">
                    {t('strainsView.genealogyView.geneticInfluence')}
                </h4>
                {contributions.length > 0 ? (
                    <ul className="space-y-1.5 text-sm">
                        {contributions.map((c, idx) => (
                            <li
                                key={`contrib-${c?.name ?? idx}`}
                                className="flex justify-between items-center gap-2"
                            >
                                <span className="text-slate-300 truncate" title={c?.name ?? ''}>
                                    {c?.name ?? '—'}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 rounded-full"
                                            style={{
                                                width: `${Math.min(100, c?.contribution ?? 0)}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="font-mono text-primary-300 text-xs w-12 text-right tabular-nums">
                                        {typeof c?.contribution === 'number'
                                            ? c.contribution.toFixed(1)
                                            : '0.0'}
                                        %
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 text-xs">
                        {t('strainsView.genealogyView.noStrainSelected')}
                    </p>
                )}
            </Card>

            {/* Descendants */}
            <Button variant="secondary" size="sm" className="w-full" onClick={onShowDescendants}>
                <PhosphorIcons.ShareNetwork className="w-4 h-4 mr-1.5" />
                {t('strainsView.genealogyView.showDescendants')}
            </Button>
        </div>
    )
})
AnalysisPanel.displayName = 'GenealogyAnalysisPanel'
