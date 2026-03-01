import { useState, useEffect } from 'react'
import { ttsService } from '@/services/ttsService'
import { selectLanguage } from '@/stores/selectors'
import { useAppSelector } from '@/stores/store'
import { Language } from '@/types'

export const useAvailableVoices = () => {
    const language = useAppSelector(selectLanguage);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

    useEffect(() => {
        if (!ttsService.isSupported()) {
            setVoices([])
            return
        }

        const updateVoices = () => {
            setVoices(ttsService.getVoices(language))
        }

        // Initial load
        updateVoices()

        // Update when voices change
        const synth = window.speechSynthesis
        synth.onvoiceschanged = updateVoices

        return () => {
            synth.onvoiceschanged = null
        }
    }, [language])

    return voices
}