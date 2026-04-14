// ---------------------------------------------------------------------------
// AnalyticsDashboardView -- Cross-Module Analytics Dashboard
//
// Displays a comprehensive analytics overview of the user's garden:
// garden score, risk factors, strain performance, recommendations,
// journal trend chart, health trend, nutrient consistency, and CSV export.
// Integrated into the KnowledgeView as a new tab.
// ---------------------------------------------------------------------------

import React, { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
} from 'recharts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useActivePlants } from '@/hooks/useSimulationBridge'
import { usePredictiveAnalytics } from '@/hooks/usePredictiveAnalytics'
import { PredictiveInsightsPanel } from '@/components/common/PredictiveInsightsPanel'
import { cn } from '@/lib/utils'
import type { GrowAnalytics } from '@/services/analyticsService'
import type { PredictiveInsight } from '@/services/predictiveAnalyticsService'

// -- Constants & Helpers ---------------------------------------------------

const STAGE_COLORS = [
    '#22c55e',
    '#3b82f6',
    '#a855f7',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
] as const

const CHART_MARGIN = { top: 8, right: 12, left: 0, bottom: 0 } as const

function scoreColor(score: number): string {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
}

function scoreBgColor(score: number): string {
    if (score >= 80) return 'stroke-green-400'
    if (score >= 60) return 'stroke-yellow-400'
    if (score >= 40) return 'stroke-orange-400'
    return 'stroke-red-400'
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

function ratingBadge(rating: string): string {
    switch (rating) {
        case 'stable':
            return 'bg-green-500/20 text-green-300'
        case 'moderate':
            return 'bg-yellow-500/20 text-yellow-300'
        default:
            return 'bg-red-500/20 text-red-300'
    }
}

// -- CSV Export helper -----------------------------------------------------

function exportAnalyticsCsv(
    analytics: GrowAnalytics,
    predictiveInsights?: ReadonlyMap<string, PredictiveInsight>,
): void {
    const rows: string[] = []
    rows.push('Section,Key,Value')
    rows.push(`Overview,Garden Score,${analytics.gardenScore}`)
    rows.push(`Overview,Avg Health,${analytics.avgHealth}`)
    rows.push(`Overview,Env Stability,${analytics.environmentStability}`)

    for (const [stage, count] of Object.entries(analytics.stageDistribution)) {
        rows.push(`Stage Distribution,${stage},${count}`)
    }

    for (const sp of analytics.strainPerformance) {
        rows.push(
            `Strain Performance,${sp.strainName},Health=${sp.avgHealth} Plants=${sp.plantCount} AvgAge=${sp.avgAge}`,
        )
    }

    for (const risk of analytics.riskFactors) {
        rows.push(`Risk,${risk.type},${risk.severity}`)
    }

    if (predictiveInsights) {
        for (const [plantId, insight] of predictiveInsights) {
            rows.push(
                `Predictive,${plantId} Botrytis Risk,${insight.botrytisRisk.riskLevel} (${insight.botrytisRisk.riskScore})`,
            )
            rows.push(`Predictive,${plantId} Env Alerts,${insight.environmentAlerts.length}`)
            rows.push(`Predictive,${plantId} Yield Impact,${insight.yieldImpact.impactPercent}%`)
        }
    }

    for (const nc of analytics.nutrientConsistency) {
        rows.push(`Nutrient,${nc.plantName},pH=${nc.avgPh} EC=${nc.avgEc} Rating=${nc.rating}`)
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cannaguide-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

// -- Score Gauge SVG -------------------------------------------------------

const ScoreGauge: React.FC<{ score: number }> = memo(({ score }) => {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <svg width="130" height="130" viewBox="0 0 130 130" className="mx-auto">
            <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="10"
            />
            <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                className={scoreBgColor(score)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text
                x="65"
                y="60"
                textAnchor="middle"
                className="fill-white text-2xl font-bold"
                fontSize="28"
            >
                {score}
            </text>
            <text x="65" y="80" textAnchor="middle" className="fill-white/40" fontSize="12">
                /100
            </text>
        </svg>
    )
})
ScoreGauge.displayName = 'ScoreGauge'

// -- Component -------------------------------------------------------------

export const AnalyticsDashboardView: React.FC = memo(() => {
    const { t } = useTranslation()
    const plants = useActivePlants()
    const analytics = useAnalytics()
    const {
        insights: predictiveInsights,
        loading: predictiveLoading,
        worstRisk,
    } = usePredictiveAnalytics(plants)
    const [activeHealthPlant, setActiveHealthPlant] = useState(0)
    const [activePredictivePlant, setActivePredictivePlant] = useState(0)

    const handleExport = useCallback(() => {
        exportAnalyticsCsv(analytics, predictiveInsights)
    }, [analytics, predictiveInsights])

    if (plants.length === 0) {
        return (
            <div
                data-testid="analytics-empty-state"
                className="flex flex-col items-center justify-center py-16 text-center text-white/60"
            >
                <p className="text-lg">
                    {t('analytics.analyticsEmpty', 'Add plants to see analytics')}
                </p>
            </div>
        )
    }

    const pieData = Object.entries(analytics.stageDistribution).map(([name, value]) => ({
        name,
        value,
    }))

    const currentHealthTrend = analytics.healthTrend[activeHealthPlant]

    return (
        <div className="space-y-6">
            {/* -- Header with Export ---------------------------------------- */}
            <div className="flex items-center justify-end">
                <button
                    onClick={handleExport}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors"
                >
                    {t('analytics.exportCsv', 'Export CSV')}
                </button>
            </div>

            {/* -- Garden Score Gauge ---------------------------------------- */}
            <div
                data-testid="analytics-garden-score"
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
            >
                <p className="mb-2 text-sm text-white/60">
                    {t('analytics.gardenScore', 'Garden Score')}
                </p>
                <ScoreGauge score={analytics.gardenScore} />

                <div className="mt-4 flex justify-center gap-4 sm:gap-8 text-sm text-white/70">
                    <div>
                        <span
                            className={cn(
                                'block text-lg font-semibold',
                                scoreColor(analytics.avgHealth),
                            )}
                        >
                            {analytics.avgHealth}
                        </span>
                        <span>{t('analytics.avgHealth', 'Avg Health')}</span>
                    </div>
                    <div>
                        <span
                            className={cn(
                                'block text-lg font-semibold',
                                scoreColor(analytics.environmentStability),
                            )}
                        >
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

            {/* -- Stage Distribution Pie Chart ------------------------------ */}
            {pieData.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.stageDistribution', 'Stage Distribution')}
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                                nameKey="name"
                            >
                                {pieData.map((_entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            STAGE_COLORS[index % STAGE_COLORS.length] ?? '#888888'
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* -- Journal Activity Trend Area Chart ------------------------- */}
            {analytics.journalActivityTrend.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.journalTrend', 'Journal Activity (14d)')}
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={analytics.journalActivityTrend} margin={CHART_MARGIN}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                tickFormatter={(v: string) => v.slice(5)}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name={t('analytics.journalEntries', 'Entries')}
                                stroke="#3b82f6"
                                fill="rgba(59,130,246,0.15)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* -- Health Trend Chart ---------------------------------------- */}
            {analytics.healthTrend.length > 0 && currentHealthTrend !== undefined && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white/90">
                            {t('analytics.healthTrend', 'Health Trend (14d)')}
                        </h3>
                        {analytics.healthTrend.length > 1 && (
                            <select
                                value={activeHealthPlant}
                                onChange={(e) => setActiveHealthPlant(Number(e.target.value))}
                                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80"
                            >
                                {analytics.healthTrend.map((ht, i) => (
                                    <option key={ht.plantId} value={i}>
                                        {ht.plantName}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={currentHealthTrend.trend} margin={CHART_MARGIN}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                tickFormatter={(v: string) => v.slice(5)}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name={t('analytics.chartHealth', 'Health')}
                                stroke="#22c55e"
                                fill="rgba(34,197,94,0.15)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* -- Nutrient Consistency ------------------------------------- */}
            {analytics.nutrientConsistency.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.nutrientConsistency', 'Nutrient Consistency')}
                    </h3>
                    <div className="space-y-2">
                        {analytics.nutrientConsistency.map((nc) => (
                            <div
                                key={nc.plantId}
                                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                            >
                                <span className="font-medium text-white/90">{nc.plantName}</span>
                                <div className="flex items-center gap-3 text-xs text-white/70">
                                    <span>
                                        {t('analytics.phLabel', 'pH')}: {nc.avgPh}
                                    </span>
                                    <span>
                                        {t('analytics.ecLabel', 'EC')}: {nc.avgEc}
                                    </span>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5',
                                            ratingBadge(nc.rating),
                                        )}
                                    >
                                        {t(`analytics.nutrientRating.${nc.rating}`, nc.rating)}
                                    </span>
                                </div>
                            </div>
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
                                <span className="font-medium">
                                    {t(`analytics.riskType.${risk.type}`, risk.type)}
                                </span>
                                {' -- '}
                                {t(risk.descriptionKey, risk.descriptionParams ?? {})}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* -- Predictive Insights -------------------------------------- */}
            {plants.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white/90">
                            {t('analytics.predictive.title', 'Predictive Insights')}
                            {worstRisk !== null && worstRisk !== 'low' && (
                                <span
                                    className={cn(
                                        'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                        worstRisk === 'critical'
                                            ? 'bg-red-500/20 text-red-300'
                                            : worstRisk === 'high'
                                              ? 'bg-orange-500/20 text-orange-300'
                                              : 'bg-amber-500/20 text-amber-300',
                                    )}
                                >
                                    {t(`analytics.predictive.risk.${worstRisk}`, worstRisk)}
                                </span>
                            )}
                        </h3>
                        {plants.length > 1 && (
                            <select
                                value={activePredictivePlant}
                                onChange={(e) => setActivePredictivePlant(Number(e.target.value))}
                                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80"
                                aria-label={t('analytics.predictive.selectPlant', 'Select plant')}
                            >
                                {plants.map((p, i) => (
                                    <option key={p.id} value={i}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <PredictiveInsightsPanel
                        insight={
                            plants[activePredictivePlant] !== undefined
                                ? (predictiveInsights.get(
                                      plants[activePredictivePlant]?.id ?? '',
                                  ) ?? null)
                                : null
                        }
                        loading={predictiveLoading}
                        plantName={plants[activePredictivePlant]?.name}
                        glass
                    />
                </div>
            )}

            {/* -- Strain Performance Bar Chart ------------------------------ */}
            {analytics.strainPerformance.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.strainPerformance', 'Strain Performance')}
                    </h3>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(120, analytics.strainPerformance.length * 40)}
                    >
                        <BarChart
                            data={analytics.strainPerformance}
                            layout="vertical"
                            margin={{ ...CHART_MARGIN, left: 60 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="strainName"
                                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                                width={55}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar
                                dataKey="avgHealth"
                                name={t('analytics.health', 'Health')}
                                fill="#22c55e"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 overflow-x-auto px-2 sm:px-0">
                        <table className="w-full text-left text-xs sm:text-sm text-white/80">
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

            {/* -- Grow Duration Stats -------------------------------------- */}
            {analytics.growDurationStats.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-semibold text-white/90">
                        {t('analytics.growDuration', 'Grow Duration by Strain')}
                    </h3>
                    <div className="overflow-x-auto px-2 sm:px-0">
                        <table className="w-full text-left text-xs sm:text-sm text-white/80">
                            <thead className="border-b border-white/10 text-xs text-white/50">
                                <tr>
                                    <th className="pb-2 pr-4">{t('analytics.strain', 'Strain')}</th>
                                    <th className="pb-2 pr-4">
                                        {t('analytics.growDurationMin', 'Min')}
                                    </th>
                                    <th className="pb-2 pr-4">
                                        {t('analytics.growDurationMax', 'Max')}
                                    </th>
                                    <th className="pb-2 pr-4">
                                        {t('analytics.growDurationAvg', 'Avg')}
                                    </th>
                                    <th className="pb-2">
                                        {t('analytics.growDurationCount', 'Harvests')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.growDurationStats.map((gd) => (
                                    <tr key={gd.strainName} className="border-b border-white/5">
                                        <td className="py-2 pr-4 font-medium">{gd.strainName}</td>
                                        <td className="py-2 pr-4">{gd.minDays}d</td>
                                        <td className="py-2 pr-4">{gd.maxDays}d</td>
                                        <td className="py-2 pr-4">{gd.avgDays}d</td>
                                        <td className="py-2">{gd.count}</td>
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
