import type { DiagnosisRecord, MetricsReading } from '@/types'
import { formatDate, truncate } from './pdfTypes'

export interface MetricStats {
    label: string
    min: string
    max: string
    avg: string
    unit: string
}

export function computeMetricStats(readings: MetricsReading[]): MetricStats[] {
    const stats: MetricStats[] = []
    const fields: Array<{
        key: keyof MetricsReading
        label: string
        unit: string
        decimals: number
    }> = [
        { key: 'height', label: 'Height', unit: 'cm', decimals: 1 },
        { key: 'potWeight', label: 'Pot Weight', unit: 'g', decimals: 0 },
        { key: 'co2', label: 'CO2', unit: 'ppm', decimals: 0 },
    ]

    for (const field of fields) {
        const values = readings
            .map((r) => r[field.key])
            .filter((v): v is number => typeof v === 'number')
        if (values.length === 0) continue
        const min = Math.min(...values)
        const max = Math.max(...values)
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        stats.push({
            label: field.label,
            min: min.toFixed(field.decimals),
            max: max.toFixed(field.decimals),
            avg: avg.toFixed(field.decimals),
            unit: field.unit,
        })
    }
    return stats
}

export interface DiagnosisSummaryRow {
    date: string
    label: string
    severity: string
    confidence: string
}

export function buildDiagnosisRows(records: DiagnosisRecord[]): DiagnosisSummaryRow[] {
    return records
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((r) => ({
            date: formatDate(r.timestamp),
            label: truncate(r.label, 40),
            severity: r.severity,
            confidence: `${Math.round(r.confidence * 100)}%`,
        }))
}
