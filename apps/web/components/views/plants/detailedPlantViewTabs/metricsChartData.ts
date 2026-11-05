import type { HydroReading, MetricsReading } from '@/types'

/** One point of the metrics overview chart. */
export interface MetricsChartPoint {
    time: string
    vpd: number
    ph: number | undefined
    ec: number | undefined
    height: number | undefined
    potWeight: number | undefined
    co2: number | undefined
}

/** The first entry per timestamp, as a lookup (the chart shows one value per instant). */
const firstByTimestamp = <T extends { timestamp: number }>(
    entries: readonly T[],
): Map<number, T> => {
    const byTimestamp = new Map<number, T>()
    for (const entry of entries) {
        if (!byTimestamp.has(entry.timestamp)) byTimestamp.set(entry.timestamp, entry)
    }
    return byTimestamp
}

const hydroFields = (reading: HydroReading | undefined) => ({ ph: reading?.ph, ec: reading?.ec })

const metricFields = (metric: MetricsReading | undefined) => ({
    height: metric?.height,
    potWeight: metric?.potWeight,
    co2: metric?.co2,
})

/**
 * Merges the plant's metrics and the hydro readings since `cutoff` into one
 * time-ordered series. Both histories are kept in full (GH #686, GH #814), so
 * the merge looks each instant up in a map instead of scanning every reading
 * per point: linear in the readings plus the sort of the timestamps.
 */
export const buildMetricsChartData = (
    metricsReadings: readonly MetricsReading[],
    hydroReadings: readonly HydroReading[],
    cutoff: number,
    vpd: number,
): MetricsChartPoint[] => {
    const metrics = firstByTimestamp(metricsReadings.filter((r) => r.timestamp >= cutoff))
    const hydro = firstByTimestamp(hydroReadings.filter((r) => r.timestamp >= cutoff))
    const timestamps = new Set([...metrics.keys(), ...hydro.keys()])

    return Array.from(timestamps)
        .sort((a, b) => a - b)
        .map((ts) => ({
            time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            vpd,
            ...hydroFields(hydro.get(ts)),
            ...metricFields(metrics.get(ts)),
        }))
}
