import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TTSSettings } from '@/types'
import { setLocalOnlyMode } from '@/services/localOnlyModeService'

const cloudSpeak = vi.fn()

vi.mock('@/services/cloudTtsService', () => ({
    CLOUD_TTS_ORIGIN: 'https://api.elevenlabs.io',
    cloudTtsService: { isSupported: () => true, speak: cloudSpeak, cancel: vi.fn() },
}))
vi.mock('@/services/speakNaturalService', () => ({ speakNatural: (text: string) => text }))
vi.mock('@/services/voiceTelemetryService', () => ({
    voiceTelemetryService: { recordVoiceEvent: vi.fn() },
}))

const settings = { cloudTtsEnabled: true, rate: 1, pitch: 1, volume: 1 } as unknown as TTSSettings

describe('ttsService in Local-Only Mode (GH #700)', () => {
    const browserSpeak = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('speechSynthesis', {
            speak: browserSpeak,
            cancel: vi.fn(),
            getVoices: () => [],
            addEventListener: vi.fn(),
        })
        vi.stubGlobal(
            'SpeechSynthesisUtterance',
            class {
                constructor(public text: string) {}
            },
        )
    })

    afterEach(() => {
        setLocalOnlyMode(false)
        vi.unstubAllGlobals()
        vi.resetModules()
    })

    it('does not send the text to ElevenLabs and speaks with the browser instead', async () => {
        setLocalOnlyMode(true)
        const { ttsService } = await import('./ttsService')

        ttsService.speak('Water the plants', 'en', vi.fn(), settings)

        expect(cloudSpeak).not.toHaveBeenCalled()
        expect(browserSpeak).toHaveBeenCalledOnce()
    })

    it('uses ElevenLabs as before when the mode is off', async () => {
        const { ttsService } = await import('./ttsService')

        ttsService.speak('Water the plants', 'en', vi.fn(), settings)

        expect(cloudSpeak).toHaveBeenCalledOnce()
        expect(browserSpeak).not.toHaveBeenCalled()
    })
})
