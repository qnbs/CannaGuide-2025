/**
 * Centralized WebGPU Service -- shared adapter/device lifecycle, feature
 * detection, capability reporting, and automatic cleanup on page unload.
 *
 * All WebGPU consumers (WebLLM, ONNX, image generation) should use this
 * service to avoid redundant adapter requests and ensure device cleanup.
 *
 * Capabilities:
 * - Singleton GPU adapter + device caching (probe once, share everywhere)
 * - Feature matrix (shader-f16, timestamp-query, bgra8unorm-storage)
 * - GPU tier classification (high / mid / low / none)
 * - Automatic device.destroy() on pagehide / visibilitychange idle
 * - Telemetry hooks for VRAM and adapter metadata
 * - Battery-aware GPU gating
 */

import { captureLocalAiError } from './sentryService'
import { getBatteryManager, getGpuAdapterInfo } from '@/utils/browserApis'

// --------------------------------------------------------------------------
// WebGPU type shims (lib.dom may lack full WebGPU definitions)
// --------------------------------------------------------------------------

interface WebGpuDevice {
    destroy(): void
    lost: Promise<{ reason: string; message: string }>
}

interface WebGpuAdapter {
    limits: GPUSupportedLimits
    features: ReadonlySet<string>
    info?: { description?: string; vendor?: string; architecture?: string }
    requestDevice(descriptor?: {
        requiredFeatures?: string[]
        requiredLimits?: Record<string, number>
    }): Promise<WebGpuDevice>
}

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type GpuTier = 'high' | 'mid' | 'low' | 'none'

export interface WebGpuFeatures {
    shaderF16: boolean
    timestampQuery: boolean
    bgra8UnormStorage: boolean
    float32Filterable: boolean
    maxBufferSizeMB: number
    maxComputeWorkgroupSizeX: number
}

export interface WebGpuCapabilities {
    /** Whether navigator.gpu is present. */
    apiAvailable: boolean
    /** Whether a GPU adapter was successfully acquired. */
    adapterAcquired: boolean
    /** Adapter vendor/description (if available). */
    adapterDescription: string | null
    /** Adapter vendor string. */
    vendor: string | null
    /** Adapter architecture string. */
    architecture: string | null
    /** Estimated VRAM in MB via maxBufferSize. */
    vramMB: number | null
    /** Detected feature flags. */
    features: WebGpuFeatures
    /** Computed GPU tier. */
    tier: GpuTier
    /** Whether the device is on battery (null if unknown). */
    onBattery: boolean | null
    /** Battery level 0-1 (null if unknown). */
    batteryLevel: number | null
    /** Whether WebGPU should be gated due to low battery. */
    batteryGated: boolean
    /** Probe timestamp. */
    probedAt: number
}

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const ADAPTER_TIMEOUT_MS = 5000
const MIN_VRAM_MID_MB = 2048
const MIN_VRAM_HIGH_MB = 6144
const BATTERY_GATE_LEVEL = 0.15

// --------------------------------------------------------------------------
// Module State
// --------------------------------------------------------------------------

let cachedCapabilities: WebGpuCapabilities | null = null
let sharedDevice: WebGpuDevice | null = null
let deviceDestroyRegistered = false

// --------------------------------------------------------------------------
// Internal Helpers
// --------------------------------------------------------------------------

const probeFeatures = (adapter: GPUAdapter): WebGpuFeatures => {
    const limits = adapter.limits as GPUSupportedLimits
    const featureSet = adapter.features as ReadonlySet<string>

    return {
        shaderF16: featureSet.has('shader-f16'),
        timestampQuery: featureSet.has('timestamp-query'),
        bgra8UnormStorage: featureSet.has('bgra8unorm-storage'),
        float32Filterable: featureSet.has('float32-filterable'),
        maxBufferSizeMB: Math.round((limits.maxBufferSize ?? 0) / (1024 * 1024)),
        maxComputeWorkgroupSizeX: limits.maxComputeWorkgroupSizeX ?? 0,
    }
}

const classifyTier = (vramMB: number | null, features: WebGpuFeatures): GpuTier => {
    if (vramMB === null) return 'low'
    if (vramMB >= MIN_VRAM_HIGH_MB && features.shaderF16) return 'high'
    if (vramMB >= MIN_VRAM_MID_MB) return 'mid'
    return 'low'
}

const probeBattery = async (): Promise<{
    onBattery: boolean | null
    batteryLevel: number | null
}> => {
    const battery = await getBatteryManager()
    if (!battery) return { onBattery: null, batteryLevel: null }
    return {
        onBattery: !battery.charging,
        batteryLevel: battery.level,
    }
}

// --------------------------------------------------------------------------
// Device Lifecycle
// --------------------------------------------------------------------------

const onPageHide = (): void => {
    if (sharedDevice) {
        try {
            sharedDevice.destroy()
        } catch (error) {
            captureLocalAiError(error, { stage: 'webgpu-device-destroy-pagehide' })
        }
        sharedDevice = null
        console.debug('[WebGPU] Device destroyed on pagehide')
    }
}

const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden' && sharedDevice) {
        // Defer destroy by 30s -- if user returns quickly, no re-init needed
        const device = sharedDevice
        const timer = setTimeout(() => {
            if (document.visibilityState === 'hidden' && sharedDevice === device) {
                try {
                    device.destroy()
                } catch (error) {
                    captureLocalAiError(error, { stage: 'webgpu-device-destroy-hidden' })
                }
                sharedDevice = null
                console.debug('[WebGPU] Device destroyed after 30s hidden')
            }
        }, 30_000)
        // If user comes back, cancel the destroy
        const cancel = (): void => {
            clearTimeout(timer)
            document.removeEventListener('visibilitychange', cancel)
        }
        document.addEventListener('visibilitychange', cancel, { once: true })
    }
}

const registerCleanup = (): void => {
    if (deviceDestroyRegistered) return
    deviceDestroyRegistered = true
    if (typeof window !== 'undefined') {
        window.addEventListener('pagehide', onPageHide)
        document.addEventListener('visibilitychange', onVisibilityChange)
    }
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Probe WebGPU capabilities. Caches the result after the first successful
 * probe. Safe to call multiple times -- subsequent calls return from cache.
 */
export const probeWebGpu = async (): Promise<WebGpuCapabilities> => {
    if (cachedCapabilities) return cachedCapabilities

    const noGpu: WebGpuCapabilities = {
        apiAvailable: false,
        adapterAcquired: false,
        adapterDescription: null,
        vendor: null,
        architecture: null,
        vramMB: null,
        features: {
            shaderF16: false,
            timestampQuery: false,
            bgra8UnormStorage: false,
            float32Filterable: false,
            maxBufferSizeMB: 0,
            maxComputeWorkgroupSizeX: 0,
        },
        tier: 'none',
        onBattery: null,
        batteryLevel: null,
        batteryGated: false,
        probedAt: Date.now(),
    }

    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
        cachedCapabilities = noGpu
        return noGpu
    }

    try {
        const gpu = navigator.gpu as GPU
        const adapter = await Promise.race([
            gpu.requestAdapter({ powerPreference: 'high-performance' }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), ADAPTER_TIMEOUT_MS)),
        ])

        if (!adapter) {
            cachedCapabilities = { ...noGpu, apiAvailable: true, probedAt: Date.now() }
            return cachedCapabilities
        }

        const features = probeFeatures(adapter)
        const vramMB = features.maxBufferSizeMB > 0 ? features.maxBufferSizeMB : null
        const tier = classifyTier(vramMB, features)
        const info = getGpuAdapterInfo(adapter)

        const { onBattery, batteryLevel } = await probeBattery()
        const batteryGated =
            onBattery === true && batteryLevel !== null && batteryLevel < BATTERY_GATE_LEVEL

        cachedCapabilities = {
            apiAvailable: true,
            adapterAcquired: true,
            adapterDescription: info?.description ?? null,
            vendor: info?.vendor ?? null,
            architecture: info?.architecture ?? null,
            vramMB,
            features,
            tier,
            onBattery,
            batteryLevel,
            batteryGated,
            probedAt: Date.now(),
        }

        console.debug(
            `[WebGPU] Probe: tier=${tier}, vram=${vramMB ?? '?'}MB, f16=${features.shaderF16}, vendor=${info?.vendor ?? '?'}`,
        )

        return cachedCapabilities
    } catch (error) {
        captureLocalAiError(error, { stage: 'webgpu-probe' })
        cachedCapabilities = { ...noGpu, apiAvailable: true, probedAt: Date.now() }
        return cachedCapabilities
    }
}

/** Synchronous access to cached capabilities (null if not yet probed). */
export const getCachedCapabilities = (): WebGpuCapabilities | null => cachedCapabilities

/** Check if WebGPU is available and not battery-gated. */
export const isWebGpuUsable = (): boolean => {
    if (!cachedCapabilities) return false
    return cachedCapabilities.adapterAcquired && !cachedCapabilities.batteryGated
}

/** Get the GPU tier (requires prior probe). */
export const getGpuTier = (): GpuTier => cachedCapabilities?.tier ?? 'none'

/**
 * Get or create a shared GPUDevice. Registers automatic cleanup on
 * pagehide and deferred cleanup on visibilitychange (30s idle).
 *
 * The shared device should be used for compute shaders and ONNX WebGPU
 * execution. WebLLM manages its own device internally via CreateMLCEngine.
 */
export const getSharedDevice = async (): Promise<WebGpuDevice | null> => {
    if (sharedDevice) return sharedDevice

    if (typeof navigator === 'undefined' || !('gpu' in navigator)) return null

    try {
        const gpu = navigator.gpu as GPU
        const adapter = (await Promise.race([
            gpu.requestAdapter({ powerPreference: 'high-performance' }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), ADAPTER_TIMEOUT_MS)),
        ])) as WebGpuAdapter | null
        if (!adapter) return null

        const requiredFeatures: string[] = []
        if (adapter.features.has('shader-f16')) {
            requiredFeatures.push('shader-f16')
        }

        sharedDevice = await adapter.requestDevice({
            requiredFeatures,
            requiredLimits: {
                maxBufferSize: adapter.limits.maxBufferSize,
                maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
            },
        })

        sharedDevice.lost.then((info) => {
            console.debug(`[WebGPU] Device lost: ${info.reason} - ${info.message}`)
            sharedDevice = null
        })

        registerCleanup()
        console.debug('[WebGPU] Shared device created')
        return sharedDevice
    } catch (error) {
        captureLocalAiError(error, { stage: 'webgpu-device-create' })
        return null
    }
}

/** Explicitly destroy the shared device (e.g. before heavy VRAM consumer). */
export const destroySharedDevice = (): void => {
    if (sharedDevice) {
        try {
            sharedDevice.destroy()
        } catch (error) {
            captureLocalAiError(error, { stage: 'webgpu-device-destroy-explicit' })
        }
        sharedDevice = null
        console.debug('[WebGPU] Shared device destroyed explicitly')
    }
}

/** Invalidate cached capabilities (e.g. after adapter change). */
export const invalidateWebGpuCache = (): void => {
    cachedCapabilities = null
}

/** Reset all state (for tests). */
export const resetWebGpuService = (): void => {
    cachedCapabilities = null
    if (sharedDevice) {
        try {
            sharedDevice.destroy()
        } catch {
            // ignore
        }
        sharedDevice = null
    }
    deviceDestroyRegistered = false
}
