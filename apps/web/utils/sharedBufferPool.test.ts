import { describe, it, expect } from 'vitest'
import { SharedBufferPool, getSharedBufferPool, disposeSharedBufferPool } from './sharedBufferPool'

// In test environment, SharedArrayBuffer may be available but
// crossOriginIsolated is false, so the pool falls back to ArrayBuffer.

describe('SharedBufferPool', () => {
    describe('acquire / release', () => {
        it('returns a PooledBuffer with buffer and release function', () => {
            const pool = new SharedBufferPool(1024)
            const pooled = pool.acquire()
            expect(pooled.buffer).toBeInstanceOf(ArrayBuffer)
            expect(typeof pooled.release).toBe('function')
            expect(pooled.shared).toBe(false) // not isolated in test env
            pooled.release()
            pool.dispose()
        })

        it('reuses returned buffers', () => {
            const pool = new SharedBufferPool(512)
            const first = pool.acquire()
            const buf = first.buffer
            first.release()

            const second = pool.acquire()
            expect(second.buffer).toBe(buf) // same buffer reused
            second.release()
            pool.dispose()
        })

        it('throws after dispose', () => {
            const pool = new SharedBufferPool()
            pool.dispose()
            expect(() => pool.acquire()).toThrow('disposed')
        })
    })

    describe('acquireInt32', () => {
        it('returns a typed Int32Array view', () => {
            const pool = new SharedBufferPool(256)
            const { view, release, shared } = pool.acquireInt32()
            expect(view).toBeInstanceOf(Int32Array)
            expect(shared).toBe(false)
            release()
            pool.dispose()
        })
    })

    describe('availableCount', () => {
        it('tracks pool size', () => {
            const pool = new SharedBufferPool(128)
            expect(pool.availableCount).toBe(0)
            const a = pool.acquire()
            const b = pool.acquire()
            a.release()
            expect(pool.availableCount).toBe(1)
            b.release()
            expect(pool.availableCount).toBe(2)
            pool.dispose()
        })
    })

    describe('singleton', () => {
        it('getSharedBufferPool returns the same instance', () => {
            disposeSharedBufferPool()
            const a = getSharedBufferPool()
            const b = getSharedBufferPool()
            expect(a).toBe(b)
            disposeSharedBufferPool()
        })
    })
})
