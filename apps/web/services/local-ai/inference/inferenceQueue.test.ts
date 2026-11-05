import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    enqueueInference,
    isWorkerAvailable,
    getQueueSize,
    getActiveCount,
    terminateInferenceWorker,
    resetWorkerState,
    applyLocalOnlyModeToInferenceWorker,
} from './inferenceQueue'
import { workerBus } from '@/services/workerBus'
import { setLocalOnlyMode } from '@/services/localOnlyModeService'
import { ModelDownloadBlockedError } from '@cannaguide/ai-core/ml'
import { reportModelDownloadBlocked } from '../models/modelDownloadBlocked'

vi.mock('../models/modelDownloadBlocked', () => ({ reportModelDownloadBlocked: vi.fn() }))

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

describe('inferenceQueue in Local-Only Mode (GH #700)', () => {
    const posted: Array<{ type?: string; payload?: { localOnly?: boolean } }> = []

    /** A worker that refuses every model, as the real one does for an uncached model. */
    class RefusingWorker {
        private listeners: Array<(event: MessageEvent) => void> = []
        addEventListener(type: string, handler: (event: MessageEvent) => void) {
            if (type === 'message') this.listeners.push(handler)
        }
        removeEventListener(type: string, handler: (event: MessageEvent) => void) {
            if (type === 'message') this.listeners = this.listeners.filter((h) => h !== handler)
        }
        postMessage = vi.fn(
            (data: { messageId: string; type?: string; payload?: { localOnly?: boolean } }) => {
                posted.push(data)
                setTimeout(() => {
                    for (const listener of this.listeners) {
                        listener(
                            new MessageEvent('message', {
                                data: {
                                    messageId: data.messageId,
                                    success: false,
                                    error: 'Local-Only Mode blocks downloading the model Xenova/x',
                                    errorCode: 'MODEL_DOWNLOAD_BLOCKED',
                                },
                            }),
                        )
                    }
                }, 0)
            },
        )
        terminate = vi.fn()
    }

    beforeEach(() => {
        posted.length = 0
        workerBus.reset()
        workerBus.register('inference', new RefusingWorker() as unknown as Worker)
    })

    afterEach(() => {
        setLocalOnlyMode(false)
        terminateInferenceWorker()
        resetWorkerState()
        workerBus.reset()
    })

    it('sends the mode with the task, and keeps a refusal typed without retrying', async () => {
        setLocalOnlyMode(true)

        const result = enqueueInference({
            task: 'feature-extraction',
            modelId: 'Xenova/x',
            input: 'a',
            timeoutMs: 5000,
        })

        await expect(result).rejects.toBeInstanceOf(ModelDownloadBlockedError)
        await expect(result).rejects.toMatchObject({ modelId: 'Xenova/x' })
        expect(posted).toHaveLength(1)
        expect(posted[0]?.payload?.localOnly).toBe(true)
        expect(reportModelDownloadBlocked).toHaveBeenCalledWith(
            expect.any(ModelDownloadBlockedError),
        )
    })

    it('a switch to Local-Only Mode reaches a running worker, and starts none', async () => {
        await applyLocalOnlyModeToInferenceWorker(false)
        expect(posted).toHaveLength(0)

        // The refusing worker answers every message with an error; the control
        // message only has to arrive.
        await applyLocalOnlyModeToInferenceWorker(true).catch(() => undefined)
        expect(posted).toHaveLength(1)
        expect(posted[0]).toMatchObject({ type: 'LOCAL_ONLY' })

        workerBus.reset()
        await applyLocalOnlyModeToInferenceWorker(true)
        expect(posted).toHaveLength(1)
    })
})
