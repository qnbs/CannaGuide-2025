// ---------------------------------------------------------------------------
// Native Bridge Service -- Web Notification API dispatch
//
// Provides a unified notification + microphone permission API.
// Web-only: uses the browser Notification API and getUserMedia.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NativePlatform = 'web'

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
    return 'web'
}

// ---------------------------------------------------------------------------
// Permission handling
// ---------------------------------------------------------------------------

let permissionGranted = false

/**
 * Request notification permissions via the Web Notification API.
 * Safe to call multiple times -- caches the result after the first grant.
 * Returns true if notifications are allowed.
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (permissionGranted) return true

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
 * Send a browser notification.  Gracefully degrades to a no-op when
 * permissions are denied or the browser does not support notifications.
 */
export async function sendNotification(options: NativeNotificationOptions): Promise<void> {
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
