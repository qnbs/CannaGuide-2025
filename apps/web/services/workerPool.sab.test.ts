/**
 * WorkerPool SAB hot-path tests.
 *
 * These tests mock `canUseSharedArrayBuffer()` as **true** to exercise
 * the SAB code paths (AtomicsChannel + LockFreeRingBuffer initialization,
 * getSabChannel/getSabRingBuffer accessors, sabBufferUtilization metrics).
 *
 * The non-SAB tests remain in `workerPool.test.ts`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkerPool } from './workerPool'

// ---------------------------------------------------------------------------
// Mocks -- SAB enabled
// ---------------------------------------------------------------------------

vi.mock('@/utils/deviceCapabilities', () => ({
    getMaxPoolSize: () => 4,
}))

vi.mock('@/utils/crossOriginIsolation', () => ({
    canUseSharedArrayBuffer: () => true,
}))

// ---------------------------------------------------------------------------
// Mock Worker
// ---------------------------------------------------------------------------

class MockWorker {
    terminated = false
    messages: unknown[] = []
    terminate(): void {
        this.terminated = true
    }
    addEventListener(): void {
        /* noop */
    }
    removeEventListener(): void {
        /* noop */
    }
    postMessage(data: unknown): void {
        this.messages.push(data)
    }
}

function createMockFactory(): { factory: () => Worker; instances: MockWorker[] } {
    const instances: MockWorker[] = []
    return {
        factory: () => {
            const w = new MockWorker()
            instances.push(w)
            return w as unknown as Worker
        },
        instances,
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let pool: WorkerPool

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    pool = new WorkerPool()
})

afterEach(() => {
    pool.dispose()
    vi.useRealTimers()
})

describe('WorkerPool SAB hot-path', () => {
    // --- SAB auto-init for hot workers ---

    it('initializes AtomicsChannel for hot workers on spawn', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('vpd', { factory, hot: true })

        pool.getOrCreate('vpd')

        // Worker should have received __ATOMICS_CHANNEL__ message
        const atomicsMsg = instances[0]!.messages.find(
            (m) =>
                typeof m === 'object' &&
                m !== null &&
                (m as Record<string, unknown>).type === '__ATOMICS_CHANNEL__',
        ) as Record<string, unknown> | undefined
        expect(atomicsMsg).toBeDefined()
        expect(atomicsMsg!.buffer).toBeInstanceOf(SharedArrayBuffer)
    })

    it('initializes LockFreeRingBuffer for hot workers on spawn', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('vpd', { factory, hot: true })

        pool.getOrCreate('vpd')

        // Worker should have received __RING_BUFFER__ message
        const ringMsg = instances[0]!.messages.find(
            (m) =>
                typeof m === 'object' &&
                m !== null &&
                (m as Record<string, unknown>).type === '__RING_BUFFER__',
        ) as Record<string, unknown> | undefined
        expect(ringMsg).toBeDefined()
        expect(ringMsg!.buffer).toBeInstanceOf(SharedArrayBuffer)
    })

    it('does NOT initialize SAB for cold (non-hot) workers', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('calc', { factory, hot: false })

        pool.getOrCreate('calc')

        // No SAB messages should have been posted
        expect(instances[0]!.messages).toHaveLength(0)
    })

    // --- getSabChannel / getSabRingBuffer ---

    it('getSabChannel returns AtomicsChannel for hot worker', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('vpd', { factory, hot: true })

        pool.getOrCreate('vpd')

        const ch = pool.getSabChannel('vpd')
        expect(ch).not.toBeNull()
    })

    it('getSabRingBuffer returns LockFreeRingBuffer for hot worker', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('vpd', { factory, hot: true })

        pool.getOrCreate('vpd')

        const ring = pool.getSabRingBuffer('vpd')
        expect(ring).not.toBeNull()
    })

    it('getSabChannel returns null for cold worker', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('calc', { factory, hot: false })

        pool.getOrCreate('calc')

        expect(pool.getSabChannel('calc')).toBeNull()
    })

    it('getSabRingBuffer returns null for cold worker', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('calc', { factory, hot: false })

        pool.getOrCreate('calc')

        expect(pool.getSabRingBuffer('calc')).toBeNull()
    })

    it('getSabChannel returns null for unspawned worker', () => {
        expect(pool.getSabChannel('nonexistent')).toBeNull()
    })

    // --- SAB cleanup on terminate ---

    it('clears SAB references on terminateWorker', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('vpd', { factory, hot: true })

        pool.getOrCreate('vpd')
        expect(pool.getSabChannel('vpd')).not.toBeNull()
        expect(pool.getSabRingBuffer('vpd')).not.toBeNull()

        pool.terminateWorker('vpd')

        expect(pool.getSabChannel('vpd')).toBeNull()
        expect(pool.getSabRingBuffer('vpd')).toBeNull()
    })

    it('clears SAB references on dispose', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('vpd', { factory, hot: true })

        pool.getOrCreate('vpd')
        expect(pool.getSabChannel('vpd')).not.toBeNull()

        pool.dispose()

        expect(pool.getSabChannel('vpd')).toBeNull()
        expect(pool.getSabRingBuffer('vpd')).toBeNull()
    })

    // --- sabBufferUtilization in PoolMetrics ---

    it('reports sabAvailable=true in pool metrics', () => {
        const metrics = pool.getPoolMetrics()
        expect(metrics.sabAvailable).toBe(true)
    })

    it('includes sabBufferUtilization for hot workers', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('vpd', { factory, hot: true })

        pool.getOrCreate('vpd')

        const metrics = pool.getPoolMetrics()
        expect(metrics.sabBufferUtilization).toHaveProperty('vpd')
        expect(metrics.sabBufferUtilization['vpd']!.capacity).toBeGreaterThan(0)
        expect(metrics.sabBufferUtilization['vpd']!.size).toBe(0) // empty buffer initially
    })

    it('sabBufferUtilization is empty when no hot workers spawned', () => {
        const metrics = pool.getPoolMetrics()
        expect(metrics.sabBufferUtilization).toEqual({})
    })

    // --- Re-spawn re-initializes SAB ---

    it('re-initializes SAB on re-spawn after terminate', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('vpd', { factory, hot: true })

        pool.getOrCreate('vpd')
        pool.terminateWorker('vpd')
        expect(pool.getSabChannel('vpd')).toBeNull()

        pool.getOrCreate('vpd')
        expect(pool.getSabChannel('vpd')).not.toBeNull()
        expect(pool.getSabRingBuffer('vpd')).not.toBeNull()
    })
})
