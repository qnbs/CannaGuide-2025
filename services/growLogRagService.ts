import { Plant, JournalEntry } from '@/types'

interface LogChunk {
    plantId: string
    plantName: string
    text: string
    createdAt: number
}

const tokenize = (input: string): string[] =>
    input
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 2)

const scoreChunk = (chunk: LogChunk, queryTokens: string[]): number => {
    const haystack = chunk.text.toLowerCase()
    let score = 0

    for (const token of queryTokens) {
        if (haystack.includes(token)) {
            score += 2
        }
    }

    const ageBoost = Math.max(0, 1 - (Date.now() - chunk.createdAt) / (1000 * 60 * 60 * 24 * 30))
    return score + ageBoost
}

class GrowLogRagService {
    private buildChunks(plants: Plant[]): LogChunk[] {
        return plants.flatMap((plant) =>
            plant.journal.map((entry: JournalEntry) => ({
                plantId: plant.id,
                plantName: plant.name,
                createdAt: entry.createdAt,
                text: `${entry.type} ${entry.notes} ${(entry.details && JSON.stringify(entry.details)) || ''}`,
            })),
        )
    }

    public retrieveRelevantContext(plants: Plant[], query: string, limit = 6): string {
        const chunks = this.buildChunks(plants)
        if (chunks.length === 0) {
            return 'No grow log entries found.'
        }

        const tokens = tokenize(query)
        const ranked = chunks
            .map((chunk) => ({ chunk, score: scoreChunk(chunk, tokens) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ chunk }) =>
                `- ${chunk.plantName} @ ${new Date(chunk.createdAt).toLocaleString()}: ${chunk.text.slice(0, 240)}`,
            )

        return ranked.join('\n')
    }
}

export const growLogRagService = new GrowLogRagService()
