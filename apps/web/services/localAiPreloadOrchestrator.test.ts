import { describe, expect, it, vi } from 'vitest'

vi.mock('./localAiWebLlmService', () => ({
    loadWebLlmEngine: vi.fn(async () => ({})),
}))

vi.mock('./localAiEmbeddingService', () => ({
    preloadEmbeddingModel: vi.fn(async () => true),
}))

vi.mock('./localAiNlpService', () => ({
    preloadNlpModels: vi.fn(async (cb: (l: number, t: number, s: string) => void) => {
        cb(1, 3, 'sentiment')
        cb(2, 3, 'summarization')
        cb(3, 3, 'zero-shot')
        return { sentimentReady: true, summarizationReady: true, zeroShotReady: true }
    }),
}))

vi.mock('./localAiLanguageDetectionService', () => ({
    preloadLanguageDetectionModel: vi.fn(async () => true),
}))

vi.mock('./localAiImageSimilarityService', () => ({
    preloadImageSimilarityModel: vi.fn(async () => true),
}))

vi.mock('./imageGenerationService', () => ({
    checkImageGenCapability: vi.fn(() => ({ supported: false })),
}))

import { preloadOfflineAssets, type LocalAiPreloadReport } from './localAiPreloadOrchestrator'
import type { LocalAiModelManager } from './localAiModelManager'

const buildMockManager = (textOk = true, visionOk = true): LocalAiModelManager =>
    ({
        loadTextPipeline: vi.fn(async () => {
            if (!textOk) throw new Error('text failed')
            return vi.fn()
        }),
        loadVisionPipeline: vi.fn(async () => {
            if (!visionOk) throw new Error('vision failed')
            return vi.fn()
        }),
        dispose: vi.fn(),
    }) as unknown as LocalAiModelManager

describe('localAiPreloadOrchestrator', () => {
    it('reports progress callbacks with correct step count', async () => {
        const manager = buildMockManager()
        const steps: Array<[number, number, string]> = []

        const report = await preloadOfflineAssets(manager, false, (l, t, s) => {
            steps.push([l, t, s])
        })

        expect(report.textModelReady).toBe(true)
        expect(report.visionModelReady).toBe(true)
        expect(report.errorCount).toBe(0)
        expect(steps.length).toBeGreaterThanOrEqual(3)
        expect(steps[0]).toEqual([0, 8, 'text-model'])
    })

    it('counts errorCount for failed model loads', async () => {
        const manager = buildMockManager(false, false)

        const report = await preloadOfflineAssets(manager)

        expect(report.textModelReady).toBe(false)
        expect(report.visionModelReady).toBe(false)
        expect(report.errorCount).toBe(2)
    })

    it('ecoOnly mode only loads text model', async () => {
        const manager = buildMockManager()
        const steps: Array<[number, number, string]> = []

        const report = await preloadOfflineAssets(
            manager,
            false,
            (l, t, s) => steps.push([l, t, s]),
            true,
        )

        expect(report.textModelReady).toBe(true)
        expect(report.visionModelReady).toBe(false)
        expect(report.embeddingModelReady).toBe(false)
        expect(report.webLlmReady).toBe(false)
        // ecoOnly has totalSteps = 1
        expect(steps[0]).toEqual([0, 1, 'text-model-eco'])
    })

    it('returns full preload report with all fields', async () => {
        const manager = buildMockManager()
        const report: LocalAiPreloadReport = await preloadOfflineAssets(manager)

        expect(report).toEqual(
            expect.objectContaining({
                textModelReady: true,
                visionModelReady: true,
                webLlmReady: false,
                embeddingModelReady: true,
                sentimentModelReady: true,
                summarizationModelReady: true,
                zeroShotTextModelReady: true,
                languageDetectionReady: true,
                imageSimilarityReady: true,
                imageGenerationReady: false,
                errorCount: 0,
            }),
        )
    })
})
