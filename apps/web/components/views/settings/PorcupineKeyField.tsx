import React from 'react'
import { useTranslation } from 'react-i18next'
import { PORCUPINE_SECRET } from '@/services/settingsSecretStores'
import { SecretKeyField } from './SecretKeyField'

/** The Picovoice access key field; the key lives in its encrypted store (#709). */
export const PorcupineKeyField: React.FC = () => {
    const { t } = useTranslation()
    return (
        <SecretKeyField
            secret={PORCUPINE_SECRET}
            label={t('settingsView.voice.wakeWord.accessKey')}
            description={t('settingsView.voice.wakeWord.accessKeyDesc')}
            placeholder={t('settingsView.voice.wakeWord.accessKeyPlaceholder')}
            errorId="porcupine-access-key-error"
        />
    )
}
