import React, { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectLanguage } from '@/stores/selectors';
import { setVoiceListening, setVoiceStatusMessage, processVoiceCommand } from '@/stores/slices/uiSlice';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Button } from './Button';

// Browser compatibility for the Web Speech API
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const VoiceControl: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const lang = useAppSelector(selectLanguage);
    const { isListening, isAvailable } = useAppSelector(state => state.ui.voiceControl);
    const recognitionRef = useRef<any | null>(null);

    const handleResult = useCallback((event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        if (transcript) {
            dispatch(setVoiceStatusMessage(t('voiceControl.processing', { transcript })));
            dispatch(processVoiceCommand(transcript));
        }
        // Stop listening after a command is processed
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [dispatch, t]);

    const handleError = useCallback((event: any) => {
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
        if (!isAvailable) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        
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
        if (!isAvailable || !recognitionRef.current) return;
        
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
                } catch (stopErr) {
                    // Ignore errors on stopping if it was already stopped.
                }
                dispatch(setVoiceStatusMessage(t('voiceControl.errors.startFailed')));
                dispatch(setVoiceListening(false));
            }
        }
    };
    
    if (!isAvailable) {
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