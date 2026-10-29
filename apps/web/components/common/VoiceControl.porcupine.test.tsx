/**
 * VoiceControl reads the Porcupine access key from its encrypted store, not
 * from the settings (#709). Dynamic import after the SpeechRecognition stub,
 * as in VoiceControl.test.tsx (support is evaluated at module load).
 */
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'

// Synthetic canaries, never real keys.
const STORED = 'pv_canary_stored_00000000000000000000'
const LEGACY = 'pv_canary_legacy_00000000000000000000'

const keyStore = vi.hoisted(() => ({
    key: null as string | null,
    listeners: new Set<() => void>(),
}))
let legacyKey: string | null = null

vi.mock('@/services/porcupineKeyService', () => ({
    porcupineKeyService: {
        getApiKey: vi.fn(async () => keyStore.key),
        subscribe: vi.fn((listener: () => void) => {
            keyStore.listeners.add(listener)
            return () => keyStore.listeners.delete(listener)
        }),
    },
}))
vi.mock('@/services/porcupineWakeWordService', () => ({
    porcupineWakeWordService: {
        init: vi.fn(async () => true),
        start: vi.fn(async () => undefined),
        stop: vi.fn(async () => undefined),
        setCallback: vi.fn(),
    },
}))
vi.mock('@/services/voiceTelemetryService', () => ({
    voiceTelemetryService: { recordVoiceEvent: vi.fn() },
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/stores/useUIStore', () => ({
    useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
            voiceControl: { isListening: false, isAvailable: true, statusMessage: null },
            setVoiceListening: vi.fn(),
            setVoiceStatusMessage: vi.fn(),
            processVoiceCommand: vi.fn(),
        }),
}))
vi.mock('@/stores/store', () => ({
    useAppSelector: (selector: (s: unknown) => unknown) =>
        selector({
            settings: {
                settings: {
                    general: { language: 'en' },
                    voiceControl: {
                        hotwordEnabled: true,
                        continuousListening: false,
                        wakeWordEngine: 'porcupine',
                        porcupineAccessKey: legacyKey,
                        porcupineKeyword: 'porcupine',
                    },
                },
            },
        }),
}))
vi.mock('@/stores/selectors', () => ({
    selectLanguage: (s: { settings: { settings: { general: { language: string } } } }) =>
        s.settings.settings.general.language,
    selectSettings: (s: { settings: { settings: unknown } }) => s.settings.settings,
}))
vi.mock('@/components/icons/PhosphorIcons', () => ({
    PhosphorIcons: { Microphone: () => React.createElement('svg') },
}))
vi.mock('./Button', () => ({
    Button: ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
        React.createElement('button', rest, children),
}))

type WindowWithSpeech = Window & { SpeechRecognition?: unknown }
class MockSpeechRecognition {
    continuous = false
    interimResults = false
    lang = ''
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    start = vi.fn()
    stop = vi.fn()
    abort = vi.fn()
}

const renderVoiceControl = async () => {
    vi.resetModules()
    const { VoiceControl } = await import('./VoiceControl')
    const { porcupineWakeWordService } = await import('@/services/porcupineWakeWordService')
    render(<VoiceControl />)
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
    return porcupineWakeWordService
}

describe('VoiceControl -- Porcupine access key (#709)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        keyStore.key = null
        keyStore.listeners.clear()
        legacyKey = null
        ;(window as WindowWithSpeech).SpeechRecognition = MockSpeechRecognition
    })

    afterEach(() => {
        cleanup()
        delete (window as WindowWithSpeech).SpeechRecognition
    })

    it('initializes Porcupine with the key from the encrypted store', async () => {
        keyStore.key = STORED
        const porcupine = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledWith(STORED, 'porcupine')
        expect(porcupine.start).toHaveBeenCalled()
    })

    it('falls back to a legacy key whose migration has not succeeded yet', async () => {
        legacyKey = LEGACY
        const porcupine = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledWith(LEGACY, 'porcupine')
    })

    it('stays on the regex fallback without any key', async () => {
        const porcupine = await renderVoiceControl()
        expect(porcupine.init).not.toHaveBeenCalled()
    })

    it('a newly saved key starts Porcupine without a reload', async () => {
        const porcupine = await renderVoiceControl()
        expect(porcupine.init).not.toHaveBeenCalled()
        keyStore.key = STORED
        await act(async () => {
            for (const listener of keyStore.listeners) listener()
            await new Promise((resolve) => setTimeout(resolve, 0))
        })
        expect(porcupine.init).toHaveBeenCalledWith(STORED, 'porcupine')
    })
})
