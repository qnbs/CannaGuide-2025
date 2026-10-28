import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
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
    const dispatch = useAppDispatch()
    const [apiKeyInput, setApiKeyInput] = useState('')
    const [hasStoredKey, setHasStoredKey] = useState(false)
    const [isBusy, setIsBusy] = useState(false)
    const [status, setStatus] = useState<Status>(null)
    // Counts completed saves and removals: an initial lookup that resolves
    // after one of them is stale and must not overwrite it (#711 review).
    const mutations = useRef(0)

    useEffect(() => {
        let active = true
        const seen = mutations.current
        cloudTtsKeyService
            .hasApiKey()
            .then((stored) => {
                if (active && seen === mutations.current) setHasStoredKey(stored)
            })
            .catch(() => {
                // An unreadable store shows "no key"; saving a new one still works.
            })
        return () => {
            active = false
        }
    }, [])

    /**
     * After an explicit save or removal, a legacy plaintext key still waiting
     * in the settings (failed startup migration) is obsolete: drop it, so the
     * next start cannot overwrite the user's choice with it (#711 review).
     */
    const retireLegacyKey = (): void => {
        cloudTtsKeyService.resolveLegacyKey()
        dispatch(setSetting({ path: 'tts.cloudTtsApiKey', value: null }))
    }

    const handleSave = async (): Promise<void> => {
        setIsBusy(true)
        try {
            await cloudTtsKeyService.setApiKey(apiKeyInput)
            retireLegacyKey()
            mutations.current += 1
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
            retireLegacyKey()
            mutations.current += 1
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
                    // SettingsRow labels only native controls; name this one
                    // for assistive technology (#711 review).
                    aria-label={t('settingsView.voice.cloudTts.apiKey')}
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
