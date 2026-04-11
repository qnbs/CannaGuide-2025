/**
 * Lock-free Single-Producer Single-Consumer (SPSC) ring buffer (W-05).
 *
 * Zero-copy, zero-lock data streaming between exactly one producer
 * (e.g. main thread) and one consumer (e.g. worker) using
 * SharedArrayBuffer + Atomics.
 *
 * Falls back to a regular ArrayBuffer-backed ring buffer when
 * SharedArrayBuffer is not available (progressive enhancement).
 *
 * Design:
 *   Buffer layout (Int32Array view):
 *     [0] = writeIndex  (owned by producer, read by consumer)
 *     [1] = readIndex   (owned by consumer, read by producer)
 *     [2..capacity+1] = data slots
 *
 *   Lock-free invariant:
 *     - Producer only writes writeIndex; consumer only writes readIndex
 *     - Atomics.store/load ensure visibility across threads
 *     - No mutex, no CAS loops -- pure index arithmetic
 *
 * Capacity must be a power of 2 for fast modular arithmetic (& mask).
 *
 * Usage:
 *   // Producer (main thread):
 *   const ring = LockFreeRingBuffer.create(1024)
 *   ring.push(42) // returns true if successful, false if full
 *   worker.postMessage({ type: '__RING_BUFFER__', buffer: ring.getBuffer() })
 *
 *   // Consumer (worker):
 *   const ring = LockFreeRingBuffer.fromTransfer(buffer, 'consumer')
 *   const value = ring.pop() // returns number or null if empty
 */

import { canUseSharedArrayBuffer } from './crossOriginIsolation'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Offset for the write index in the Int32Array. */
const WRITE_IDX = 0

/** Offset for the read index in the Int32Array. */
const READ_IDX = 1

/** Offset where data slots begin. */
const DATA_OFFSET = 2

/** Default capacity (must be power of 2). */
const DEFAULT_CAPACITY = 256

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPowerOf2(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0
}

function nextPowerOf2(n: number): number {
    let v = n - 1
    v |= v >> 1
    v |= v >> 2
    v |= v >> 4
    v |= v >> 8
    v |= v >> 16
    return v + 1
}

// ---------------------------------------------------------------------------
// LockFreeRingBuffer
// ---------------------------------------------------------------------------

export class LockFreeRingBuffer {
    private readonly view: Int32Array
    private readonly buffer: SharedArrayBuffer | ArrayBuffer
    private readonly capacity: number
    /** Bitmask for fast modular arithmetic: index & mask === index % capacity */
    private readonly mask: number
    private readonly shared: boolean

    private constructor(
        buffer: SharedArrayBuffer | ArrayBuffer,
        capacity: number,
        _role: 'producer' | 'consumer',
        shared: boolean,
    ) {
        this.buffer = buffer
        this.view = new Int32Array(buffer)
        this.capacity = capacity
        this.mask = capacity - 1
        this.shared = shared
    }

    // -----------------------------------------------------------------------
    // Factory methods
    // -----------------------------------------------------------------------

    /**
     * Create a new ring buffer as producer.
     * Uses SharedArrayBuffer if available, otherwise ArrayBuffer.
     *
     * @param capacity Must be a power of 2. Rounded up if not.
     */
    static create(capacity = DEFAULT_CAPACITY): LockFreeRingBuffer {
        const cap = isPowerOf2(capacity) ? capacity : nextPowerOf2(capacity)
        const byteLength = (DATA_OFFSET + cap) * Int32Array.BYTES_PER_ELEMENT
        const useShared = canUseSharedArrayBuffer()
        const buffer = useShared ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength)

        const view = new Int32Array(buffer)
        if (useShared) {
            Atomics.store(view, WRITE_IDX, 0)
            Atomics.store(view, READ_IDX, 0)
        } else {
            view[WRITE_IDX] = 0
            view[READ_IDX] = 0
        }

        return new LockFreeRingBuffer(buffer, cap, 'producer', useShared)
    }

    /**
     * Reconstruct a ring buffer from a transferred SharedArrayBuffer.
     * The capacity is inferred from the buffer length.
     */
    static fromTransfer(
        buffer: SharedArrayBuffer | ArrayBuffer,
        role: 'producer' | 'consumer',
    ): LockFreeRingBuffer {
        const totalSlots = buffer.byteLength / Int32Array.BYTES_PER_ELEMENT
        const capacity = totalSlots - DATA_OFFSET
        const shared = buffer instanceof SharedArrayBuffer
        return new LockFreeRingBuffer(buffer, capacity, role, shared)
    }

    // -----------------------------------------------------------------------
    // Producer API
    // -----------------------------------------------------------------------

    /**
     * Push a value into the ring buffer (non-blocking).
     * @returns `true` if the value was written, `false` if the buffer is full.
     */
    push(value: number): boolean {
        const writeIdx = this.shared
            ? Atomics.load(this.view, WRITE_IDX)
            : (this.view[WRITE_IDX] ?? 0)
        const readIdx = this.shared ? Atomics.load(this.view, READ_IDX) : (this.view[READ_IDX] ?? 0)

        // Full when write is one lap ahead of read
        if (((writeIdx + 1) & this.mask) === (readIdx & this.mask)) {
            return false
        }

        const slot = DATA_OFFSET + (writeIdx & this.mask)
        if (this.shared) {
            Atomics.store(this.view, slot, value)
            Atomics.store(this.view, WRITE_IDX, writeIdx + 1)
            // Wake consumer if waiting
            Atomics.notify(this.view, WRITE_IDX, 1)
        } else {
            this.view[slot] = value
            this.view[WRITE_IDX] = writeIdx + 1
        }

        return true
    }

    /**
     * Push multiple values into the ring buffer.
     * @returns Number of values actually written.
     */
    pushBatch(values: ArrayLike<number>): number {
        let written = 0
        for (let i = 0; i < values.length; i++) {
            const v = values[i]
            if (v === undefined || !this.push(v)) break
            written++
        }
        return written
    }

    // -----------------------------------------------------------------------
    // Consumer API
    // -----------------------------------------------------------------------

    /**
     * Pop a value from the ring buffer (non-blocking).
     * @returns The value, or `null` if the buffer is empty.
     */
    pop(): number | null {
        const writeIdx = this.shared
            ? Atomics.load(this.view, WRITE_IDX)
            : (this.view[WRITE_IDX] ?? 0)
        const readIdx = this.shared ? Atomics.load(this.view, READ_IDX) : (this.view[READ_IDX] ?? 0)

        // Empty when read has caught up to write
        if ((readIdx & this.mask) === (writeIdx & this.mask) && readIdx === writeIdx) {
            return null
        }

        const slot = DATA_OFFSET + (readIdx & this.mask)
        const value = this.shared ? Atomics.load(this.view, slot) : (this.view[slot] ?? 0)

        if (this.shared) {
            Atomics.store(this.view, READ_IDX, readIdx + 1)
        } else {
            this.view[READ_IDX] = readIdx + 1
        }

        return value
    }

    /**
     * Pop up to `maxCount` values from the ring buffer.
     * @returns Array of values (may be shorter than maxCount or empty).
     */
    popBatch(maxCount: number): number[] {
        const results: number[] = []
        for (let i = 0; i < maxCount; i++) {
            const v = this.pop()
            if (v === null) break
            results.push(v)
        }
        return results
    }

    /**
     * Wait for data to become available (blocking).
     * **Only use in workers** -- Atomics.wait blocks the thread.
     *
     * @param timeoutMs Maximum time to wait. 0 = no timeout.
     * @returns `true` if data is available, `false` if timed out.
     */
    waitForData(timeoutMs = 0): boolean {
        if (!this.shared) return !this.isEmpty()
        const writeIdx = Atomics.load(this.view, WRITE_IDX)
        const readIdx = Atomics.load(this.view, READ_IDX)
        if (writeIdx !== readIdx) return true

        const result = Atomics.wait(
            this.view,
            WRITE_IDX,
            writeIdx,
            timeoutMs > 0 ? timeoutMs : undefined,
        )
        return result !== 'timed-out'
    }

    // -----------------------------------------------------------------------
    // Diagnostics
    // -----------------------------------------------------------------------

    /**
     * Current number of items in the buffer.
     */
    get size(): number {
        const writeIdx = this.shared
            ? Atomics.load(this.view, WRITE_IDX)
            : (this.view[WRITE_IDX] ?? 0)
        const readIdx = this.shared ? Atomics.load(this.view, READ_IDX) : (this.view[READ_IDX] ?? 0)
        return writeIdx - readIdx
    }

    /**
     * Whether the buffer is empty.
     */
    isEmpty(): boolean {
        return this.size === 0
    }

    /**
     * Whether the buffer is full.
     */
    isFull(): boolean {
        return this.size >= this.capacity - 1
    }

    /**
     * Buffer capacity (max items before full).
     */
    getCapacity(): number {
        return this.capacity - 1 // one slot reserved for full detection
    }

    /**
     * Whether this ring buffer is backed by SharedArrayBuffer.
     */
    isShared(): boolean {
        return this.shared
    }

    /**
     * Get the underlying buffer for transfer to a worker.
     */
    getBuffer(): SharedArrayBuffer | ArrayBuffer {
        return this.buffer
    }
}
