import type { DiagnosisRecord, MetricsReading, Plant } from '@/types'
import { truncate } from './pdfTypes'
import { computeMetricStats } from './pdfStats'

/** Generates a template-based AI summary (offline-safe fallback). */
export function buildOfflineSummary(
    plant: Plant,
    metrics: MetricsReading[],
    diagnosis: DiagnosisRecord[],
): { summary: string; recommendations: string[] } {
    const age = plant.age
    const health = Math.round(plant.health)
    const stage = plant.stage
    const stats = computeMetricStats(metrics)

    let summary = `${plant.name} (${plant.strain.name}) is ${age} days old in the ${stage} stage with ${health}% health.`

    if (stats.length > 0) {
        const heightStat = stats.find((s) => s.label === 'Height')
        if (heightStat) {
            summary += ` Current height range: ${heightStat.min}-${heightStat.max} ${heightStat.unit}.`
        }
    }

    if (diagnosis.length > 0) {
        const latest = diagnosis[diagnosis.length - 1]
        if (latest) {
            summary += ` Latest diagnosis: ${latest.label} (${latest.severity}, ${Math.round(latest.confidence * 100)}% confidence).`
        }
    }

    const recommendations: string[] = []
    if (health < 70) {
        recommendations.push('Monitor plant health closely -- consider environment adjustments.')
    }
    if (diagnosis.some((d) => d.severity === 'severe')) {
        recommendations.push('Address severe diagnosis findings immediately.')
    }
    if (metrics.length < 5) {
        recommendations.push('Log more metrics regularly for better trend analysis.')
    }
    if (recommendations.length === 0) {
        recommendations.push('Plant is progressing well -- maintain current care routine.')
    }

    return { summary, recommendations }
}

/**
 * Attempts to generate an AI-powered plant summary.
 * Falls back to an offline template when AI is unavailable.
 */
export async function generatePlantSummary(
    plant: Plant,
    metrics: MetricsReading[],
    diagnosis: DiagnosisRecord[],
): Promise<{ summary: string; recommendations: string[] }> {
    try {
        const { aiService } = await import('@/services/aiFacade')
        const response = await aiService.getPlantAdvice(plant, 'en')
        if (response?.content) {
            const lines = response.content.split('\n').filter((l: string) => l.trim())
            const summary = lines.slice(0, 3).join(' ')
            const recommendations = lines.slice(3, 8).map((l: string) => l.replace(/^[-*]\s*/, ''))
            if (summary.length > 20) {
                return {
                    summary: truncate(summary, 500),
                    recommendations:
                        recommendations.length > 0
                            ? recommendations
                            : ['Follow the AI-suggested care plan above.'],
                }
            }
        }
    } catch {
        console.debug('[pdfReport] AI summary unavailable, using offline fallback')
    }
    return buildOfflineSummary(plant, metrics, diagnosis)
}
