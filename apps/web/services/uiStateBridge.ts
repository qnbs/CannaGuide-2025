// ---------------------------------------------------------------------------
// UI State Bridge
//
// Central service that connects the Redux store to Zustand UI stores.
// Extracted from useUIStore.initUIStoreReduxBridge and extended with reactive
// subscription helpers so Zustand actions can read/subscribe to Redux state
// without importing the Redux store singleton directly.
//
// Usage:
//   -- Called once in store.ts after createAppStore():
//     initUIStateBridge(store.getState, store.dispatch)
//
//   -- In Zustand action thunks:
//     const slots = getReduxSnapshot((s) => s.simulation.plantSlots)
//     const unsub = subscribeToRedux((s) => s.settings.settings.general.theme, (theme) => ...)
// ---------------------------------------------------------------------------

import type { RootState, AppDispatch } from '@/stores/store'
import type { UnknownAction } from '@reduxjs/toolkit'

// ---------------------------------------------------------------------------
// Internal singleton state
// ---------------------------------------------------------------------------

let _getState: (() => RootState) | null = null
let _dispatch: AppDispatch | null = null
/** Unsubscribe functions registered via subscribeToRedux -- cleaned up on re-init. */
const _subscriptions: Array<() => void> = []

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

/**
 * Wire the bridge to the Redux store.
 * Called once from store.ts after createAppStore() completes.
 * Re-initialising with a new store (e.g. during hot-module reload) cleans up
 * previous subscriptions automatically.
 */
export function initUIStateBridge(getState: () => RootState, dispatch: AppDispatch): void {
    // Clean up any live subscriptions from a previous init
    _subscriptions.splice(0).forEach((unsub) => unsub())

    _getState = getState
    _dispatch = dispatch
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Synchronously read a value from the Redux store.
 * Safe to call from Zustand actions and plain functions.
 *
 * @example
 *   const slots = getReduxSnapshot((s) => s.simulation.plantSlots)
 */
export function getReduxSnapshot<T>(selector: (state: RootState) => T): T {
    if (!_getState) {
        throw new Error('[uiStateBridge] Bridge not initialised. Call initUIStateBridge() first.')
    }
    return selector(_getState())
}

/**
 * Subscribe to a derived Redux value and receive updates whenever it changes.
 * Returns an unsubscribe function for cleanup (e.g. in useEffect or store teardown).
 *
 * The subscription is tracked internally and automatically removed on re-init,
 * so callers that live for the lifetime of the app do not need to call unsub().
 *
 * @example
 *   const unsub = subscribeToRedux(
 *     (s) => s.settings.settings.general.theme,
 *     (theme) => useUIStore.setState({ activeTheme: theme }),
 *   )
 */
export function subscribeToRedux<T>(
    selector: (state: RootState) => T,
    handler: (value: T, prevValue: T) => void,
): () => void {
    if (!_getState) {
        throw new Error('[uiStateBridge] Bridge not initialised. Call initUIStateBridge() first.')
    }

    const store = _getState

    let prev = selector(store())

    // We need access to the Redux store's subscribe method.
    // The bridge receives getState() -- to subscribe we need the raw store object.
    // We work around this by accepting an optional store.subscribe via a closure captured
    // at init time.  Fall back to a no-op unsubscribe when _storeSubscribe is unavailable.
    if (!_storeSubscribe) {
        console.warn('[uiStateBridge] subscribeToRedux called before _storeSubscribe was set.')
        return () => undefined
    }

    const unsub = _storeSubscribe(() => {
        const next = selector(store())
        if (!Object.is(next, prev)) {
            const cur = prev
            prev = next
            handler(next, cur)
        }
    })

    _subscriptions.push(unsub)

    return () => {
        const idx = _subscriptions.indexOf(unsub)
        if (idx !== -1) _subscriptions.splice(idx, 1)
        unsub()
    }
}

/**
 * Dispatch a Redux action from a Zustand action or plain service function.
 *
 * @example
 *   dispatchToRedux(settingsSlice.actions.setTheme('dark'))
 */
export function dispatchToRedux(action: UnknownAction): void {
    if (!_dispatch) {
        throw new Error('[uiStateBridge] Bridge not initialised. Call initUIStateBridge() first.')
    }
    _dispatch(action)
}

// ---------------------------------------------------------------------------
// Internal: store.subscribe reference (set by initUIStateBridge + overload)
// ---------------------------------------------------------------------------

let _storeSubscribe: ((listener: () => void) => () => void) | null = null

/**
 * Extended init that also captures store.subscribe for reactive subscriptions.
 * Called from store.ts with the full AppStore reference.
 */
export function initUIStateBridgeFull(
    getState: () => RootState,
    dispatch: AppDispatch,
    subscribe: (listener: () => void) => () => void,
): void {
    _storeSubscribe = subscribe
    initUIStateBridge(getState, dispatch)
}
