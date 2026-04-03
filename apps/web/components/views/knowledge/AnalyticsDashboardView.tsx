// ---------------------------------------------------------------------------
// AnalyticsDashboardView -- Cross-Module Analytics Dashboard
//
// Displays a comprehensive analytics overview of the user's garden:
// garden score, risk factors, strain performance, and recommendations.
// Integrated into the KnowledgeView as a new tab.
// ---------------------------------------------------------------------------

import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useActivePlants } from '@/hooks/useSimulationBridge'
import { cn } from '@/lib/utils'

// -- Score color helper ----------------------------------------------------

function scoreColor(score: number): string {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
}

function severityBadge(severity: string): string {
    switch (severity) {
        case 'high':
            return 'bg-red-500/20 text-red-300 border-red-500/30'
        case 'medium':
            return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        default:
            return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
}

// -- Component -------------------------------------------------------------

export const AnalyticsDashboardView: React.FC = memo(() => {
    const { t } = useTranslation('knowledge')
    const plants = useActivePlants()
    const analytics = useAnalytics()

    if (plants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/60">
                <p className="text-lg">
                    {t('analytics.analyticsEmpty', 'Add plants to see analytics')}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* -- Garden Score Hero ----------------------------------------- */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
                <p className="mb-2 text-sm text-white/60">
                    {t('analytics.gardenScore', 'Garden Score')}
                </p>
                <p className={cn('text-5xl font-bold', scoreColor(analytics.gardenScore))}>
                    {analytics.gardenScore}
                </p>
                <p className="mt-1 text-xs text-white/40">/100</p>

                <div className="mt-4 flex justify-center gap-8 text-sm text-white/70">
                    <div>
                        <span className="block text-lg font-semibold text-white/90">
                            {analytics.avgHealth}
                        </span>
                        <span>{t('analytics.avgHealth', 'Avg Health')}</span>
                    </div>
                    <div>
                        <span className="block text-lg font-semibold text-white/90">
                            {analytics.environmentStability}
                        </span>
                        <span>{t('analytics.envStability', 'Env Stability')}</span>
                    </div>
                    <div>
                        <span className="block text-lg font-semibold text-white/90">
                            {plants.length}
                        </span>
                        <span>{t('analytics.activePlants', 'Active Plants')}</span>
                    </div>
                </div>
            </div>

            {/* -- Stage Distribution ---------------------------------------- */}
            {Object.keys(analytics.stageDistribution).length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.stageDistribution', 'Stage Distribution')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(analytics.stageDistribution).map(([stage, count]) => (
                            <span
                                key={stage}
                                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"
                            >
                                {stage}: {count}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* -- Risk Factors --------------------------------------------- */}
            {analytics.riskFactors.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.riskFactors', 'Risk Factors')}
                    </h3>
                    <ul className="space-y-2">
                        {analytics.riskFactors.map((risk, i) => (
                            <li
                                key={`${risk.type}-${i}`}
                                className={cn(
                                    'rounded-lg border px-3 py-2 text-sm',
                                    severityBadge(risk.severity),
                                )}
                            >
                                <span className="font-medium">{risk.type}</span>
                                {' -- '}
                                {risk.description}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* -- Strain Performance --------------------------------------- */}
            {analytics.strainPerformance.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.strainPerformance', 'Strain Performance')}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-white/80">
                            <thead className="border-b border-white/10 text-xs text-white/50">
                                <tr>
                                    <th className="pb-2 pr-4">{t('analytics.strain', 'Strain')}</th>
                                    <th className="pb-2 pr-4">{t('analytics.health', 'Health')}</th>
                                    <th className="pb-2 pr-4">{t('analytics.plants', 'Plants')}</th>
                                    <th className="pb-2">{t('analytics.avgAge', 'Avg Age')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.strainPerformance.map((sp) => (
                                    <tr key={sp.strainName} className="border-b border-white/5">
                                        <td className="py-2 pr-4 font-medium">{sp.strainName}</td>
                                        <td className={cn('py-2 pr-4', scoreColor(sp.avgHealth))}>
                                            {sp.avgHealth}
                                        </td>
                                        <td className="py-2 pr-4">{sp.plantCount}</td>
                                        <td className="py-2">{sp.avgAge}d</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* -- Recommendations ------------------------------------------ */}
            {analytics.recommendations.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.recommendations.title', 'Recommendations')}
                    </h3>
                    <ul className="space-y-2">
                        {analytics.recommendations.map((rec, i) => (
                            <li
                                key={`rec-${i}`}
                                className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80"
                            >
                                <span className="font-medium text-white/90">
                                    {t(`analytics.${rec.titleKey}`, rec.titleKey)}
                                </span>
                                <p className="mt-0.5 text-xs text-white/60">
                                    {t(`analytics.${rec.descriptionKey}`, rec.descriptionKey)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* -- Next Milestone ------------------------------------------- */}
            {analytics.nextMilestone !== undefined && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm">
                    <p className="text-sm text-white/60">
                        {t('analytics.nextMilestone', 'Next Milestone')}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white/90">
                        {analytics.nextMilestone.plantName} --{' '}
                        {t(
                            `analytics.milestoneType.${analytics.nextMilestone.type}`,
                            analytics.nextMilestone.type,
                        )}
                    </p>
                    <p className="text-xs text-white/50">
                        ~{analytics.nextMilestone.estimatedDays}{' '}
                        {t('analytics.daysAway', 'days away')}
                    </p>
                </div>
            )}
        </div>
    )
})

AnalyticsDashboardView.displayName = 'AnalyticsDashboardView'
