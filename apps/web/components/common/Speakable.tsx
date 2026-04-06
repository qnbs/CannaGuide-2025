import React, { useRef } from 'react'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { selectSettings } from '@/stores/selectors'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { useTtsStore } from '@/stores/useTtsStore'

interface SpeakableProps {
    children: React.ReactNode
    elementId: string
    className?: string
}

export const Speakable: React.FC<SpeakableProps> = ({ children, elementId, className }) => {
    const { t } = useTranslation()
    const currentlySpeakingId = useTtsStore((s) => s.currentlySpeakingId)
    const addToTtsQueue = useTtsStore((s) => s.addToTtsQueue)
    const settings = useAppSelector(selectSettings)
    const highlightEnabled = settings.tts.highlightSpeakingText
    const ref = useRef<HTMLDivElement>(null)

    const isSpeaking = currentlySpeakingId === elementId

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (ref.current) {
            const textToSpeak = ref.current.innerText ?? ''
            if (textToSpeak.trim()) {
                addToTtsQueue({ id: elementId, text: textToSpeak })
            }
        }
    }

    return (
        <div
            ref={ref}
            className={`speakable-container relative group ${
                isSpeaking && highlightEnabled ? 'speakable-highlight' : ''
            } ${className ?? ''}`}
        >
            {children}
            <button
                onClick={handleSpeak}
                className="speakable-button absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-slate-700/80 hover:bg-primary-500/80 text-white rounded-full p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                aria-label={t('settingsView.tts.readThis')}
            >
                <PhosphorIcons.SpeakerHigh className="w-4 h-4" />
            </button>
        </div>
    )
}
