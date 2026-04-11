/**
 * Cross-Origin Isolation detection utilities (W-03).
 *
 * SharedArrayBuffer requires cross-origin isolation:
 *   - Cross-Origin-Opener-Policy: same-origin
 *   - Cross-Origin-Embedder-Policy: credentialless (or require-corp)
 *
 * GitHub Pages does not support custom HTTP headers, so SAB is
 * only available on Vercel/Cloudflare Pages deployments.
 * All SAB consumers must feature-detect and fall back gracefully.
 *
 * See ADR-0009 for the architectural decision.
 */

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Check whether the current window is cross-origin isolated.
 * When true, `SharedArrayBuffer` and high-resolution `performance.now()`
 * are available.
 */
export function isCrossOriginIsolated(): boolean {
    return typeof self !== 'undefined' && self.crossOriginIsolated === true
}

/**
 * Check whether `SharedArrayBuffer` is available in the current context.
 * This is a stricter runtime check than `isCrossOriginIsolated()` because
 * some browsers gate SAB behind additional flags.
 */
export function canUseSharedArrayBuffer(): boolean {
    return typeof SharedArrayBuffer !== 'undefined' && isCrossOriginIsolated()
}

/**
 * Feature detection summary for diagnostics and telemetry.
 */
export interface CrossOriginIsolationStatus {
    /** Whether `self.crossOriginIsolated` is true. */
    isolated: boolean
    /** Whether `SharedArrayBuffer` constructor is available. */
    sabAvailable: boolean
    /** Whether `Atomics` namespace is available. */
    atomicsAvailable: boolean
    /** Whether all prerequisites for lock-free worker communication are met. */
    canUseLockFree: boolean
}

/**
 * Return a diagnostic snapshot of cross-origin isolation capabilities.
 * Useful for settings UI, telemetry, and debug panels.
 */
export function getCrossOriginIsolationStatus(): CrossOriginIsolationStatus {
    const isolated = isCrossOriginIsolated()
    const sabAvailable = typeof SharedArrayBuffer !== 'undefined'
    const atomicsAvailable = typeof Atomics !== 'undefined'

    return {
        isolated,
        sabAvailable,
        atomicsAvailable,
        canUseLockFree: isolated && sabAvailable && atomicsAvailable,
    }
}
