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
import { INITIAL_TELEMETRY, type MqttTelemetryMetrics } from '@/types/iotSchemas'

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

/** IoT event surfaced to UI for toast notifications. */
export interface IoTToastEvent {
    id: string
    type: 'connection_lost' | 'connection_restored' | 'validation_error' | 'wss_warning'
    message: string
    timestamp: number
}

export interface SensorState {
    // -- Live data --
    /** Latest reading from the active sensor source. */
    currentReading: SensorReading | null
    /** Rolling window of recent readings for sparkline / trend display. */
    history: SensorReading[]
    /** Connection status of the active transport. */
    connectionState: SensorConnectionState
    /** Which transport is currently feeding data. */
    activeSource: SensorSource | null
    /** Telemetry metrics from the MQTT layer. */
    telemetry: MqttTelemetryMetrics
    /** Toast events queue for UI notifications (max 10, FIFO). */
    toastEvents: IoTToastEvent[]

    // -- Actions --
    /** Push a new sensor reading (called by MQTT/BLE/HTTP services). */
    pushReading: (reading: SensorReading, source: SensorSource) => void
    /** Update the connection state of a specific transport. */
    setConnectionState: (state: SensorConnectionState) => void
    /** Update telemetry snapshot. */
    setTelemetry: (telemetry: MqttTelemetryMetrics) => void
    /** Push an IoT event for toast display. */
    pushToastEvent: (event: Omit<IoTToastEvent, 'id'>) => void
    /** Dismiss a toast event by ID. */
    dismissToast: (id: string) => void
    /** Clear all readings and reset to idle. */
    reset: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of readings kept in the rolling history buffer. */
const MAX_HISTORY_LENGTH = 120
const MAX_TOAST_EVENTS = 10

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let toastIdCounter = 0

export const sensorStore = createStore<SensorState>()(
    subscribeWithSelector((set) => ({
        currentReading: null,
        history: [],
        connectionState: 'disconnected',
        activeSource: null,
        telemetry: { ...INITIAL_TELEMETRY },
        toastEvents: [],

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

        setTelemetry: (telemetry) => set({ telemetry }),

        pushToastEvent: (event) =>
            set((state) => {
                toastIdCounter += 1
                const toast: IoTToastEvent = {
                    ...event,
                    id: `iot_toast_${toastIdCounter}`,
                }
                const next = [...state.toastEvents, toast]
                if (next.length > MAX_TOAST_EVENTS) {
                    next.splice(0, next.length - MAX_TOAST_EVENTS)
                }
                return { toastEvents: next }
            }),

        dismissToast: (id) =>
            set((state) => ({
                toastEvents: state.toastEvents.filter((t) => t.id !== id),
            })),

        reset: () =>
            set({
                currentReading: null,
                history: [],
                connectionState: 'disconnected',
                activeSource: null,
                telemetry: { ...INITIAL_TELEMETRY },
                toastEvents: [],
            }),
    })),
)
