/**
 * useVpdSabStream -- Main-thread consumer for VPD SAB data (W-06).
 *
 * Reads VPD status signals and values from the SharedArrayBuffer
 * pipeline established by workerPool.initSabHotPath(). The VPD
 * simulation worker pushes data via AtomicsChannel (status codes)
 * and LockFreeRingBuffer (scaled VPD values).
 *
 * Progressive enhancement: returns idle state when SAB is unavailable
 * (e.g. GitHub Pages without COEP headers).
 *
 * Polling interval: 250ms (sufficient for 1-5 Hz VPD simulation ticks).
 */

import { useEffect, useState, useRef } from 'react'
import { workerPool } from '@/services/workerPool'
import { WORKER_NAMES } from '@/services/workerFactories'

// ---------------------------------------------------------------------------
// VPD signal codes (must match vpdSimulation.worker.ts VPD_SIGNAL)
// ---------------------------------------------------------------------------

const VPD_SIGNAL_OPTIMAL = 1
const VPD_SIGNAL_LOW = 2
const VPD_SIGNAL_HIGH = 3
const VPD_SIGNAL_DANGER = 4

/** Polling interval for SAB data reads (ms). */
const POLL_INTERVAL_MS = 250

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VpdSabStatus = 'none' | 'optimal' | 'low' | 'high' | 'danger'

export interface VpdSabStreamState {
    /** Current VPD zone status from AtomicsChannel signal. */
    vpdStatus: VpdSabStatus
    /** Latest VPD value (kPa) from LockFreeRingBuffer, or null if no data. */
    latestVpd: number | null
    /** True when SAB pipeline is connected and polling. */
    isStreaming: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signalToStatus(signal: number): VpdSabStatus {
    switch (signal) {
        case VPD_SIGNAL_OPTIMAL:
            return 'optimal'
        case VPD_SIGNAL_LOW:
            return 'low'
        case VPD_SIGNAL_HIGH:
            return 'high'
        case VPD_SIGNAL_DANGER:
            return 'danger'
        default:
            return 'none'
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const IDLE_STATE: VpdSabStreamState = {
    vpdStatus: 'none',
    latestVpd: null,
    isStreaming: false,
}

/**
 * Subscribe to the VPD simulation worker's SAB data stream.
 *
 * Returns real-time VPD status and values when the SAB pipeline is
 * active (COEP enabled + VPD worker spawned). Falls back to idle
 * state when SAB is unavailable -- components should treat null
 * values as "no SAB data, use postMessage fallback".
 */
export function useVpdSabStream(): VpdSabStreamState {
    const [state, setState] = useState(IDLE_STATE)
    const stateRef = useRef(state)
    stateRef.current = state

    useEffect(() => {
        const channel = workerPool.getSabChannel(WORKER_NAMES.VPD)
        const ring = workerPool.getSabRingBuffer(WORKER_NAMES.VPD)

        if (!channel && !ring) {
            // SAB not available or VPD worker not yet spawned
            return
        }

        setState((prev) => ({ ...prev, isStreaming: true }))

        const timer = setInterval(() => {
            let newStatus: VpdSabStatus = stateRef.current.vpdStatus
            let newVpd: number | null = null

            // Read latest signal from AtomicsChannel (non-blocking)
            if (channel) {
                const signal = channel.read()
                newStatus = signalToStatus(signal)
            }

            // Drain ring buffer -- keep only the latest value
            if (ring) {
                let val = ring.pop()
                while (val !== null) {
                    // VPD worker encodes as Math.round(vpd * 1000)
                    newVpd = val / 1000
                    val = ring.pop()
                }
            }

            const prev = stateRef.current
            const statusChanged = newStatus !== prev.vpdStatus
            const vpdChanged = newVpd !== null && newVpd !== prev.latestVpd

            if (statusChanged || vpdChanged) {
                setState({
                    vpdStatus: newStatus,
                    latestVpd: newVpd ?? prev.latestVpd,
                    isStreaming: true,
                })
            }
        }, POLL_INTERVAL_MS)

        return () => {
            clearInterval(timer)
            setState(IDLE_STATE)
        }
    }, [])

    return state
}
