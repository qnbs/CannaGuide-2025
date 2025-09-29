import React from 'react';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { selectTtsState } from '@/stores/selectors';
import { Button } from '@/components/common/Button';
import { useAppSelector, useAppDispatch } from '@/stores/store';
// FIX: Corrected imports for Redux actions.
import { playTts, pauseTts, stopTts, nextTts } from '@/stores/slices/ttsSlice';

export const TTSControls: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { isTtsSpeaking, isTtsPaused, ttsQueue } = useAppSelector(selectTtsState);
    const ttsEnabled = useAppSelector(state => state.settings.settings.tts.enabled);

    if (!ttsEnabled || ttsQueue.length === 0 && !isTtsSpeaking && !isTtsPaused) {
        return null;
    }

    return (
        <div className="fixed bottom-[72px] right-4 z-40 flex items-center gap-2 p-2 rounded-full shadow-lg glass-pane animate-fade-in">
            {isTtsSpeaking && !isTtsPaused ? (
                <Button variant="secondary" size="sm" className="!p-2 rounded-full" onClick={() => dispatch(pauseTts())} aria-label={t('tts.pause')}>
                    <PhosphorIcons.Pause className="w-5 h-5" />
                </Button>
            ) : (
                <Button variant="primary" size="sm" className="!p-2 rounded-full" onClick={() => dispatch(playTts())} aria-label={t('tts.play')}>
                    <PhosphorIcons.Play className="w-5 h-5" />
                </Button>
            )}
            <Button variant="secondary" size="sm" className="!p-2 rounded-full" onClick={() => dispatch(nextTts())} disabled={ttsQueue.length <= 1 && !isTtsPaused} aria-label={t('tts.next')}>
                <PhosphorIcons.SkipForward className="w-5 h-5" />
            </Button>
            <Button variant="danger" size="sm" className="!p-2 rounded-full" onClick={() => dispatch(stopTts())} aria-label={t('tts.stop')}>
                <PhosphorIcons.Stop className="w-5 h-5" />
            </Button>
        </div>
    );
};