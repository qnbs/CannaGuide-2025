/**
 * Worker-side SAB handler -- accepts AtomicsChannel and RingBuffer
 * transfers during worker startup (W-06 / ADR-0009).
 *
 * Workers call `initSabHandler()` to intercept `__ATOMICS_CHANNEL__`
 * and `__RING_BUFFER__` messages before they reach the main
 * WorkerBus message handler. The received SAB primitives are stored
 * and accessible via `getWorkerChannel()` / `getWorkerRingBuffer()`.
 *
 * Progressive enhancement: when SAB is not available, these messages
 * are never sent, and the getters return null. Worker logic should
 * always check for null before using SAB primitives.
 *
 * Must be called AFTER `initAbortHandler()` so the handler chain is:
 *   self.onmessage -> sabHandler -> abortHandler -> original handler
 */

import { AtomicsChannel } from './atomicsChannel'
import { LockFreeRingBuffer } from './lockFreeRingBuffer'

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let channel: AtomicsChannel | null = null
let ringBuffer: LockFreeRingBuffer | null = null

// ---------------------------------------------------------------------------
// Public API (worker-side)
// ---------------------------------------------------------------------------

/**
 * Install the SAB message handler on the worker's global scope.
 * Intercepts `__ATOMICS_CHANNEL__` and `__RING_BUFFER__` init messages.
 *
 * Must be called once per worker, AFTER `initAbortHandler()`.
 */
export function initSabHandler(): void {
    const previousHandler = self.onmessage

    self.onmessage = (event: MessageEvent) => {
        // Origin verification
        if (event.origin && event.origin !== self.location.origin) {
            return
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const data = event.data as
            | { type?: string; buffer?: SharedArrayBuffer | ArrayBuffer }
            | undefined

        if (data?.type === '__ATOMICS_CHANNEL__' && data.buffer instanceof SharedArrayBuffer) {
            channel = AtomicsChannel.fromTransfer(data.buffer)
            return // Do not forward to the main handler
        }

        if (
            data?.type === '__RING_BUFFER__' &&
            (data.buffer instanceof SharedArrayBuffer || data.buffer instanceof ArrayBuffer)
        ) {
            ringBuffer = LockFreeRingBuffer.fromTransfer(data.buffer, 'consumer')
            return
        }

        // Forward all other messages to the previous handler
        if (previousHandler) {
            previousHandler.call(self, event)
        }
    }
}

/**
 * Get the AtomicsChannel received during worker startup.
 * Returns null if SAB is not available or channel was never sent.
 */
export function getWorkerChannel(): AtomicsChannel | null {
    return channel
}

/**
 * Get the LockFreeRingBuffer received during worker startup.
 * Returns null if SAB is not available or buffer was never sent.
 */
export function getWorkerRingBuffer(): LockFreeRingBuffer | null {
    return ringBuffer
}
