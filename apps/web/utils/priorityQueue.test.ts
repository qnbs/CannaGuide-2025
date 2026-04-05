import { describe, expect, it } from 'vitest'
import { PriorityQueue, PRIORITY_VALUES, type WorkerPriority } from '@/utils/priorityQueue'

describe('PriorityQueue', () => {
    it('dequeues highest priority first (lowest numeric value)', () => {
        const pq = new PriorityQueue<string>()
        pq.enqueue('low-job', 'low')
        pq.enqueue('critical-job', 'critical')
        pq.enqueue('normal-job', 'normal')
        pq.enqueue('high-job', 'high')

        expect(pq.dequeue()).toBe('critical-job')
        expect(pq.dequeue()).toBe('high-job')
        expect(pq.dequeue()).toBe('normal-job')
        expect(pq.dequeue()).toBe('low-job')
    })

    it('maintains FIFO order within the same priority', () => {
        const pq = new PriorityQueue<string>()
        pq.enqueue('first', 'normal')
        pq.enqueue('second', 'normal')
        pq.enqueue('third', 'normal')

        expect(pq.dequeue()).toBe('first')
        expect(pq.dequeue()).toBe('second')
        expect(pq.dequeue()).toBe('third')
    })

    it('preserves heap invariant after 100 random insertions', () => {
        const pq = new PriorityQueue<number>()
        const priorities: WorkerPriority[] = ['critical', 'high', 'normal', 'low']
        const items: Array<{ value: number; priority: WorkerPriority }> = []

        for (let i = 0; i < 100; i++) {
            const priority = priorities[i % priorities.length] as WorkerPriority
            items.push({ value: i, priority })
            pq.enqueue(i, priority)
        }

        expect(pq.size).toBe(100)

        let lastPriority = -1
        const results: number[] = []
        while (pq.size > 0) {
            const item = pq.dequeue()
            expect(item).toBeDefined()
            if (item !== undefined) {
                // Find the priority of this item
                const record = items.find((r) => r.value === item)
                expect(record).toBeDefined()
                const numPriority = PRIORITY_VALUES[record?.priority ?? 'low']
                // Priority must be non-decreasing (sorted order)
                expect(numPriority).toBeGreaterThanOrEqual(lastPriority)
                lastPriority = numPriority
                results.push(item)
            }
        }

        expect(results).toHaveLength(100)
    })

    it('returns undefined when dequeuing from empty queue', () => {
        const pq = new PriorityQueue<string>()
        expect(pq.dequeue()).toBeUndefined()
    })

    it('clear() resets the queue', () => {
        const pq = new PriorityQueue<string>()
        pq.enqueue('a', 'critical')
        pq.enqueue('b', 'low')
        expect(pq.size).toBe(2)

        pq.clear()
        expect(pq.size).toBe(0)
        expect(pq.dequeue()).toBeUndefined()
    })

    it('reports correct size after enqueue and dequeue', () => {
        const pq = new PriorityQueue<string>()
        expect(pq.size).toBe(0)

        pq.enqueue('a', 'normal')
        expect(pq.size).toBe(1)

        pq.enqueue('b', 'high')
        expect(pq.size).toBe(2)

        pq.dequeue()
        expect(pq.size).toBe(1)

        pq.dequeue()
        expect(pq.size).toBe(0)
    })

    it('peek returns highest-priority item without removing it', () => {
        const pq = new PriorityQueue<string>()
        pq.enqueue('normal-item', 'normal')
        pq.enqueue('critical-item', 'critical')

        expect(pq.peek()).toBe('critical-item')
        expect(pq.size).toBe(2)
        expect(pq.peek()).toBe('critical-item')
    })

    it('peek returns undefined on empty queue', () => {
        const pq = new PriorityQueue<string>()
        expect(pq.peek()).toBeUndefined()
    })

    it('toArray returns all items without removing them', () => {
        const pq = new PriorityQueue<string>()
        pq.enqueue('a', 'low')
        pq.enqueue('b', 'critical')
        pq.enqueue('c', 'normal')

        const items = pq.toArray()
        expect(items).toHaveLength(3)
        expect(items).toContain('a')
        expect(items).toContain('b')
        expect(items).toContain('c')
        expect(pq.size).toBe(3)
    })

    it('handles single-item enqueue and dequeue', () => {
        const pq = new PriorityQueue<number>()
        pq.enqueue(42, 'high')
        expect(pq.dequeue()).toBe(42)
        expect(pq.size).toBe(0)
    })
})
