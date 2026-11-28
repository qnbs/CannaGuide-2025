/**
 * VoiceControl reads the Porcupine access key from its encrypted store, not
 * from the settings (#709). Dynamic import after the SpeechRecognition stub,
 * as in VoiceControl.test.tsx (support is evaluated at module load).
 */
import { act, cleanup, fireEvent, render } from '@testing-library/react'
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
let localOnly = false
let hotword = true
let engine: 'regex' | 'porcupine' = 'porcupine'
let speechConsentVersion: number | null = null

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
        dispose: vi.fn(async () => undefined),
        setCallback: vi.fn(),
    },
}))
vi.mock('@/services/voiceTelemetryService', () => ({
    voiceTelemetryService: { recordVoiceEvent: vi.fn() },
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('./BrowserSpeechConsentDialog', () => ({
    BrowserSpeechConsentDialog: ({ isOpen, onAllow }: { isOpen: boolean; onAllow: () => void }) =>
        isOpen
            ? React.createElement(
                  'button',
                  { onClick: onAllow, 'aria-label': 'allow-browser-speech' },
                  'allow',
              )
            : null,
}))
vi.mock('@/stores/useUIStore', () => ({
    useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
            voiceControl: { isListening: false, isAvailable: true, statusMessage: null },
            setVoiceListening: vi.fn(),
            setVoiceStatusMessage: vi.fn(),
            processVoiceCommand: vi.fn(),
            addNotification: vi.fn(),
        }),
}))
vi.mock('@/stores/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (s: unknown) => unknown) =>
        selector({
            settings: {
                settings: {
                    general: { language: 'en' },
                    voiceControl: {
                        hotwordEnabled: hotword,
                        continuousListening: false,
                        wakeWordEngine: engine,
                        porcupineAccessKey: legacyKey,
                        porcupineKeyword: 'porcupine',
                    },
                    privacy: {
                        localOnlyMode: localOnly,
                        webSpeechConsentVersion: speechConsentVersion,
                    },
                },
            },
        }),
}))
vi.mock('@/stores/selectors', () => ({
    selectLanguage: (s: { settings: { settings: { general: { language: string } } } }) =>
        s.settings.settings.general.language,
    selectSettings: (s: { settings: { settings: unknown } }) => s.settings.settings,
    selectLocalOnlyMode: (s: { settings: { settings: { privacy: { localOnlyMode: boolean } } } }) =>
        s.settings.settings.privacy.localOnlyMode,
}))
vi.mock('@/components/icons/PhosphorIcons', () => ({
    PhosphorIcons: { Microphone: () => React.createElement('svg') },
}))
vi.mock('./Button', () => ({
    Button: ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
        React.createElement('button', rest, children),
}))

type WindowWithSpeech = Window & { SpeechRecognition?: unknown }
const startBrowserSpeech = vi.fn()
const constructBrowserSpeech = vi.fn()
const mockSpeechInstances: Array<{ abort: ReturnType<typeof vi.fn> }> = []
class MockSpeechRecognition {
    continuous = false
    interimResults = false
    lang = ''
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    start = startBrowserSpeech
    stop = vi.fn()
    abort = vi.fn()

    constructor() {
        constructBrowserSpeech()
        mockSpeechInstances.push(this)
    }
}

const settle = () =>
    act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
    })

const renderVoiceControl = async () => {
    vi.resetModules()
    const { VoiceControl } = await import('./VoiceControl')
    const { porcupineWakeWordService } = await import('@/services/porcupineWakeWordService')
    const view = render(<VoiceControl />)
    await settle()
    return { porcupine: porcupineWakeWordService, view, VoiceControl }
}

const changeStoredKey = async (key: string | null) => {
    keyStore.key = key
    await act(async () => {
        for (const listener of keyStore.listeners) listener()
    })
    await settle()
}

describe('VoiceControl -- Porcupine access key (#709)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        keyStore.key = null
        keyStore.listeners.clear()
        legacyKey = null
        localOnly = false
        hotword = true
        engine = 'porcupine'
        speechConsentVersion = null
        mockSpeechInstances.length = 0
        ;(window as WindowWithSpeech).SpeechRecognition = MockSpeechRecognition
    })

    afterEach(() => {
        cleanup()
        delete (window as WindowWithSpeech).SpeechRecognition
    })

    it('initializes Porcupine with the key from the encrypted store', async () => {
        keyStore.key = STORED
        speechConsentVersion = 1
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledWith(STORED, 'porcupine')
        expect(porcupine.start).toHaveBeenCalled()
        expect(constructBrowserSpeech).not.toHaveBeenCalled()
        expect(startBrowserSpeech).not.toHaveBeenCalled()
    })

    it('falls back to a legacy key whose migration has not succeeded yet', async () => {
        legacyKey = LEGACY
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledWith(LEGACY, 'porcupine')
        expect(constructBrowserSpeech).not.toHaveBeenCalled()
        expect(startBrowserSpeech).not.toHaveBeenCalled()
    })

    it('does not implicitly start browser speech when the Porcupine key is missing', async () => {
        speechConsentVersion = 1
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).not.toHaveBeenCalled()
        expect(constructBrowserSpeech).not.toHaveBeenCalled()
        expect(startBrowserSpeech).not.toHaveBeenCalled()
    })

    it('starts regex hotword recognition only after browser speech consent', async () => {
        engine = 'regex'
        const { view, VoiceControl } = await renderVoiceControl()
        expect(constructBrowserSpeech).not.toHaveBeenCalled()
        expect(startBrowserSpeech).not.toHaveBeenCalled()

        speechConsentVersion = 1
        view.rerender(<VoiceControl />)
        await settle()

        expect(startBrowserSpeech).toHaveBeenCalledOnce()
    })

    it('starts a requested command session immediately after consent', async () => {
        keyStore.key = STORED
        const { view, VoiceControl } = await renderVoiceControl()

        fireEvent.click(view.getByRole('button', { name: 'common.voiceControl.toggle' }))
        await settle()
        fireEvent.click(view.getByRole('button', { name: 'allow-browser-speech' }))

        speechConsentVersion = 1
        view.rerender(<VoiceControl />)
        await settle()

        expect(constructBrowserSpeech).toHaveBeenCalled()
        expect(startBrowserSpeech).toHaveBeenCalledOnce()
    })

    it('waits for Porcupine to release its microphone before starting browser hotword', async () => {
        keyStore.key = STORED
        const { porcupine, view, VoiceControl } = await renderVoiceControl()
        let stopped: () => void = () => undefined
        vi.mocked(porcupine.stop).mockImplementationOnce(
            () =>
                new Promise<void>((resolve) => {
                    stopped = resolve
                }),
        )

        speechConsentVersion = 1
        engine = 'regex'
        view.rerender(<VoiceControl />)
        await settle()
        expect(porcupine.stop).toHaveBeenCalled()
        expect(startBrowserSpeech).not.toHaveBeenCalled()

        stopped()
        await settle()
        expect(porcupine.dispose).toHaveBeenCalledOnce()
        expect(startBrowserSpeech).toHaveBeenCalledOnce()
    })

    it('stops both browser recognizers before switching from regex to Porcupine', async () => {
        engine = 'regex'
        speechConsentVersion = 1
        keyStore.key = STORED
        const { porcupine, view, VoiceControl } = await renderVoiceControl()
        const browserRecognizers = [...mockSpeechInstances]
        expect(browserRecognizers).toHaveLength(2)

        engine = 'porcupine'
        view.rerender(<VoiceControl />)
        await settle()

        expect(
            browserRecognizers.every((recognition) => recognition.abort.mock.calls.length > 0),
        ).toBe(true)
        expect(constructBrowserSpeech).toHaveBeenCalledTimes(2)
        expect(porcupine.start).toHaveBeenCalledOnce()
    })

    it('aborts command and hotword recognizers when unmounted', async () => {
        engine = 'regex'
        speechConsentVersion = 1
        const { view } = await renderVoiceControl()
        const browserRecognizers = [...mockSpeechInstances]
        expect(browserRecognizers).toHaveLength(2)

        view.unmount()

        expect(
            browserRecognizers.every((recognition) => recognition.abort.mock.calls.length > 0),
        ).toBe(true)
    })

    it('releases failed initialization without starting a browser fallback', async () => {
        keyStore.key = STORED
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.start).toHaveBeenCalledOnce()
        vi.mocked(porcupine.init).mockResolvedValueOnce(false)

        await changeStoredKey(LEGACY)
        expect(porcupine.init).toHaveBeenLastCalledWith(LEGACY, 'porcupine')
        expect(porcupine.dispose).toHaveBeenCalledTimes(2)
        expect(porcupine.start).toHaveBeenCalledOnce()
        expect(startBrowserSpeech).not.toHaveBeenCalled()
    })

    it('a newly saved key starts Porcupine without a reload', async () => {
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).not.toHaveBeenCalled()
        await changeStoredKey(STORED)
        expect(porcupine.init).toHaveBeenCalledWith(STORED, 'porcupine')
    })

    it('a changed key replaces the engine instead of keeping the old one (#744 review)', async () => {
        keyStore.key = STORED
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledWith(STORED, 'porcupine')
        await changeStoredKey(LEGACY)
        expect(porcupine.dispose).toHaveBeenCalledTimes(1)
        expect(porcupine.init).toHaveBeenLastCalledWith(LEGACY, 'porcupine')
        expect(vi.mocked(porcupine.dispose).mock.invocationCallOrder[0]).toBeLessThan(
            vi.mocked(porcupine.init).mock.invocationCallOrder[1]!,
        )
    })

    it('removing the key releases the engine (#744 review)', async () => {
        keyStore.key = STORED
        const { porcupine } = await renderVoiceControl()
        await changeStoredKey(null)
        expect(porcupine.dispose).toHaveBeenCalledTimes(1)
        expect(porcupine.init).toHaveBeenCalledTimes(1)
    })

    it('an unreadable key store falls back to the legacy key (#744 review)', async () => {
        const { porcupineKeyService } = await import('@/services/porcupineKeyService')
        vi.mocked(porcupineKeyService.getApiKey).mockRejectedValueOnce(new Error('idb'))
        legacyKey = LEGACY
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledWith(LEGACY, 'porcupine')
    })

    it('a setup torn down during init() does not start the engine (#744 review)', async () => {
        keyStore.key = STORED
        const { porcupineWakeWordService } = await import('@/services/porcupineWakeWordService')
        let finishInit: (ok: boolean) => void = () => undefined
        vi.mocked(porcupineWakeWordService.init).mockImplementationOnce(
            () =>
                new Promise<boolean>((resolve) => {
                    finishInit = resolve
                }),
        )
        const { porcupine, view } = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledTimes(1)
        view.unmount()
        await act(async () => finishInit(true))
        await settle()
        expect(porcupine.start).not.toHaveBeenCalled()
    })

    it('a key change during init() still ends on the new key (#744 review)', async () => {
        keyStore.key = STORED
        const { porcupineWakeWordService } = await import('@/services/porcupineWakeWordService')
        let finishInit: (ok: boolean) => void = () => undefined
        vi.mocked(porcupineWakeWordService.init).mockImplementationOnce(
            () =>
                new Promise<boolean>((resolve) => {
                    finishInit = resolve
                }),
        )
        const { porcupine } = await renderVoiceControl()
        await changeStoredKey(LEGACY)
        expect(porcupine.init).toHaveBeenCalledTimes(1)
        await act(async () => finishInit(true))
        await settle()
        expect(porcupine.dispose).toHaveBeenCalledTimes(1)
        expect(porcupine.init).toHaveBeenLastCalledWith(LEGACY, 'porcupine')
    })

    it('a teardown while start() is pending still stops the engine (#744 review)', async () => {
        keyStore.key = STORED
        const { porcupineWakeWordService } = await import('@/services/porcupineWakeWordService')
        let finishStart: () => void = () => undefined
        vi.mocked(porcupineWakeWordService.start).mockImplementationOnce(
            () =>
                new Promise<void>((resolve) => {
                    finishStart = resolve
                }),
        )
        const { porcupine, view } = await renderVoiceControl()
        expect(porcupine.start).toHaveBeenCalledTimes(1)
        view.unmount()
        expect(porcupine.stop).not.toHaveBeenCalled()
        await act(async () => finishStart())
        await settle()
        expect(porcupine.stop).toHaveBeenCalledTimes(1)
        expect(vi.mocked(porcupine.start).mock.invocationCallOrder[0]).toBeLessThan(
            vi.mocked(porcupine.stop).mock.invocationCallOrder[0]!,
        )
    })

    it('the next run disposes only after the previous stop finished (#744 review)', async () => {
        keyStore.key = STORED
        const { porcupineWakeWordService } = await import('@/services/porcupineWakeWordService')
        const { porcupine } = await renderVoiceControl()
        let finishStop: () => void = () => undefined
        vi.mocked(porcupineWakeWordService.stop).mockImplementationOnce(
            () =>
                new Promise<void>((resolve) => {
                    finishStop = resolve
                }),
        )
        await changeStoredKey(LEGACY)
        expect(porcupine.stop).toHaveBeenCalledTimes(1)
        expect(porcupine.dispose).not.toHaveBeenCalled()
        await act(async () => finishStop())
        await settle()
        expect(porcupine.dispose).toHaveBeenCalledTimes(1)
        expect(porcupine.init).toHaveBeenLastCalledWith(LEGACY, 'porcupine')
    })

    it('stays off in Local-Only Mode, and stops when the mode is switched on (GH #717)', async () => {
        keyStore.key = STORED
        localOnly = true
        const { porcupine, view, VoiceControl } = await renderVoiceControl()

        expect(porcupine.init).not.toHaveBeenCalled()

        localOnly = false
        view.rerender(<VoiceControl />)
        await settle()
        expect(porcupine.init).toHaveBeenCalledTimes(1)

        localOnly = true
        view.rerender(<VoiceControl />)
        await settle()
        // Released, not only stopped: init() subscribed the microphone.
        expect(porcupine.dispose).toHaveBeenCalled()
    })

    it('turning the hotword off releases the engine, so the microphone closes', async () => {
        keyStore.key = STORED
        const { porcupine, view, VoiceControl } = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledTimes(1)

        hotword = false
        view.rerender(<VoiceControl />)
        await settle()
        // stop() only pauses the worker; dispose() unsubscribes WebVoiceProcessor.
        expect(porcupine.dispose).toHaveBeenCalledTimes(1)

        localOnly = true
        view.rerender(<VoiceControl />)
        await settle()
        expect(porcupine.dispose).toHaveBeenCalledTimes(1)
    })
})
