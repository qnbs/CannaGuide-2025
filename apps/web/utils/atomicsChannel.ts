/**
 * Lock-free Atomics communication channel (W-04).
 *
 * Provides a bidirectional signaling mechanism between the main thread
 * and a worker using SharedArrayBuffer + Atomics. Falls back to
 * postMessage when SAB is unavailable (progressive enhancement).
 *
 * Architecture:
 *   - Backed by a SharedArrayBuffer with Int32Array view
 *   - Slot layout: [SIGNAL_MAIN_TO_WORKER, SIGNAL_WORKER_TO_MAIN, DATA_SLOT_0, ...]
 *   - Main thread writes to slot 0, worker reads from slot 0 (and vice versa)
 *   - Atomics.store/load for lock-free reads/writes
 *   - Atomics.notify/wait for efficient wake-up (no polling)
 *
 * Usage (main thread):
 *   const channel = AtomicsChannel.create(worker)
 *   channel.signal(42)        // fast-signal a value to the worker
 *   channel.read()            // read last value from worker
 *
 * Usage (worker):
 *   const channel = AtomicsChannel.fromTransfer(sharedBuffer)
 *   channel.waitForSignal()   // blocks worker until main signals
 *   channel.signal(99)        // fast-signal back to main
 *
 * See ADR-0009 for the progressive enhancement strategy.
 */

import { canUseSharedArrayBuffer } from './crossOriginIsolation'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of Int32 slots in the shared buffer. */
const SLOT_COUNT = 8

/** Byte size of the shared buffer (SLOT_COUNT * 4 bytes per Int32). */
const BUFFER_BYTES = SLOT_COUNT * Int32Array.BYTES_PER_ELEMENT

/** Slot index: main thread signals worker. */
const SLOT_M2W = 0

/** Slot index: worker signals main thread. */
const SLOT_W2M = 1

/** Slot index: first data slot. */
const SLOT_DATA_START = 2

/** Sentinel value indicating "no signal". */
const NO_SIGNAL = 0

// ---------------------------------------------------------------------------
// AtomicsChannel
// ---------------------------------------------------------------------------

export class AtomicsChannel {
    private readonly view: Int32Array
    private readonly buffer: SharedArrayBuffer
    /** Which side this channel instance represents. */
    private readonly side: 'main' | 'worker'

    private constructor(buffer: SharedArrayBuffer, side: 'main' | 'worker') {
        this.buffer = buffer
        this.view = new Int32Array(buffer)
        this.side = side
    }

    // -----------------------------------------------------------------------
    // Factory methods
    // -----------------------------------------------------------------------

    /**
     * Create a new AtomicsChannel on the main thread and transfer the
     * backing SharedArrayBuffer to a worker.
     *
     * Returns `null` if SharedArrayBuffer is not available (GitHub Pages).
     */
    static create(worker: Worker): AtomicsChannel | null {
        if (!canUseSharedArrayBuffer()) {
            return null
        }

        const buffer = new SharedArrayBuffer(BUFFER_BYTES)
        const view = new Int32Array(buffer)
        // Initialize all slots to sentinel
        for (let i = 0; i < SLOT_COUNT; i++) {
            Atomics.store(view, i, NO_SIGNAL)
        }

        // Transfer the SAB to the worker (SAB is shared, not transferred)
        worker.postMessage(
            { type: '__ATOMICS_CHANNEL__', buffer },
            // Note: SAB does not go into transfer list -- it is shared
        )

        return new AtomicsChannel(buffer, 'main')
    }

    /**
     * Reconstruct an AtomicsChannel on the worker side from a transferred
     * SharedArrayBuffer. Call this in the worker's message handler when
     * receiving `{ type: '__ATOMICS_CHANNEL__', buffer }`.
     */
    static fromTransfer(buffer: SharedArrayBuffer): AtomicsChannel {
        return new AtomicsChannel(buffer, 'worker')
    }

    /**
     * Check whether SAB-backed channels are supported.
     */
    static isSupported(): boolean {
        return canUseSharedArrayBuffer()
    }

    // -----------------------------------------------------------------------
    // Signaling
    // -----------------------------------------------------------------------

    /**
     * Send a signal value to the other side (non-blocking).
     * Main -> Worker or Worker -> Main depending on which side calls it.
     */
    signal(value: number): void {
        const slot = this.side === 'main' ? SLOT_M2W : SLOT_W2M
        Atomics.store(this.view, slot, value)
        // Wake the other side if it's waiting
        Atomics.notify(this.view, slot, 1)
    }

    /**
     * Read the last signal from the other side (non-blocking).
     */
    read(): number {
        const slot = this.side === 'main' ? SLOT_W2M : SLOT_M2W
        return Atomics.load(this.view, slot)
    }

    /**
     * Wait for a signal from the other side (blocking).
     * **Only use in workers** -- Atomics.wait is not allowed on the main thread.
     *
     * @param timeoutMs Maximum time to wait in milliseconds. 0 = no timeout.
     * @returns The signal value, or `null` if timed out.
     */
    waitForSignal(timeoutMs = 0): number | null {
        if (this.side === 'main') {
            throw new Error('[AtomicsChannel] Atomics.wait is not allowed on the main thread.')
        }
        const slot = SLOT_M2W
        const current = Atomics.load(this.view, slot)
        if (current !== NO_SIGNAL) {
            // Reset and return
            Atomics.store(this.view, slot, NO_SIGNAL)
            return current
        }
        // Block until notified or timeout
        const result = Atomics.wait(
            this.view,
            slot,
            NO_SIGNAL,
            timeoutMs > 0 ? timeoutMs : undefined,
        )
        if (result === 'timed-out') {
            return null
        }
        const val = Atomics.load(this.view, slot)
        Atomics.store(this.view, slot, NO_SIGNAL)
        return val
    }

    // -----------------------------------------------------------------------
    // Data slots (multiple Int32 values)
    // -----------------------------------------------------------------------

    /**
     * Write an Int32 value to a data slot (non-blocking).
     * Data slots range from 0 to (SLOT_COUNT - 2 - 1).
     */
    writeData(slotIndex: number, value: number): void {
        const actualSlot = SLOT_DATA_START + slotIndex
        if (actualSlot < SLOT_DATA_START || actualSlot >= SLOT_COUNT) {
            throw new RangeError(
                `[AtomicsChannel] Data slot index ${slotIndex} out of range [0, ${SLOT_COUNT - SLOT_DATA_START - 1}]`,
            )
        }
        Atomics.store(this.view, actualSlot, value)
    }

    /**
     * Read an Int32 value from a data slot (non-blocking).
     */
    readData(slotIndex: number): number {
        const actualSlot = SLOT_DATA_START + slotIndex
        if (actualSlot < SLOT_DATA_START || actualSlot >= SLOT_COUNT) {
            throw new RangeError(
                `[AtomicsChannel] Data slot index ${slotIndex} out of range [0, ${SLOT_COUNT - SLOT_DATA_START - 1}]`,
            )
        }
        return Atomics.load(this.view, actualSlot)
    }

    /**
     * Number of data slots available (besides the 2 signal slots).
     */
    get dataSlotCount(): number {
        return SLOT_COUNT - SLOT_DATA_START
    }

    /**
     * Get the underlying SharedArrayBuffer for direct access or diagnostics.
     */
    getBuffer(): SharedArrayBuffer {
        return this.buffer
    }
}
