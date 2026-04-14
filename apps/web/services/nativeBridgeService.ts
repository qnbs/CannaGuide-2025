// ---------------------------------------------------------------------------
// Native Bridge Service -- Notification + Microphone permission API
//
// Provides a unified notification + microphone permission API.
// Tauri Desktop: delegates to @tauri-apps/plugin-notification.
// Web/PWA: uses the browser Notification API and getUserMedia.
// ---------------------------------------------------------------------------

import { platform } from '@/services/platformService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NativePlatform = 'tauri' | 'pwa' | 'web'

export interface NativeNotificationOptions {
    title: string
    body: string
    /** Optional grouping tag to coalesce similar notifications. */
    tag?: string | undefined
}

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

export function detectPlatform(): NativePlatform {
    if (platform.isTauri) return 'tauri'
    if (platform.isPwa) return 'pwa'
    return 'web'
}

// ---------------------------------------------------------------------------
// Tauri lazy imports (tree-shaken on web builds)
// ---------------------------------------------------------------------------

async function tauriNotify(
    options: NativeNotificationOptions,
): Promise<void> {
    try {
        const mod = await import('@tauri-apps/plugin-notification')
        await mod.sendNotification({ title: options.title, body: options.body })
    } catch {
        console.debug('[NativeBridge] Tauri notification dispatch failed')
    }
}

async function tauriRequestNotificationPermission(): Promise<boolean> {
    try {
        const mod = await import('@tauri-apps/plugin-notification')
        let perm = await mod.isPermissionGranted()
        if (!perm) {
            const result = await mod.requestPermission()
            perm = result === 'granted'
        }
        return perm
    } catch {
        console.debug('[NativeBridge] Tauri notification permission failed')
        return false
    }
}

// ---------------------------------------------------------------------------
// Permission handling
// ---------------------------------------------------------------------------

let permissionGranted = false

/**
 * Request notification permissions via the Web Notification API or Tauri plugin.
 * Safe to call multiple times -- caches the result after the first grant.
 * Returns true if notifications are allowed.
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (permissionGranted) return true

    // Tauri Desktop path
    if (platform.isTauri) {
        permissionGranted = await tauriRequestNotificationPermission()
        return permissionGranted
    }

    // Web / PWA path
    try {
        if (typeof Notification !== 'undefined') {
            if (Notification.permission === 'granted') {
                permissionGranted = true
                return true
            }
            if (Notification.permission !== 'denied') {
                const result = await Notification.requestPermission()
                permissionGranted = result === 'granted'
                return permissionGranted
            }
        }
    } catch {
        console.debug('[NativeBridge] Permission request failed -- falling back to silent')
    }

    return false
}

// ---------------------------------------------------------------------------
// Notification dispatch
// ---------------------------------------------------------------------------

/**
 * Send a notification.  Delegates to Tauri plugin-notification on desktop,
 * browser Notification API on web/PWA.  Gracefully degrades to a no-op
 * when permissions are denied or the platform does not support notifications.
 */
export async function sendNotification(options: NativeNotificationOptions): Promise<void> {
    // Tauri Desktop path
    if (platform.isTauri) {
        await tauriNotify(options)
        return
    }

    // Web / PWA path
    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) return

    try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notificationOptions: NotificationOptions = { body: options.body }
            if (options.tag !== undefined) {
                notificationOptions.tag = options.tag
            }
            new Notification(options.title, notificationOptions)
        }
    } catch {
        console.debug('[NativeBridge] Notification dispatch failed')
    }
}

// ---------------------------------------------------------------------------
// Microphone permission
// ---------------------------------------------------------------------------

/**
 * Request microphone access via the getUserMedia API.
 * Returns true if microphone access is granted.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
    try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach((t) => t.stop())
            return true
        }
    } catch {
        console.debug('[NativeBridge] Microphone permission request failed')
    }

    return false
}

// ---------------------------------------------------------------------------
// Public facade
// ---------------------------------------------------------------------------

export const nativeBridgeService = {
    detectPlatform,
    requestNotificationPermission,
    requestMicrophonePermission,
    sendNotification,
}
