import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
    probeWebGpu,
    getCachedCapabilities,
    isWebGpuUsable,
    getGpuTier,
    getSharedDevice,
    destroySharedDevice,
    resetWebGpuService,
    invalidateWebGpuCache,
} from './localAiWebGpuService'

describe('localAiWebGpuService', () => {
    beforeEach(() => {
        resetWebGpuService()
    })

    afterEach(() => {
        resetWebGpuService()
        vi.restoreAllMocks()
    })

    describe('probeWebGpu', () => {
        it('returns tier=none when navigator.gpu is absent', async () => {
            const result = await probeWebGpu()
            expect(result.apiAvailable).toBe(false)
            expect(result.tier).toBe('none')
            expect(result.adapterAcquired).toBe(false)
        })

        it('caches the result after first probe', async () => {
            const first = await probeWebGpu()
            const second = await probeWebGpu()
            expect(first).toBe(second)
        })

        it('returns apiAvailable=true but adapterAcquired=false when adapter is null', async () => {
            const mockGpu = { requestAdapter: vi.fn().mockResolvedValue(null) }
            Object.defineProperty(navigator, 'gpu', {
                value: mockGpu,
                configurable: true,
                writable: true,
            })

            const result = await probeWebGpu()
            expect(result.apiAvailable).toBe(true)
            expect(result.adapterAcquired).toBe(false)
            expect(result.tier).toBe('none')

            // Cleanup
            Object.defineProperty(navigator, 'gpu', {
                value: undefined,
                configurable: true,
                writable: true,
            })
        })

        it('classifies high tier with sufficient VRAM and shader-f16', async () => {
            const mockAdapter = {
                limits: {
                    maxBufferSize: 8 * 1024 * 1024 * 1024,
                    maxStorageBufferBindingSize: 1024 * 1024 * 1024,
                    maxComputeWorkgroupSizeX: 256,
                },
                features: new Set(['shader-f16', 'bgra8unorm-storage']),
                info: { description: 'NVIDIA RTX 4090', vendor: 'nvidia', architecture: 'ada' },
                requestDevice: vi.fn(),
            }
            const mockGpu = { requestAdapter: vi.fn().mockResolvedValue(mockAdapter) }
            Object.defineProperty(navigator, 'gpu', {
                value: mockGpu,
                configurable: true,
                writable: true,
            })

            const result = await probeWebGpu()
            expect(result.tier).toBe('high')
            expect(result.vramMB).toBe(8192)
            expect(result.features.shaderF16).toBe(true)
            expect(result.vendor).toBe('nvidia')

            Object.defineProperty(navigator, 'gpu', {
                value: undefined,
                configurable: true,
                writable: true,
            })
        })

        it('classifies mid tier with moderate VRAM', async () => {
            const mockAdapter = {
                limits: {
                    maxBufferSize: 4 * 1024 * 1024 * 1024,
                    maxStorageBufferBindingSize: 512 * 1024 * 1024,
                    maxComputeWorkgroupSizeX: 256,
                },
                features: new Set([]),
                info: { description: 'Intel UHD', vendor: 'intel', architecture: 'gen12' },
                requestDevice: vi.fn(),
            }
            const mockGpu = { requestAdapter: vi.fn().mockResolvedValue(mockAdapter) }
            Object.defineProperty(navigator, 'gpu', {
                value: mockGpu,
                configurable: true,
                writable: true,
            })

            const result = await probeWebGpu()
            expect(result.tier).toBe('mid')
            expect(result.vramMB).toBe(4096)

            Object.defineProperty(navigator, 'gpu', {
                value: undefined,
                configurable: true,
                writable: true,
            })
        })

        it('classifies low tier with small VRAM', async () => {
            const mockAdapter = {
                limits: {
                    maxBufferSize: 512 * 1024 * 1024,
                    maxStorageBufferBindingSize: 128 * 1024 * 1024,
                    maxComputeWorkgroupSizeX: 128,
                },
                features: new Set([]),
                info: { description: 'Mali-G52', vendor: 'arm' },
                requestDevice: vi.fn(),
            }
            const mockGpu = { requestAdapter: vi.fn().mockResolvedValue(mockAdapter) }
            Object.defineProperty(navigator, 'gpu', {
                value: mockGpu,
                configurable: true,
                writable: true,
            })

            const result = await probeWebGpu()
            expect(result.tier).toBe('low')

            Object.defineProperty(navigator, 'gpu', {
                value: undefined,
                configurable: true,
                writable: true,
            })
        })
    })

    describe('getCachedCapabilities', () => {
        it('returns null before probe', () => {
            expect(getCachedCapabilities()).toBeNull()
        })

        it('returns capabilities after probe', async () => {
            await probeWebGpu()
            expect(getCachedCapabilities()).not.toBeNull()
        })
    })

    describe('isWebGpuUsable', () => {
        it('returns false before probe', () => {
            expect(isWebGpuUsable()).toBe(false)
        })

        it('returns false when no GPU', async () => {
            await probeWebGpu()
            expect(isWebGpuUsable()).toBe(false)
        })
    })

    describe('getGpuTier', () => {
        it('returns none before probe', () => {
            expect(getGpuTier()).toBe('none')
        })
    })

    describe('invalidateWebGpuCache', () => {
        it('clears cached capabilities', async () => {
            await probeWebGpu()
            expect(getCachedCapabilities()).not.toBeNull()
            invalidateWebGpuCache()
            expect(getCachedCapabilities()).toBeNull()
        })
    })

    describe('destroySharedDevice', () => {
        it('does not throw when no device exists', () => {
            expect(() => destroySharedDevice()).not.toThrow()
        })
    })

    describe('getSharedDevice', () => {
        it('returns null when navigator.gpu is absent', async () => {
            const device = await getSharedDevice()
            expect(device).toBeNull()
        })
    })

    describe('resetWebGpuService', () => {
        it('clears all state', async () => {
            await probeWebGpu()
            resetWebGpuService()
            expect(getCachedCapabilities()).toBeNull()
            expect(getGpuTier()).toBe('none')
        })
    })
})
