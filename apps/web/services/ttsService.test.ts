import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TTSSettings } from '@/types'

const baseSettings: TTSSettings = {
    enabled: true,
    voiceName: null,
    rate: 1,
    pitch: 1,
    volume: 1,
    highlightSpeakingText: true,
    cloudTtsEnabled: false,
    cloudTtsProvider: 'elevenlabs',
    cloudTtsApiKey: null,
}

const setupSpeechEnvironment = () => {
    const speak = vi.fn()
    const cancel = vi.fn()
    const pause = vi.fn()
    const resume = vi.fn()
    const getVoices = vi.fn(() => [
        { name: 'English Default', lang: 'en-US', default: true },
        { name: 'Deutsch', lang: 'de-DE', default: false },
    ])

    const synth = {
        speaking: false,
        onvoiceschanged: null as (() => void) | null,
        getVoices,
        speak,
        cancel,
        pause,
        resume,
    }

    class MockSpeechSynthesisUtterance {
        text: string
        lang = ''
        voice: unknown = null
        pitch = 1
        rate = 1
        volume = 1
        onend: (() => void) | null = null
        onerror: ((event: Event) => void) | null = null

        constructor(text: string) {
            this.text = text
        }
    }

    Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: synth,
    })
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
        configurable: true,
        value: MockSpeechSynthesisUtterance,
    })

    return { synth, speak, cancel, pause, resume, getVoices }
}

const loadService = async () => (await import('./ttsService')).ttsService

describe('ttsService', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it('initializes and returns language-filtered voices', async () => {
        setupSpeechEnvironment()
        const ttsService = await loadService()

        ttsService.init()
        const deVoices = ttsService.getVoices('de')

        expect(ttsService.isSupported()).toBe(true)
        expect(deVoices.length).toBe(1)
        expect(deVoices[0]?.name).toBe('Deutsch')
    })

    it('speaks with selected voice and calls onEnd callback', async () => {
        const { speak } = setupSpeechEnvironment()
        const ttsService = await loadService()
        ttsService.init()

        const onEnd = vi.fn()
        ttsService.speak('Hello world', 'en', onEnd, {
            ...baseSettings,
            voiceName: 'English Default',
        })

        expect(speak).toHaveBeenCalledTimes(1)
        const utterance = speak.mock.calls[0]?.[0] as {
            lang: string
            onend?: () => void
            voice?: { name?: string }
        }

        expect(utterance?.lang).toBe('en-US')
        expect(utterance?.voice?.name).toBe('English Default')

        utterance?.onend?.()
        expect(onEnd).toHaveBeenCalledTimes(1)
    })

    it('falls back to onEnd when speech synthesis is unavailable', async () => {
        Object.defineProperty(window, 'speechSynthesis', {
            configurable: true,
            value: undefined,
        })

        const ttsService = await loadService()
        const onEnd = vi.fn()

        ttsService.speak('No synth', 'en', onEnd, baseSettings)

        expect(ttsService.isSupported()).toBe(false)
        expect(onEnd).toHaveBeenCalledTimes(1)
    })

    it('delegates cancel, pause and resume to speech synthesis', async () => {
        const { cancel, pause, resume } = setupSpeechEnvironment()
        const ttsService = await loadService()

        ttsService.cancel()
        ttsService.pause()
        ttsService.resume()

        expect(cancel).toHaveBeenCalledTimes(1)
        expect(pause).toHaveBeenCalledTimes(1)
        expect(resume).toHaveBeenCalledTimes(1)
    })

    it('conforms to ITTSProvider interface shape', async () => {
        setupSpeechEnvironment()
        const ttsService = await loadService()

        expect(typeof ttsService.isSupported).toBe('function')
        expect(typeof ttsService.init).toBe('function')
        expect(typeof ttsService.getVoices).toBe('function')
        expect(typeof ttsService.speak).toBe('function')
        expect(typeof ttsService.cancel).toBe('function')
        expect(typeof ttsService.pause).toBe('function')
        expect(typeof ttsService.resume).toBe('function')
    })

    it('speaks with a different language parameter', async () => {
        const { speak } = setupSpeechEnvironment()
        const ttsService = await loadService()
        ttsService.init()

        const onEnd = vi.fn()
        ttsService.speak('Hallo Welt', 'de', onEnd, baseSettings)

        expect(speak).toHaveBeenCalledTimes(1)
        const utterance = speak.mock.calls[0]?.[0] as { lang: string }
        expect(utterance?.lang).toBe('de-DE')
    })
})
