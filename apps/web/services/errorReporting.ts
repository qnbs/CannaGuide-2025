/**
 * Error reporting that stays on the device.
 *
 * CannaGuide runs no crash-reporting service and sends error reports nowhere. A handled
 * failure of the local AI stack is written to the console at debug level, so it never
 * leaves the device. Development builds show it in the developer tools ("Verbose");
 * production builds drop debug logging altogether (`pure` in vite.config.ts).
 */

/** The step of the local AI stack that failed. */
export type LocalAiErrorStage =
    | 'preload'
    | 'inference'
    | 'vision'
    | 'webllm'
    | 'fallback'
    | 'embedding'
    | 'sentiment'
    | 'summarization'
    | 'classification'
    | 'cache'
    | 'cache-read'
    | 'cache-write'
    | 'cache-clear'
    | 'cache-persist'
    | 'batch'
    | 'similarity-candidate'
    | 'growth-extraction'
    | 'image-generation'
    | 'image-generation-local'
    | 'image-cache-read'
    | 'image-cache-write'
    | 'image-cache-clear'
    | 'gpu-mutex-eviction'
    | 'gpu-mutex-rehydrate'
    | 'gpu-mutex-auto-release'
    | 'webllm-eviction'
    | 'webllm-diagnostics'
    | 'webllm-streaming'
    | 'webgpu-probe'
    | 'webgpu-device-create'
    | 'webgpu-device-destroy-pagehide'
    | 'webgpu-device-destroy-hidden'
    | 'webgpu-device-destroy-explicit'
    | 'hydro-forecast'
    | 'storage-estimate'
    | 'worker-inference-fallthrough'
    | 'preload-embedding'
    | 'preload-nlp'
    | 'preload-storage-check'
    | 'webllm-storage-check'
    | 'response-validation'

/** Optional fields accept an explicit `undefined` (exactOptionalPropertyTypes). */
export interface LocalAiErrorContext {
    model?: string | undefined
    stage: LocalAiErrorStage
    backend?: 'webgpu' | 'wasm' | undefined
    retryAttempt?: number | undefined
    batchItem?: number | undefined
    candidateIndex?: number | undefined
    consumer?: string | undefined
}

/**
 * Records a handled local AI failure in the console, with the stage, model and backend
 * that failed. The caller has already fallen back or recovered; nothing is sent anywhere.
 */
export const captureLocalAiError = (error: unknown, context: LocalAiErrorContext): void => {
    console.debug(`[local-ai] ${context.stage} failed`, context, error)
}
