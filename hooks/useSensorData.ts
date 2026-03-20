// ---------------------------------------------------------------------------
// useSensorData — React hook for consuming high-frequency sensor readings
//
// Uses Zustand's `useStore` with selector for fine-grained subscriptions.
// Components only re-render when the specific slice they select changes.
// ---------------------------------------------------------------------------

import { useStore } from 'zustand'
import { sensorStore } from '@/stores/sensorStore'
import type { SensorReading, SensorConnectionState, SensorSource } from '@/stores/sensorStore'

/** Subscribe to the latest sensor reading. Re-renders on every new reading. */
export function useCurrentReading(): SensorReading | null {
    return useStore(sensorStore, (s) => s.currentReading)
}

/** Subscribe to the rolling history buffer (sparklines, trend charts). */
export function useSensorHistory(): SensorReading[] {
    return useStore(sensorStore, (s) => s.history)
}

/** Subscribe to the connection state of the active sensor transport. */
export function useSensorConnectionState(): SensorConnectionState {
    return useStore(sensorStore, (s) => s.connectionState)
}

/** Subscribe to which transport is feeding data. */
export function useActiveSensorSource(): SensorSource | null {
    return useStore(sensorStore, (s) => s.activeSource)
}

/**
 * Convenience hook returning the full sensor snapshot.
 * Prefer the granular hooks above to minimise re-renders.
 */
export function useSensorData(): {
    reading: SensorReading | null
    history: SensorReading[]
    connectionState: SensorConnectionState
    source: SensorSource | null
} {
    const reading = useCurrentReading()
    const history = useSensorHistory()
    const connectionState = useSensorConnectionState()
    const source = useActiveSensorSource()
    return { reading, history, connectionState, source }
}
