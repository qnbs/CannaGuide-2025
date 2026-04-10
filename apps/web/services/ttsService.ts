import { TTSSettings, Language, ITTSProvider } from '@/types'
import { cloudTtsService } from '@/services/cloudTtsService'
import { speakNatural } from '@/services/speakNaturalService'
import { voiceTelemetryService } from '@/services/voiceTelemetryService'

class TTSService implements ITTSProvider {
    readonly providerName = 'webspeech'

    private readonly synth: SpeechSynthesis | null =
        typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis
            ? window.speechSynthesis
            : null
    private voices: SpeechSynthesisVoice[] = []
    private onEndCallback: (() => void) | null = null
    private isInitialized: boolean = false

    public isSupported(): boolean {
        return this.synth !== null
    }

    public init() {
        if (this.isInitialized || !this.synth) return
        this.synth.onvoiceschanged = this.loadVoices.bind(this)
        this.loadVoices() // Initial attempt
        this.isInitialized = true
    }

    private loadVoices() {
        if (!this.synth) {
            this.voices = []
            return
        }
        this.voices = this.synth.getVoices()
    }

    public getVoices(lang: Language): SpeechSynthesisVoice[] {
        if (!this.synth) {
            return []
        }
        return this.voices.filter((voice) => voice.lang.startsWith(lang))
    }

    speak(text: string, lang: Language, onEnd: () => void, settings: TTSSettings) {
        // Apply text normalization for better TTS output
        const normalizedText = speakNatural(text, lang)

        // Route to Cloud TTS if enabled and available
        if (settings.cloudTtsEnabled && cloudTtsService.isSupported()) {
            voiceTelemetryService.recordVoiceEvent('ttsPlayed', { provider: 'elevenlabs' })
            cloudTtsService.setEncryptedApiKey(settings.cloudTtsApiKey)
            cloudTtsService.speak(normalizedText, lang, onEnd, settings)
            return
        }

        voiceTelemetryService.recordVoiceEvent('ttsPlayed', { provider: 'webspeech' })

        if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
            onEnd()
            return
        }

        if (this.synth.speaking) {
            this.synth.cancel()
        }

        const utterance = new SpeechSynthesisUtterance(normalizedText)
        this.onEndCallback = onEnd

        utterance.onend = () => {
            if (this.onEndCallback) {
                this.onEndCallback()
            }
        }

        utterance.onerror = (event) => {
            console.debug('SpeechSynthesisUtterance.onerror', event)
            if (this.onEndCallback) {
                this.onEndCallback() // Also advance queue on error
            }
        }

        const langCode = lang === 'de' ? 'de-DE' : 'en-US'
        let selectedVoice = this.voices.find((voice) => voice.name === settings.voiceName)
        if (!selectedVoice) {
            selectedVoice = this.voices.find((voice) => voice.lang === langCode && voice.default)
        }
        if (!selectedVoice) {
            selectedVoice = this.voices.find((voice) => voice.lang.startsWith(lang))
        }

        utterance.voice = selectedVoice || null
        utterance.lang = selectedVoice?.lang || langCode
        utterance.pitch = settings.pitch
        utterance.rate = settings.rate
        utterance.volume = settings.volume

        try {
            this.synth.speak(utterance)
        } catch (speakError) {
            // Firefox/Android: speak() can throw synchronously (e.g. no audio focus, API not ready)
            console.debug('SpeechSynthesis.speak() threw synchronously:', speakError)
            onEnd()
        }
    }

    cancel() {
        this.onEndCallback = null
        if (!this.synth) {
            return
        }
        this.synth.cancel()
    }

    pause() {
        if (!this.synth) {
            return
        }
        this.synth.pause()
    }

    resume() {
        if (!this.synth) {
            return
        }
        this.synth.resume()
    }
}

export const ttsService = new TTSService()
