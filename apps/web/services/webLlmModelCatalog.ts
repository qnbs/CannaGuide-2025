/**
 * WebLLM Model Catalog -- curated list of supported local LLM models
 * with auto-selection based on GPU tier and device capabilities.
 *
 * Models use MLC quantized format for WebLLM (q4f16_1-MLC).
 * Transformers.js fallback IDs map to Xenova/HuggingFace ONNX variants.
 */

import type { GpuTier } from './localAiWebGpuService'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WebLlmModel {
    /** WebLLM model string (MLC format). */
    id: string
    /** Display name for UI. */
    label: string
    /** Approximate download size in bytes. */
    sizeBytes: number
    /** Model parameter tier. */
    sizeTier: '0.5B' | '1.5B' | '3B' | '4B' | '8B'
    /** Minimum VRAM in MB for GPU inference (0 = WASM-capable). */
    minVramMb: number
    /** Whether this model supports vision/image input. */
    supportsVision: boolean
    /** Supported output languages. */
    languages: readonly string[]
    /** Recommended default for most users. */
    recommended: boolean
    /** Whether WebGPU is required (false = WASM fallback available). */
    requiresWebGPU: boolean
    /** Short description for the UI. */
    description: string
    /** Transformers.js fallback model ID (null = WebLLM-only, no ONNX variant). */
    transformersFallbackId: string | null
}

// ─── Model Catalog ───────────────────────────────────────────────────────────

export const WEB_LLM_MODELS: readonly WebLlmModel[] = [
    {
        id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
        label: 'Qwen 2.5 0.5B',
        sizeBytes: 400_000_000,
        sizeTier: '0.5B',
        minVramMb: 0,
        supportsVision: false,
        languages: ['en', 'de', 'es', 'fr', 'nl'],
        recommended: false,
        requiresWebGPU: false,
        description: 'Ultra-light model for any device. Fast but limited quality.',
        transformersFallbackId: 'Xenova/Qwen2.5-0.5B-Instruct',
    },
    {
        id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
        label: 'Qwen 2.5 1.5B',
        sizeBytes: 1_000_000_000,
        sizeTier: '1.5B',
        minVramMb: 2048,
        supportsVision: false,
        languages: ['en', 'de', 'es', 'fr', 'nl'],
        recommended: false,
        requiresWebGPU: false,
        description: 'Balanced model for mid-range GPUs. Good multilingual support.',
        transformersFallbackId: 'Xenova/Qwen2.5-1.5B-Instruct',
    },
    {
        id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        label: 'Llama 3.2 3B',
        sizeBytes: 1_800_000_000,
        sizeTier: '3B',
        minVramMb: 4096,
        supportsVision: false,
        languages: ['en', 'de', 'es', 'fr'],
        recommended: true,
        requiresWebGPU: true,
        description: 'High quality reasoning. Best choice for capable GPUs.',
        transformersFallbackId: null,
    },
    {
        id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
        label: 'Phi 3.5 Mini',
        sizeBytes: 2_200_000_000,
        sizeTier: '4B',
        minVramMb: 4096,
        supportsVision: false,
        languages: ['en', 'de', 'es', 'fr'],
        recommended: false,
        requiresWebGPU: true,
        description: 'Strong reasoning and instruction following. Largest option.',
        transformersFallbackId: null,
    },
] as const

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

/** Return all available models. */
export const getAllModels = (): readonly WebLlmModel[] => WEB_LLM_MODELS

/** Find a model by its WebLLM ID. */
export const getModelById = (id: string): WebLlmModel | undefined =>
    WEB_LLM_MODELS.find((m) => m.id === id)

/**
 * Automatically select the best model for the given GPU tier.
 *
 * - **high** (>= 6 GB VRAM + shader-f16): Llama 3.2 3B
 * - **mid**  (>= 2 GB VRAM):              Qwen 2.5 1.5B
 * - **low**  (< 2 GB VRAM):               Qwen 2.5 0.5B
 * - **none** (no WebGPU):                  Qwen 2.5 0.5B (WASM)
 */
export const autoSelectModel = (tier: GpuTier): WebLlmModel => {
    switch (tier) {
        case 'high':
            // Llama 3.2 3B -- best quality for high-tier GPUs
            return WEB_LLM_MODELS[2]!
        case 'mid':
            // Qwen 2.5 1.5B -- balanced for mid-range
            return WEB_LLM_MODELS[1]!
        case 'low':
        case 'none':
        default:
            // Qwen 2.5 0.5B -- minimal resource usage
            return WEB_LLM_MODELS[0]!
    }
}
