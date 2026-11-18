// ---------------------------------------------------------------------------
// Local-Only Mode -- keeps data on this device and the local network
// ---------------------------------------------------------------------------
// The flag behind the setting. Services that leave the app go through the
// egress gate in services/net/egress.ts, which reads it; some older call sites
// still check it directly. When enabled: cloud AI blocked,
// Gist sync blocked, MQTT limited to LAN brokers, cloud TTS skipped, browser
// speech recognition off (the UI reads selectLocalOnlyMode for that), transformers.js
// models from the browser cache only (prepareTransformersLoad). Not every
// path is covered yet; docs/ARCHITECTURE.md ("Local-Only Mode egress gate")
// lists what is not.
// ---------------------------------------------------------------------------

let _localOnlyMode = false

type LocalOnlyModeListener = (enabled: boolean) => void
const listeners = new Set<LocalOnlyModeListener>()

/** Called from the listener middleware when the privacy setting changes. */
export const setLocalOnlyMode = (enabled: boolean): void => {
    const changed = _localOnlyMode !== enabled
    _localOnlyMode = enabled
    if (!changed) return
    for (const listener of listeners) {
        try {
            listener(enabled)
        } catch (error) {
            console.debug('[LocalOnly] change listener failed:', error)
        }
    }
}

/**
 * For work already under way when the mode turns on -- the desktop update download
 * is stopped here, because checking the flag only before a request does not stop
 * one in flight. Called on each change, not for the current value. Returns the
 * unsubscribe.
 */
export const onLocalOnlyModeChange = (listener: LocalOnlyModeListener): (() => void) => {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

/** Returns true when Local-Only Mode is active. */
export const isLocalOnlyMode = (): boolean => _localOnlyMode
