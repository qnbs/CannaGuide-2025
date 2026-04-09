import type { JournalEntry } from '@/types'
import { JournalEntryType } from '@/types'
import { getT } from '@/i18n'

// ---------------------------------------------------------------------------
// Heuristic journal summary (offline fallback -- no AI required)
// ---------------------------------------------------------------------------

interface SummaryStats {
    totalEntries: number
    byType: Partial<Record<JournalEntryType, number>>
    avgPh: number | undefined
    avgEc: number | undefined
    wateringCount: number
    feedingCount: number
    trainingCount: number
    photoCount: number
    issuesNoted: string[]
    dateRange: { from: number; to: number }
}

function collectStats(entries: JournalEntry[]): SummaryStats {
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt)
    const byType: Partial<Record<JournalEntryType, number>> = {}
    const phValues: number[] = []
    const ecValues: number[] = []
    const issues: string[] = []

    for (const entry of sorted) {
        byType[entry.type] = (byType[entry.type] ?? 0) + 1

        if (entry.details && 'ph' in entry.details) {
            const ph = entry.details.ph
            if (typeof ph === 'number' && ph > 0) phValues.push(ph)
        }
        if (entry.details && 'ec' in entry.details) {
            const ec = entry.details.ec
            if (typeof ec === 'number' && ec > 0) ecValues.push(ec)
        }
        if (
            entry.type === JournalEntryType.PestControl ||
            entry.type === JournalEntryType.Observation
        ) {
            if (entry.notes.length > 10) {
                issues.push(entry.notes.slice(0, 80))
            }
        }
    }

    const avg = (arr: number[]): number | undefined =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined

    return {
        totalEntries: entries.length,
        byType,
        avgPh: avg(phValues),
        avgEc: avg(ecValues),
        wateringCount: byType[JournalEntryType.Watering] ?? 0,
        feedingCount: byType[JournalEntryType.Feeding] ?? 0,
        trainingCount: byType[JournalEntryType.Training] ?? 0,
        photoCount: byType[JournalEntryType.Photo] ?? 0,
        issuesNoted: issues.slice(0, 5),
        dateRange: {
            from: sorted[0]?.createdAt ?? Date.now(),
            to: sorted[sorted.length - 1]?.createdAt ?? Date.now(),
        },
    }
}

function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    })
}

export function generateHeuristicSummary(plantName: string, entries: JournalEntry[]): string {
    const t = getT()

    if (entries.length === 0) {
        return t('plantsView.journal.noEntriesForSummary', {
            defaultValue: 'No journal entries to summarize.',
        })
    }

    const stats = collectStats(entries)
    const lines: string[] = []

    lines.push(
        `**${plantName}** -- ${t('plantsView.journal.summaryPeriod', { defaultValue: 'Summary' })} ${formatDate(stats.dateRange.from)} - ${formatDate(stats.dateRange.to)}`,
    )
    lines.push('')
    lines.push(
        `${t('plantsView.journal.totalEntries', { defaultValue: 'Total entries' })}: ${stats.totalEntries}`,
    )

    if (stats.wateringCount > 0) {
        lines.push(
            `- ${t('plantsView.journal.watering', { defaultValue: 'Watering' })}: ${stats.wateringCount}x`,
        )
    }
    if (stats.feedingCount > 0) {
        lines.push(
            `- ${t('plantsView.journal.feeding', { defaultValue: 'Feeding' })}: ${stats.feedingCount}x`,
        )
    }
    if (stats.trainingCount > 0) {
        lines.push(
            `- ${t('plantsView.journal.training', { defaultValue: 'Training' })}: ${stats.trainingCount}x`,
        )
    }
    if (stats.photoCount > 0) {
        lines.push(
            `- ${t('plantsView.journal.photos', { defaultValue: 'Photos' })}: ${stats.photoCount}x`,
        )
    }

    if (stats.avgPh != null) {
        lines.push(
            `- ${t('plantsView.journal.avgPh', { defaultValue: 'Avg pH' })}: ${stats.avgPh.toFixed(1)}`,
        )
    }
    if (stats.avgEc != null) {
        lines.push(
            `- ${t('plantsView.journal.avgEc', { defaultValue: 'Avg EC' })}: ${stats.avgEc.toFixed(2)} mS/cm`,
        )
    }

    if (stats.issuesNoted.length > 0) {
        lines.push('')
        lines.push(`**${t('plantsView.journal.issuesNoted', { defaultValue: 'Issues noted' })}:**`)
        for (const issue of stats.issuesNoted) {
            lines.push(`- ${issue}`)
        }
    }

    return lines.join('\n')
}

export async function generateAiSummary(
    plantName: string,
    entries: JournalEntry[],
): Promise<string> {
    if (entries.length === 0) {
        return generateHeuristicSummary(plantName, entries)
    }

    try {
        // Attempt AI-powered summary via facade
        const { aiService } = await import('@/services/aiFacade')
        const stats = collectStats(entries)
        const prompt = [
            `Summarize this cannabis grow journal for plant "${plantName}":`,
            `Period: ${formatDate(stats.dateRange.from)} - ${formatDate(stats.dateRange.to)}`,
            `Entries: ${stats.totalEntries} (watering: ${stats.wateringCount}, feeding: ${stats.feedingCount}, training: ${stats.trainingCount})`,
            stats.avgPh != null ? `Average pH: ${stats.avgPh.toFixed(1)}` : '',
            stats.avgEc != null ? `Average EC: ${stats.avgEc.toFixed(2)}` : '',
            stats.issuesNoted.length > 0 ? `Issues: ${stats.issuesNoted.join('; ')}` : '',
            'Provide a concise 3-5 sentence summary with actionable recommendations.',
        ]
            .filter(Boolean)
            .join('\n')

        const response = await aiService.getEquipmentRecommendation(prompt, 'en')
        if (
            response &&
            'text' in response &&
            typeof response.text === 'string' &&
            response.text.length > 20
        ) {
            return response.text
        }
    } catch {
        console.debug('[JournalSummary] AI summary failed, falling back to heuristic')
    }

    // Fallback to heuristic
    return generateHeuristicSummary(plantName, entries)
}
