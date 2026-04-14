/**
 * Model Registry -- canonical source of truth for all local AI models
 * supported by CannaGuide. Consumed by the web app's WebLLM catalog,
 * telemetry service, and cache invalidation logic.
 *
 * Bump MODEL_REGISTRY_VERSION when models are added, removed, or updated.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** GPU tier classification matching webGpuService. */
export type GpuTierName = 'none' | 'low' | 'mid' | 'high'

/** Model parameter size tier. */
export type ModelSizeTier = '0.5B' | '1.5B' | '3B' | '4B' | '8B'

export interface ModelRegistryEntry {
    /** Unique model identifier (WebLLM MLC format or ONNX model ID). */
    id: string
    /** Display name for UI. */
    label: string
    /** Semantic version of the model weights. */
    version: string
    /** ISO date when this entry was last verified (YYYY-MM-DD). */
    releaseDate: string
    /** Approximate download size in bytes. */
    sizeBytes: number
    /** Model parameter tier. */
    sizeTier: ModelSizeTier
    /** Minimum GPU tier required for acceptable performance. */
    gpuTier: GpuTierName
    /** Minimum VRAM in MB for GPU inference (0 = WASM-capable). */
    minVramMb: number
    /** Whether WebGPU is required (false = WASM fallback available). */
    requiresWebGpu: boolean
    /** Whether this model supports vision/image input. */
    supportsVision: boolean
    /** Supported output languages (ISO 639-1). */
    languages: readonly string[]
    /** Recommended default for most users at the given GPU tier. */
    recommended: boolean
    /** Whether this model is deprecated and should not be used for new installs. */
    deprecated: boolean
    /** Short description for the UI. */
    description: string
    /** Transformers.js fallback model ID (null = WebLLM-only, no ONNX variant). */
    fallbackOnnxId: string | null
    /** SHA-256 checksum of model weights (null = not yet verified). */
    checksumSha256: string | null
}

// ── Registry Version ─────────────────────────────────────────────────────────

/** Bump when models are added, removed, updated, or deprecated. */
export const MODEL_REGISTRY_VERSION = '1.1.0'

// ── Model Registry ───────────────────────────────────────────────────────────

export const MODEL_REGISTRY: readonly ModelRegistryEntry[] = [
    {
        id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
        label: 'Qwen 2.5 0.5B',
        version: '2.5.0',
        releaseDate: '2024-09-19',
        sizeBytes: 400_000_000,
        sizeTier: '0.5B',
        gpuTier: 'none',
        minVramMb: 0,
        requiresWebGpu: false,
        supportsVision: false,
        languages: ['en', 'de', 'es', 'fr', 'nl'],
        recommended: false,
        deprecated: false,
        description: 'Ultra-light model for any device. Fast but limited quality.',
        fallbackOnnxId: 'Xenova/Qwen2.5-0.5B-Instruct',
        checksumSha256: null,
    },
    {
        id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
        label: 'Qwen 2.5 1.5B',
        version: '2.5.0',
        releaseDate: '2024-09-19',
        sizeBytes: 1_000_000_000,
        sizeTier: '1.5B',
        gpuTier: 'mid',
        minVramMb: 2048,
        requiresWebGpu: false,
        supportsVision: false,
        languages: ['en', 'de', 'es', 'fr', 'nl'],
        recommended: false,
        deprecated: false,
        description: 'Balanced model for mid-range GPUs. Good multilingual support.',
        fallbackOnnxId: 'Xenova/Qwen2.5-1.5B-Instruct',
        checksumSha256: null,
    },
    {
        id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        label: 'Llama 3.2 3B',
        version: '3.2.0',
        releaseDate: '2024-09-25',
        sizeBytes: 1_800_000_000,
        sizeTier: '3B',
        gpuTier: 'high',
        minVramMb: 4096,
        requiresWebGpu: true,
        supportsVision: false,
        languages: ['en', 'de', 'es', 'fr'],
        recommended: true,
        deprecated: false,
        description: 'High quality reasoning. Best choice for capable GPUs.',
        fallbackOnnxId: null,
        checksumSha256: null,
    },
    {
        id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
        label: 'Phi 3.5 Mini',
        version: '3.5.0',
        releaseDate: '2024-08-20',
        sizeBytes: 2_200_000_000,
        sizeTier: '4B',
        gpuTier: 'high',
        minVramMb: 4096,
        requiresWebGpu: true,
        supportsVision: false,
        languages: ['en', 'de', 'es', 'fr'],
        recommended: false,
        deprecated: false,
        description: 'Strong reasoning and instruction following. Largest option.',
        fallbackOnnxId: null,
        checksumSha256: null,
    },
]

// ── Lookup Helpers ───────────────────────────────────────────────────────────

/** Find a model by its ID (returns undefined if not found). */
export const getRegistryModelById = (id: string): ModelRegistryEntry | undefined =>
    MODEL_REGISTRY.find((m) => m.id === id)

/** Get the pinned version string for a model ID. */
export const getRegistryModelVersion = (id: string): string | undefined =>
    getRegistryModelById(id)?.version

/** Return all non-deprecated models suitable for a given GPU tier. */
export const getModelsForGpuTier = (tier: GpuTierName): readonly ModelRegistryEntry[] => {
    const tierOrder: Record<GpuTierName, number> = { none: 0, low: 1, mid: 2, high: 3 }
    const level = tierOrder[tier]
    return MODEL_REGISTRY.filter((m) => !m.deprecated && tierOrder[m.gpuTier] <= level)
}

/** Auto-select the recommended model for a GPU tier. */
export const getRecommendedModel = (tier: GpuTierName): ModelRegistryEntry => {
    const candidates = getModelsForGpuTier(tier)
    const recommended = candidates.find((m) => m.recommended)
    // Fallback: pick the largest candidate (best quality that fits)
    return recommended ?? candidates[candidates.length - 1] ?? MODEL_REGISTRY[0]!
}
