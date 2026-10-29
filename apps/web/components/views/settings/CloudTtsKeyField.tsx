import React from 'react'
import { useTranslation } from 'react-i18next'
import { CLOUD_TTS_SECRET } from '@/services/settingsSecretStores'
import { SecretKeyField } from './SecretKeyField'

/** The ElevenLabs key field; the key lives in its encrypted store (#654). */
export const CloudTtsKeyField: React.FC = () => {
    const { t } = useTranslation()
    return (
        <SecretKeyField
            secret={CLOUD_TTS_SECRET}
            label={t('settingsView.voice.cloudTts.apiKey')}
            description={t('settingsView.voice.cloudTts.apiKeyDesc')}
            placeholder={t('settingsView.voice.cloudTts.apiKeyPlaceholder')}
            errorId="cloud-tts-api-key-error"
        />
    )
}
