import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock onnxruntime-web
vi.mock('onnxruntime-web', () => ({
    env: { wasm: { wasmPaths: '' } },
    InferenceSession: {
        create: vi.fn().mockResolvedValue({
            run: vi.fn().mockResolvedValue({
                output: { data: new Float32Array([6.1, 1.5, 21.5]) },
            }),
            release: vi.fn(),
        }),
    },
    Tensor: vi.fn().mockImplementation((_type: string, data: Float32Array, _shape: number[]) => ({
        data,
    })),
}))

describe('hydroForecastWorker', () => {
    let handler: (e: MessageEvent) => void

    beforeEach(() => {
        // Capture the onmessage handler set by the worker
        const origOnMessage = Object.getOwnPropertyDescriptor(globalThis, 'onmessage')
        Object.defineProperty(self, 'onmessage', {
            set(fn: (e: MessageEvent) => void) {
                handler = fn
                if (origOnMessage?.set) origOnMessage.set.call(self, fn)
            },
            get() {
                return handler
            },
            configurable: true,
        })
        // Also capture postMessage
        vi.spyOn(self, 'postMessage').mockImplementation(() => {})
    })

    it('responds to FORECAST with fallback when no session', async () => {
        // Import the worker to register the handler
        await import('./hydroForecastWorker')

        const event = new MessageEvent('message', {
            data: {
                messageId: 'test-1',
                type: 'FORECAST',
                payload: { input: null },
            },
        })

        await handler(event)

        expect(self.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                messageId: 'test-1',
                success: true,
                data: expect.objectContaining({
                    ph: 6.0,
                    ec: 1.6,
                    temp: 21.0,
                    modelBased: false,
                }),
            }),
        )
    })

    it('responds to FORECAST with moving average for valid data', async () => {
        await import('./hydroForecastWorker')

        // Create 24 readings: constant pH 6.0, EC 1.5, Temp 22.0
        const input = new Float32Array(72)
        for (let t = 0; t < 24; t++) {
            input[t * 3] = 6.0
            input[t * 3 + 1] = 1.5
            input[t * 3 + 2] = 22.0
        }

        const event = new MessageEvent('message', {
            data: {
                messageId: 'test-2',
                type: 'FORECAST',
                payload: { input },
            },
        })

        await handler(event)

        expect(self.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                messageId: 'test-2',
                success: true,
                data: expect.objectContaining({
                    modelBased: false,
                }),
            }),
        )

        // Verify the prediction is close to the constant input
        const call = vi
            .mocked(self.postMessage)
            .mock.calls.find((c) => (c[0] as { messageId: string }).messageId === 'test-2')
        const data = (call?.[0] as { data: { ph: number; ec: number; temp: number } }).data
        expect(data.ph).toBeCloseTo(6.0, 1)
        expect(data.ec).toBeCloseTo(1.5, 1)
        expect(data.temp).toBeCloseTo(22.0, 0)
    })

    it('responds to TERMINATE without crash', async () => {
        await import('./hydroForecastWorker')

        const event = new MessageEvent('message', {
            data: {
                messageId: 'test-3',
                type: 'TERMINATE',
            },
        })

        await handler(event)

        expect(self.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                messageId: 'test-3',
                success: true,
                data: { status: 'terminated' },
            }),
        )
    })
})
