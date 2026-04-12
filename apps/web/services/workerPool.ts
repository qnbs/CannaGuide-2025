/**
 * WorkerPool -- Centralized Worker lifecycle management (W-06).
 *
 * Provides lazy spawning, idle-timeout cleanup, and device-aware pool sizing.
 * Hot-path workers (VPD, voice) are exempt from idle timeout.
 *
 * All Worker instantiation is delegated to registered factory functions
 * (see workerFactories.ts). The pool integrates with WorkerBus via
 * `setWorkerPool()` -- dispatches to unregistered workers are auto-spawned.
 *
 * SAB hot-path initialization happens automatically on spawn when
 * `canUseSharedArrayBuffer()` returns true.
 *
 * ADR-0010: Worker Pool with Dynamic Spawning.
 */

import { canUseSharedArrayBuffer } from '@/utils/crossOriginIsolation'
import { getMaxPoolSize } from '@/utils/deviceCapabilities'
import { AtomicsChannel } from '@/utils/atomicsChannel'
import { LockFreeRingBuffer } from '@/utils/lockFreeRingBuffer'
import { getPerformanceMemory } from '@/utils/browserApis'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Factory function that creates a new Worker instance. */
export type WorkerFactory = () => Worker

/** Configuration for a registered worker type. */
export interface WorkerFactoryEntry {
    /** Creates the Worker instance on demand. */
    factory: WorkerFactory
    /** When true, the worker is never terminated by idle timeout. */
    hot: boolean
}

/** Pool-level telemetry counters (JSON-serializable). */
export interface PoolMetrics {
    /** Number of currently active (alive) workers. */
    activeCount: number
    /** Number of workers waiting for idle timeout. */
    idleCount: number
    /** Cumulative workers spawned since pool creation. */
    totalSpawned: number
    /** Cumulative workers terminated since pool creation. */
    totalTerminated: number
    /** Maximum pool size allowed by device capabilities. */
    maxPoolSize: number
    /** Whether SAB hot-paths are available. */
    sabAvailable: boolean
    /** SAB ring buffer utilization per hot-path worker (name -> size/capacity). */
    sabBufferUtilization: Record<string, { size: number; capacity: number }>
}

/** Callback invoked when a worker is freshly spawned by the pool. */
export type OnSpawnHook = (name: string, worker: Worker) => void

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default idle timeout before a cold worker is terminated (ms). */
const IDLE_TIMEOUT_MS = 45_000

/** Interval between memory pressure checks (ms). */
const MEMORY_CHECK_INTERVAL_MS = 30_000

/** Heap usage threshold: terminate low-priority idle workers. */
const HEAP_WARN_THRESHOLD = 0.85

/** Heap usage threshold: terminate all non-hot workers. */
const HEAP_CRITICAL_THRESHOLD = 0.9

// ---------------------------------------------------------------------------
// WorkerPool
// ---------------------------------------------------------------------------

export class WorkerPool {
    /** Live worker instances keyed by name. */
    private readonly instances = new Map<string, Worker>()

    /** Idle-timeout handles keyed by worker name. */
    private readonly idleTimers = new Map<string, ReturnType<typeof setTimeout>>()

    /** Registered factory entries keyed by worker type name. */
    private readonly factories = new Map<string, WorkerFactoryEntry>()

    /** Workers currently in idle state (timer running, not disposed). */
    private readonly idleSet = new Set<string>()

    // -- Telemetry counters --
    private spawnedTotal = 0
    private terminatedTotal = 0

    /** Optional hook called after every lazy spawn. */
    private onSpawnHook: OnSpawnHook | undefined
    /** Handle for the periodic memory pressure check interval. */
    private memoryCheckHandle: ReturnType<typeof setInterval> | null = null
    /** W-06/SAB: AtomicsChannels keyed by worker name (main-thread side). */
    private readonly sabChannels = new Map<string, AtomicsChannel>()

    /** W-06/SAB: LockFreeRingBuffers keyed by worker name (main-thread side). */
    private readonly sabRingBuffers = new Map<string, LockFreeRingBuffer>()

    // -------------------------------------------------------------------
    // Factory registration
    // -------------------------------------------------------------------

    /**
     * Register a worker factory so the pool can lazily create it on demand.
     * Must be called before the first `getOrCreate()` for this name.
     */
    registerFactory(name: string, entry: WorkerFactoryEntry): void {
        this.factories.set(name, entry)
    }

    /** Check whether a factory is registered for a worker name. */
    hasFactory(name: string): boolean {
        return this.factories.has(name)
    }

    // -------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------

    /**
     * Retrieve an existing Worker or lazily spawn one using the registered
     * factory. Resets the idle timer on every access.
     *
     * @throws Error if no factory is registered for `name`.
     */
    getOrCreate(name: string): Worker {
        // Cancel any pending idle timeout -- worker is active again
        this.cancelIdleTimer(name)
        this.idleSet.delete(name)

        const existing = this.instances.get(name)
        if (existing) return existing

        const entry = this.factories.get(name)
        if (!entry) {
            throw new Error(`[WorkerPool] No factory registered for "${name}"`)
        }

        const maxSize = getMaxPoolSize()
        if (this.instances.size >= maxSize) {
            // Evict the oldest idle worker to stay within budget
            const evicted = this.evictIdleWorker()
            if (!evicted) {
                // All workers are active -- allow overflow (graceful degradation)
                console.debug(
                    `[WorkerPool] Pool size ${this.instances.size} exceeds max ${maxSize} -- no idle workers to evict`,
                )
            }
        }

        const worker = entry.factory()
        this.instances.set(name, worker)
        this.spawnedTotal++

        // Start OOM monitor on first worker spawn
        this.startMemoryMonitor()

        // W-06/SAB: Initialize hot-path primitives before notifying hook
        this.initSabHotPath(name, worker)

        // Notify hook (used by WorkerBus to auto-register)
        this.onSpawnHook?.(name, worker)

        return worker
    }

    /**
     * Mark a worker as idle. If the worker is not in the hot set,
     * an idle timer starts. When it fires the worker is terminated.
     */
    release(name: string): void {
        if (!this.instances.has(name)) return

        const entry = this.factories.get(name)
        if (entry?.hot) {
            // Hot workers are never idle-terminated
            return
        }

        this.idleSet.add(name)
        this.cancelIdleTimer(name)
        this.idleTimers.set(
            name,
            setTimeout(() => {
                this.terminateWorker(name)
            }, IDLE_TIMEOUT_MS),
        )
    }

    /**
     * Immediately terminate a worker and free resources.
     */
    terminateWorker(name: string): void {
        this.cancelIdleTimer(name)
        this.idleSet.delete(name)
        this.sabChannels.delete(name)
        this.sabRingBuffers.delete(name)
        const worker = this.instances.get(name)
        if (worker) {
            worker.terminate()
            this.instances.delete(name)
            this.terminatedTotal++
        }
    }

    /** Check whether a live worker instance exists. */
    has(name: string): boolean {
        return this.instances.has(name)
    }

    /** Get a live worker instance (or undefined). */
    get(name: string): Worker | undefined {
        return this.instances.get(name)
    }

    /** Terminate all workers and clear all timers. */
    dispose(): void {
        this.stopMemoryMonitor()
        for (const [name] of this.idleTimers) {
            this.cancelIdleTimer(name)
        }
        for (const [name, worker] of this.instances) {
            worker.terminate()
            this.terminatedTotal++
            this.idleSet.delete(name)
            this.instances.delete(name)
        }
        this.sabChannels.clear()
        this.sabRingBuffers.clear()
    }

    /** Set a hook called after every lazy spawn event. */
    setOnSpawnHook(hook: OnSpawnHook): void {
        this.onSpawnHook = hook
    }

    // -------------------------------------------------------------------
    // OOM Memory Pressure Monitor (W-06.1)
    // -------------------------------------------------------------------

    /**
     * Start periodic heap memory monitoring. When heap usage exceeds
     * HEAP_WARN_THRESHOLD (85%), idle and low-priority workers are
     * terminated. At HEAP_CRITICAL_THRESHOLD (90%), all non-hot workers
     * are terminated to prevent OOM crashes.
     *
     * Safe to call multiple times -- subsequent calls are no-ops.
     * Only effective in Chromium (requires `performance.memory`).
     */
    startMemoryMonitor(): void {
        if (this.memoryCheckHandle) return
        // Only useful in browsers that expose performance.memory (Chromium)
        if (!getPerformanceMemory()) return

        this.memoryCheckHandle = setInterval(() => {
            this.checkMemoryPressure()
        }, MEMORY_CHECK_INTERVAL_MS)
    }

    /** Stop the periodic memory pressure monitor. */
    stopMemoryMonitor(): void {
        if (this.memoryCheckHandle) {
            clearInterval(this.memoryCheckHandle)
            this.memoryCheckHandle = null
        }
    }

    /**
     * Check current JS heap usage and terminate workers if pressure is
     * detected. Returns the current heap usage ratio (0-1) or null if
     * the performance.memory API is unavailable.
     */
    checkMemoryPressure(): number | null {
        const mem = getPerformanceMemory()
        if (!mem || mem.jsHeapSizeLimit === 0) return null

        const ratio = mem.usedJSHeapSize / mem.jsHeapSizeLimit
        if (ratio < HEAP_WARN_THRESHOLD) return ratio

        if (ratio >= HEAP_CRITICAL_THRESHOLD) {
            // Critical: terminate ALL non-hot workers
            console.debug(
                `[WorkerPool] CRITICAL memory pressure (${(ratio * 100).toFixed(1)}%) -- terminating all non-hot workers`,
            )
            this.terminateNonHotWorkers()
        } else {
            // Warning: terminate idle workers only
            console.debug(
                `[WorkerPool] Memory pressure (${(ratio * 100).toFixed(1)}%) -- terminating idle workers`,
            )
            this.terminateIdleWorkers()
        }
        return ratio
    }

    /** Terminate all workers that are currently idle (timer running). */
    private terminateIdleWorkers(): void {
        const names = [...this.idleSet]
        for (const name of names) {
            this.terminateWorker(name)
        }
    }

    /** Terminate all workers except those marked as hot. */
    private terminateNonHotWorkers(): void {
        const names = [...this.instances.keys()]
        for (const name of names) {
            const entry = this.factories.get(name)
            if (!entry?.hot) {
                this.terminateWorker(name)
            }
        }
    }

    // -------------------------------------------------------------------
    // SAB Hot-Path (W-06 / ADR-0009)
    // -------------------------------------------------------------------

    /**
     * Initialize SAB hot-path primitives for a worker.
     * Creates an AtomicsChannel and a LockFreeRingBuffer, transfers
     * them to the worker via postMessage. Only called when SAB is available
     * AND the worker is marked as hot.
     *
     * Main-thread side keeps references for reading signals and consuming
     * ring buffer data.
     */
    private initSabHotPath(name: string, worker: Worker): void {
        if (!canUseSharedArrayBuffer()) return

        const entry = this.factories.get(name)
        if (!entry?.hot) return

        // AtomicsChannel: bidirectional signaling (VPD danger, voice wakeword)
        const ch = AtomicsChannel.create(worker)
        if (ch) {
            this.sabChannels.set(name, ch)
        }

        // LockFreeRingBuffer: streaming data (e.g. VPD tick data)
        const ring = LockFreeRingBuffer.create(256)
        if (ring.isShared()) {
            worker.postMessage({
                type: '__RING_BUFFER__',
                buffer: ring.getBuffer(),
            })
            this.sabRingBuffers.set(name, ring)
        }
    }

    /**
     * Get the main-thread AtomicsChannel for reading signals from a worker.
     * Returns null if SAB is not available or worker has no channel.
     */
    getSabChannel(name: string): AtomicsChannel | null {
        return this.sabChannels.get(name) ?? null
    }

    /**
     * Get the main-thread LockFreeRingBuffer for consuming data from a worker.
     * Returns null if SAB is not available or worker has no ring buffer.
     */
    getSabRingBuffer(name: string): LockFreeRingBuffer | null {
        return this.sabRingBuffers.get(name) ?? null
    }

    // -------------------------------------------------------------------
    // Telemetry
    // -------------------------------------------------------------------

    /** Return a JSON-serializable snapshot of pool-level metrics. */
    getPoolMetrics(): PoolMetrics {
        const sabBufferUtilization: Record<string, { size: number; capacity: number }> = {}
        for (const [name, ring] of this.sabRingBuffers) {
            sabBufferUtilization[name] = {
                size: ring.size,
                capacity: ring.getCapacity(),
            }
        }

        return {
            activeCount: this.instances.size - this.idleSet.size,
            idleCount: this.idleSet.size,
            totalSpawned: this.spawnedTotal,
            totalTerminated: this.terminatedTotal,
            maxPoolSize: getMaxPoolSize(),
            sabAvailable: canUseSharedArrayBuffer(),
            sabBufferUtilization,
        }
    }

    // -------------------------------------------------------------------
    // Internals
    // -------------------------------------------------------------------

    private cancelIdleTimer(name: string): void {
        const timer = this.idleTimers.get(name)
        if (timer !== undefined) {
            clearTimeout(timer)
            this.idleTimers.delete(name)
        }
    }

    /**
     * Evict the first idle worker found. Returns true if a worker was evicted.
     */
    private evictIdleWorker(): boolean {
        for (const name of this.idleSet) {
            this.terminateWorker(name)
            return true
        }
        return false
    }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const workerPool = new WorkerPool()
