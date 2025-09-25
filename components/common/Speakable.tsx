import React, { useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { selectCurrentlySpeakingId } from '@/stores/selectors';
import { useTranslations } from '@/hooks/useTranslations';

interface SpeakableProps {
    children: React.ReactNode;
    elementId: string;
    className?: string;
}

export const Speakable: React.FC<SpeakableProps> = ({ children, elementId, className }) => {
    const { t } = useTranslations();
    const addToTtsQueue = useAppStore(state => state.addToTtsQueue);
    const currentlySpeakingId = useAppStore(selectCurrentlySpeakingId);
    const ref = useRef<HTMLDivElement>(null);

    const isSpeaking = currentlySpeakingId === elementId;

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (ref.current) {
            const textToSpeak = ref.current.textContent || '';
            if (textToSpeak.trim()) {
                addToTtsQueue({ id: elementId, text: textToSpeak });
            }
        }
    };

    return (
        <div
            ref={ref}
            className={`speakable-container relative group ${isSpeaking ? 'speakable-highlight' : ''} ${className}`}
        >
            {children}
            <button
                onClick={handleSpeak}
                className="speakable-button absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-slate-700/80 hover:bg-primary-500/80 text-white rounded-full p-1"
                aria-label={t('tts.readThis')}
            >
                <PhosphorIcons.SpeakerHigh className="w-4 h-4" />
            </button>
        </div>
    );
};