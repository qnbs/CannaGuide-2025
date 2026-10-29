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
        dispose: vi.fn(async () => undefined),
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
    return { porcupine: porcupineWakeWordService, view }
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
        ;(window as WindowWithSpeech).SpeechRecognition = MockSpeechRecognition
    })

    afterEach(() => {
        cleanup()
        delete (window as WindowWithSpeech).SpeechRecognition
    })

    it('initializes Porcupine with the key from the encrypted store', async () => {
        keyStore.key = STORED
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledWith(STORED, 'porcupine')
        expect(porcupine.start).toHaveBeenCalled()
    })

    it('falls back to a legacy key whose migration has not succeeded yet', async () => {
        legacyKey = LEGACY
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).toHaveBeenCalledWith(LEGACY, 'porcupine')
    })

    it('stays on the regex fallback without any key', async () => {
        const { porcupine } = await renderVoiceControl()
        expect(porcupine.init).not.toHaveBeenCalled()
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
})
