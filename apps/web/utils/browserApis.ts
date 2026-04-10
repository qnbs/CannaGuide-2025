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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const perf = performance as Partial<{ memory: ChromePerformanceMemory }>
    return perf.memory ?? null
}

// ---- Navigator: deviceMemory (Chromium-only) -----------------------------

/**
 * Returns `navigator.deviceMemory` in GB if available, otherwise `null`.
 * Non-standard API -- only present in Chromium-based browsers.
 */
export function getDeviceMemoryGB(): number | null {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

// ---- Mobile Device Detection (Hybrid) ------------------------------------

/**
 * Detect whether the current device is a mobile phone or tablet.
 * Uses a multi-signal approach: User-Agent, touch capability,
 * screen dimensions, and deviceMemory for reliability.
 */
export function isMobileDevice(): boolean {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
    // Signal 1: UA pattern (catches most mobile browsers)
    const mobileUa = /Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini|IEMobile/i.test(
        navigator.userAgent,
    )
    // Signal 2: coarse pointer + touch (excludes desktops with touchscreens)
    const hasCoarsePointer =
        typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
    // Signal 3: narrow viewport (< 1024px) -- typical for phones/tablets in portrait
    const narrowViewport = window.innerWidth < 1024
    // Signal 4: maxTouchPoints > 0 (all mobile devices, most tablets)
    const hasTouchPoints = navigator.maxTouchPoints > 0

    // Require at least 2 signals to classify as mobile
    const score =
        Number(mobileUa) +
        Number(hasCoarsePointer) +
        Number(narrowViewport) +
        Number(hasTouchPoints)
    return score >= 2
}

/**
 * Detect if the device is a high-end tablet (e.g. iPad Pro) that can
 * handle WebGPU workloads despite being a "mobile" device.
 */
export function isHighEndTablet(): boolean {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    const isIpad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    const memoryGB = getDeviceMemoryGB()
    // iPad Pro typically reports 4+ cores and 4+ GB memory
    const highCores = (navigator.hardwareConcurrency ?? 0) >= 4
    const highMemory = memoryGB !== null && memoryGB >= 4
    return isIpad && (highCores || highMemory)
}

/**
 * Returns effective device memory in GB, combining `navigator.deviceMemory`
 * with the JS heap size limit as a secondary signal.
 */
export function getEffectiveDeviceMemoryGB(): number {
    const reported = getDeviceMemoryGB()
    if (reported !== null) return reported

    // Fallback: estimate from JS heap limit (Chrome-only)
    const mem = getPerformanceMemory()
    if (mem) {
        // JS heap is typically 25-50% of total RAM
        return Math.round((mem.jsHeapSizeLimit / (1024 * 1024 * 1024)) * 2.5 * 10) / 10
    }

    // Unknown -- assume conservative 4 GB
    return 4
}

// ---- Storage Quota Check -------------------------------------------------

export interface StorageQuotaResult {
    /** Whether there is enough storage for the required amount. */
    ok: boolean
    /** Available storage in MB (null if API unavailable). */
    availableMB: number | null
    /** Total quota in MB (null if API unavailable). */
    totalMB: number | null
}

/**
 * Check whether sufficient storage is available before starting a model download.
 * Uses the Storage Manager API (`navigator.storage.estimate()`).
 *
 * @param requiredMB - Minimum free storage needed in megabytes.
 */
export async function checkStorageQuota(requiredMB: number): Promise<StorageQuotaResult> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
        // API unavailable -- assume OK to avoid blocking users
        return { ok: true, availableMB: null, totalMB: null }
    }
    try {
        const estimate = await navigator.storage.estimate()
        const totalMB = estimate.quota ? Math.round(estimate.quota / (1024 * 1024)) : null
        const usedMB = estimate.usage ? Math.round(estimate.usage / (1024 * 1024)) : 0
        const availableMB = totalMB !== null ? totalMB - usedMB : null

        return {
            ok: availableMB === null || availableMB >= requiredMB,
            availableMB,
            totalMB,
        }
    } catch {
        return { ok: true, availableMB: null, totalMB: null }
    }
}

// ---- Network Connection Info ---------------------------------------------

export interface ConnectionInfo {
    /** Whether the device uses cellular data (vs wifi/ethernet). */
    isCellular: boolean
    /** Whether a data saver / lite mode is active. */
    saveData: boolean
    /** Effective connection type if available. */
    effectiveType: string | null
}

/**
 * Get network connection information from the Network Information API.
 * Returns conservative defaults when the API is unavailable.
 */
export function getConnectionInfo(): ConnectionInfo {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
        return { isCellular: false, saveData: false, effectiveType: null }
    }

    const conn: unknown = navigator.connection
    if (conn == null || typeof conn !== 'object') {
        return { isCellular: false, saveData: false, effectiveType: null }
    }

    const connType = 'type' in conn ? conn.type : undefined
    const connSaveData = 'saveData' in conn ? conn.saveData : undefined
    const connEffType = 'effectiveType' in conn ? conn.effectiveType : undefined

    const cellularTypes = new Set(['cellular', 'wimax', 'bluetooth'])
    return {
        isCellular: typeof connType === 'string' && cellularTypes.has(connType),
        saveData: connSaveData === true,
        effectiveType: typeof connEffType === 'string' ? connEffType : null,
    }
}
