// ---------------------------------------------------------------------------
// Eco-Mode detection — adaptive AI routing for constrained devices
//
// Auto-detects low battery (<25%, not charging) and switches the AI mode to
// 'eco', which restricts inference to the small 0.5B text model + rule-based
// heuristics. This saves battery and prevents OOM.
//
// When battery recovers (>30% or charging), eco mode is automatically
// deactivated and the mode returns to 'hybrid'.
// ---------------------------------------------------------------------------

import { Sentry } from '@/services/sentryService'

/** Battery level below which WebGPU/WebLLM are hard-disabled. */
const CRITICAL_BATTERY_THRESHOLD = 0.15
/** Battery level below which eco mode activates (<25%). */
const ECO_ACTIVATE_THRESHOLD = 0.25
/** Battery level above which eco mode deactivates (>30%, hysteresis). */
const ECO_DEACTIVATE_THRESHOLD = 0.3

/** Session flag to prevent repeated eco mode notification on page loads. */
const ECO_NOTIFIED_KEY = 'cannaguide.ecoModeNotified'
/** Session flag to prevent repeated battery gating notification on page loads. */
const BATTERY_NOTIFIED_KEY = 'cannaguide.batteryGatingNotified'

// ── Module state ──────────────────────────────────────────
let _ecoActive = false
let _ecoAutoActivated = false // Track if eco was auto-activated (vs. manual)
let _criticalBattery = false
let _modeGetter: (() => string) | null = null
let _modeSetter: ((mode: string) => void) | null = null

// ── UI notification callbacks (registered from index.tsx) ──
let _onBatteryGating: ((level: number) => void) | null = null
let _onEcoAutoActivated: (() => void) | null = null
let _onEcoAutoDeactivated: (() => void) | null = null

/** True when eco mode is active — callers can use this to skip heavy models. */
export const isEcoMode = (): boolean => _ecoActive

/**
 * True when battery is critically low (<15%, not charging).
 * In this state, WebGPU/WebLLM must NOT be used at all — route to
 * cloud or heuristic fallback only.
 */
export const isCriticalBattery = (): boolean => _criticalBattery

/**
 * Explicitly set eco mode state (used when the user selects 'eco' manually).
 * Resets the auto-activated flag to prevent auto-deactivation of user choice.
 */
export const setEcoModeExplicit = (active: boolean): void => {
    _ecoActive = active
    _ecoAutoActivated = false // Manual selection -- don't auto-deactivate
}

/**
 * Register getters/setters for the AI mode from aiService.
 * This avoids a circular dependency between aiService <-> preloadService.
 */
export const registerModeAccessors = (
    getter: () => string,
    setter: (mode: string) => void,
): void => {
    _modeGetter = getter
    _modeSetter = setter
}

/**
 * Register callbacks for UI notifications (toast, native push).
 * Called from index.tsx during boot to avoid circular service -> store deps.
 */
export const registerEcoCallbacks = (callbacks: {
    onBatteryGating?: (level: number) => void
    onEcoAutoActivated?: () => void
    onEcoAutoDeactivated?: () => void
}): void => {
    _onBatteryGating = callbacks.onBatteryGating ?? null
    _onEcoAutoActivated = callbacks.onEcoAutoActivated ?? null
    _onEcoAutoDeactivated = callbacks.onEcoAutoDeactivated ?? null
}

/**
 * Detect whether the device is in a resource-constrained state
 * (low battery only) and should auto-switch to eco mode.
 *
 * Note: Mobile detection and low memory were intentionally removed.
 * Eco mode now triggers ONLY on low battery (<25%, not charging).
 *
 * Only triggers for users on 'hybrid' — explicit mode choices are respected.
 */
export const detectEcoCondition = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined') return false
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrowing navigator for non-standard APIs
    const nav = navigator as unknown as {
        getBattery?: () => Promise<{ level: number; charging: boolean }>
    }

    try {
        const battery = await nav.getBattery?.()
        if (battery && !battery.charging && battery.level < ECO_ACTIVATE_THRESHOLD) {
            return true
        }
    } catch {
        // Battery API unavailable — ignore
    }

    return false
}

/**
 * Detect whether the battery has recovered enough to deactivate eco mode.
 * Uses hysteresis (30% threshold) to prevent rapid toggling.
 */
export const detectBatteryRecovered = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined') return false
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrowing navigator for Battery API
    const nav = navigator as unknown as {
        getBattery?: () => Promise<{ level: number; charging: boolean }>
    }

    try {
        const battery = await nav.getBattery?.()
        if (battery) {
            // Battery recovered if charging OR level above deactivate threshold
            if (battery.charging || battery.level >= ECO_DEACTIVATE_THRESHOLD) {
                return true
            }
        }
    } catch {
        // Battery API unavailable — assume recovered to avoid permanent eco lock
        return true
    }

    return false
}

/**
 * Detect critical battery state (<15%, not charging).
 * When critical, WebGPU/WebLLM are hard-disabled regardless of mode.
 */
export const detectCriticalBattery = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined') return false
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrowing navigator for Battery API
        const nav = navigator as unknown as {
            getBattery?: () => Promise<{ level: number; charging: boolean }>
        }
        const battery = await nav.getBattery?.()
        if (battery && !battery.charging && battery.level < CRITICAL_BATTERY_THRESHOLD) {
            return true
        }
    } catch {
        // Battery API unavailable
    }
    return false
}

/**
 * If the current mode is 'hybrid' or 'eco' (auto-activated), probe the device
 * and auto-switch to/from eco mode based on battery state.
 *
 * - Activates eco mode when battery is low (<25%, not charging)
 * - Deactivates eco mode when battery recovers (>30% or charging)
 *
 * Requires `registerModeAccessors()` to have been called.
 * Also detects critical battery and sets the hard-gate flag.
 */
export const applyAdaptiveMode = async (): Promise<void> => {
    // Check critical battery first (applies to all modes)
    const critical = await detectCriticalBattery()
    if (critical !== _criticalBattery) {
        _criticalBattery = critical
        if (critical) {
            console.debug('[AI] Critical battery (<15%) -- WebGPU/WebLLM hard-disabled.')
            Sentry.captureMessage('battery_critical_gating', 'warning')
            // Only show notification once per session to avoid spam
            const alreadyNotified = sessionStorage.getItem(BATTERY_NOTIFIED_KEY) === '1'
            if (!alreadyNotified) {
                sessionStorage.setItem(BATTERY_NOTIFIED_KEY, '1')
                // Resolve battery level for notification
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrowing for Battery API
                    const nav = navigator as unknown as {
                        getBattery?: () => Promise<{ level: number; charging: boolean }>
                    }
                    const battery = await nav.getBattery?.()
                    if (battery) {
                        _onBatteryGating?.(Math.round(battery.level * 100))
                    }
                } catch {
                    _onBatteryGating?.(0)
                }
            }
        } else {
            // Battery no longer critical -- clear flag for potential future notification
            sessionStorage.removeItem(BATTERY_NOTIFIED_KEY)
        }
    }

    const currentMode = _modeGetter?.()

    // Check for eco mode deactivation (battery recovered)
    // Only deactivate if eco was auto-activated, not manually set by user
    if (_ecoAutoActivated && currentMode === 'eco' && (await detectBatteryRecovered())) {
        _ecoActive = false
        _ecoAutoActivated = false
        _modeSetter?.('hybrid')
        console.debug('[AI] Adaptive routing: battery recovered, switching back to hybrid mode.')
        // Clear the notification flag so user can be notified if it happens again
        sessionStorage.removeItem(ECO_NOTIFIED_KEY)
        _onEcoAutoDeactivated?.()
        return
    }

    // Check for eco mode activation (low battery)
    if (currentMode !== 'hybrid') return
    if (await detectEcoCondition()) {
        _ecoActive = true
        _ecoAutoActivated = true
        _modeSetter?.('eco')
        console.debug('[AI] Adaptive routing: auto-switched to eco mode (low battery detected).')
        // Only show notification once per session to avoid spam on page reloads
        const alreadyNotified = sessionStorage.getItem(ECO_NOTIFIED_KEY) === '1'
        if (!alreadyNotified) {
            sessionStorage.setItem(ECO_NOTIFIED_KEY, '1')
            Sentry.captureMessage('eco_mode_auto_activated', 'info')
            _onEcoAutoActivated?.()
        }
    }
}

/**
 * Reset session notification flags and internal state (for testing purposes only).
 * @internal
 */
export const _resetNotificationFlags = (): void => {
    _criticalBattery = false
    _ecoAutoActivated = false
    try {
        sessionStorage.removeItem(ECO_NOTIFIED_KEY)
        sessionStorage.removeItem(BATTERY_NOTIFIED_KEY)
    } catch {
        // sessionStorage unavailable in test environment
    }
}
