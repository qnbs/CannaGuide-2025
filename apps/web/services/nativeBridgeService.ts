// ---------------------------------------------------------------------------
// Native Bridge Service -- unified notification dispatch
//
// Detects the runtime platform (Tauri, Capacitor, Browser) and routes
// notifications to the appropriate native API.  All native plugin imports
// are dynamic so the web bundle stays lean -- tree-shaking removes the
// import paths when the native shells are not present.
//
// Platform detection order:
//   1. Tauri v2   -- window.__TAURI_INTERNALS__
//   2. Capacitor  -- window.Capacitor?.isNativePlatform()
//   3. Browser    -- Web Notification API (falls back to no-op)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NativePlatform = 'tauri' | 'capacitor' | 'web'

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
    if (typeof window === 'undefined') return 'web'

    // Tauri v2 injects __TAURI_INTERNALS__ on the window object
    if ('__TAURI_INTERNALS__' in window) return 'tauri'

    // Capacitor injects a global Capacitor object with isNativePlatform()
    const cap = (window as unknown as Record<string, unknown>)['Capacitor'] as
        | { isNativePlatform?: () => boolean }
        | undefined
    if (cap?.isNativePlatform?.()) return 'capacitor'

    return 'web'
}

// ---------------------------------------------------------------------------
// Permission handling
// ---------------------------------------------------------------------------

let permissionGranted = false

/**
 * Request notification permissions for the current platform.
 * Safe to call multiple times -- caches the result after the first grant.
 * Returns true if notifications are allowed.
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (permissionGranted) return true

    const platform = detectPlatform()

    try {
        if (platform === 'tauri') {
            const { isPermissionGranted, requestPermission } =
                await import('@tauri-apps/plugin-notification')
            let granted = await isPermissionGranted()
            if (!granted) {
                const result = await requestPermission()
                granted = result === 'granted'
            }
            permissionGranted = granted
            return granted
        }

        if (platform === 'capacitor') {
            const { LocalNotifications } = await import('@capacitor/local-notifications')
            const { display } = await LocalNotifications.requestPermissions()
            permissionGranted = display === 'granted'
            return permissionGranted
        }

        // Browser fallback
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

/** Auto-incrementing ID for Capacitor local notifications. */
let capacitorNotificationId = 1

/**
 * Send a native notification.  Gracefully degrades to a no-op when
 * permissions are denied or the platform does not support notifications.
 */
export async function sendNotification(options: NativeNotificationOptions): Promise<void> {
    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) return

    const platform = detectPlatform()

    try {
        if (platform === 'tauri') {
            const { sendNotification: tauriNotify } =
                await import('@tauri-apps/plugin-notification')
            tauriNotify({ title: options.title, body: options.body })
            return
        }

        if (platform === 'capacitor') {
            const { LocalNotifications } = await import('@capacitor/local-notifications')
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: options.title,
                        body: options.body,
                        id: capacitorNotificationId++,
                        schedule: { at: new Date() },
                    },
                ],
            })
            return
        }

        // Browser Web Notification API
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notificationOptions: NotificationOptions = { body: options.body }
            if (options.tag !== undefined) {
                notificationOptions.tag = options.tag
            }
            new Notification(options.title, notificationOptions)
        }
    } catch {
        console.debug('[NativeBridge] Notification dispatch failed for platform:', platform)
    }
}

// ---------------------------------------------------------------------------
// Public facade
// ---------------------------------------------------------------------------

export const nativeBridgeService = {
    detectPlatform,
    requestNotificationPermission,
    sendNotification,
}
