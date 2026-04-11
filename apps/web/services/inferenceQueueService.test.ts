import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    enqueueInference,
    isWorkerAvailable,
    getQueueSize,
    getActiveCount,
    terminateInferenceWorker,
    resetWorkerState,
} from './inferenceQueueService'
import { workerBus } from '@/services/workerBus'

// Mock Worker that responds via WorkerBus protocol (addEventListener-based)
class MockWorker {
    private _listeners: Array<(event: MessageEvent) => void> = []

    addEventListener(type: string, handler: (event: MessageEvent) => void) {
        if (type === 'message') this._listeners.push(handler)
    }

    removeEventListener(type: string, handler: (event: MessageEvent) => void) {
        if (type === 'message') this._listeners = this._listeners.filter((h) => h !== handler)
    }

    postMessage = vi.fn().mockImplementation((data: { messageId: string }) => {
        setTimeout(() => {
            for (const listener of this._listeners) {
                listener(
                    new MessageEvent('message', {
                        data: {
                            messageId: data.messageId,
                            success: true,
                            data: [{ generated_text: 'test output' }],
                        },
                    }),
                )
            }
        }, 10)
    })
    terminate = vi.fn()
}

vi.stubGlobal('Worker', MockWorker)

describe('inferenceQueueService', () => {
    beforeEach(() => {
        workerBus.reset()
        // W-06: WorkerPool auto-spawn is not wired in tests, so register
        // a MockWorker manually to satisfy workerBus.dispatch().
        workerBus.register('inference', new MockWorker() as unknown as Worker)
    })

    afterEach(() => {
        terminateInferenceWorker()
        resetWorkerState()
        workerBus.reset()
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
        // Use a Worker that never responds so tasks stay active/queued
        vi.stubGlobal(
            'Worker',
            class {
                private _listeners: Array<(event: MessageEvent) => void> = []
                addEventListener(type: string, handler: (event: MessageEvent) => void) {
                    if (type === 'message') this._listeners.push(handler)
                }
                removeEventListener(type: string, handler: (event: MessageEvent) => void) {
                    if (type === 'message')
                        this._listeners = this._listeners.filter((h) => h !== handler)
                }
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
                private _listeners: Array<(event: MessageEvent) => void> = []
                addEventListener(type: string, handler: (event: MessageEvent) => void) {
                    if (type === 'message') this._listeners.push(handler)
                }
                removeEventListener(type: string, handler: (event: MessageEvent) => void) {
                    if (type === 'message')
                        this._listeners = this._listeners.filter((h) => h !== handler)
                }
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

        await expect(promise).rejects.toThrow(/terminated|unregistered|No worker registered/)
    })
})
