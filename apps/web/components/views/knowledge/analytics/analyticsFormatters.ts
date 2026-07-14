// ---------------------------------------------------------------------------
// Presentation helpers for the analytics dashboard: score/severity colouring
// and the CSV export. Split out of AnalyticsDashboardView, which sat one line
// under the 700-line file budget.
// ---------------------------------------------------------------------------

import type { GrowAnalytics } from '@/services/analyticsService'
import type { PredictiveInsight } from '@/services/predictiveAnalyticsService'
import type { HydroReading } from '@/types'

export const STAGE_COLORS = [
    '#22c55e',
    '#3b82f6',
    '#a855f7',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
] as const

export const CHART_MARGIN = { top: 8, right: 12, left: 0, bottom: 0 } as const

export function scoreColor(score: number): string {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
}

export function scoreBgColor(score: number): string {
    if (score >= 80) return 'stroke-green-400'
    if (score >= 60) return 'stroke-yellow-400'
    if (score >= 40) return 'stroke-orange-400'
    return 'stroke-red-400'
}

export function severityBadge(severity: string): string {
    switch (severity) {
        case 'high':
            return 'bg-red-500/20 text-red-300 border-red-500/30'
        case 'medium':
            return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        default:
            return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
}

export function ratingBadge(rating: string): string {
    switch (rating) {
        case 'stable':
            return 'bg-green-500/20 text-green-300'
        case 'moderate':
            return 'bg-yellow-500/20 text-yellow-300'
        default:
            return 'bg-red-500/20 text-red-300'
    }
}

export function exportAnalyticsCsv(
    analytics: GrowAnalytics,
    predictiveInsights?: ReadonlyMap<string, PredictiveInsight>,
    hydroReadings?: readonly HydroReading[],
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

    if (hydroReadings && hydroReadings.length > 0) {
        const phVals = hydroReadings.map((r) => r.ph)
        const ecVals = hydroReadings.map((r) => r.ec)
        const tempVals = hydroReadings.map((r) => r.waterTemp)
        const avg = (arr: number[]): string =>
            (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
        rows.push(`Hydro,Readings Count,${hydroReadings.length}`)
        rows.push(`Hydro,pH Min,${Math.min(...phVals).toFixed(2)}`)
        rows.push(`Hydro,pH Max,${Math.max(...phVals).toFixed(2)}`)
        rows.push(`Hydro,pH Avg,${avg(phVals)}`)
        rows.push(`Hydro,EC Min,${Math.min(...ecVals).toFixed(2)}`)
        rows.push(`Hydro,EC Max,${Math.max(...ecVals).toFixed(2)}`)
        rows.push(`Hydro,EC Avg,${avg(ecVals)}`)
        rows.push(`Hydro,Temp Min,${Math.min(...tempVals).toFixed(1)}`)
        rows.push(`Hydro,Temp Max,${Math.max(...tempVals).toFixed(1)}`)
        rows.push(`Hydro,Temp Avg,${avg(tempVals)}`)
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cannaguide-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}
