import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// loadOnnxRuntime must hand ORT integrity-verified wasm bytes and never a
// `wasmPaths` prefix: with a prefix, onnxruntime-web 1.30 resolves its JS glue
// against the CDN and import()s it unverified (GH #585).

const ortEnv = vi.hoisted(() => ({ wasm: {} as Record<string, unknown> }))
vi.mock('onnxruntime-web', () => ({ env: ortEnv }))

import {
    ORT_WASM_SRI,
    ORT_WASM_URL,
    fetchVerifiedOrtWasm,
    loadOnnxRuntime,
    resetVerifiedOrtWasmForTests,
} from '@cannaguide/ai-core/ml'

const wasmResponse = (bytes: Uint8Array, status = 200) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        arrayBuffer: async () => bytes.buffer,
    }) as unknown as Response

describe('onnxruntime-web wasm integrity', () => {
    beforeEach(() => {
        resetVerifiedOrtWasmForTests()
        ortEnv.wasm = {}
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('loads ORT with browser-verified bytes and no wasmPaths', async () => {
        const bytes = new Uint8Array([0, 97, 115, 109])
        const fetchMock = vi.fn(async () => wasmResponse(bytes))
        vi.stubGlobal('fetch', fetchMock)

        const ort = await loadOnnxRuntime()

        expect(fetchMock).toHaveBeenCalledOnce()
        expect(fetchMock).toHaveBeenCalledWith(ORT_WASM_URL, {
            integrity: ORT_WASM_SRI,
            mode: 'cors',
            credentials: 'omit',
        })
        expect(ort.env.wasm.wasmBinary).toBe(bytes.buffer)
        // A prefix would make ORT import its glue JS from the CDN.
        expect(ort.env.wasm).not.toHaveProperty('wasmPaths')
    })

    it('downloads once per realm and reuses the verified bytes', async () => {
        const fetchMock = vi.fn(async () => wasmResponse(new Uint8Array([1])))
        vi.stubGlobal('fetch', fetchMock)

        await loadOnnxRuntime()
        await loadOnnxRuntime()

        expect(fetchMock).toHaveBeenCalledOnce()
    })

    it('fails closed on an integrity mismatch and retries on the next call', async () => {
        // The browser rejects a digest mismatch as a network error before any byte
        // is readable; ORT must not be configured with anything in that case.
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch (integrity mismatch)'))
            .mockResolvedValueOnce(wasmResponse(new Uint8Array([2])))
        vi.stubGlobal('fetch', fetchMock)

        await expect(loadOnnxRuntime()).rejects.toThrow(/integrity/)
        expect(ortEnv.wasm).not.toHaveProperty('wasmBinary')

        await expect(loadOnnxRuntime()).resolves.toBeDefined()
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('treats an HTTP error as a failed download', async () => {
        const fetchImpl = vi.fn(async () => wasmResponse(new Uint8Array(), 404))

        await expect(fetchVerifiedOrtWasm(fetchImpl)).rejects.toThrow(/HTTP 404/)
        expect(ortEnv.wasm).not.toHaveProperty('wasmBinary')
    })
})
