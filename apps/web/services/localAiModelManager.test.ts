import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./localAIModelLoader', () => ({
    loadTransformersPipeline: vi.fn(),
    clearPipelineCache: vi.fn(),
    evictIdlePipelines: vi.fn(),
    getResolvedProfile: vi.fn(() => ({
        transformersModelId: 'test-model',
        useQuantized: true,
        webLlmModelId: 'test-webllm',
    })),
}))

vi.mock('./localAiWebLlmService', () => ({
    disposeWebLlm: vi.fn(),
}))

vi.mock('./localAiDiagnosisService', () => ({
    VISION_MODEL_ID: 'test-vision-model',
}))

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

vi.mock('./localAiInferenceRouter', () => ({
    clearInferenceCache: vi.fn(),
}))

import { LocalAiModelManager } from './localAiModelManager'
import { loadTransformersPipeline, clearPipelineCache } from './localAIModelLoader'
import { disposeWebLlm } from './localAiWebLlmService'
import { clearInferenceCache } from './localAiInferenceRouter'

describe('LocalAiModelManager', () => {
    let manager: LocalAiModelManager

    beforeEach(() => {
        manager = new LocalAiModelManager()
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('loads primary text model successfully', async () => {
        const mockPipeline = vi.fn()
        vi.mocked(loadTransformersPipeline).mockResolvedValueOnce(mockPipeline)

        const result = await manager.loadTextPipeline()
        expect(result).toBe(mockPipeline)
        expect(loadTransformersPipeline).toHaveBeenCalledWith('text-generation', 'test-model', {
            quantized: true,
        })
    })

    it('falls back to ALT_TEXT_MODEL_ID on primary failure', async () => {
        const altPipeline = vi.fn()
        vi.mocked(loadTransformersPipeline)
            .mockRejectedValueOnce(new Error('primary failed'))
            .mockResolvedValueOnce(altPipeline)

        const result = await manager.loadTextPipeline()
        expect(result).toBe(altPipeline)
        expect(loadTransformersPipeline).toHaveBeenCalledTimes(2)
        expect(loadTransformersPipeline).toHaveBeenLastCalledWith(
            'text-generation',
            'Xenova/Qwen2.5-0.5B-Instruct',
            { quantized: true },
        )
    })

    it('resets pipeline promise on double failure', async () => {
        vi.mocked(loadTransformersPipeline)
            .mockRejectedValueOnce(new Error('primary failed'))
            .mockRejectedValueOnce(new Error('alt failed'))

        await expect(manager.loadTextPipeline()).rejects.toThrow('alt failed')

        // Second call should retry (not return cached rejected promise)
        const freshPipeline = vi.fn()
        vi.mocked(loadTransformersPipeline).mockResolvedValueOnce(freshPipeline)
        const result = await manager.loadTextPipeline()
        expect(result).toBe(freshPipeline)
    })

    it('loads vision pipeline successfully', async () => {
        const visionPipeline = vi.fn()
        vi.mocked(loadTransformersPipeline).mockResolvedValueOnce(visionPipeline)

        const result = await manager.loadVisionPipeline()
        expect(result).toBe(visionPipeline)
        expect(loadTransformersPipeline).toHaveBeenCalledWith(
            'zero-shot-image-classification',
            'test-vision-model',
            { quantized: true },
        )
    })

    it('caches pipeline promises across calls', async () => {
        const mockPipeline = vi.fn()
        vi.mocked(loadTransformersPipeline).mockResolvedValue(mockPipeline)

        await manager.loadTextPipeline()
        await manager.loadTextPipeline()
        expect(loadTransformersPipeline).toHaveBeenCalledTimes(1)
    })

    it('disposes all resources', () => {
        manager.dispose()
        expect(disposeWebLlm).toHaveBeenCalled()
        expect(clearPipelineCache).toHaveBeenCalled()
        expect(clearInferenceCache).toHaveBeenCalled()
    })
})
