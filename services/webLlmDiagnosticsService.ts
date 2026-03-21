/**
 * WebLLM Diagnostics Service — Determines exactly why WebLLM is inactive
 * and provides structured diagnostic results for the UI and health reports.
 *
 * Diagnostic cascade:
 *   1. Secure Context check (HTTPS / localhost)
 *   2. WebGPU API availability (navigator.gpu)
 *   3. GPU Adapter acquisition (hardware support)
 *   4. VRAM capacity evaluation (min 4 GB for LLMs)
 *   5. Model profile availability (progressive quantization)
 *   6. Force-WASM override check (user setting)
 */

import { captureLocalAiError } from './sentryService'

// ─── Types ───────────────────────────────────────────────────────────────────

export type WebLlmInactiveReason =
    | 'active'
    | 'insecure-context'
    | 'no-webgpu-api'
    | 'no-gpu-adapter'
    | 'vram-insufficient'
    | 'no-model-profile'
    | 'force-wasm-override'
    | 'browser-unsupported'
    | 'adapter-request-timeout'
    | 'unknown-error'

export interface WebLlmDiagnosticResult {
    /** Whether WebLLM can operate on this device. */
    available: boolean
    /** Specific reason code for inactivity. */
    reason: WebLlmInactiveReason
    /** Human-readable diagnostic message (EN). */
    message: string
    /** Detailed context for debugging. */
    details: {
        secureContext: boolean
        webGpuApiPresent: boolean
        adapterAcquired: boolean
        adapterDescription: string | null
        vramMB: number | null
        vramSufficient: boolean | null
        modelProfileId: string | null
        forceWasm: boolean
        browserInfo: string
    }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_VRAM_FOR_WEBLLM_MB = 4096
const ADAPTER_REQUEST_TIMEOUT_MS = 5000

const resolveSecureContext = (): boolean =>
    typeof globalThis !== 'undefined' && 'isSecureContext' in globalThis
        ? globalThis.isSecureContext
        : typeof location !== 'undefined' &&
          (location.protocol === 'https:' || location.hostname === 'localhost')

const buildProbeErrorResult = (
    error: unknown,
    details: WebLlmDiagnosticResult['details'],
): WebLlmDiagnosticResult => {
    captureLocalAiError(error, { stage: 'webllm-diagnostics' })
    const isTimeout = error instanceof Error && error.message.includes('timeout')
    return {
        available: false,
        reason: isTimeout ? 'adapter-request-timeout' : 'unknown-error',
        message: isTimeout
            ? 'GPU adapter request timed out. The graphics driver may be unresponsive.'
            : `GPU probe failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        details,
    }
}

// ─── Core Diagnostic ─────────────────────────────────────────────────────────

/**
 * Run a comprehensive diagnostic to determine WebLLM availability.
 * Safe to call from any context — gracefully handles all failures.
 */
export const diagnoseWebLlm = async (options?: {
    forceWasm?: boolean
    modelProfileId?: string | null
}): Promise<WebLlmDiagnosticResult> => {
    const details: WebLlmDiagnosticResult['details'] = {
        secureContext: false,
        webGpuApiPresent: false,
        adapterAcquired: false,
        adapterDescription: null,
        vramMB: null,
        vramSufficient: null,
        modelProfileId: options?.modelProfileId ?? null,
        forceWasm: options?.forceWasm ?? false,
        browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    }

    // 1. Force WASM override check
    if (options?.forceWasm) {
        return {
            available: false,
            reason: 'force-wasm-override',
            message: 'WebLLM is disabled because Force WASM mode is active in Settings.',
            details,
        }
    }

    // 2. Secure Context
    const isSecure = resolveSecureContext()
    details.secureContext = isSecure
    if (!isSecure) {
        return {
            available: false,
            reason: 'insecure-context',
            message:
                'WebGPU requires a Secure Context (HTTPS or localhost). The current page is loaded over an insecure connection.',
            details,
        }
    }

    // 3. WebGPU API presence
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
        details.webGpuApiPresent = false
        return {
            available: false,
            reason: 'no-webgpu-api',
            message:
                'This browser does not support WebGPU. WebLLM requires Chrome 113+, Safari 26+, or Firefox 141+.',
            details,
        }
    }
    details.webGpuApiPresent = true

    // 4. GPU Adapter acquisition
    try {
        const gpu = navigator.gpu as GPU
        const adapter = await Promise.race([
            gpu.requestAdapter({ powerPreference: 'high-performance' }),
            new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), ADAPTER_REQUEST_TIMEOUT_MS),
            ),
        ])

        if (!adapter) {
            return {
                available: false,
                reason: 'no-gpu-adapter',
                message:
                    'No compatible GPU adapter found. The GPU may not support Direct3D 12, Metal, or Vulkan 1.0+.',
                details,
            }
        }

        details.adapterAcquired = true
        details.adapterDescription =
            (adapter as unknown as { info?: { description?: string } }).info?.description ?? null

        // 5. VRAM evaluation
        const maxBufferBytes = (adapter.limits as GPUSupportedLimits).maxBufferSize ?? 0
        const vramMB = maxBufferBytes > 0 ? Math.round(maxBufferBytes / (1024 * 1024)) : null
        details.vramMB = vramMB

        if (vramMB !== null) {
            details.vramSufficient = vramMB >= MIN_VRAM_FOR_WEBLLM_MB
            if (!details.vramSufficient) {
                return {
                    available: false,
                    reason: 'vram-insufficient',
                    message: `Insufficient VRAM: ${vramMB}MB detected, ${MIN_VRAM_FOR_WEBLLM_MB}MB required. The browser may be using an integrated GPU instead of the dedicated graphics card.`,
                    details,
                }
            }
        }
    } catch (error) {
        return buildProbeErrorResult(error, details)
    }

    // 6. Model profile check
    if (!options?.modelProfileId) {
        return {
            available: false,
            reason: 'no-model-profile',
            message:
                'No WebLLM model is configured for this device profile. VRAM or device class may be too low for any supported model.',
            details,
        }
    }

    // All checks passed
    return {
        available: true,
        reason: 'active',
        message: `WebLLM is available via WebGPU (${details.adapterDescription ?? 'unknown GPU'}, ${details.vramMB ?? '?'}MB VRAM).`,
        details,
    }
}

/**
 * Get a localization-ready reason key for use with i18n.
 */
export const getDiagnosticI18nKey = (reason: WebLlmInactiveReason): string =>
    `settingsView.localAiDiag.reasons.${reason}`
