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
vi.mock('@cannaguide/ai-core/ml', () => ({
    loadTransformers: async () => ({
        env: { backends: { onnx: { wasm: {} } } },
        pipeline: async () => async () => pipeOutput.value,
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

    it('leaves plain pipeline results unchanged', async () => {
        const labels = [{ label: 'POSITIVE', score: 0.98 }]
        pipeOutput.value = labels

        const reply = await infer('text-classification', 'cls-1')

        expect(reply).toMatchObject({ success: true, data: labels })
        expect(() => structuredClone(reply)).not.toThrow()
    })
})
