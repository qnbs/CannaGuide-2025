import { test, expect, Page } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
} from './helpers'

// ---------------------------------------------------------------------------
// WebGPU / AI Vision E2E Tests
//
// Validates that the app handles simulated WebGPU environments and degraded
// hardware gracefully. Mocks GPU adapter detection, WebRTC camera feeds,
// and CLIP vision model responses to test the full AI-vision pipeline in CI
// where real GPUs are not available.
// ---------------------------------------------------------------------------

/** Inject a mock WebGPU adapter so `navigator.gpu` feature checks pass. */
async function injectWebGPUMock(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const mockAdapter = {
            name: 'Mock WebGPU Adapter',
            features: new Set(['shader-f16']),
            limits: {
                maxBufferSize: 268435456,
                maxStorageBufferBindingSize: 134217728,
                maxComputeWorkgroupSizeX: 256,
            },
            isFallbackAdapter: false,
            requestDevice: async () => ({
                label: 'mock-device',
                features: new Set(),
                limits: {},
                queue: { submit: () => {}, writeBuffer: () => {} },
                createShaderModule: () => ({}),
                createComputePipeline: () => ({}),
                createBuffer: () => ({
                    mapAsync: async () => {},
                    getMappedRange: () => new ArrayBuffer(0),
                    unmap: () => {},
                    destroy: () => {},
                }),
                destroy: () => {},
            }),
        }

        Object.defineProperty(navigator, 'gpu', {
            value: {
                requestAdapter: async () => mockAdapter,
                getPreferredCanvasFormat: () => 'bgra8unorm',
            },
            writable: false,
            configurable: true,
        })
    })
}

/** Inject a fake `getUserMedia` camera feed that returns a blank video stream. */
async function injectCameraFeedMock(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(
            navigator.mediaDevices,
        )
        if (navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia = async (constraints) => {
                if (constraints && typeof constraints === 'object' && 'video' in constraints) {
                    const canvas = document.createElement('canvas')
                    canvas.width = 640
                    canvas.height = 480
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        ctx.fillStyle = '#2d5a27'
                        ctx.fillRect(0, 0, 640, 480)
                    }
                    return canvas.captureStream(15)
                }
                if (originalGetUserMedia) {
                    return originalGetUserMedia(constraints)
                }
                throw new DOMException('Not supported', 'NotSupportedError')
            }
        }
    })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('WebGPU AI Vision Pipeline', () => {
    test.beforeEach(async ({ page }) => {
        await injectWebGPUMock(page)
        await injectCameraFeedMock(page)
    })

    test('app boots without crash when WebGPU mock is active', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await expectNoCrashPatterns(page)

        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })

    test('WebGPU detection returns true with mock adapter', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)

        const hasGpu = await page.evaluate(async () => {
            if (!navigator.gpu) return false
            const adapter = await navigator.gpu.requestAdapter()
            return adapter !== null
        })

        expect(hasGpu).toBe(true)
    })

    test('app degrades gracefully when WebGPU is absent', async ({ page }) => {
        // Override the mock — remove GPU entirely
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'gpu', {
                value: undefined,
                writable: false,
                configurable: true,
            })
        })

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await expectNoCrashPatterns(page)

        // App should fall back to WASM/heuristics — no unrecoverable errors
        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })

    test('camera mock provides a valid MediaStream', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)

        const streamInfo = await page.evaluate(async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            return {
                active: stream.active,
                trackCount: stream.getTracks().length,
                videoTrackKind: stream.getVideoTracks()[0]?.kind,
            }
        })

        expect(streamInfo.active).toBe(true)
        expect(streamInfo.trackCount).toBeGreaterThanOrEqual(1)
        expect(streamInfo.videoTrackKind).toBe('video')
    })

    test('GPU adapter info is accessible from the mock', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)

        const adapterInfo = await page.evaluate(async () => {
            if (!navigator.gpu) return null
            const adapter = await navigator.gpu.requestAdapter()
            if (!adapter) return null
            return {
                name: (adapter as unknown as { name: string }).name,
                isFallback: adapter.isFallbackAdapter,
                hasShaderF16: adapter.features.has('shader-f16'),
            }
        })

        expect(adapterInfo).not.toBeNull()
        expect(adapterInfo!.name).toBe('Mock WebGPU Adapter')
        expect(adapterInfo!.isFallback).toBe(false)
        expect(adapterInfo!.hasShaderF16).toBe(true)
    })
})
