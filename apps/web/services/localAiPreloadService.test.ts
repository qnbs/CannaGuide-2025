import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localAiPreloadService, ensurePersistentStorage } from '@/services/localAiPreloadService'

const preloadOfflineAssetsMock = vi.fn()

vi.mock('@/services/localAI', () => ({
    localAiService: {
        preloadOfflineAssets: (...args: unknown[]) => preloadOfflineAssetsMock(...args),
    },
}))

vi.mock('@/services/localAiHealthService', () => ({
    probeGpuVram: vi
        .fn()
        .mockResolvedValue({ vramMB: null, probed: true, adapterDescription: null }),
    isVramInsufficient: vi.fn().mockReturnValue(false),
}))

vi.mock('@/services/localAIModelLoader', () => ({
    setVramInsufficientOverride: vi.fn(),
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
        vi.useFakeTimers()
        preloadOfflineAssetsMock.mockRejectedValue(new Error('download failed'))

        const promise = localAiPreloadService.preloadOfflineModels()

        // Advance past all retry delays
        for (let i = 0; i < 3; i++) {
            await vi.advanceTimersByTimeAsync(5000)
        }

        const status = await promise
        vi.useRealTimers()

        expect(status.state).toBe('error')
        expect(status.details).toBe('download failed')
    })

    describe('ensurePersistentStorage', () => {
        it('returns true when browser grants persistent storage', async () => {
            Object.defineProperty(navigator, 'storage', {
                configurable: true,
                value: {
                    persisted: vi.fn().mockResolvedValue(false),
                    persist: vi.fn().mockResolvedValue(true),
                },
            })
            const result = await ensurePersistentStorage()
            expect(result).toBe(true)
        })

        it('returns true when already persisted', async () => {
            Object.defineProperty(navigator, 'storage', {
                configurable: true,
                value: {
                    persisted: vi.fn().mockResolvedValue(true),
                    persist: vi.fn(),
                },
            })
            const result = await ensurePersistentStorage()
            expect(result).toBe(true)
        })

        it('returns null when storage API is unavailable', async () => {
            Object.defineProperty(navigator, 'storage', {
                configurable: true,
                value: undefined,
            })
            const result = await ensurePersistentStorage()
            expect(result).toBeNull()
        })
    })
})
