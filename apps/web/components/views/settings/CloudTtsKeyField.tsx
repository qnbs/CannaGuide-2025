import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { SettingsRow } from './SettingsShared'

type Status = { type: 'success' | 'error'; message: string } | null

/**
 * The ElevenLabs key goes straight to the encrypted key store; the settings,
 * and with them every snapshot and export, never hold it (#654). The field
 * never shows the stored key back, only whether one is saved.
 */
export const CloudTtsKeyField: React.FC = () => {
    const { t } = useTranslation()
    const [apiKeyInput, setApiKeyInput] = useState('')
    const [hasStoredKey, setHasStoredKey] = useState(false)
    const [isBusy, setIsBusy] = useState(false)
    const [status, setStatus] = useState<Status>(null)

    useEffect(() => {
        let active = true
        void cloudTtsKeyService.hasApiKey().then((stored) => {
            if (active) setHasStoredKey(stored)
        })
        return () => {
            active = false
        }
    }, [])

    const handleSave = async (): Promise<void> => {
        setIsBusy(true)
        try {
            await cloudTtsKeyService.setApiKey(apiKeyInput)
            setApiKeyInput('')
            setHasStoredKey(true)
            setStatus({ type: 'success', message: t('settingsView.security.saved') })
        } catch {
            setStatus({ type: 'error', message: t('settingsView.security.saveError') })
        } finally {
            setIsBusy(false)
        }
    }

    const handleClear = async (): Promise<void> => {
        setIsBusy(true)
        try {
            await cloudTtsKeyService.clearApiKey()
            setHasStoredKey(false)
            setStatus({ type: 'success', message: t('settingsView.security.cleared') })
        } catch {
            setStatus({ type: 'error', message: t('settingsView.security.clearError') })
        } finally {
            setIsBusy(false)
        }
    }

    return (
        <>
            <SettingsRow
                label={t('settingsView.voice.cloudTts.apiKey')}
                description={t('settingsView.voice.cloudTts.apiKeyDesc')}
            >
                <Input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={t('settingsView.voice.cloudTts.apiKeyPlaceholder')}
                    autoComplete="off"
                    spellCheck={false}
                    error={status?.type === 'error' ? status.message : undefined}
                    errorId="cloud-tts-api-key-error"
                />
            </SettingsRow>
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={() => void handleSave()}
                    disabled={isBusy || apiKeyInput.trim().length === 0}
                >
                    {t('settingsView.security.save')}
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => void handleClear()}
                    disabled={isBusy || !hasStoredKey}
                >
                    {t('settingsView.security.clear')}
                </Button>
            </div>
            <p className="text-xs text-slate-400">
                {hasStoredKey
                    ? t('settingsView.security.stored')
                    : t('settingsView.security.notStored')}
            </p>
            {status?.type === 'success' && (
                <p className="text-sm text-emerald-300" role="status">
                    {status.message}
                </p>
            )}
        </>
    )
}
