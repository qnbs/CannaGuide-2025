// ---------------------------------------------------------------------------
// Native Capabilities Service -- read-only mirror of the Tauri capability set
// for the web frontend.
//
// Reads `get_native_capabilities`, `open_log_dir`, `clear_native_cache` from
// the Rust core (see `apps/desktop/src-tauri/src/lib.rs`). On web/PWA this
// service degrades to a static "all-false" snapshot so call-sites can use
// the same API surface across PWA + Desktop.
//
// Usage:
//   import { getNativeCapabilities, openLogDir, clearNativeCache }
//     from '@/services/nativeCapabilitiesService'
//   const caps = await getNativeCapabilities()
//   if (caps.updater) { ... }
// ---------------------------------------------------------------------------

import { platform } from '@/services/platformService'

export interface NativeCapabilities {
    /** File system plugin active. */
    readonly fs: boolean
    /** Native dialog plugin active (`@tauri-apps/plugin-dialog`). */
    readonly dialog: boolean
    /** Notification plugin active. */
    readonly notification: boolean
    /** Tray icon active. */
    readonly tray: boolean
    /** Global shortcut plugin active. */
    readonly shortcut: boolean
    /** Auto-updater plugin active. */
    readonly updater: boolean
    /** Window-state persistence active. */
    readonly windowState: boolean
    /** Tauri Store plugin active (used by desktop-only settings). */
    readonly store: boolean
    /** Running a debug build. */
    readonly isDev: boolean
    /** macOS aarch64 Universal binary detection (informational). */
    readonly isMacOsUniversal: boolean
    /** Absolute path to the per-user log directory (or null if unknown). */
    readonly logDir: string | null
}

/**
 * Static "no-op" capability snapshot used when the runtime is the PWA
 * or a regular browser. All plugin flags are `false` so call-sites can
 * branch on capabilities without inspecting `platform.isTauri` directly.
 */
const PWA_CAPABILITIES: NativeCapabilities = Object.freeze({
    fs: false,
    dialog: false,
    notification: false,
    tray: false,
    shortcut: false,
    updater: false,
    windowState: false,
    store: false,
    isDev: false,
    isMacOsUniversal: false,
    logDir: null,
})

/** Cached result -- the capability list does not change at runtime. */
let _cached: NativeCapabilities | null = null

interface RawCapabilities {
    fs: boolean
    dialog: boolean
    notification: boolean
    tray: boolean
    shortcut: boolean
    updater: boolean
    window_state: boolean
    store: boolean
    is_dev: boolean
    is_macos_universal: boolean
    log_dir: string | null
}

/**
 * Resolve the active native capability snapshot. Returns the PWA stub when
 * not running inside Tauri. Cached after the first successful call.
 */
export async function getNativeCapabilities(): Promise<NativeCapabilities> {
    if (_cached) return _cached
    if (!platform.isTauri) {
        _cached = PWA_CAPABILITIES
        return _cached
    }
    try {
        const { invoke } = await import('@tauri-apps/api/core')
        const raw = await invoke<RawCapabilities>('get_native_capabilities')
        _cached = Object.freeze({
            fs: raw.fs,
            dialog: raw.dialog,
            notification: raw.notification,
            tray: raw.tray,
            shortcut: raw.shortcut,
            updater: raw.updater,
            windowState: raw.window_state,
            store: raw.store,
            isDev: raw.is_dev,
            isMacOsUniversal: raw.is_macos_universal,
            logDir: raw.log_dir ?? null,
        })
        return _cached
    } catch (err) {
        // IPC failure -- treat as web-grade fallback rather than throwing so
        // UI can still render without the optional capability surfaces.
        console.debug('[nativeCapabilities] IPC failed, falling back to PWA stub:', err)
        _cached = PWA_CAPABILITIES
        return _cached
    }
}

/**
 * Open the per-user log directory in the native file manager.
 * On PWA/web this is a no-op and returns `null`.
 */
export async function openLogDir(): Promise<string | null> {
    if (!platform.isTauri) return null
    try {
        const { invoke } = await import('@tauri-apps/api/core')
        return await invoke<string>('open_log_dir')
    } catch (err) {
        console.debug('[nativeCapabilities] open_log_dir failed:', err)
        return null
    }
}

/**
 * Clear the per-user cache directory. Returns the number of bytes freed.
 * On PWA/web this is a no-op and returns `0`.
 */
export async function clearNativeCache(): Promise<number> {
    if (!platform.isTauri) return 0
    try {
        const { invoke } = await import('@tauri-apps/api/core')
        return await invoke<number>('clear_native_cache')
    } catch (err) {
        console.debug('[nativeCapabilities] clear_native_cache failed:', err)
        return 0
    }
}

/** Internal: reset the capability cache (test-only). */
export function _resetNativeCapabilitiesCache(): void {
    _cached = null
}
