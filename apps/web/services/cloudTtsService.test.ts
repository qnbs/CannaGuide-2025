import { describe, expect, it, vi, beforeEach } from 'vitest'
import { cloudTtsService } from '@/services/cloudTtsService'

// The key comes from the encrypted key store, never from settings (#654).
vi.mock('@/services/cloudTtsKeyService', () => ({
    cloudTtsKeyService: { getApiKey: vi.fn().mockResolvedValue('decrypted-api-key') },
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock AudioContext
const mockDecodeAudioData = vi.fn().mockResolvedValue({
    duration: 1.5,
})
const mockCreateBufferSource = vi.fn().mockReturnValue({
    buffer: null,
    connect: vi.fn().mockReturnValue({ connect: vi.fn() }),
    start: vi.fn(),
    addEventListener: vi.fn(),
})
const mockCreateGain = vi.fn().mockReturnValue({
    gain: { value: 1 },
    connect: vi.fn(),
})
vi.stubGlobal(
    'AudioContext',
    vi.fn().mockImplementation(() => ({
        decodeAudioData: mockDecodeAudioData,
        createBufferSource: mockCreateBufferSource,
        createGain: mockCreateGain,
        destination: {},
        close: vi.fn(),
    })),
)

describe('cloudTtsService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('has providerName set to elevenlabs', () => {
        expect(cloudTtsService.providerName).toBe('elevenlabs')
    })

    it('isSupported returns false when no API key is set', () => {
        cloudTtsService.setApiKeyConfigured(false)
        expect(cloudTtsService.isSupported()).toBe(false)
    })

    it('isSupported returns true when API key is set', () => {
        cloudTtsService.setApiKeyConfigured(true)
        expect(cloudTtsService.isSupported()).toBe(true)
    })

    it('speak calls fetch with correct ElevenLabs URL', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
        })

        cloudTtsService.setApiKeyConfigured(true)
        const onEnd = vi.fn()

        cloudTtsService.speak('Hello world', 'en', onEnd, {
            enabled: true,
            rate: 1,
            pitch: 1,
            volume: 1,
            voiceName: '',
            highlightSpeakingText: false,
            cloudTtsEnabled: true,
            cloudTtsProvider: 'elevenlabs',
            cloudTtsApiKey: null,
        })

        // speak() fires async internally -- wait for microtask queue
        await vi.waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1)
        })
        const callUrl = mockFetch.mock.calls[0]?.[0] as string
        expect(callUrl).toContain('api.elevenlabs.io')
    })

    it('calls onEnd when fetch fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        cloudTtsService.setApiKeyConfigured(true)
        const onEnd = vi.fn()

        cloudTtsService.speak('Hello', 'en', onEnd, {
            enabled: true,
            rate: 1,
            pitch: 1,
            volume: 1,
            voiceName: '',
            highlightSpeakingText: false,
            cloudTtsEnabled: true,
            cloudTtsProvider: 'elevenlabs',
            cloudTtsApiKey: null,
        })

        // speak() fires async internally -- wait for microtask queue
        await vi.waitFor(() => {
            expect(onEnd).toHaveBeenCalled()
        })
    })

    it('cancel does not throw', () => {
        expect(() => cloudTtsService.cancel()).not.toThrow()
    })
})
