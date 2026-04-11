import { describe, it, expect } from 'vitest'
import { LockFreeRingBuffer } from './lockFreeRingBuffer'

// In test env, SAB is unavailable (not cross-origin isolated),
// so the ring buffer falls back to ArrayBuffer-backed mode.

describe('LockFreeRingBuffer', () => {
    describe('create', () => {
        it('creates a ring buffer with default capacity', () => {
            const ring = LockFreeRingBuffer.create()
            expect(ring.getCapacity()).toBe(255) // 256 - 1 reserved slot
            expect(ring.isEmpty()).toBe(true)
            expect(ring.isFull()).toBe(false)
            expect(ring.size).toBe(0)
        })

        it('rounds up capacity to next power of 2', () => {
            const ring = LockFreeRingBuffer.create(100)
            // 100 -> next pow2 = 128
            expect(ring.getCapacity()).toBe(127)
        })

        it('uses ArrayBuffer fallback when SAB is unavailable', () => {
            const ring = LockFreeRingBuffer.create(32)
            expect(ring.isShared()).toBe(false)
        })
    })

    describe('push / pop', () => {
        it('pushes and pops a single value', () => {
            const ring = LockFreeRingBuffer.create(16)
            expect(ring.push(42)).toBe(true)
            expect(ring.size).toBe(1)
            expect(ring.pop()).toBe(42)
            expect(ring.size).toBe(0)
        })

        it('handles multiple values in FIFO order', () => {
            const ring = LockFreeRingBuffer.create(16)
            ring.push(1)
            ring.push(2)
            ring.push(3)
            expect(ring.pop()).toBe(1)
            expect(ring.pop()).toBe(2)
            expect(ring.pop()).toBe(3)
            expect(ring.pop()).toBe(null)
        })

        it('returns false when buffer is full', () => {
            const ring = LockFreeRingBuffer.create(4) // capacity 3 (4-1)
            expect(ring.push(1)).toBe(true)
            expect(ring.push(2)).toBe(true)
            expect(ring.push(3)).toBe(true)
            expect(ring.push(4)).toBe(false) // full
        })

        it('returns null when buffer is empty', () => {
            const ring = LockFreeRingBuffer.create(8)
            expect(ring.pop()).toBe(null)
        })

        it('wraps around correctly', () => {
            const ring = LockFreeRingBuffer.create(4) // capacity 3
            ring.push(1)
            ring.push(2)
            ring.push(3)
            expect(ring.pop()).toBe(1)
            expect(ring.pop()).toBe(2)
            // Now there is space again
            expect(ring.push(4)).toBe(true)
            expect(ring.push(5)).toBe(true)
            expect(ring.pop()).toBe(3)
            expect(ring.pop()).toBe(4)
            expect(ring.pop()).toBe(5)
            expect(ring.pop()).toBe(null)
        })
    })

    describe('pushBatch / popBatch', () => {
        it('pushes a batch of values', () => {
            const ring = LockFreeRingBuffer.create(16)
            const written = ring.pushBatch([10, 20, 30, 40])
            expect(written).toBe(4)
            expect(ring.size).toBe(4)
        })

        it('stops pushing when full', () => {
            const ring = LockFreeRingBuffer.create(4) // capacity 3
            const written = ring.pushBatch([1, 2, 3, 4, 5])
            expect(written).toBe(3)
        })

        it('pops a batch of values', () => {
            const ring = LockFreeRingBuffer.create(16)
            ring.pushBatch([10, 20, 30])
            const batch = ring.popBatch(5)
            expect(batch).toEqual([10, 20, 30])
        })
    })

    describe('fromTransfer', () => {
        it('reconstructs a ring buffer from the raw buffer', () => {
            const producer = LockFreeRingBuffer.create(32)
            producer.push(99)
            producer.push(100)

            const consumer = LockFreeRingBuffer.fromTransfer(producer.getBuffer(), 'consumer')
            expect(consumer.size).toBe(2)
            expect(consumer.pop()).toBe(99)
            expect(consumer.pop()).toBe(100)
        })
    })

    describe('diagnostics', () => {
        it('reports isEmpty and isFull correctly', () => {
            const ring = LockFreeRingBuffer.create(4) // capacity 3
            expect(ring.isEmpty()).toBe(true)
            expect(ring.isFull()).toBe(false)

            ring.push(1)
            ring.push(2)
            ring.push(3)
            expect(ring.isEmpty()).toBe(false)
            expect(ring.isFull()).toBe(true)

            ring.pop()
            expect(ring.isFull()).toBe(false)
        })
    })
})
