// Web Speech API -- not yet fully standardized in TypeScript's DOM lib.
export interface WSpeechRecognitionResult {
    readonly isFinal: boolean
    readonly length: number
    [index: number]: { transcript: string; confidence: number }
}

export interface WSpeechRecognitionResultList {
    readonly length: number
    [index: number]: WSpeechRecognitionResult
}

export interface WSpeechRecognitionEvent extends Event {
    readonly results: WSpeechRecognitionResultList
}

export interface WSpeechRecognitionErrorEvent extends Event {
    readonly error: string
}

export interface WSpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    addEventListener(type: 'result', listener: (event: WSpeechRecognitionEvent) => void): void
    addEventListener(type: 'error', listener: (event: WSpeechRecognitionErrorEvent) => void): void
    addEventListener(type: 'end', listener: () => void): void
    removeEventListener(type: 'result', listener: (event: WSpeechRecognitionEvent) => void): void
    removeEventListener(
        type: 'error',
        listener: (event: WSpeechRecognitionErrorEvent) => void,
    ): void
    removeEventListener(type: 'end', listener: () => void): void
    start(): void
    stop(): void
    abort(): void
}

type WSpeechRecognitionCtor = { new (): WSpeechRecognition }

export const SpeechRecognitionAPI: WSpeechRecognitionCtor | undefined =
    (window as Window & { SpeechRecognition?: WSpeechRecognitionCtor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: WSpeechRecognitionCtor })
        .webkitSpeechRecognition

export const hasSpeechRecognitionSupport = typeof SpeechRecognitionAPI === 'function'

export function abortSpeechRecognition(
    recognition: WSpeechRecognition,
    onResult: (event: WSpeechRecognitionEvent) => void,
    onError: (event: WSpeechRecognitionErrorEvent) => void,
    onEnd: () => void,
): void {
    recognition.removeEventListener('result', onResult)
    recognition.removeEventListener('error', onError)
    recognition.removeEventListener('end', onEnd)
    recognition.abort()
}

/** Regex that matches "hey canna" or "hey cannaguide" (case-insensitive). */
export const HOTWORD_REGEX = /hey\s+canna(?:guide)?/i

/** Whether a wake word may listen under the app's enabled and privacy state. */
export function wakeWordAllowed(
    hotwordEnabled: boolean,
    isAvailable: boolean,
    speechBlocked: boolean,
): boolean {
    return hotwordEnabled && isAvailable && !speechBlocked
}

/** The recognizer language for the app language (commands exist in German and English). */
export function recognitionLang(lang: string): string {
    return lang === 'de' ? 'de-DE' : 'en-US'
}

export function micTitleKey(speechBlocked: boolean): string {
    return speechBlocked ? 'common.voiceControl.errors.localOnly' : 'common.voiceControl.toggle'
}

/** Duration (ms) the command listener stays active after hotword detection. */
export const HOTWORD_ACTIVATION_MS = 5_000
