import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resetNlpPipelines } from '@/services/localAiNlpService'

vi.mock('@/services/inferenceQueueService', () => ({
    isWorkerAvailable: vi.fn(() => true),
    enqueueInference: vi.fn(async (task: { task: string }) => {
        if (task.task === 'sentiment-analysis') {
            return [{ label: 'POSITIVE', score: 0.92 }]
        }
        if (task.task === 'summarization') {
            return [{ summary_text: 'Plant is healthy and growing well.' }]
        }
        if (task.task === 'zero-shot-classification') {
            return {
                labels: ['watering and irrigation', 'pH and EC', 'general question'],
                scores: [0.85, 0.1, 0.05],
            }
        }
        throw new Error(`Unknown task: ${task.task}`)
    }),
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

describe('localAiNlpService', () => {
    beforeEach(() => {
        resetNlpPipelines()
    })

    describe('analyzeSentiment', () => {
        it('returns positive sentiment for happy text', async () => {
            const { analyzeSentiment } = await import('@/services/localAiNlpService')
            const result = await analyzeSentiment('The plant is growing beautifully!')
            expect(result.label).toBe('POSITIVE')
            expect(result.score).toBeGreaterThan(0.5)
            expect(result.normalized).toBe('positive')
        })

        it('returns neutral for empty text', async () => {
            const { analyzeSentiment } = await import('@/services/localAiNlpService')
            const result = await analyzeSentiment('')
            expect(result.normalized).toBe('neutral')
        })

        it('sanitizes HTML from input', async () => {
            const { analyzeSentiment } = await import('@/services/localAiNlpService')
            const result = await analyzeSentiment('<script>alert(1)</script>Good growth')
            expect(result).toBeDefined()
            expect(result.label).toBeDefined()
        })
    })

    describe('analyzeSentimentBatch', () => {
        it('analyzes multiple texts', async () => {
            const { analyzeSentimentBatch } = await import('@/services/localAiNlpService')
            const results = await analyzeSentimentBatch([
                'Great progress today',
                'Leaves are drooping',
            ])
            expect(results).toHaveLength(2)
            results.forEach((r) => expect(r).toHaveProperty('normalized'))
        })
    })

    describe('summarizeText', () => {
        it('summarizes long text', async () => {
            const { summarizeText } = await import('@/services/localAiNlpService')
            const result = await summarizeText(
                'The plant showed remarkable growth over the past week. New leaves emerged from the main stem and side branches developed well. VPD was maintained at 1.1 kPa throughout. Watering schedule was every other day with EC of 1.4.',
            )
            expect(result.summary).toBeTruthy()
            expect(result.inputLength).toBeGreaterThan(0)
            expect(result.outputLength).toBeGreaterThan(0)
        })

        it('returns short text unchanged', async () => {
            const { summarizeText } = await import('@/services/localAiNlpService')
            const result = await summarizeText('Short note.')
            expect(result.summary).toBe('Short note.')
        })
    })

    describe('classifyGrowTopic', () => {
        it('classifies a watering question', async () => {
            const { classifyGrowTopic } = await import('@/services/localAiNlpService')
            const result = await classifyGrowTopic('How often should I water my plant?')
            expect(result.topLabel).toBeDefined()
            expect(result.topScore).toBeGreaterThan(0)
            expect(result.labels.length).toBeGreaterThan(0)
        })

        it('returns general for empty input', async () => {
            const { classifyGrowTopic } = await import('@/services/localAiNlpService')
            const result = await classifyGrowTopic('')
            expect(result.topLabel).toBe('general question')
        })
    })

    describe('analyzeJournalSentimentTrend', () => {
        it('returns stable for empty entries', async () => {
            const { analyzeJournalSentimentTrend } = await import('@/services/localAiNlpService')
            const result = await analyzeJournalSentimentTrend([])
            expect(result.overall).toBe('stable')
            expect(result.entryCount).toBe(0)
        })

        it('analyzes sentiment trend across entries', async () => {
            const { analyzeJournalSentimentTrend } = await import('@/services/localAiNlpService')
            const entries = Array.from({ length: 6 }, (_, i) => ({
                notes: i < 3 ? 'Great progress' : 'Some issues',
                createdAt: Date.now() - i * 86400000,
            }))
            const result = await analyzeJournalSentimentTrend(entries)
            expect(result.entryCount).toBe(6)
            expect(['improving', 'declining', 'stable']).toContain(result.overall)
        })
    })

    describe('preloadNlpModels', () => {
        it('reports all models as ready on success', async () => {
            const { preloadNlpModels } = await import('@/services/localAiNlpService')
            const steps: Array<[number, number, string]> = []
            const status = await preloadNlpModels((loaded, total, label) => {
                steps.push([loaded, total, label])
            })
            expect(status.sentimentReady).toBe(true)
            expect(status.summarizationReady).toBe(true)
            expect(status.zeroShotReady).toBe(true)
            expect(steps.length).toBeGreaterThanOrEqual(3)
        })
    })
})
