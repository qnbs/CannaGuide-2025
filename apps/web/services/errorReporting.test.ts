import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureLocalAiError } from './errorReporting'

describe('captureLocalAiError', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('writes the failure, with its stage and model, to the debug console', () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        const error = new Error('device lost')

        captureLocalAiError(error, { stage: 'webgpu-probe', model: 'qwen', backend: 'webgpu' })

        expect(debug).toHaveBeenCalledTimes(1)
        expect(debug).toHaveBeenCalledWith(
            '[local-ai] webgpu-probe failed',
            { stage: 'webgpu-probe', model: 'qwen', backend: 'webgpu' },
            error,
        )
    })

    it('sends nothing off the device', () => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        const fetchSpy = vi.fn()
        const beacon = vi.fn()
        vi.stubGlobal('fetch', fetchSpy)
        vi.stubGlobal('navigator', { ...globalThis.navigator, sendBeacon: beacon })

        captureLocalAiError(new Error('quota'), { stage: 'cache-write' })

        expect(fetchSpy).not.toHaveBeenCalled()
        expect(beacon).not.toHaveBeenCalled()
        vi.unstubAllGlobals()
    })
})
