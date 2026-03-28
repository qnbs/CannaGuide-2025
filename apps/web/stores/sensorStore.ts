// ---------------------------------------------------------------------------
// Zustand Sensor Store — high-frequency sensor data stream
//
// Decoupled from Redux to avoid serialisation overhead on rapid MQTT/BLE
// updates (~500 ms intervals). Uses transient updates so subscribers only
// re-render when they explicitly select a slice of state.
//
// Design rationale (Architecture Decision):
//   Redux excels at global user-state (settings, plants, journal) that is
//   persisted to IndexedDB. Sensor data, however, is ephemeral, arrives at
//   high frequency, and is consumed by a small number of UI widgets.
//   Zustand with `subscribeWithSelector` avoids Redux middleware overhead
//   and the mandatory action→reducer→selector→re-render cycle.
// ---------------------------------------------------------------------------

import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SensorReading {
    temperatureC: number
    humidityPercent: number
    ph?: number | null
    receivedAt: number
}

export type SensorConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'
export type SensorSource = 'mqtt' | 'bluetooth' | 'http'

export interface SensorState {
    // ── Live data ──────────────────────────────────────────────────────
    /** Latest reading from the active sensor source. */
    currentReading: SensorReading | null
    /** Rolling window of recent readings for sparkline / trend display. */
    history: SensorReading[]
    /** Connection status of the active transport. */
    connectionState: SensorConnectionState
    /** Which transport is currently feeding data. */
    activeSource: SensorSource | null

    // ── Actions ────────────────────────────────────────────────────────
    /** Push a new sensor reading (called by MQTT/BLE/HTTP services). */
    pushReading: (reading: SensorReading, source: SensorSource) => void
    /** Update the connection state of a specific transport. */
    setConnectionState: (state: SensorConnectionState) => void
    /** Clear all readings and reset to idle. */
    reset: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of readings kept in the rolling history buffer. */
const MAX_HISTORY_LENGTH = 120

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const sensorStore = createStore<SensorState>()(
    subscribeWithSelector((set) => ({
        currentReading: null,
        history: [],
        connectionState: 'disconnected',
        activeSource: null,

        pushReading: (reading, source) =>
            set((state) => {
                const next = [...state.history, reading]
                // FIFO: drop oldest entries when buffer exceeds max
                if (next.length > MAX_HISTORY_LENGTH) {
                    next.splice(0, next.length - MAX_HISTORY_LENGTH)
                }
                return {
                    currentReading: reading,
                    history: next,
                    activeSource: source,
                }
            }),

        setConnectionState: (connectionState) => set({ connectionState }),

        reset: () =>
            set({
                currentReading: null,
                history: [],
                connectionState: 'disconnected',
                activeSource: null,
            }),
    })),
)
