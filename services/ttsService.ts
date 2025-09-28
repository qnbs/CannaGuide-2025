
import { TTSSettings, Language } from '@/types';

class TTSService {
    private synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private onEndCallback: (() => void) | null = null;
    private isInitialized: boolean = false;

    constructor() {
        this.synth = window.speechSynthesis;
    }
    
    public init() {
        if (this.isInitialized) return;
        this.synth.onvoiceschanged = this.loadVoices.bind(this);
        this.loadVoices(); // Initial attempt
        this.isInitialized = true;
    }

    private loadVoices() {
        this.voices = this.synth.getVoices();
    }

    public getVoices(lang: Language): SpeechSynthesisVoice[] {
        const langCode = lang === 'de' ? 'de-DE' : 'en-US';
        return this.voices.filter(voice => voice.lang.startsWith(lang));
    }

    speak(text: string, lang: Language, onEnd: () => void, settings: TTSSettings) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        this.onEndCallback = onEnd;

        utterance.onend = () => {
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        };
        
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            if (this.onEndCallback) {
                this.onEndCallback(); // Also advance queue on error
            }
        };

        const langCode = lang === 'de' ? 'de-DE' : 'en-US';
        let selectedVoice = this.voices.find(voice => voice.name === settings.voiceName);
        if (!selectedVoice) {
            selectedVoice = this.voices.find(voice => voice.lang === langCode && voice.default);
        }
        if (!selectedVoice) {
            selectedVoice = this.voices.find(voice => voice.lang.startsWith(lang));
        }

        utterance.voice = selectedVoice || null;
        utterance.lang = selectedVoice?.lang || langCode;
        utterance.pitch = settings.pitch;
        utterance.rate = settings.rate;

        this.synth.speak(utterance);
    }
    
    cancel() {
        this.onEndCallback = null;
        this.synth.cancel();
    }

    pause() {
        this.synth.pause();
    }

    resume() {
        this.synth.resume();
    }
}

export const ttsService = new TTSService();