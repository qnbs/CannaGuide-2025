// ---------------------------------------------------------------------------
// Eco-Mode detection — adaptive AI routing for constrained devices
//
// Auto-detects low memory (<4 GB) or low battery (<25%, not charging) and
// switches the AI mode to 'eco', which restricts inference to the small
// 0.5B text model + rule-based heuristics. This saves battery and prevents
// OOM on mobile / Capacitor / low-end hardware.
// ---------------------------------------------------------------------------

// ── Module state ──────────────────────────────────────────
let _ecoActive = false
let _modeGetter: (() => string) | null = null
let _modeSetter: ((mode: string) => void) | null = null

/** True when eco mode is active — callers can use this to skip heavy models. */
export const isEcoMode = (): boolean => _ecoActive

/** Explicitly set eco mode state (used when the user selects 'eco' manually). */
export const setEcoModeExplicit = (active: boolean): void => {
    _ecoActive = active
}

/**
 * Register getters/setters for the AI mode from aiService.
 * This avoids a circular dependency between aiService ↔ preloadService.
 */
export const registerModeAccessors = (
    getter: () => string,
    setter: (mode: string) => void,
): void => {
    _modeGetter = getter
    _modeSetter = setter
}

/**
 * Detect whether the device is in a resource-constrained state
 * (low memory or low battery) and should auto-switch to eco mode.
 *
 * Only triggers for users on 'hybrid' — explicit mode choices are respected.
 */
export const detectEcoCondition = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined') return false
    const nav = navigator as unknown as {
        deviceMemory?: number
        getBattery?: () => Promise<{ level: number; charging: boolean }>
    }

    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4

    let lowBattery = false
    try {
        const battery = await nav.getBattery?.()
        if (battery && !battery.charging && battery.level < 0.25) {
            lowBattery = true
        }
    } catch {
        // Battery API unavailable — ignore
    }

    return lowMemory || lowBattery
}

/**
 * If the current mode is 'hybrid', probe the device and auto-switch to 'eco'
 * when constrained. Requires `registerModeAccessors()` to have been called.
 */
export const applyAdaptiveMode = async (): Promise<void> => {
    const currentMode = _modeGetter?.()
    if (currentMode !== 'hybrid') return
    if (await detectEcoCondition()) {
        _ecoActive = true
        _modeSetter?.('eco')
        console.debug('[AI] Adaptive routing: auto-switched to eco mode (low resources detected).')
    }
}
