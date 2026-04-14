/**
 * WebLLM Model Catalog -- thin wrapper around @cannaguide/ai-core Model Registry
 * providing backward-compatible exports and auto-selection based on GPU tier.
 *
 * Models use MLC quantized format for WebLLM (q4f16_1-MLC).
 * Transformers.js fallback IDs map to Xenova/HuggingFace ONNX variants.
 */

import {
    MODEL_REGISTRY,
    MODEL_REGISTRY_VERSION,
    getRegistryModelById,
    getRegistryModelVersion,
    getModelsForGpuTier,
    getRecommendedModel,
    type ModelRegistryEntry,
    type GpuTierName,
} from '@cannaguide/ai-core'
import type { GpuTier } from '../device/webGpuService'

// ─── Re-exports from Registry ────────────────────────────────────────────────

/** Catalog-level version (delegated to registry). */
export const MODEL_CATALOG_VERSION: string = MODEL_REGISTRY_VERSION

// ─── Backward-compatible WebLlmModel type ────────────────────────────────────

export interface WebLlmModel {
    /** WebLLM model string (MLC format). */
    id: string
    /** Display name for UI. */
    label: string
    /** Semantic version of the model weights (e.g. '2.5.0'). */
    version: string
    /** ISO date when this model entry was last verified (YYYY-MM-DD). */
    releaseDate: string
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

/** Map a registry entry to the backward-compatible WebLlmModel shape. */
const toWebLlmModel = (entry: ModelRegistryEntry): WebLlmModel => ({
    id: entry.id,
    label: entry.label,
    version: entry.version,
    releaseDate: entry.releaseDate,
    sizeBytes: entry.sizeBytes,
    sizeTier: entry.sizeTier,
    minVramMb: entry.minVramMb,
    supportsVision: entry.supportsVision,
    languages: entry.languages,
    recommended: entry.recommended,
    requiresWebGPU: entry.requiresWebGpu,
    description: entry.description,
    transformersFallbackId: entry.fallbackOnnxId,
})

// ─── Model Catalog (derived from registry) ───────────────────────────────────

export const WEB_LLM_MODELS: readonly WebLlmModel[] = MODEL_REGISTRY.filter(
    (m) => !m.deprecated,
).map(toWebLlmModel)

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

/** Return all available models. */
export const getAllModels = (): readonly WebLlmModel[] => WEB_LLM_MODELS

/** Find a model by its WebLLM ID. */
export const getModelById = (id: string): WebLlmModel | undefined =>
    WEB_LLM_MODELS.find((m) => m.id === id)

/** Get the pinned version string for a model ID (returns undefined if not found). */
export const getModelVersion = (id: string): string | undefined => getRegistryModelVersion(id)

/**
 * Automatically select the best model for the given GPU tier.
 *
 * - **high** (>= 6 GB VRAM + shader-f16): Llama 3.2 3B
 * - **mid**  (>= 2 GB VRAM):              Qwen 2.5 1.5B
 * - **low**  (< 2 GB VRAM):               Qwen 2.5 0.5B
 * - **none** (no WebGPU):                  Qwen 2.5 0.5B (WASM)
 */
export const autoSelectModel = (tier: GpuTier): WebLlmModel => {
    const registryTier = tier as GpuTierName
    const entry = getRecommendedModel(registryTier)
    return toWebLlmModel(entry)
}

export { getRegistryModelById, getRegistryModelVersion, getModelsForGpuTier }
