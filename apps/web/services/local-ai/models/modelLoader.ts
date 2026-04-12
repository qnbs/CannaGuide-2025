type TransformersModule = typeof import('@xenova/transformers')
import { acquireGpu, releaseGpu } from '../device/gpuResourceManager'
import { getModelById } from './webLlmModelCatalog'
import { isMobileDevice, isHighEndTablet, checkStorageQuota } from '@/utils/browserApis'

export type LocalAiPipeline = (
    input: unknown,
    options?: Record<string, unknown>,
) => Promise<unknown>

/** Detected best ONNX execution provider: webgpu -> wasm. */
export type OnnxBackend = 'webgpu' | 'wasm'

let transformersModulePromise: Promise<TransformersModule> | null = null
let detectedBackend: OnnxBackend | null = null
let forceWasmOverride = false
let vramInsufficientOverride = false

/** Cached pipeline instances keyed by `task::modelId`. */
const pipelineCache = new Map<string, Promise<LocalAiPipeline>>()

/** Allow callers (e.g. settings UI) to force WASM backend for debugging. */
export const setForceWasm = (force: boolean): void => {
    forceWasmOverride = force
    detectedBackend = null // reset so next call re-evaluates
}

/** Read the current forceWasm override state. */
export const getForceWasm = (): boolean => forceWasmOverride

/** Called by VRAM profiler when GPU memory is too low for safe WebGPU usage. */
export const setVramInsufficientOverride = (insufficient: boolean): void => {
    vramInsufficientOverride = insufficient
    detectedBackend = null
}

/** Detect the best available ONNX execution provider. */
export const detectOnnxBackend = (): OnnxBackend => {
    if (forceWasmOverride || vramInsufficientOverride) return 'wasm'
    if (detectedBackend) return detectedBackend
    // Mobile devices default to WASM for stability and battery savings,
    // UNLESS they are a high-end tablet (e.g. iPad Pro) with sufficient GPU
    if (isMobileDevice() && !isHighEndTablet()) {
        detectedBackend = 'wasm'
        return detectedBackend
    }
    detectedBackend = typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm'
    return detectedBackend
}

/** Adaptive concurrency: scale with hardware, capped at 1-5. Mobile uses max 1. */
const getMaxConcurrentLoads = (): number => {
    if (isMobileDevice()) return 1
    const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 2) : 2
    return Math.max(2, Math.min(5, Math.floor(cores * 0.5)))
}

let activeLoads = 0
const loadQueue: Array<() => void> = []

/** Reject pipeline loads when memory pressure is critically high. */
const checkMemoryPressure = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const perf = performance as unknown as {
        memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number }
    }
    if (perf.memory) {
        const usagePercent = (perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100
        // Mobile has tighter memory constraints -- use lower threshold
        const threshold = isMobileDevice() ? 80 : 90
        if (usagePercent > threshold) {
            throw new Error(
                `Memory pressure too high (${usagePercent.toFixed(0)}%) -- aborting model load to prevent OOM.`,
            )
        }
    }
}

const acquireLoadSlot = (): Promise<void> => {
    if (activeLoads < getMaxConcurrentLoads()) {
        activeLoads++
        return Promise.resolve()
    }
    return new Promise<void>((resolve) => loadQueue.push(resolve))
}

const releaseLoadSlot = (): void => {
    activeLoads--
    const next = loadQueue.shift()
    if (next) {
        activeLoads++
        next()
    }
}

const shouldRetryWithWasm = (error: unknown, mergedOptions: Record<string, unknown>): boolean =>
    mergedOptions.device === 'webgpu' &&
    error instanceof Error &&
    /webgpu|context|gpu/i.test(error.message)

const buildPipelineOptions = (
    modelId: string,
    backend: OnnxBackend,
    options: Record<string, unknown>,
): Record<string, unknown> => {
    const mergedOptions: Record<string, unknown> = { ...options }

    // Prefer WebGPU device when available; Transformers.js falls back to WASM automatically
    if (backend === 'webgpu' && !mergedOptions.device) {
        mergedOptions.device = 'webgpu'
    }

    // Add progress callback for download tracking
    if (!mergedOptions.progress_callback) {
        mergedOptions.progress_callback = (progress: {
            status: string
            file?: string
            progress?: number
        }) => {
            if (progress.status === 'progress' && typeof progress.progress === 'number') {
                console.debug(
                    `[LocalAI] ${modelId}: ${progress.file ?? 'model'} ${progress.progress.toFixed(0)}%`,
                )
            }
        }
    }

    return mergedOptions
}

const executePipelineLoad = async (
    pipeline: TransformersModule['pipeline'],
    task: string,
    modelId: string,
    mergedOptions: Record<string, unknown>,
): Promise<LocalAiPipeline> => {
    try {
        return await (pipeline(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            task as never,
            modelId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            mergedOptions as never,
        ) as Promise<LocalAiPipeline>)
    } catch (pipelineError) {
        // If WebGPU context creation failed, retry with WASM backend
        if (shouldRetryWithWasm(pipelineError, mergedOptions)) {
            console.debug(`[LocalAI] WebGPU pipeline failed for ${modelId}, retrying with WASM.`)
            forceWasmOverride = true
            detectedBackend = null
            mergedOptions.device = undefined

            return await (pipeline(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                task as never,
                modelId,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                mergedOptions as never,
            ) as Promise<LocalAiPipeline>)
        }
        throw pipelineError
    }
}

/** Count of currently loaded pipeline instances. */
export const getLoadedPipelineCount = (): number => pipelineCache.size

/** List of pipeline keys currently loaded. */
export const getLoadedPipelineKeys = (): string[] => [...pipelineCache.keys()]

export const getTransformersModule = async (): Promise<TransformersModule> => {
    if (!transformersModulePromise) {
        transformersModulePromise = (async () => {
            const mod = await import('@xenova/transformers')
            // Configure ONNX backend for optimal device utilization
            const backend = detectOnnxBackend()
            if (mod.env?.backends?.onnx?.wasm) {
                mod.env.backends.onnx.wasm.proxy = true
            }
            // Disable local model path to prevent 404 noise on static hosting (e.g. GitHub Pages)
            if (mod.env) {
                mod.env.allowLocalModels = false
            }
            console.debug(`[LocalAI] Transformers.js loaded, preferred backend: ${backend}`)
            return mod
        })()
    }

    return transformersModulePromise
}

/**
 * Factory for creating cached, singleton pipeline loaders with consistent error handling.
 * Eliminates duplicated loader boilerplate across local AI services.
 */
export const createCachedPipelineLoader = (
    task: string,
    modelId: string,
    options: Record<string, unknown> = { quantized: true },
): (() => Promise<LocalAiPipeline>) => {
    let cached: Promise<LocalAiPipeline> | null = null
    return (): Promise<LocalAiPipeline> => {
        if (!cached) {
            cached = loadTransformersPipeline(task, modelId, options).catch((error: unknown) => {
                cached = null
                throw error
            })
        }
        return cached
    }
}

export const loadTransformersPipeline = async (
    task: string,
    modelId: string,
    options: Record<string, unknown>,
): Promise<LocalAiPipeline> => {
    const cacheKey = `${task}::${modelId}`
    const cached = pipelineCache.get(cacheKey)
    if (cached) return cached

    const promise = (async () => {
        checkMemoryPressure()
        // Verify sufficient storage before downloading model files
        const quota = await checkStorageQuota(200) // ~200 MB minimum for ONNX models
        if (!quota.ok) {
            const avail = quota.availableMB !== null ? `${quota.availableMB} MB` : 'unknown'
            throw new Error(
                `Insufficient storage for model download (available: ${avail}, needed: ~200 MB). Free up space and try again.`,
            )
        }
        await acquireLoadSlot()
        const backend = detectOnnxBackend()
        // Acquire GPU mutex when using Weber backend to prevent VRAM collision with WebLLM
        const usingWebGpu = backend === 'webgpu'
        if (usingWebGpu) {
            await acquireGpu('onnx-webgpu')
        }
        try {
            const { pipeline } = await getTransformersModule()
            const mergedOptions = buildPipelineOptions(modelId, backend, options)
            return executePipelineLoad(pipeline, task, modelId, mergedOptions)
        } finally {
            if (usingWebGpu) {
                releaseGpu('onnx-webgpu')
            }
            releaseLoadSlot()
        }
    })()

    // Evict oldest BEFORE inserting — prevents exceeding limit during load
    const memPressure = isMemoryPressureElevated()
    const evictionLimit = memPressure ? 6 : 12
    while (pipelineCache.size >= evictionLimit) {
        const oldest = pipelineCache.keys().next().value
        if (oldest) pipelineCache.delete(oldest)
        else break
    }
    pipelineCache.set(cacheKey, promise)
    // Evict from cache on failure so retry is possible
    promise.catch(() => pipelineCache.delete(cacheKey))
    return promise
}

/** Returns true when JS heap usage exceeds 70 %. */
const isMemoryPressureElevated = (): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const perf = performance as unknown as {
        memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number }
    }
    if (!perf.memory) return false
    return (perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100 > 70
}

/**
 * Evict least-recently-used pipelines when the tab is hidden.
 * Called from a visibility-change listener to free GPU/WASM memory while idle.
 */
export const evictIdlePipelines = (keepCount = 3): void => {
    while (pipelineCache.size > keepCount) {
        const oldest = pipelineCache.keys().next().value
        if (oldest) pipelineCache.delete(oldest)
        else break
    }
    console.debug(`[LocalAI] Evicted idle pipelines, ${pipelineCache.size} remaining.`)
}

/** Reset cached pipelines (useful for tests and forced re-download). */
export const clearPipelineCache = (): void => {
    pipelineCache.clear()
}

// ─── Progressive Quantization & Model-Switching ──────────────────────────────

/** Quantization level controlling download size and inference cost. */
export type QuantizationLevel = 'q4f16' | 'q4' | 'none'

/** Model size tier — determines base model selection. */
export type ModelSizeTier = '1.5B' | '0.5B'

/** Resolved model profile based on device capabilities and VRAM. */
export interface ModelProfile {
    /** Selected quantization level. */
    quantLevel: QuantizationLevel
    /** Model size tier. */
    sizeTier: ModelSizeTier
    /** Resolved Transformers.js model ID. */
    transformersModelId: string
    /** Resolved WebLLM model ID (null if not recommended for this tier). */
    webLlmModelId: string | null
    /** Whether to pass `quantized: true` to the Transformers.js pipeline. */
    useQuantized: boolean
    /** Human-readable reason for this selection. */
    reason: string
    /** Estimated download + inference savings vs full 1.5B model (0–100). */
    estimatedSavingsPercent: number
}

/** Transformers.js model IDs by size tier. */
const TRANSFORMERS_MODELS: Record<ModelSizeTier, string> = {
    '1.5B': 'Xenova/Qwen2.5-1.5B-Instruct',
    '0.5B': 'Xenova/Qwen2.5-0.5B-Instruct',
}

/** WebLLM model IDs by size tier (q4f16 quantization). */
const WEBLLM_MODELS: Record<ModelSizeTier, string> = {
    '1.5B': 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    '0.5B': 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
}

/** VRAM threshold in MB for the q4f16 / 1.5B premium tier. */
const VRAM_THRESHOLD_Q4F16_MB = 6144

/** System RAM threshold in GB for the premium tier. */
const RAM_THRESHOLD_HIGH_GB = 8

/** Manual quantization override (null = auto-detect). */
let quantOverride: QuantizationLevel | null = null

/** Manual model size tier override (null = auto-detect). */
let sizeOverride: ModelSizeTier | null = null

/** Manual model ID override from catalog selection (null = auto-detect). */
let modelIdOverride: string | null = null

/** Cached resolved profile — invalidated on override or VRAM changes. */
let cachedProfile: ModelProfile | null = null

/**
 * Set manual quantization level override.
 * Pass `null` to return to automatic VRAM-based detection.
 */
export const setModelQuant = (level: QuantizationLevel | null): void => {
    quantOverride = level
    cachedProfile = null
    console.debug(`[LocalAI] Quantization override set to: ${level ?? 'auto'}`)
}

/** Get the current quantization override (null = auto). */
export const getModelQuantOverride = (): QuantizationLevel | null => quantOverride

/**
 * Set manual model size tier override.
 * Pass `null` to return to automatic detection.
 */
export const setModelSizeTier = (tier: ModelSizeTier | null): void => {
    sizeOverride = tier
    cachedProfile = null
    console.debug(`[LocalAI] Model size override set to: ${tier ?? 'auto'}`)
}

/** Get the current model size tier override (null = auto). */
export const getModelSizeTierOverride = (): ModelSizeTier | null => sizeOverride

/**
 * Set a preferred model ID override from the catalog.
 * When set, `resolveModelProfile()` uses this model's metadata instead of
 * VRAM-based auto-detection. Pass `null` to return to auto mode.
 */
export const setPreferredModelOverride = (modelId: string | null): void => {
    modelIdOverride = modelId
    cachedProfile = null
    console.debug(`[LocalAI] Model ID override set to: ${modelId ?? 'auto'}`)
}

/** Get the current model ID override (null = auto). */
export const getPreferredModelOverride = (): string | null => modelIdOverride

/**
 * Resolve the optimal model profile based on device capabilities and VRAM.
 *
 * **Strategy (Progressive Quantization):**
 * - **Premium tier** — WebGPU + high VRAM (≥ 6 GB) + ≥ 8 GB RAM:
 *   q4f16 with 1.5B model (full WebLLM + Transformers.js).
 * - **Standard tier** — everything else:
 *   q4 with 0.5B model only, saving ~70 % download and inference time.
 *   WebLLM uses the lightweight 0.5B variant if WebGPU is available;
 *   otherwise falls back to WASM-only Transformers.js.
 *
 * @param vramMB - GPU VRAM in MB (pass from `probeGpuVram()` or `null` if unknown).
 */
export const resolveModelProfile = (vramMB: number | null = null): ModelProfile => {
    if (cachedProfile) return cachedProfile

    const backend = detectOnnxBackend()
    const hasWebGpu = backend === 'webgpu'
    const memoryGB =
        typeof navigator !== 'undefined'
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
              ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 0)
            : 0

    // ── Catalog model ID override ──────────────────────────────────────
    if (modelIdOverride !== null) {
        const catalogModel = getModelById(modelIdOverride)
        if (catalogModel) {
            const sTier: ModelSizeTier =
                catalogModel.sizeTier === '0.5B' || catalogModel.sizeTier === '1.5B'
                    ? catalogModel.sizeTier
                    : '0.5B'
            const fallbackTransformersId =
                catalogModel.transformersFallbackId ?? TRANSFORMERS_MODELS['0.5B']
            cachedProfile = {
                quantLevel: 'q4f16',
                sizeTier: sTier,
                transformersModelId: fallbackTransformersId,
                webLlmModelId: hasWebGpu ? catalogModel.id : null,
                useQuantized: true,
                reason: `Catalog override: ${catalogModel.label} (${catalogModel.sizeTier}).`,
                estimatedSavingsPercent: catalogModel.sizeTier === '0.5B' ? 70 : 40,
            }
            return cachedProfile
        }
        // Invalid model ID -- fall through to auto-detection
        console.debug(`[LocalAI] Unknown catalog model ID: ${modelIdOverride}, using auto.`)
    }

    // ── Manual overrides ─────────────────────────────────────────────────
    if (quantOverride !== null || sizeOverride !== null) {
        const qLevel = quantOverride ?? 'q4'
        const sTier = sizeOverride ?? '0.5B'
        cachedProfile = buildProfile(qLevel, sTier, 'Manual override applied.')
        return cachedProfile
    }

    // ── Premium tier: WebGPU + high VRAM + 8 GB+ RAM ────────────────────
    if (
        hasWebGpu &&
        vramMB !== null &&
        vramMB >= VRAM_THRESHOLD_Q4F16_MB &&
        memoryGB >= RAM_THRESHOLD_HIGH_GB
    ) {
        cachedProfile = buildProfile(
            'q4f16',
            '1.5B',
            `WebGPU + high VRAM (${vramMB} MB) + ${memoryGB} GB RAM -> q4f16 1.5B premium tier.`,
        )
        return cachedProfile
    }

    // ── Standard tier: everything else — 0.5B q4 ────────────────────────
    const reasonParts: string[] = []
    if (!hasWebGpu) reasonParts.push('no WebGPU')
    else if (vramMB !== null && vramMB < VRAM_THRESHOLD_Q4F16_MB)
        reasonParts.push(`VRAM ${vramMB} MB < ${VRAM_THRESHOLD_Q4F16_MB} MB`)
    if (memoryGB < RAM_THRESHOLD_HIGH_GB && memoryGB > 0)
        reasonParts.push(`RAM ${memoryGB} GB < ${RAM_THRESHOLD_HIGH_GB} GB`)
    if (reasonParts.length === 0) reasonParts.push('device capabilities unknown')

    cachedProfile = buildProfile(
        'q4',
        '0.5B',
        `${reasonParts.join(', ')} -> 0.5B q4 standard tier (~70 % savings).`,
    )
    return cachedProfile
}

/** Build a concrete ModelProfile from the given parameters. */
const buildProfile = (
    quantLevel: QuantizationLevel,
    sizeTier: ModelSizeTier,
    reason: string,
): ModelProfile => {
    const backend = detectOnnxBackend()
    const hasWebGpu = backend === 'webgpu'

    // WebLLM is only useful with WebGPU
    let webLlmModelId: string | null = null
    if (hasWebGpu) {
        webLlmModelId = quantLevel === 'q4f16' ? WEBLLM_MODELS[sizeTier] : WEBLLM_MODELS['0.5B']
    }

    let estimatedSavingsPercent = 0
    if (sizeTier === '0.5B') {
        estimatedSavingsPercent = 70
    } else if (quantLevel === 'q4f16') {
        estimatedSavingsPercent = 40
    }

    return {
        quantLevel,
        sizeTier,
        transformersModelId: TRANSFORMERS_MODELS[sizeTier],
        webLlmModelId,
        useQuantized: quantLevel !== 'none',
        reason,
        estimatedSavingsPercent,
    }
}

/** Get the currently resolved model profile (resolves with defaults if not yet resolved). */
export const getResolvedProfile = (): ModelProfile => cachedProfile ?? resolveModelProfile()

/** Invalidate the cached profile (e.g. after VRAM probe completes). */
export const invalidateModelProfile = (): void => {
    cachedProfile = null
}

/** Reset all quantization state (useful for tests). */
export const resetQuantizationState = (): void => {
    cachedProfile = null
    quantOverride = null
    sizeOverride = null
    modelIdOverride = null
}
