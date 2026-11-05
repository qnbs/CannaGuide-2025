import { beforeEach, describe, expect, it, vi } from 'vitest'

// transformers.js returns feature-extraction output as a Tensor whose
// constructor returns a Proxy; structured clone rejects it, so the worker's
// reply never reached embeddingService (GH #635).

class ProxiedTensor {
    type = 'float32'
    dims = [1, 3]
    data = new Float32Array([0.25, 0.5, 0.75])
    constructor() {
        return new Proxy(this, { get: (target, key) => Reflect.get(target, key) })
    }
}

const pipeOutput = vi.hoisted(() => ({ value: undefined as unknown }))
const pipelineCalls = vi.hoisted(() => ({ count: 0 }))
// Holds pipeline creation open, as a download in progress does.
const pipelineGate = vi.hoisted(() => ({ wait: Promise.resolve() }))
// A failure the next pipeline creation throws, if set.
const pipelineError = vi.hoisted(() => ({ value: null as Error | null }))
// One env object for the whole worker, as transformers.js has.
const workerEnv = vi.hoisted(
    () => ({ backends: { onnx: { wasm: {} } } }) as Record<string, unknown>,
)
vi.mock('@cannaguide/ai-core/ml', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@cannaguide/ai-core/ml')>()),
    loadTransformers: async () => ({
        env: workerEnv,
        pipeline: async () => {
            pipelineCalls.count += 1
            await pipelineGate.wait
            if (pipelineError.value) throw pipelineError.value
            return async () => pipeOutput.value
        },
    }),
}))

describe('inference.worker replies', () => {
    let handler: (e: MessageEvent) => Promise<void>

    beforeEach(() => {
        Object.defineProperty(self, 'onmessage', {
            set(fn: (e: MessageEvent) => Promise<void>) {
                handler = fn
            },
            get() {
                return handler
            },
            configurable: true,
        })
        vi.spyOn(self, 'postMessage').mockImplementation(() => {})
    })

    const infer = async (task: string, messageId: string) => {
        await import('./inference.worker')
        vi.mocked(self.postMessage).mockClear()
        // initAbortHandler wraps onmessage without returning the inner promise,
        // so wait for the reply rather than for the handler.
        void handler(
            new MessageEvent('message', {
                data: { messageId, type: 'INFER', payload: { task, modelId: 'm', input: 'x' } },
            }),
        )
        await vi.waitFor(() => expect(self.postMessage).toHaveBeenCalled())
        return vi.mocked(self.postMessage).mock.calls.at(-1)?.[0] as {
            success: boolean
            data?: unknown
            error?: string
            errorCode?: string
        }
    }

    it('posts a feature-extraction Tensor as plain, cloneable { type, dims, data }', async () => {
        expect(() => structuredClone(new ProxiedTensor())).toThrow(/could not be cloned/)
        pipeOutput.value = new ProxiedTensor()

        const reply = await infer('feature-extraction', 'emb-1')

        expect(reply.success).toBe(true)
        expect(() => structuredClone(reply)).not.toThrow()
        expect(reply.data).toEqual({
            type: 'float32',
            dims: [1, 3],
            data: new Float32Array([0.25, 0.5, 0.75]),
        })
        expect((reply.data as { data: Float32Array }).data).toBeInstanceOf(Float32Array)
    })

    it('rejects a tensor whose dims do not match its data instead of posting success', async () => {
        const broken = new ProxiedTensor()
        broken.dims = [1, 384]
        pipeOutput.value = broken

        const reply = await infer('feature-extraction', 'emb-2')

        expect(reply.success).toBe(false)
        expect(reply.error).toMatch(/dims \[1,384\] describe 384 values but data has 3/)
    })

    it('leaves plain pipeline results unchanged', async () => {
        const labels = [{ label: 'POSITIVE', score: 0.98 }]
        pipeOutput.value = labels

        const reply = await infer('text-classification', 'cls-1')

        expect(reply).toMatchObject({ success: true, data: labels })
        expect(() => structuredClone(reply)).not.toThrow()
    })

    it('in Local-Only Mode refuses a model that is not downloaded, with its own code', async () => {
        await import('./inference.worker')
        vi.mocked(self.postMessage).mockClear()
        pipelineCalls.count = 0

        void handler(
            new MessageEvent('message', {
                data: {
                    messageId: 'lo-1',
                    type: 'INFER',
                    payload: {
                        task: 'feature-extraction',
                        modelId: 'Xenova/not-cached',
                        input: 'x',
                        localOnly: true,
                    },
                },
            }),
        )
        await vi.waitFor(() => expect(self.postMessage).toHaveBeenCalled())

        expect(vi.mocked(self.postMessage).mock.calls[0]?.[0]).toMatchObject({
            messageId: 'lo-1',
            success: false,
            errorCode: 'MODEL_DOWNLOAD_BLOCKED',
        })
        expect(pipelineCalls.count).toBe(0)
    })

    it('in Local-Only Mode does not hand out a download still under way', async () => {
        await import('./inference.worker')
        const send = (messageId: string, localOnly: boolean) =>
            void handler(
                new MessageEvent('message', {
                    data: {
                        messageId,
                        type: 'INFER',
                        payload: {
                            task: 'text-classification',
                            modelId: 'Xenova/slow',
                            input: 'x',
                            localOnly,
                        },
                    },
                }),
            )
        let release: () => void = () => undefined
        pipelineGate.wait = new Promise<void>((resolve) => (release = resolve))
        vi.mocked(self.postMessage).mockClear()

        send('slow-1', false)
        send('slow-2', true)
        await vi.waitFor(() => expect(self.postMessage).toHaveBeenCalled())

        expect(vi.mocked(self.postMessage).mock.calls[0]?.[0]).toMatchObject({
            messageId: 'slow-2',
            success: false,
            errorCode: 'MODEL_DOWNLOAD_BLOCKED',
        })
        release()
        pipelineGate.wait = Promise.resolve()
    })

    const tellLocalOnly = (enabled: boolean) =>
        handler(
            new MessageEvent('message', {
                data: {
                    messageId: `lo-${String(enabled)}`,
                    type: 'LOCAL_ONLY',
                    payload: { enabled },
                },
            }),
        )

    it('a LOCAL_ONLY message makes the loaded env cache-only, with no reply', async () => {
        await infer('text-classification', 'warm-1')
        vi.mocked(self.postMessage).mockClear()

        await tellLocalOnly(true)

        try {
            await vi.waitFor(() =>
                expect(workerEnv).toMatchObject({
                    allowRemoteModels: false,
                    allowLocalModels: true,
                }),
            )
            // Posted outside the bus: nothing waits for an answer.
            expect(self.postMessage).not.toHaveBeenCalled()
        } finally {
            await tellLocalOnly(false)
        }
    })

    it('after LOCAL_ONLY a task with a stale localOnly: false still loads cache-only', async () => {
        await import('./inference.worker')
        await tellLocalOnly(true)
        vi.mocked(self.postMessage).mockClear()
        pipelineCalls.count = 0
        try {
            // Dispatched before the switch, or replayed after a preemption.
            void handler(
                new MessageEvent('message', {
                    data: {
                        messageId: 'stale-1',
                        type: 'INFER',
                        payload: {
                            task: 'feature-extraction',
                            modelId: 'Xenova/stale',
                            input: 'x',
                            localOnly: false,
                        },
                    },
                }),
            )
            await vi.waitFor(() => expect(self.postMessage).toHaveBeenCalled())
            expect(vi.mocked(self.postMessage).mock.calls[0]?.[0]).toMatchObject({
                messageId: 'stale-1',
                errorCode: 'MODEL_DOWNLOAD_BLOCKED',
            })
            expect(pipelineCalls.count).toBe(0)
        } finally {
            await tellLocalOnly(false)
        }
    })

    it('a file refused after the switch is reported with the blocked code', async () => {
        pipelineError.value = new Error(
            '`env.allowRemoteModels=false` and file was not found locally at "x".',
        )
        try {
            await import('./inference.worker')
            vi.mocked(self.postMessage).mockClear()
            // A model of its own: the helper's model is already loaded by earlier tests.
            void handler(
                new MessageEvent('message', {
                    data: {
                        messageId: 'late-refusal',
                        type: 'INFER',
                        payload: {
                            task: 'text-classification',
                            modelId: 'Xenova/late',
                            input: 'x',
                        },
                    },
                }),
            )
            await vi.waitFor(() => expect(self.postMessage).toHaveBeenCalled())
            expect(vi.mocked(self.postMessage).mock.calls[0]?.[0]).toMatchObject({
                messageId: 'late-refusal',
                success: false,
                errorCode: 'MODEL_DOWNLOAD_BLOCKED',
            })
        } finally {
            pipelineError.value = null
        }
    })

    it('a later LOCAL_ONLY off wins over an earlier on that was still waiting', async () => {
        await infer('text-classification', 'warm-2')
        workerEnv.allowRemoteModels = true

        const on = tellLocalOnly(true)
        const off = tellLocalOnly(false)
        await Promise.all([on, off])

        expect(workerEnv.allowRemoteModels).toBe(true)
    })
})
