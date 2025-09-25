import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { ttsService } from '@/services/ttsService';
import { selectLanguage } from '@/stores/selectors';

export const useAvailableVoices = () => {
    const language = useAppStore(selectLanguage);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const updateVoices = () => {
            setVoices(ttsService.getVoices(language));
        };

        // Initial load
        updateVoices();

        // Update when voices change
        window.speechSynthesis.onvoiceschanged = updateVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [language]);

    return voices;
};