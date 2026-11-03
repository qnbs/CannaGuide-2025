// ---------------------------------------------------------------------------
// Local-Only Mode -- keeps data on this device and the local network
// ---------------------------------------------------------------------------
// The flag behind the setting. Services that leave the app go through the
// egress gate in services/net/egress.ts, which reads it; some older call sites
// still check it directly. When enabled: Sentry disabled, cloud AI blocked,
// Gist sync blocked, MQTT limited to LAN brokers, cloud TTS skipped. Not every
// path is covered yet; docs/ARCHITECTURE.md ("Local-Only Mode egress gate")
// lists what is not.
// ---------------------------------------------------------------------------

let _localOnlyMode = false

/** Called from the listener middleware when the privacy setting changes. */
export const setLocalOnlyMode = (enabled: boolean): void => {
    _localOnlyMode = enabled
}

/** Returns true when Local-Only Mode is active. */
export const isLocalOnlyMode = (): boolean => _localOnlyMode
