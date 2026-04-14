/**
 * Platform detection bridge for PWA <-> Tauri Desktop code sharing.
 *
 * Usage:
 *   import { platform } from '@/services/platformService'
 *   if (platform.isTauri) { ... native dialog ... }
 *   else { ... web fallback ... }
 */

export interface PlatformInfo {
    /** Running inside a Tauri webview */
    readonly isTauri: boolean
    /** Running as installed PWA (standalone display mode) */
    readonly isPwa: boolean
    /** Running in a regular browser tab */
    readonly isBrowser: boolean
    /** OS platform when in Tauri, otherwise browser UA hint */
    readonly os: 'windows' | 'macos' | 'linux' | 'unknown'
}

function detectOs(): PlatformInfo['os'] {
    // Tauri injects __TAURI_INTERNALS__ which has platform info
    const tauriInternals: unknown =
        '__TAURI_INTERNALS__' in globalThis
            ? (globalThis as Record<string, unknown>)['__TAURI_INTERNALS__']
            : undefined
    if (
        typeof tauriInternals === 'object' &&
        tauriInternals !== null &&
        'platform' in tauriInternals
    ) {
        const p = (tauriInternals as { platform: unknown }).platform
        if (p === 'windows' || p === 'win32') return 'windows'
        if (p === 'darwin' || p === 'macos') return 'macos'
        if (p === 'linux') return 'linux'
    }

    // Fallback to navigator.userAgentData (Chromium) or navigator.platform
    const uaData: unknown = 'userAgentData' in navigator ? navigator.userAgentData : undefined
    const hint =
        typeof uaData === 'object' && uaData !== null && 'platform' in uaData
            ? String((uaData as { platform: unknown }).platform)
            : (navigator.platform ?? '')
    if (/win/i.test(hint)) return 'windows'
    if (/mac/i.test(hint)) return 'macos'
    if (/linux/i.test(hint)) return 'linux'
    return 'unknown'
}

function createPlatformInfo(): PlatformInfo {
    const isTauri = '__TAURI_INTERNALS__' in globalThis
    const isPwa =
        !isTauri &&
        (globalThis.matchMedia?.('(display-mode: standalone)')?.matches === true ||
            ('standalone' in navigator && navigator.standalone === true))

    return Object.freeze({
        isTauri,
        isPwa,
        isBrowser: !isTauri && !isPwa,
        os: detectOs(),
    })
}

/** Singleton platform info -- evaluated once at import time */
export const platform: PlatformInfo = createPlatformInfo()
