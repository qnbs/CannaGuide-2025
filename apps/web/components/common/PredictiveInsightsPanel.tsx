// ---------------------------------------------------------------------------
// PredictiveInsightsPanel -- Shared UI for predictive analytics results
//
// Displays Botrytis risk assessment, environment alerts, and yield impact
// from a PredictiveInsight object. Used in both the IoT Dashboard and the
// Knowledge Hub Analytics Dashboard.
// ---------------------------------------------------------------------------

import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { PredictiveInsight, RiskLevel } from '@/services/predictiveAnalyticsService'

// ---------------------------------------------------------------------------
// Risk-level style helpers
// ---------------------------------------------------------------------------

const RISK_STYLES: Record<RiskLevel, { ring: string; bg: string; text: string }> = {
    low: {
        ring: 'ring-emerald-400/20',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
    },
    moderate: {
        ring: 'ring-amber-400/20',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
    },
    high: {
        ring: 'ring-orange-400/20',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
    },
    critical: {
        ring: 'ring-red-400/20',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
    },
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PredictiveInsightsPanelProps {
    /** The predictive insight to display (null = no data) */
    insight: PredictiveInsight | null
    /** Whether analysis is currently in-flight */
    loading: boolean
    /** Optional plant name to display in the header */
    plantName?: string | undefined
    /** i18n key prefix -- allows IoT and Knowledge contexts to use different keys */
    i18nPrefix?: string | undefined
    /** Use glass-morphism card styling instead of Card component */
    glass?: boolean | undefined
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PredictiveInsightsPanel: React.FC<PredictiveInsightsPanelProps> = memo(
    ({ insight, loading, plantName, i18nPrefix = 'analytics.predictive', glass = false }) => {
        const { t } = useTranslation()

        const containerClass = glass
            ? 'rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-4'
            : 'rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-4'

        if (loading) {
            return (
                <div className={containerClass} role="status" aria-label={t(`${i18nPrefix}.title`)}>
                    <div className="flex items-center gap-2">
                        <PhosphorIcons.Brain
                            className="w-4 h-4 text-primary-400 animate-pulse"
                            aria-hidden="true"
                        />
                        <span className="text-sm text-slate-400">
                            {t(`${i18nPrefix}.analyzing`, 'Analyzing...')}
                        </span>
                    </div>
                </div>
            )
        }

        if (!insight) {
            return (
                <div className={containerClass}>
                    <div className="flex items-center gap-2">
                        <PhosphorIcons.Brain
                            className="w-4 h-4 text-slate-600"
                            aria-hidden="true"
                        />
                        <span className="text-sm text-slate-500">
                            {t(`${i18nPrefix}.noData`, 'Not enough sensor data for predictions')}
                        </span>
                    </div>
                </div>
            )
        }

        const botrytis = insight.botrytisRisk
        const bStyle = RISK_STYLES[botrytis.riskLevel]

        return (
            <div className={containerClass} aria-label={t(`${i18nPrefix}.title`)}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                        <PhosphorIcons.Brain
                            className="w-4 h-4 text-primary-400"
                            aria-hidden="true"
                        />
                        {t(`${i18nPrefix}.title`, 'Predictive Insights')}
                        {plantName !== undefined && (
                            <span className="text-white/50 font-normal">-- {plantName}</span>
                        )}
                    </h3>
                    <span className="text-[10px] text-white/40">
                        {insight.analyzedSamples} {t(`${i18nPrefix}.samples`, 'samples')}
                    </span>
                </div>

                {/* Botrytis Risk */}
                <div
                    className={cn(
                        'rounded-xl ring-1 ring-inset backdrop-blur-sm p-3',
                        bStyle.ring,
                        bStyle.bg,
                    )}
                    role="region"
                    aria-label={t(`${i18nPrefix}.botrytisRisk`, 'Botrytis Risk')}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white/70">
                            {t(`${i18nPrefix}.botrytisRisk`, 'Botrytis Risk')}
                        </span>
                        <span
                            className={cn(
                                'text-xs font-bold uppercase tracking-wider',
                                bStyle.text,
                            )}
                        >
                            {t(`${i18nPrefix}.risk.${botrytis.riskLevel}`, botrytis.riskLevel)}
                        </span>
                    </div>
                    {botrytis.factors.length > 0 && (
                        <ul className="text-[11px] text-white/50 space-y-0.5 mb-2">
                            {botrytis.factors.map((f) => (
                                <li key={f} className="flex items-start gap-1">
                                    <span className="shrink-0 mt-0.5">--</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="text-xs text-white/70">{botrytis.recommendation}</p>
                </div>

                {/* Environment Alerts */}
                {insight.environmentAlerts.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-white/50">
                            {t(`${i18nPrefix}.envAlerts`, 'Environment Alerts')}
                        </h4>
                        {insight.environmentAlerts.map((alert, idx) => {
                            const aStyle = RISK_STYLES[alert.severity]
                            return (
                                <div
                                    key={`${alert.type}-${idx}`}
                                    className={cn(
                                        'rounded-lg ring-1 ring-inset backdrop-blur-sm px-3 py-2 flex items-center justify-between',
                                        aStyle.ring,
                                        aStyle.bg,
                                    )}
                                    role="alert"
                                >
                                    <span className="text-xs text-white/70">{alert.message}</span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-bold uppercase ml-2 shrink-0',
                                            aStyle.text,
                                        )}
                                    >
                                        {alert.currentValue.toFixed(1)} ({alert.idealRange[0]}-
                                        {alert.idealRange[1]})
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Yield Impact */}
                <div className="rounded-xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white/70">
                            {t(`${i18nPrefix}.yieldImpact`, 'Yield Impact')}
                        </span>
                        <span
                            className={cn(
                                'text-sm font-bold tabular-nums',
                                insight.yieldImpact.impactPercent >= 0
                                    ? 'text-emerald-400'
                                    : 'text-red-400',
                            )}
                        >
                            {insight.yieldImpact.impactPercent >= 0 ? '+' : ''}
                            {insight.yieldImpact.impactPercent}%
                        </span>
                    </div>
                    <p className="text-[11px] text-white/50">{insight.yieldImpact.description}</p>
                </div>
            </div>
        )
    },
)
PredictiveInsightsPanel.displayName = 'PredictiveInsightsPanel'
