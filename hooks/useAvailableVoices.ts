import { useState, useEffect } from 'react'
import { ttsService } from '@/services/ttsService'
import { selectLanguage } from '@/stores/selectors'
import { useAppSelector } from '@/stores/store'
import { Language } from '@/types'

export const useAvailableVoices = () => {
    const language = useAppSelector(selectLanguage);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

    useEffect(() => {
        const updateVoices = () => {
            setVoices(ttsService.getVoices(language))
        }

        // Initial load
        updateVoices()

        // Update when voices change
        window.speechSynthesis.onvoiceschanged = updateVoices

        return () => {
            window.speechSynthesis.onvoiceschanged = null
        }
    }, [language])

    return voices
}