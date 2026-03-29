/**
 * Image Generation Service — Client-side text-to-image generation using
 * SD-Turbo via Transformers.js and ONNX Runtime Web with WebGPU acceleration.
 *
 * Architecture:
 *   1. CLIP Text Encoder: Converts strain-derived prompt into embedding
 *   2. U-Net Latent Denoiser: Single-step adversarial diffusion (SD-Turbo)
 *   3. VAE Pixel Decoder: Decodes latent space to 512×512 image
 *
 * Execution:
 *   - Offloaded to a dedicated Web Worker (imageGeneration.worker.ts)
 *   - Falls back to main-thread if Worker unavailable
 *   - Results cached in IndexedDB (imageGenerationCacheService)
 *   - WebGPU preferred, WASM fallback automatic
 */

import type { Strain } from '@/types'
import type { ImageStyle } from '@/types/aiProvider'
import type { ImageGenPayload, ImageGenProgressMessage } from '@/workers/imageGeneration.worker'
import { secureRandom } from '@/utils/random'
import { captureLocalAiError } from './sentryService'
import { detectOnnxBackend } from './localAIModelLoader'
import {
    classifyDevice,
    type DeviceClass,
    isVramInsufficient,
    getCachedVramInfo,
} from './localAiHealthService'
import { getCachedGeneratedImage, setCachedGeneratedImage } from './imageGenerationCacheService'
import { acquireGpu, releaseGpu, getGpuLockState } from './gpuResourceManager'
import { workerBus } from '@/services/workerBus'
import { getT } from '@/i18n'

// ─── Constants ───────────────────────────────────────────────────────────────

/** SD-Turbo ONNX model for single-step diffusion. */
const SD_TURBO_MODEL_ID = 'schmuell/sd-turbo-onnx-web'

/** Number of denoising steps (SD-Turbo is optimized for 1-step). */
const DEFAULT_NUM_STEPS = 1

/** Output image resolution. */
const IMAGE_WIDTH = 512
const IMAGE_HEIGHT = 512

/** Timeout for one generation attempt. */
const GENERATION_TIMEOUT_MS = 120_000

/** Maximum concurrent generation tasks. */
const MAX_CONCURRENT = 1

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImageGenerationRequest {
    /** Unique request ID. */
    id: string
    /** The strain to generate an image for. */
    strain: Strain
    /** Visual style. */
    style: ImageStyle
    /** User criteria. */
    criteria: { focus: string; composition: string; mood: string }
    /** Language for prompt construction. */
    lang: 'en' | 'de'
    /** Optional number of denoising steps (1-4). */
    numSteps?: number
    /** Optional guidance scale (default: 1.0 for SD-Turbo). */
    guidanceScale?: number
    /** Optional seed for reproducibility. */
    seed?: number
}

export interface ImageGenerationResult {
    /** Base64-encoded data URL (image/png). */
    dataUrl: string
    /** Generation latency in ms. */
    latencyMs: number
    /** Model used. */
    modelId: string
    /** Backend used (webgpu or wasm). */
    backend: string
    /** Prompt that was used. */
    prompt: string
    /** Width of generated image. */
    width: number
    /** Height of generated image. */
    height: number
}

export interface ImageGenerationProgress {
    /** Phase: 'loading' | 'encoding' | 'denoising' | 'decoding' | 'complete'. */
    phase: 'loading' | 'encoding' | 'denoising' | 'decoding' | 'complete'
    /** Progress within the phase (0-100). */
    percent: number
    /** Elapsed time in ms. */
    elapsedMs: number
}

// ─── State ───────────────────────────────────────────────────────────────────

const WORKER_NAME = 'imageGeneration'
let activeCount = 0

// ─── Prompt Engineering ──────────────────────────────────────────────────────

const STYLE_PROMPTS: Record<Exclude<ImageStyle, 'random'>, string> = {
    botanical:
        'botanical illustration, scientific accuracy, detailed trichomes, natural lighting, white background',
    fantasy: 'fantasy art style, magical glowing, ethereal atmosphere, enchanted forest background',
    psychedelic:
        'psychedelic art, vibrant neon colors, fractal patterns, surreal composition, kaleidoscopic',
    macro: 'macro photography, extreme close-up, visible trichomes and pistils, shallow depth of field, crystal clear',
    cyberpunk:
        'cyberpunk aesthetic, neon-lit grow room, holographic overlays, futuristic technology, dark atmosphere',
}

const FOCUS_PROMPTS: Record<string, string> = {
    buds: 'dense cannabis buds, thick resinous flowers, prominent calyxes',
    plant: 'full cannabis plant, healthy foliage, visible branching structure',
    abstract: 'abstract artistic interpretation of cannabis, flowing organic shapes',
}

const COMPOSITION_PROMPTS: Record<string, string> = {
    symmetrical: 'centered symmetrical composition, balanced framing',
    dynamic: 'dynamic diagonal composition, dramatic angles',
    minimalist: 'minimalist composition, clean negative space, simple elegant',
}

const MOOD_PROMPTS: Record<string, string> = {
    mystical: 'mystical atmosphere, soft ethereal glow, dreamy lighting',
    energetic: 'energetic vibrant scene, bold contrast, dynamic lighting',
    calm: 'calm serene atmosphere, warm golden hour lighting, peaceful',
}

/** Build a diffusion prompt from strain data and user preferences. */
export const buildImagePrompt = (
    strain: Strain,
    style: ImageStyle,
    criteria: { focus: string; composition: string; mood: string },
): string => {
    const styles = ['botanical', 'fantasy', 'psychedelic', 'macro', 'cyberpunk'] as const
    const resolvedStyle: Exclude<ImageStyle, 'random'> =
        style === 'random'
            ? (styles[Math.floor(secureRandom() * styles.length)] ?? 'botanical')
            : style

    let strainType: 'sativa' | 'indica' | 'hybrid' = 'hybrid'
    if (strain.type === 'Sativa') {
        strainType = 'sativa'
    } else if (strain.type === 'Indica') {
        strainType = 'indica'
    }
    const aromaHints = strain.aromas?.slice(0, 3).join(', ') ?? ''
    const terpeneHints = strain.dominantTerpenes?.slice(0, 2).join(', ') ?? ''

    const parts = [
        `Cannabis ${strainType} strain "${strain.name}"`,
        FOCUS_PROMPTS[criteria.focus] ?? FOCUS_PROMPTS.buds,
        STYLE_PROMPTS[resolvedStyle],
        COMPOSITION_PROMPTS[criteria.composition] ?? COMPOSITION_PROMPTS.dynamic,
        MOOD_PROMPTS[criteria.mood] ?? MOOD_PROMPTS.mystical,
        'photorealistic, high detail, 8K quality',
    ]

    if (aromaHints) parts.push(`hints of ${aromaHints} aroma`)
    if (terpeneHints) parts.push(`dominant ${terpeneHints} terpene profile`)
    if (strain.thc >= 25) parts.push('extremely frosty, heavy trichome coverage')
    else if (strain.thc >= 18) parts.push('generous trichome coverage')

    return parts.join(', ')
}

// ─── Device Capability Check ─────────────────────────────────────────────────

export interface ImageGenCapability {
    supported: boolean
    reason: string
    backend: 'webgpu' | 'wasm'
    deviceClass: DeviceClass
    estimatedLatencyMs: number
}

/** Check if the current device supports image generation. */
export const checkImageGenCapability = (): ImageGenCapability => {
    const backend = detectOnnxBackend()
    const deviceClass = classifyDevice()

    if (backend !== 'webgpu') {
        return {
            supported: false,
            reason: getT()('common.imageGenCapability.webgpuRequired', {
                defaultValue:
                    'WebGPU is required for image generation. This device only supports WASM.',
            }),
            backend,
            deviceClass,
            estimatedLatencyMs: -1,
        }
    }

    if (deviceClass === 'low-end') {
        return {
            supported: false,
            reason: getT()('common.imageGenCapability.deviceInsufficient', {
                defaultValue: 'Device capabilities are insufficient for image generation.',
            }),
            backend,
            deviceClass,
            estimatedLatencyMs: -1,
        }
    }

    // Check VRAM threshold (4 GB minimum for SD-Turbo)
    if (isVramInsufficient()) {
        const vram = getCachedVramInfo()
        return {
            supported: false,
            reason: getT()('common.imageGenCapability.insufficientVram', {
                defaultValue:
                    'Insufficient VRAM ({{vram}}MB). At least 4096MB required for image generation.',
                vram: String(vram?.vramMB ?? '?'),
            }),
            backend,
            deviceClass,
            estimatedLatencyMs: -1,
        }
    }

    const estimatedLatencyMs = deviceClass === 'high-end' ? 2_000 : 8_000

    return {
        supported: true,
        reason: `Image generation available via ${backend} (${deviceClass}).`,
        backend,
        deviceClass,
        estimatedLatencyMs,
    }
}

// ─── Worker Registration ─────────────────────────────────────────────────────

const ensureWorker = (): Worker => {
    if (!workerBus.has(WORKER_NAME)) {
        workerBus.register(
            WORKER_NAME,
            new Worker(new URL('../workers/imageGeneration.worker.ts', import.meta.url), {
                type: 'module',
            }),
        )
    }
    return workerBus.getWorker(WORKER_NAME)
}

/** Terminate the image generation worker to free GPU/WASM resources. */
export const terminateImageGenWorker = (): void => {
    if (workerBus.has(WORKER_NAME)) {
        workerBus.unregister(WORKER_NAME)
    }
}

// ─── Core Generation Function ────────────────────────────────────────────────

/**
 * Generate a strain image using client-side SD-Turbo diffusion.
 *
 * Flow:
 *   1. Build prompt from strain data + style + criteria
 *   2. Check IndexedDB cache for existing result
 *   3. Dispatch to Web Worker (or main-thread fallback)
 *   4. Cache result in IndexedDB
 *   5. Return base64 data URL
 */
export const generateStrainImageLocal = async (
    request: ImageGenerationRequest,
    onProgress?: (progress: ImageGenerationProgress) => void,
): Promise<ImageGenerationResult> => {
    const prompt = buildImagePrompt(request.strain, request.style, request.criteria)

    // Check cache first
    const cached = await getCachedGeneratedImage(prompt)
    if (cached) {
        return {
            dataUrl: cached.dataUrl,
            latencyMs: 0,
            modelId: SD_TURBO_MODEL_ID,
            backend: 'cache',
            prompt,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
        }
    }

    // Check capability
    const capability = checkImageGenCapability()
    if (!capability.supported) {
        throw new Error(capability.reason)
    }

    if (activeCount >= MAX_CONCURRENT) {
        throw new Error(
            getT()('common.imageGenCapability.alreadyInProgress', {
                defaultValue:
                    'Image generation already in progress. Please wait for the current task.',
            }),
        )
    }

    // Check if GPU is already locked by another consumer
    const lockState = getGpuLockState()
    if (lockState.locked && lockState.holder !== 'image-gen') {
        onProgress?.({ phase: 'loading', percent: 0, elapsedMs: 0 })
    }

    // Acquire exclusive GPU access (may evict WebLLM)
    await acquireGpu('image-gen')

    activeCount++
    const startTime = performance.now()

    try {
        const payload: ImageGenPayload = {
            prompt,
            numSteps: Math.min(Math.max(request.numSteps ?? DEFAULT_NUM_STEPS, 1), 4),
            guidanceScale: request.guidanceScale ?? 1.0,
            seed: request.seed ?? null,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            modelId: SD_TURBO_MODEL_ID,
        }

        const workerResult = await executeInWorker(payload, onProgress)
        const latencyMs = Math.round(performance.now() - startTime)

        const result: ImageGenerationResult = {
            dataUrl: workerResult.dataUrl,
            latencyMs,
            modelId: SD_TURBO_MODEL_ID,
            backend: detectOnnxBackend(),
            prompt,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
        }

        // Cache result asynchronously
        setCachedGeneratedImage(prompt, workerResult.dataUrl).catch((e) =>
            captureLocalAiError(e, { model: SD_TURBO_MODEL_ID, stage: 'cache-write' }),
        )

        return result
    } catch (error) {
        captureLocalAiError(error, {
            model: SD_TURBO_MODEL_ID,
            stage: 'image-generation',
        })
        throw error
    } finally {
        activeCount--
        releaseGpu('image-gen')
    }
}

/** Execute generation via WorkerBus with progress listener on the raw worker. */
const executeInWorker = async (
    payload: ImageGenPayload,
    onProgress?: (progress: ImageGenerationProgress) => void,
): Promise<{ dataUrl: string; latencyMs: number; backend: string }> => {
    const w = ensureWorker()

    // Listen for progress messages (no messageId — bypasses WorkerBus)
    const progressHandler = (event: MessageEvent<ImageGenProgressMessage>) => {
        const msg = event.data
        if (msg && 'progress' in msg && msg.progress) {
            onProgress?.(msg.progress)
        }
    }
    w.addEventListener('message', progressHandler)

    try {
        const result = await workerBus.dispatch<{
            dataUrl: string
            latencyMs: number
            backend: string
        }>(WORKER_NAME, 'GENERATE', payload, GENERATION_TIMEOUT_MS)
        return result
    } finally {
        w.removeEventListener('message', progressHandler)
    }
}
