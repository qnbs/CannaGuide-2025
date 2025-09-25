import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { selectTtsState, selectSettings } from '@/stores/selectors';
import { Button } from '@/components/common/Button';

export const TTSControls: React.FC = () => {
    const { t } = useTranslations();
    const { isTtsSpeaking, isTtsPaused, ttsQueue } = useAppStore(selectTtsState);
    const { playTts, pauseTts, stopTts, nextTts } = useAppStore(state => ({
        playTts: state.playTts,
        pauseTts: state.pauseTts,
        stopTts: state.stopTts,
        nextTts: state.nextTts,
    }));
    const ttsEnabled = useAppStore(selectSettings).tts.enabled;

    if (!ttsEnabled || ttsQueue.length === 0 && !isTtsSpeaking && !isTtsPaused) {
        return null;
    }

    const showPlay = !isTtsSpeaking || isTtsPaused;

    return (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 p-2 rounded-full shadow-lg glass-pane animate-fade-in">
            {isTtsSpeaking && !isTtsPaused ? (
                <Button variant="secondary" size="sm" className="!p-2 rounded-full" onClick={pauseTts} aria-label={t('tts.pause')}>
                    <PhosphorIcons.Pause className="w-5 h-5" />
                </Button>
            ) : (
                <Button variant="primary" size="sm" className="!p-2 rounded-full" onClick={playTts} aria-label={t('tts.play')}>
                    <PhosphorIcons.Play className="w-5 h-5" />
                </Button>
            )}
            <Button variant="secondary" size="sm" className="!p-2 rounded-full" onClick={nextTts} disabled={ttsQueue.length <= 1 && !isTtsPaused} aria-label={t('tts.next')}>
                <PhosphorIcons.SkipForward className="w-5 h-5" />
            </Button>
            <Button variant="danger" size="sm" className="!p-2 rounded-full" onClick={stopTts} aria-label={t('tts.stop')}>
                <PhosphorIcons.Stop className="w-5 h-5" />
            </Button>
        </div>
    );
};