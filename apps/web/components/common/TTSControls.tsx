import React from 'react'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { selectTtsEnabled, selectSettings } from '@/stores/selectors'
import { Button } from '@/components/common/Button'
import { useAppSelector } from '@/stores/store'
import { useTtsStore } from '@/stores/useTtsStore'

export const TTSControls: React.FC = () => {
    const { t } = useTranslation()
    const settings = useAppSelector(selectSettings)
    const { isTtsSpeaking, isTtsPaused, ttsQueue, play, pause, stop, next } = useTtsStore()
    const ttsEnabled = useAppSelector(selectTtsEnabled)

    if (!ttsEnabled || (ttsQueue.length === 0 && !isTtsSpeaking && !isTtsPaused)) {
        return null
    }

    return (
        <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] sm:bottom-4 right-4 z-40 flex items-center gap-2 p-2 rounded-full shadow-lg glass-pane animate-fade-in">
            {isTtsSpeaking && !isTtsPaused ? (
                <Button
                    variant="secondary"
                    size="sm"
                    className="!p-2 rounded-full min-h-[44px] min-w-[44px]"
                    onClick={() => pause()}
                    aria-label={t('settingsView.tts.pause')}
                >
                    <PhosphorIcons.Pause className="w-5 h-5" />
                </Button>
            ) : (
                <Button
                    variant="primary"
                    size="sm"
                    className="!p-2 rounded-full min-h-[44px] min-w-[44px]"
                    onClick={() => play(settings)}
                    aria-label={t('settingsView.tts.play')}
                >
                    <PhosphorIcons.Play className="w-5 h-5" />
                </Button>
            )}
            <Button
                variant="secondary"
                size="sm"
                className="!p-2 rounded-full min-h-[44px] min-w-[44px]"
                onClick={() => next()}
                disabled={ttsQueue.length <= 1 && !isTtsPaused}
                aria-label={t('settingsView.tts.next')}
            >
                <PhosphorIcons.SkipForward className="w-5 h-5" />
            </Button>
            <Button
                variant="danger"
                size="sm"
                className="!p-2 rounded-full min-h-[44px] min-w-[44px]"
                onClick={() => stop()}
                aria-label={t('settingsView.tts.stop')}
            >
                <PhosphorIcons.Stop className="w-5 h-5" />
            </Button>
        </div>
    )
}
