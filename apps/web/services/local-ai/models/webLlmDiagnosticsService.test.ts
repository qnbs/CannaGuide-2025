import { describe, it, expect, vi, afterEach } from 'vitest'
import { diagnoseWebLlm, getDiagnosticI18nKey } from './webLlmDiagnosticsService'

vi.mock('../../sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

describe('webLlmDiagnosticsService', () => {
    const originalIsSecureContext = globalThis.isSecureContext

    afterEach(() => {
        vi.restoreAllMocks()
        Object.defineProperty(globalThis, 'isSecureContext', {
            value: originalIsSecureContext,
            writable: true,
            configurable: true,
        })
    })

    const setSecureContext = (value: boolean): void => {
        Object.defineProperty(globalThis, 'isSecureContext', {
            value,
            writable: true,
            configurable: true,
        })
    }

    it('returns force-wasm-override when forceWasm is true', async () => {
        const result = await diagnoseWebLlm({ forceWasm: true })
        expect(result.available).toBe(false)
        expect(result.reason).toBe('force-wasm-override')
        expect(result.details.forceWasm).toBe(true)
    })

    it('returns insecure-context when not in secure context', async () => {
        setSecureContext(false)
        const result = await diagnoseWebLlm()
        expect(result.available).toBe(false)
        expect(result.reason).toBe('insecure-context')
        expect(result.details.secureContext).toBe(false)
    })

    it('returns no-webgpu-api when navigator.gpu is missing', async () => {
        setSecureContext(true)
        // Test environment (jsdom/node) does not have navigator.gpu
        const result = await diagnoseWebLlm()
        // In test env without navigator.gpu, should return no-webgpu-api
        if (!('gpu' in navigator)) {
            expect(result.available).toBe(false)
            expect(result.reason).toBe('no-webgpu-api')
            expect(result.details.webGpuApiPresent).toBe(false)
        }
    })

    it('returns no-model-profile when modelProfileId is missing with GPU available', async () => {
        setSecureContext(true)

        const mockAdapter = {
            info: { description: 'Mock GPU' },
            limits: { maxBufferSize: 8 * 1024 * 1024 * 1024 },
        }
        const mockGpu = {
            requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
        }
        Object.defineProperty(navigator, 'gpu', {
            value: mockGpu,
            writable: true,
            configurable: true,
        })

        const result = await diagnoseWebLlm()
        expect(result.available).toBe(false)
        expect(result.reason).toBe('no-model-profile')

        // Clean up
        Object.defineProperty(navigator, 'gpu', {
            value: undefined,
            writable: true,
            configurable: true,
        })
    })

    it('returns vram-insufficient when VRAM is below 4GB', async () => {
        setSecureContext(true)

        const mockAdapter = {
            info: { description: 'Weak GPU' },
            limits: { maxBufferSize: 2 * 1024 * 1024 * 1024 }, // 2GB
        }
        const mockGpu = {
            requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
        }
        Object.defineProperty(navigator, 'gpu', {
            value: mockGpu,
            writable: true,
            configurable: true,
        })

        const result = await diagnoseWebLlm({ modelProfileId: 'test-model' })
        expect(result.available).toBe(false)
        expect(result.reason).toBe('vram-insufficient')
        expect(result.details.vramSufficient).toBe(false)

        Object.defineProperty(navigator, 'gpu', {
            value: undefined,
            writable: true,
            configurable: true,
        })
    })

    it('returns active when all checks pass', async () => {
        setSecureContext(true)

        const mockAdapter = {
            info: { description: 'Good GPU' },
            limits: { maxBufferSize: 8 * 1024 * 1024 * 1024 }, // 8GB
        }
        const mockGpu = {
            requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
        }
        Object.defineProperty(navigator, 'gpu', {
            value: mockGpu,
            writable: true,
            configurable: true,
        })

        const result = await diagnoseWebLlm({ modelProfileId: 'Qwen2.5-1.5B' })
        expect(result.available).toBe(true)
        expect(result.reason).toBe('active')
        expect(result.details.vramSufficient).toBe(true)
        expect(result.details.adapterDescription).toBe('Good GPU')

        Object.defineProperty(navigator, 'gpu', {
            value: undefined,
            writable: true,
            configurable: true,
        })
    })

    it('returns no-gpu-adapter when requestAdapter returns null', async () => {
        setSecureContext(true)

        const mockGpu = {
            requestAdapter: vi.fn().mockResolvedValue(null),
        }
        Object.defineProperty(navigator, 'gpu', {
            value: mockGpu,
            writable: true,
            configurable: true,
        })

        const result = await diagnoseWebLlm({ modelProfileId: 'test' })
        expect(result.available).toBe(false)
        expect(result.reason).toBe('no-gpu-adapter')

        Object.defineProperty(navigator, 'gpu', {
            value: undefined,
            writable: true,
            configurable: true,
        })
    })
})

describe('getDiagnosticI18nKey', () => {
    it('returns correct i18n key for each reason', () => {
        expect(getDiagnosticI18nKey('active')).toBe('settingsView.localAiDiag.reasons.active')
        expect(getDiagnosticI18nKey('insecure-context')).toBe(
            'settingsView.localAiDiag.reasons.insecure-context',
        )
        expect(getDiagnosticI18nKey('no-webgpu-api')).toBe(
            'settingsView.localAiDiag.reasons.no-webgpu-api',
        )
        expect(getDiagnosticI18nKey('vram-insufficient')).toBe(
            'settingsView.localAiDiag.reasons.vram-insufficient',
        )
        expect(getDiagnosticI18nKey('force-wasm-override')).toBe(
            'settingsView.localAiDiag.reasons.force-wasm-override',
        )
    })
})
