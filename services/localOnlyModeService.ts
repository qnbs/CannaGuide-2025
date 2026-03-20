// ---------------------------------------------------------------------------
// Local-Only Mode — Blocks all outbound network requests when active
// ---------------------------------------------------------------------------
// Provides a global guard that services check before making external calls.
// When enabled: Sentry disabled, cloud AI blocked, Gist sync blocked.
// ---------------------------------------------------------------------------

let _localOnlyMode = false

/** Called from the listener middleware when the privacy setting changes. */
export const setLocalOnlyMode = (enabled: boolean): void => {
    _localOnlyMode = enabled
}

/** Returns true when Local-Only Mode is active (all outbound traffic blocked). */
export const isLocalOnlyMode = (): boolean => _localOnlyMode
