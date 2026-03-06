import React, { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectLanguage } from '@/stores/selectors';
import { setVoiceListening, setVoiceStatusMessage, processVoiceCommand } from '@/stores/slices/uiSlice';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Button } from './Button';

// Web Speech API – not yet fully standardized in TypeScript's DOM lib
interface WSpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    [index: number]: { transcript: string; confidence: number };
}
interface WSpeechRecognitionResultList {
    readonly length: number;
    [index: number]: WSpeechRecognitionResult;
}
interface WSpeechRecognitionEvent extends Event {
    readonly results: WSpeechRecognitionResultList;
}
interface WSpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}
interface WSpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    addEventListener(type: 'result', listener: (event: WSpeechRecognitionEvent) => void): void;
    addEventListener(type: 'error', listener: (event: WSpeechRecognitionErrorEvent) => void): void;
    addEventListener(type: 'end', listener: () => void): void;
    removeEventListener(type: 'result', listener: (event: WSpeechRecognitionEvent) => void): void;
    removeEventListener(type: 'error', listener: (event: WSpeechRecognitionErrorEvent) => void): void;
    removeEventListener(type: 'end', listener: () => void): void;
    start(): void;
    stop(): void;
    abort(): void;
}
type WSpeechRecognitionCtor = { new(): WSpeechRecognition };

const SpeechRecognitionAPI: WSpeechRecognitionCtor | undefined =
    (window as Window & { SpeechRecognition?: WSpeechRecognitionCtor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: WSpeechRecognitionCtor }).webkitSpeechRecognition;
const hasSpeechRecognitionSupport = typeof SpeechRecognitionAPI === 'function';

export const VoiceControl: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const lang = useAppSelector(selectLanguage);
    const { isListening, isAvailable } = useAppSelector(state => state.ui.voiceControl);
    const recognitionRef = useRef<WSpeechRecognition | null>(null);

    const handleResult = useCallback((event: WSpeechRecognitionEvent) => {
        const latest = event.results[event.results.length - 1]
        const transcript = latest[0].transcript.trim();
        if (latest && !latest.isFinal) {
            dispatch(setVoiceStatusMessage(t('voiceControl.processing', { transcript })));
            return;
        }
        if (transcript) {
            dispatch(setVoiceStatusMessage(t('voiceControl.processing', { transcript })));
            dispatch(processVoiceCommand(transcript));
        }
        // Stop listening after a command is processed
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [dispatch, t]);

    const handleError = useCallback((event: WSpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        let errorMessageKey = 'voiceControl.errors.generic';
        if (event.error === 'no-speech') {
            errorMessageKey = 'voiceControl.errors.noSpeech';
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            errorMessageKey = 'voiceControl.errors.notAllowed';
        }
        dispatch(setVoiceStatusMessage(t(errorMessageKey)));
        dispatch(setVoiceListening(false));
        setTimeout(() => dispatch(setVoiceStatusMessage(null)), 4000);
    }, [dispatch, t]);

    const handleEnd = useCallback(() => {
        dispatch(setVoiceListening(false));
        dispatch(setVoiceStatusMessage(null));
    }, [dispatch]);

    useEffect(() => {
        if (!isAvailable || !hasSpeechRecognitionSupport) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('error', handleError);
        recognition.addEventListener('end', handleEnd);

        recognitionRef.current = recognition;

        return () => {
            if (recognition) {
                recognition.removeEventListener('result', handleResult);
                recognition.removeEventListener('error', handleError);
                recognition.removeEventListener('end', handleEnd);
                recognition.abort();
                recognitionRef.current = null;
            }
        };
    }, [isAvailable, handleResult, handleError, handleEnd]);

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = lang === 'de' ? 'de-DE' : 'en-US';
        }
    }, [lang]);

    const toggleListening = () => {
        if (!isAvailable || !hasSpeechRecognitionSupport || !recognitionRef.current) return;
        
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                dispatch(setVoiceListening(true));
                dispatch(setVoiceStatusMessage(t('voiceControl.listening')));
            } catch (e) {
                console.error("Error starting recognition:", e);
                // This can happen if recognition is already started, so we defensively stop it.
                try {
                    recognitionRef.current.stop();
                } catch {
                    // Ignore errors on stopping if it was already stopped.
                }
                dispatch(setVoiceStatusMessage(t('voiceControl.errors.startFailed')));
                dispatch(setVoiceListening(false));
            }
        }
    };
    
    if (!isAvailable || !hasSpeechRecognitionSupport) {
        return null;
    }

    return (
        <Button
            variant="ghost"
            className={`!p-2 rounded-full transition-colors duration-200 ${
                isListening 
                    ? 'text-red-400 animate-pulse bg-red-500/20' 
                    : 'text-slate-300 hover:text-slate-100'
            }`}
            onClick={toggleListening}
            title={t('voiceControl.toggle')}
            aria-label={t('voiceControl.toggle')}
            aria-pressed={isListening}
        >
            <PhosphorIcons.Microphone className="w-6 h-6" />
        </Button>
    );
};