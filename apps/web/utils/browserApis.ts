// ---------------------------------------------------------------------------
// Typed helpers for non-standard / Chromium-only browser APIs.
//
// These eliminate `as unknown as` casts at call sites by centralizing the
// unsafe type narrowing in one auditable location.
// ---------------------------------------------------------------------------

// ---- Performance (Chrome-only) -------------------------------------------

interface ChromePerformanceMemory {
    usedJSHeapSize: number
    jsHeapSizeLimit: number
    totalJSHeapSize: number
}

/**
 * Returns Chrome's `performance.memory` if available, otherwise `null`.
 * Non-standard API -- only present in Chromium-based browsers.
 */
export function getPerformanceMemory(): ChromePerformanceMemory | null {
    const perf = performance as Partial<{ memory: ChromePerformanceMemory }>
    return perf.memory ?? null
}

// ---- Navigator: deviceMemory (Chromium-only) -----------------------------

/**
 * Returns `navigator.deviceMemory` in GB if available, otherwise `null`.
 * Non-standard API -- only present in Chromium-based browsers.
 */
export function getDeviceMemoryGB(): number | null {
    const nav = navigator as Partial<{ deviceMemory: number }>
    return nav.deviceMemory ?? null
}

// ---- Navigator: Battery API (deprecated, Chromium-only) ------------------

interface BatteryManager {
    charging: boolean
    level: number
}

/**
 * Returns a BatteryManager via the deprecated Battery Status API.
 * Only available in Chromium. Returns `null` when unsupported.
 */
export async function getBatteryManager(): Promise<BatteryManager | null> {
    try {
        const nav = navigator as Partial<{
            getBattery: () => Promise<BatteryManager>
        }>
        if (!nav.getBattery) return null
        return await nav.getBattery()
    } catch {
        return null
    }
}

// ---- GPUAdapter: info (incomplete upstream typings) ----------------------

interface GpuAdapterInfo {
    vendor?: string | undefined
    architecture?: string | undefined
    device?: string | undefined
    description?: string | undefined
}

/**
 * Reads `GPUAdapter.info` which may not be present in all TS lib versions.
 * Returns a typed info object or `null`.
 */
export function getGpuAdapterInfo(adapter: GPUAdapter): GpuAdapterInfo | null {
    const a = adapter as Partial<{ info: GpuAdapterInfo }>
    return a.info ?? null
}

/**
 * Shorthand: returns the adapter description string or `null`.
 */
export function getGpuAdapterDescription(adapter: GPUAdapter): string | null {
    return getGpuAdapterInfo(adapter)?.description ?? null
}
