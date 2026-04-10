import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectTtsEnabled } from '@/stores/selectors'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/common/Button'
import { voiceOrchestratorService } from '@/services/voiceOrchestratorService'

interface ReadAloudButtonProps {
    /** The text content to read aloud via TTS. */
    text: string
    /** Unique ID for TTS queue deduplication. */
    contentId: string
    /** Optional extra CSS classes. */
    className?: string | undefined
}

/**
 * Shared read-aloud icon button. Enqueues the given text into the TTS queue.
 * Only renders when TTS is enabled in settings.
 */
export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({ text, contentId, className }) => {
    const { t } = useTranslation()
    const ttsEnabled = useAppSelector(selectTtsEnabled)

    if (!ttsEnabled || !text) {
        return null
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className={`!p-1.5 rounded-full min-h-[36px] min-w-[36px] ${className ?? ''}`}
            onClick={() => voiceOrchestratorService.readContent(text, contentId)}
            title={t('voiceControl.readAloud')}
            aria-label={t('voiceControl.readAloud')}
        >
            <PhosphorIcons.SpeakerHigh className="w-4 h-4" />
        </Button>
    )
}

ReadAloudButton.displayName = 'ReadAloudButton'
