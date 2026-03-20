import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    enqueueInference,
    isWorkerAvailable,
    getQueueSize,
    getActiveCount,
    terminateInferenceWorker,
    resetWorkerState,
} from './inferenceQueueService'

// Mock Worker since it's not available in Node test environment
class MockWorker {
    onmessage: ((e: MessageEvent) => void) | null = null
    onerror: ((e: ErrorEvent) => void) | null = null
    postMessage = vi.fn().mockImplementation((data: { id: string }) => {
        // Simulate async response
        setTimeout(() => {
            this.onmessage?.(
                new MessageEvent('message', {
                    data: { id: data.id, result: [{ generated_text: 'test output' }] },
                }),
            )
        }, 10)
    })
    terminate = vi.fn()
}

vi.stubGlobal('Worker', MockWorker)

describe('inferenceQueueService', () => {
    afterEach(() => {
        terminateInferenceWorker()
        resetWorkerState()
    })

    it('isWorkerAvailable returns true when Worker is defined', () => {
        expect(isWorkerAvailable()).toBe(true)
    })

    it('getQueueSize returns 0 initially', () => {
        expect(getQueueSize()).toBe(0)
    })

    it('getActiveCount returns 0 initially', () => {
        expect(getActiveCount()).toBe(0)
    })

    it('enqueueInference resolves with worker result', async () => {
        const result = await enqueueInference({
            task: 'text-generation',
            modelId: 'test-model',
            input: 'test prompt',
            timeoutMs: 5000,
        })
        expect(result).toEqual([{ generated_text: 'test output' }])
    })

    it('rejects when queue is full', async () => {
        // Fill the queue by making Worker not respond
        const slowWorker = new MockWorker()
        slowWorker.postMessage = vi.fn() // never responds
        vi.stubGlobal(
            'Worker',
            class {
                onmessage: ((e: MessageEvent) => void) | null = null
                onerror: ((e: ErrorEvent) => void) | null = null
                postMessage = vi.fn() // never resolves
                terminate = vi.fn()
            },
        )
        resetWorkerState()

        // Enqueue many tasks (MAX_QUEUE_SIZE = 32 + 1 active = 33 total to fill)
        const promises: Promise<unknown>[] = []
        for (let i = 0; i < 33; i++) {
            promises.push(
                enqueueInference({
                    task: 'text-generation',
                    modelId: 'test-model',
                    input: `prompt ${i}`,
                    timeoutMs: 60000,
                }).catch(() => 'rejected'),
            )
        }

        // The 34th should be rejected because the queue is full
        await expect(
            enqueueInference({
                task: 'text-generation',
                modelId: 'test-model',
                input: 'overflow',
                timeoutMs: 1000,
            }),
        ).rejects.toThrow('queue full')

        // Clean up
        terminateInferenceWorker()
    })

    it('terminateInferenceWorker rejects pending tasks', async () => {
        vi.stubGlobal(
            'Worker',
            class {
                onmessage: ((e: MessageEvent) => void) | null = null
                onerror: ((e: ErrorEvent) => void) | null = null
                postMessage = vi.fn() // never responds
                terminate = vi.fn()
            },
        )
        resetWorkerState()

        const promise = enqueueInference({
            task: 'text-generation',
            modelId: 'test-model',
            input: 'test',
            timeoutMs: 60000,
        })

        terminateInferenceWorker()

        await expect(promise).rejects.toThrow('terminated')
    })
})
