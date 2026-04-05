/**
 * Generic min-heap priority queue with FIFO tiebreaking.
 *
 * Lower numeric priority values are dequeued first. Items with equal
 * priority are returned in insertion order (FIFO).
 *
 * Used by WorkerBus to guarantee that critical dispatches (e.g. VPD alerts)
 * are processed before lower-priority work (e.g. ML inference).
 */

// ---------------------------------------------------------------------------
// Priority types
// ---------------------------------------------------------------------------

/**
 * Dispatch priority levels for WorkerBus.
 *
 * Priority Guide:
 *   critical -- VPD alerts, safety-critical plant monitoring (<100ms target)
 *   high     -- user-initiated simulation, interactive AI queries
 *   normal   -- standard operations (default)
 *   low      -- ML inference (WebLLM/ONNX), image generation, background tasks
 */
export type WorkerPriority = 'critical' | 'high' | 'normal' | 'low'

export const PRIORITY_VALUES: Record<WorkerPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
}

// ---------------------------------------------------------------------------
// Heap node
// ---------------------------------------------------------------------------

interface HeapNode<T> {
    item: T
    priority: number
    insertOrder: number
}

// ---------------------------------------------------------------------------
// PriorityQueue
// ---------------------------------------------------------------------------

export class PriorityQueue<T> {
    private heap: Array<HeapNode<T>> = []
    private counter = 0

    get size(): number {
        return this.heap.length
    }

    enqueue(item: T, priority: WorkerPriority): void {
        const node: HeapNode<T> = {
            item,
            priority: PRIORITY_VALUES[priority],
            insertOrder: this.counter++,
        }
        this.heap.push(node)
        this.bubbleUp(this.heap.length - 1)
    }

    dequeue(): T | undefined {
        if (this.heap.length === 0) return undefined
        const top = this.heap[0]
        const last = this.heap.pop()
        if (this.heap.length > 0 && last !== undefined) {
            this.heap[0] = last
            this.sinkDown(0)
        }
        return top?.item
    }

    peek(): T | undefined {
        return this.heap[0]?.item
    }

    clear(): void {
        this.heap = []
    }

    /**
     * Iterate all queued items in heap order (not sorted -- use for inspection only).
     * Does NOT remove items.
     */
    toArray(): T[] {
        return this.heap.map((n) => n.item)
    }

    // -- Heap internals -----------------------------------------------------

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIdx = (index - 1) >>> 1
            const current = this.heap[index]
            const parent = this.heap[parentIdx]
            if (current === undefined || parent === undefined) break
            if (this.isHigher(current, parent)) {
                this.heap[parentIdx] = current
                this.heap[index] = parent
                index = parentIdx
            } else {
                break
            }
        }
    }

    private sinkDown(index: number): void {
        const length = this.heap.length
        while (true) {
            const left = 2 * index + 1
            const right = 2 * index + 2
            let smallest = index

            const smallestNode = this.heap[smallest]
            const leftNode = this.heap[left]
            const rightNode = this.heap[right]

            if (smallestNode === undefined) break

            if (left < length && leftNode !== undefined && this.isHigher(leftNode, smallestNode)) {
                smallest = left
            }

            const updatedSmallest = this.heap[smallest]
            if (
                right < length &&
                rightNode !== undefined &&
                updatedSmallest !== undefined &&
                this.isHigher(rightNode, updatedSmallest)
            ) {
                smallest = right
            }

            if (smallest !== index) {
                const temp = this.heap[index]
                const swapTarget = this.heap[smallest]
                if (temp !== undefined && swapTarget !== undefined) {
                    this.heap[index] = swapTarget
                    this.heap[smallest] = temp
                }
                index = smallest
            } else {
                break
            }
        }
    }

    /** Returns true if `a` should be dequeued before `b`. */
    private isHigher(a: HeapNode<T>, b: HeapNode<T>): boolean {
        if (a.priority !== b.priority) return a.priority < b.priority
        return a.insertOrder < b.insertOrder
    }
}
