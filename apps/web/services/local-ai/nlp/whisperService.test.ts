import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelDownloadBlockedError } from '@cannaguide/ai-core/ml'
import { setLocalOnlyMode } from '@/services/localOnlyModeService'
import { reportModelDownloadBlocked } from '../models/modelDownloadBlocked'

const transformers = vi.hoisted(() => ({
    pipeline: vi.fn(),
    env: { allowLocalModels: false, allowRemoteModels: true } as Record<string, unknown>,
}))
vi.mock('../models/modelLoader', () => ({
    getTransformersModule: () => Promise.resolve(transformers),
}))
vi.mock('../models/modelDownloadBlocked', () => ({ reportModelDownloadBlocked: vi.fn() }))
vi.mock('../device/gpuResourceManager', () => ({
    acquireGpu: vi.fn(() => Promise.resolve()),
    releaseGpu: vi.fn(),
}))
vi.mock('@/services/sentryService', () => ({ captureLocalAiError: vi.fn() }))

describe('whisperService in Local-Only Mode (GH #700)', () => {
    afterEach(() => {
        setLocalOnlyMode(false)
        vi.unstubAllGlobals()
        transformers.pipeline.mockReset()
    })

    it('does not download the speech model, and says why once', async () => {
        setLocalOnlyMode(true)
        // jsdom has no AudioContext; Whisper needs one to be offered at all.
        vi.stubGlobal('AudioContext', class {})
        const { transcribe, isWhisperAvailable } = await import('./whisperService')
        expect(isWhisperAvailable()).toBe(true)

        await expect(transcribe(new Float32Array([0.1, 0.2]))).rejects.toThrow()

        expect(transformers.pipeline).not.toHaveBeenCalled()
        expect(transformers.env.allowRemoteModels).toBe(false)
        expect(reportModelDownloadBlocked).toHaveBeenCalledWith(
            expect.any(ModelDownloadBlockedError),
        )
    })
})
