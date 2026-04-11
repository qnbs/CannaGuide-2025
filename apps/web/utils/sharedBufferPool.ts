/**
 * SharedArrayBuffer pool with progressive enhancement (W-03).
 *
 * Provides a reusable pool of pre-allocated SharedArrayBuffer instances
 * for zero-copy communication between the main thread and workers.
 * Falls back to regular ArrayBuffer when SAB is unavailable
 * (e.g. GitHub Pages without COEP headers).
 *
 * Design: pool of fixed-size buffers with acquire/release semantics.
 * Prevents frequent SAB allocation which can be expensive.
 */

import { canUseSharedArrayBuffer } from './crossOriginIsolation'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default buffer size in bytes (4 KB -- fits most worker payloads). */
const DEFAULT_BUFFER_SIZE = 4096

/** Maximum number of pooled buffers to prevent memory hoarding. */
const MAX_POOL_SIZE = 16

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PooledBuffer {
    /** The underlying buffer (SharedArrayBuffer when available, ArrayBuffer otherwise). */
    buffer: SharedArrayBuffer | ArrayBuffer
    /** Whether this buffer is SAB-backed (zero-copy transferable). */
    shared: boolean
    /** Return this buffer to the pool. Must be called when done. */
    release: () => void
}

// ---------------------------------------------------------------------------
// SharedBufferPool
// ---------------------------------------------------------------------------

/**
 * Pool of reusable SharedArrayBuffers (or ArrayBuffer fallback).
 * Thread-safe from the main thread perspective (no concurrent JS access).
 */
export class SharedBufferPool {
    private readonly pool: Array<SharedArrayBuffer | ArrayBuffer> = []
    private readonly bufferSize: number
    private readonly useShared: boolean
    private disposed = false

    constructor(bufferSize = DEFAULT_BUFFER_SIZE) {
        this.bufferSize = bufferSize
        this.useShared = canUseSharedArrayBuffer()
    }

    /**
     * Acquire a buffer from the pool or create a new one.
     * The returned `PooledBuffer.release()` must be called to return it.
     */
    acquire(): PooledBuffer {
        if (this.disposed) {
            throw new Error('[SharedBufferPool] Pool has been disposed.')
        }

        let buffer = this.pool.pop()
        if (!buffer) {
            buffer = this.useShared
                ? new SharedArrayBuffer(this.bufferSize)
                : new ArrayBuffer(this.bufferSize)
        } else {
            // Zero out recycled buffer to prevent data leaks
            new Uint8Array(buffer).fill(0)
        }

        const released = { done: false }
        return {
            buffer,
            shared: this.useShared,
            release: () => {
                if (released.done || this.disposed) return
                released.done = true
                if (this.pool.length < MAX_POOL_SIZE) {
                    this.pool.push(buffer)
                }
                // If pool is full, buffer is GC'd
            },
        }
    }

    /**
     * Acquire a buffer and wrap it in a typed view.
     * Helper for common Int32Array use case (Atomics channels).
     */
    acquireInt32(): {
        view: Int32Array
        buffer: SharedArrayBuffer | ArrayBuffer
        shared: boolean
        release: () => void
    } {
        const pooled = this.acquire()
        const view = new Int32Array(pooled.buffer)
        return { view, ...pooled }
    }

    /**
     * Check whether this pool creates SharedArrayBuffer instances.
     */
    isShared(): boolean {
        return this.useShared
    }

    /**
     * Number of buffers currently available in the pool.
     */
    get availableCount(): number {
        return this.pool.length
    }

    /**
     * Release all pooled buffers. After this, acquire() will throw.
     */
    dispose(): void {
        this.disposed = true
        this.pool.length = 0
    }
}

/** Singleton pool for general-use shared buffers. */
let defaultPool: SharedBufferPool | undefined

/**
 * Get the default SharedBufferPool singleton.
 * Lazy-initialized on first call.
 */
export function getSharedBufferPool(): SharedBufferPool {
    if (!defaultPool) {
        defaultPool = new SharedBufferPool()
    }
    return defaultPool
}

/**
 * Dispose the default SharedBufferPool singleton.
 * Called on page unload to release resources.
 */
export function disposeSharedBufferPool(): void {
    defaultPool?.dispose()
    defaultPool = undefined
}
