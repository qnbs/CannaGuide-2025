import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localAiPreloadService } from '@/services/localAiPreloadService'

const preloadOfflineAssetsMock = vi.fn()

vi.mock('@/services/localAI', () => ({
    localAiService: {
        preloadOfflineAssets: (...args: unknown[]) => preloadOfflineAssetsMock(...args),
    },
}))

describe('localAiPreloadService', () => {
    beforeEach(() => {
        preloadOfflineAssetsMock.mockReset()
        localStorage.clear()
        vi.restoreAllMocks()
        Object.defineProperty(navigator, 'storage', {
            configurable: true,
            value: {
                persist: vi.fn().mockResolvedValue(true),
            },
        })
    })

    afterEach(() => {
        localStorage.clear()
    })

    it('stores a ready preload status after warming the local models', async () => {
        preloadOfflineAssetsMock.mockResolvedValue({
            textModelReady: true,
            visionModelReady: true,
            webLlmReady: false,
            errorCount: 0,
        })

        const status = await localAiPreloadService.preloadOfflineModels()

        expect(preloadOfflineAssetsMock).toHaveBeenCalledTimes(1)
        expect(status.state).toBe('ready')
        expect(status.textModelReady).toBe(true)
        expect(status.visionModelReady).toBe(true)
        expect(status.persistentStorageGranted).toBe(true)
        expect(localAiPreloadService.getStatus().state).toBe('ready')
    })

    it('stores an error status when preload fails', async () => {
        preloadOfflineAssetsMock.mockRejectedValue(new Error('download failed'))

        const status = await localAiPreloadService.preloadOfflineModels()

        expect(status.state).toBe('error')
        expect(status.details).toBe('download failed')
    })
})
