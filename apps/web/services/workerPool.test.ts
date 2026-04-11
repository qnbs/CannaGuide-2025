import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkerPool } from './workerPool'

// ---------------------------------------------------------------------------
// Mock navigator.hardwareConcurrency for deterministic pool sizing
// ---------------------------------------------------------------------------

vi.mock('@/utils/deviceCapabilities', () => ({
    getMaxPoolSize: () => 4,
}))

vi.mock('@/utils/crossOriginIsolation', () => ({
    canUseSharedArrayBuffer: () => false,
}))

// ---------------------------------------------------------------------------
// Mock Worker
// ---------------------------------------------------------------------------

class MockWorker {
    terminated = false
    terminate(): void {
        this.terminated = true
    }
    addEventListener(): void {
        /* noop */
    }
    removeEventListener(): void {
        /* noop */
    }
    postMessage(): void {
        /* noop */
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

describe('WorkerPool', () => {
    // --- Factory registration ---

    it('registerFactory + hasFactory', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })
        expect(pool.hasFactory('test')).toBe(true)
        expect(pool.hasFactory('unknown')).toBe(false)
    })

    // --- getOrCreate: lazy spawn ---

    it('getOrCreate lazily creates a worker on first access', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        const worker = pool.getOrCreate('test')
        expect(instances).toHaveLength(1)
        expect(worker).toBe(instances[0])
    })

    it('getOrCreate returns same instance on second access', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        const w1 = pool.getOrCreate('test')
        const w2 = pool.getOrCreate('test')
        expect(w1).toBe(w2)
        expect(instances).toHaveLength(1)
    })

    it('getOrCreate throws when no factory is registered', () => {
        expect(() => pool.getOrCreate('missing')).toThrow('No factory registered for "missing"')
    })

    // --- has / get ---

    it('has returns true for live worker, false otherwise', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        expect(pool.has('test')).toBe(false)
        pool.getOrCreate('test')
        expect(pool.has('test')).toBe(true)
    })

    it('get returns worker or undefined', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        expect(pool.get('test')).toBeUndefined()
        const w = pool.getOrCreate('test')
        expect(pool.get('test')).toBe(w)
    })

    // --- release + idle timeout ---

    it('release starts idle timer and terminates after timeout', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        pool.getOrCreate('test')
        pool.release('test')

        expect(instances[0]!.terminated).toBe(false)
        vi.advanceTimersByTime(45_000)
        expect(instances[0]!.terminated).toBe(true)
        expect(pool.has('test')).toBe(false)
    })

    it('release is no-op for non-existent worker', () => {
        // Should not throw
        pool.release('nonexistent')
    })

    it('getOrCreate cancels pending idle timeout', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        pool.getOrCreate('test')
        pool.release('test')
        // Access again before timeout fires
        vi.advanceTimersByTime(20_000)
        pool.getOrCreate('test')

        // The full 45s from initial release should not fire
        vi.advanceTimersByTime(30_000)
        expect(instances[0]!.terminated).toBe(false)
        expect(pool.has('test')).toBe(true)
    })

    // --- Hot workers ---

    it('hot workers are never idle-terminated', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('hot-worker', { factory, hot: true })

        pool.getOrCreate('hot-worker')
        pool.release('hot-worker')

        vi.advanceTimersByTime(120_000)
        expect(instances[0]!.terminated).toBe(false)
        expect(pool.has('hot-worker')).toBe(true)
    })

    // --- terminateWorker ---

    it('terminateWorker immediately terminates and removes', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        pool.getOrCreate('test')
        pool.terminateWorker('test')

        expect(instances[0]!.terminated).toBe(true)
        expect(pool.has('test')).toBe(false)
    })

    it('terminateWorker is safe for unknown worker', () => {
        // Should not throw
        pool.terminateWorker('unknown')
    })

    it('terminateWorker cancels idle timer', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        pool.getOrCreate('test')
        pool.release('test')
        pool.terminateWorker('test')

        // Timer should be cleared, advancing should not cause issues
        vi.advanceTimersByTime(60_000)
        expect(pool.has('test')).toBe(false)
    })

    // --- dispose ---

    it('dispose terminates all workers', () => {
        const mock1 = createMockFactory()
        const mock2 = createMockFactory()
        pool.registerFactory('a', { factory: mock1.factory, hot: false })
        pool.registerFactory('b', { factory: mock2.factory, hot: true })

        pool.getOrCreate('a')
        pool.getOrCreate('b')
        pool.dispose()

        expect(mock1.instances[0]!.terminated).toBe(true)
        expect(mock2.instances[0]!.terminated).toBe(true)
        expect(pool.has('a')).toBe(false)
        expect(pool.has('b')).toBe(false)
    })

    it('dispose clears idle timers', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        pool.getOrCreate('test')
        pool.release('test')
        pool.dispose()

        expect(instances[0]!.terminated).toBe(true)
        // No dangling timers -- advancing should be safe
        vi.advanceTimersByTime(60_000)
    })

    // --- Eviction ---

    it('evicts idle worker when pool is at max capacity', () => {
        // maxPoolSize is mocked to 4
        const mocks = Array.from({ length: 5 }, (_, i) => {
            const m = createMockFactory()
            pool.registerFactory(`w${i}`, { factory: m.factory, hot: false })
            return m
        })

        // Spawn 4 workers (fill pool)
        for (let i = 0; i < 4; i++) {
            pool.getOrCreate(`w${i}`)
        }

        // Release w0 to make it idle
        pool.release('w0')

        // Spawn w4 -- should evict idle w0
        pool.getOrCreate('w4')

        expect(mocks[0]!.instances[0]!.terminated).toBe(true)
        expect(pool.has('w0')).toBe(false)
        expect(pool.has('w4')).toBe(true)
    })

    it('allows overflow when all workers are active (no idle to evict)', () => {
        const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined)

        const mocks = Array.from({ length: 5 }, (_, i) => {
            const m = createMockFactory()
            pool.registerFactory(`w${i}`, { factory: m.factory, hot: false })
            return m
        })

        // Spawn 4 active workers (fill pool, none idle)
        for (let i = 0; i < 4; i++) {
            pool.getOrCreate(`w${i}`)
        }

        // Spawn w4 -- no idle workers to evict, should still work (overflow)
        const worker = pool.getOrCreate('w4')
        expect(worker).toBeDefined()
        expect(mocks[4]!.instances).toHaveLength(1)
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds max'))

        consoleSpy.mockRestore()
    })

    // --- onSpawnHook ---

    it('setOnSpawnHook is called on lazy spawn', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        const hook = vi.fn()
        pool.setOnSpawnHook(hook)

        const worker = pool.getOrCreate('test')
        expect(hook).toHaveBeenCalledTimes(1)
        expect(hook).toHaveBeenCalledWith('test', worker)
    })

    it('onSpawnHook is not called on subsequent getOrCreate', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        const hook = vi.fn()
        pool.setOnSpawnHook(hook)

        pool.getOrCreate('test')
        pool.getOrCreate('test')
        expect(hook).toHaveBeenCalledTimes(1)
    })

    // --- PoolMetrics ---

    it('getPoolMetrics returns correct snapshot', () => {
        const mock1 = createMockFactory()
        const mock2 = createMockFactory()
        pool.registerFactory('a', { factory: mock1.factory, hot: false })
        pool.registerFactory('b', { factory: mock2.factory, hot: false })

        // Initial state
        const initial = pool.getPoolMetrics()
        expect(initial.activeCount).toBe(0)
        expect(initial.idleCount).toBe(0)
        expect(initial.totalSpawned).toBe(0)
        expect(initial.totalTerminated).toBe(0)
        expect(initial.maxPoolSize).toBe(4)
        expect(initial.sabAvailable).toBe(false)
        expect(initial.sabBufferUtilization).toEqual({})

        // Spawn two workers
        pool.getOrCreate('a')
        pool.getOrCreate('b')

        const afterSpawn = pool.getPoolMetrics()
        expect(afterSpawn.activeCount).toBe(2)
        expect(afterSpawn.idleCount).toBe(0)
        expect(afterSpawn.totalSpawned).toBe(2)

        // Release one to idle
        pool.release('a')

        const afterRelease = pool.getPoolMetrics()
        expect(afterRelease.activeCount).toBe(1)
        expect(afterRelease.idleCount).toBe(1)

        // Terminate the idle one
        pool.terminateWorker('a')

        const afterTerminate = pool.getPoolMetrics()
        expect(afterTerminate.activeCount).toBe(1)
        expect(afterTerminate.idleCount).toBe(0)
        expect(afterTerminate.totalTerminated).toBe(1)
    })

    // --- Re-spawn after termination ---

    it('getOrCreate re-spawns after terminateWorker', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        const w1 = pool.getOrCreate('test')
        pool.terminateWorker('test')
        const w2 = pool.getOrCreate('test')

        expect(w1).not.toBe(w2)
        expect(instances).toHaveLength(2)
        expect(instances[0]!.terminated).toBe(true)
        expect(instances[1]!.terminated).toBe(false)
    })

    it('getOrCreate re-spawns after idle timeout termination', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        pool.getOrCreate('test')
        pool.release('test')
        vi.advanceTimersByTime(45_000)

        // Worker was terminated by idle timeout
        expect(instances[0]!.terminated).toBe(true)
        expect(pool.has('test')).toBe(false)

        // Re-spawn
        const w2 = pool.getOrCreate('test')
        expect(instances).toHaveLength(2)
        expect(w2).toBe(instances[1])
        expect(pool.has('test')).toBe(true)
    })

    // --- Multiple release calls ---

    it('multiple release calls only set one timer', () => {
        const { factory, instances } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        pool.getOrCreate('test')
        pool.release('test')
        pool.release('test')
        pool.release('test')

        vi.advanceTimersByTime(45_000)
        expect(instances[0]!.terminated).toBe(true)

        // Advancing further should not cause issues (no dangling timers)
        vi.advanceTimersByTime(45_000)
    })

    // --- PoolMetrics totalSpawned / totalTerminated ---

    it('tracks cumulative spawned and terminated counts', () => {
        const { factory } = createMockFactory()
        pool.registerFactory('test', { factory, hot: false })

        pool.getOrCreate('test')
        pool.terminateWorker('test')
        pool.getOrCreate('test')
        pool.terminateWorker('test')
        pool.getOrCreate('test')

        const metrics = pool.getPoolMetrics()
        expect(metrics.totalSpawned).toBe(3)
        expect(metrics.totalTerminated).toBe(2)
    })
})
