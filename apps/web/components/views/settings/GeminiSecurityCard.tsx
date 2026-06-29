import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/common/Card'
import { apiKeyService } from '@/services/apiKeyService'
import { aiProviderService, type AiProvider } from '@/services/aiProviderService'
import { aiRateLimiter } from '@/services/aiRateLimiter'
import { SettingsRow, SettingsSelect } from './SettingsShared'
import { CostTrackingSection } from './CostTrackingSection'

export const GeminiSecurityCard: React.FC = () => {
    const { t } = useTranslation()
    const [apiKeyInput, setApiKeyInput] = useState('')
    const [hasStoredKey, setHasStoredKey] = useState(false)
    const [maskedStoredKey, setMaskedStoredKey] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [statusType, setStatusType] = useState<'success' | 'error'>('success')

    const setStatus = (message: string | null, type: 'success' | 'error' = 'success') => {
        setStatusMessage(message)
        setStatusType(type)
    }
    const [isBusy, setIsBusy] = useState(false)
    const [auditLogRevision, setAuditLogRevision] = useState(0)
    const [activeProvider, setActiveProvider] = useState<AiProvider>(
        aiProviderService.getActiveProviderId(),
    )
    const providers = useMemo(() => aiProviderService.getAllProviders(), [])
    const todayUsage = aiRateLimiter.getTodayUsage()
    const recentAuditEntries = useMemo(() => {
        const revision = auditLogRevision
        if (revision < 0) {
            return []
        }
        return aiRateLimiter.getAuditLog().slice(0, 5)
    }, [auditLogRevision])
    const keyMetadata =
        activeProvider === 'gemini'
            ? apiKeyService.getApiKeyMetadata()
            : aiProviderService.getProviderKeyMetadata(activeProvider)
    const keyRotationDue =
        activeProvider === 'gemini'
            ? apiKeyService.isApiKeyRotationDue()
            : aiProviderService.isProviderKeyRotationDue(activeProvider)

    const getErrorMessage = (error: unknown, fallbackKey: string): string => {
        if (
            error instanceof Error &&
            typeof error.message === 'string' &&
            error.message.length > 0
        ) {
            if (
                error.message.startsWith('ai.error.') ||
                error.message.startsWith('settingsView.security.')
            ) {
                return t(error.message)
            }
            return error.message
        }

        return t(fallbackKey)
    }

    const loadKeyStatus = async (provider: AiProvider) => {
        try {
            // For Gemini use the original apiKeyService, for others use aiProviderService
            if (provider === 'gemini') {
                const key = await apiKeyService.getApiKey()
                setHasStoredKey(Boolean(key))
                setMaskedStoredKey(await apiKeyService.getMaskedApiKey())
            } else {
                const key = await aiProviderService.getProviderApiKey(provider)
                setHasStoredKey(Boolean(key))
                setMaskedStoredKey(await aiProviderService.getMaskedProviderApiKey(provider))
            }
        } catch {
            setStatus(t('settingsView.security.loadError'), 'error')
        }
    }

    useEffect(() => {
        let isMounted = true

        const load = async () => {
            try {
                if (activeProvider === 'gemini') {
                    const key = await apiKeyService.getApiKey()
                    if (isMounted) {
                        setHasStoredKey(Boolean(key))
                        setMaskedStoredKey(await apiKeyService.getMaskedApiKey())
                    }
                } else {
                    const key = await aiProviderService.getProviderApiKey(activeProvider)
                    if (isMounted) {
                        setHasStoredKey(Boolean(key))
                        setMaskedStoredKey(
                            await aiProviderService.getMaskedProviderApiKey(activeProvider),
                        )
                    }
                }
            } catch {
                if (isMounted) {
                    setStatus(t('settingsView.security.loadError'), 'error')
                }
            }
        }

        load()
        return () => {
            isMounted = false
        }
    }, [t, activeProvider])

    const VALID_PROVIDERS: readonly AiProvider[] = ['gemini', 'openai', 'xai', 'anthropic']

    const handleProviderChange = (providerId: string) => {
        const provider = VALID_PROVIDERS.find((p) => p === providerId)
        if (!provider) return
        setActiveProvider(provider)
        aiProviderService.setActiveProviderId(provider)
        setApiKeyInput('')
        setStatus(null)
        loadKeyStatus(provider)
    }

    const activeConfig = useMemo(
        () => aiProviderService.getProviderConfig(activeProvider),
        [activeProvider],
    )

    const getKeyAgeLabel = (updatedAt?: number | null) => {
        if (!updatedAt) {
            return t('settingsView.security.rotationUnknown')
        }

        const ageDays = Math.max(0, Math.floor((Date.now() - updatedAt) / (1000 * 60 * 60 * 24)))
        if (ageDays === 0) {
            return t('settingsView.security.rotationToday')
        }

        return t('settingsView.security.rotationAge', { days: ageDays })
    }

    const handleSaveApiKey = async () => {
        const trimmed = apiKeyInput.trim()
        if (activeProvider === 'gemini') {
            if (!apiKeyService.isValidApiKeyFormat(trimmed)) {
                setStatus(t('settingsView.security.invalid'), 'error')
                return
            }
        } else {
            if (!aiProviderService.isValidProviderKeyFormat(activeProvider, trimmed)) {
                setStatus(t('settingsView.security.invalid'), 'error')
                return
            }
        }

        setIsBusy(true)
        try {
            if (activeProvider === 'gemini') {
                await apiKeyService.setApiKey(trimmed)
                setMaskedStoredKey(await apiKeyService.getMaskedApiKey())
            } else {
                await aiProviderService.setProviderApiKey(activeProvider, trimmed)
                setMaskedStoredKey(await aiProviderService.getMaskedProviderApiKey(activeProvider))
            }
            setApiKeyInput('')
            setHasStoredKey(true)
            setStatus(t('settingsView.security.saved'))
        } catch (error) {
            setStatus(getErrorMessage(error, 'settingsView.security.saveError'), 'error')
        } finally {
            setIsBusy(false)
        }
    }

    const handleValidateApiKey = async () => {
        setIsBusy(true)
        try {
            const candidate = apiKeyInput.trim()
            if (activeProvider === 'gemini') {
                if (candidate.length > 0) {
                    await apiKeyService.validateApiKey(candidate)
                    setStatus(t('settingsView.security.testSuccessUnsaved'))
                } else {
                    await apiKeyService.validateStoredApiKey()
                    setStatus(t('settingsView.security.testSuccessStored'))
                }
            } else {
                // For non-Gemini providers, just validate format
                const keyToTest =
                    candidate.length > 0
                        ? candidate
                        : await aiProviderService.getProviderApiKey(activeProvider)
                if (!keyToTest) {
                    setStatus(t('ai.error.missingApiKey'), 'error')
                } else if (aiProviderService.isValidProviderKeyFormat(activeProvider, keyToTest)) {
                    setStatus(
                        candidate.length > 0
                            ? t('settingsView.security.testSuccessUnsaved')
                            : t('settingsView.security.testSuccessStored'),
                    )
                } else {
                    setStatus(t('settingsView.security.invalid'), 'error')
                }
            }
        } catch (error) {
            setStatus(getErrorMessage(error, 'settingsView.security.testError'), 'error')
        } finally {
            setIsBusy(false)
        }
    }

    const handleClearApiKey = async () => {
        setIsBusy(true)
        try {
            if (activeProvider === 'gemini') {
                await apiKeyService.clearApiKey()
            } else {
                await aiProviderService.clearProviderApiKey(activeProvider)
            }
            setApiKeyInput('')
            setHasStoredKey(false)
            setMaskedStoredKey(null)
            setStatus(t('settingsView.security.cleared'))
        } catch (error) {
            setStatus(getErrorMessage(error, 'settingsView.security.clearError'), 'error')
        } finally {
            setIsBusy(false)
        }
    }

    return (
        <Card>
            <FormSection
                title={t('settingsView.security.title')}
                icon={<PhosphorIcons.ShieldCheck />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
                        {t('settingsView.security.warning')}
                    </p>
                    <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-md p-3">
                        {t('settingsView.security.geminiFreeNote')}
                    </p>
                    <SettingsRow
                        label={t('settingsView.security.provider')}
                        description={t('settingsView.security.providerDesc')}
                    >
                        <SettingsSelect
                            value={activeProvider}
                            options={providers.map((p) => ({ value: p.id, label: p.label }))}
                            onChange={handleProviderChange}
                        />
                    </SettingsRow>
                    <SettingsRow
                        label={t('settingsView.security.apiKey')}
                        description={t('settingsView.security.apiKeyDesc')}
                    >
                        <Input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder={activeConfig.placeholder}
                            autoComplete="off"
                            spellCheck={false}
                            error={
                                statusType === 'error' ? (statusMessage ?? undefined) : undefined
                            }
                            errorId="api-key-error"
                        />
                    </SettingsRow>
                    {maskedStoredKey && (
                        <p className="text-xs text-slate-400">
                            {t('settingsView.security.maskedPrefix')}{' '}
                            <span className="font-mono">{maskedStoredKey}</span>
                        </p>
                    )}
                    <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3 text-xs text-slate-300 space-y-1">
                        <p>
                            {t('settingsView.security.rotationLabel')}:{' '}
                            {getKeyAgeLabel(keyMetadata?.updatedAt)}
                        </p>
                        <p>{t('settingsView.security.rotationAdvice')}</p>
                        {keyRotationDue && (
                            <div className="flex items-center gap-2 mt-2 rounded-md border border-red-500/40 bg-red-500/10 p-2">
                                <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                                    {t('settingsView.security.rotationBadge')}
                                </span>
                                <p className="text-red-300 text-xs">
                                    {t('settingsView.security.rotationDue')}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={handleSaveApiKey}
                            disabled={isBusy || apiKeyInput.trim().length === 0}
                        >
                            {t('settingsView.security.save')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleValidateApiKey}
                            disabled={isBusy || (!hasStoredKey && apiKeyInput.trim().length === 0)}
                        >
                            {t('settingsView.security.test')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleClearApiKey}
                            disabled={isBusy || !hasStoredKey}
                        >
                            {t('settingsView.security.clear')}
                        </Button>
                        <a
                            href={activeConfig.getKeyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg border border-transparent px-4 py-2 font-semibold text-slate-300 transition-colors hover:bg-primary-500/10 hover:text-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            aria-label={t('settingsView.security.openAiStudio')}
                        >
                            {t('settingsView.security.openAiStudio')}
                        </a>
                    </div>
                    <p className="text-xs text-slate-400">
                        {hasStoredKey
                            ? t('settingsView.security.stored')
                            : t('settingsView.security.notStored')}
                    </p>
                    {statusMessage && statusType === 'success' && (
                        <p className="text-sm text-emerald-300">{statusMessage}</p>
                    )}
                    <div className="border-t border-slate-700/50 pt-3 mt-3">
                        <p className="text-xs text-slate-500">
                            {t('settingsView.security.usageToday', {
                                requests: todayUsage.requestCount,
                                tokens: todayUsage.totalTokens.toLocaleString(),
                                remaining: aiRateLimiter.getRemainingRequests(),
                            })}
                        </p>
                        <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-slate-400">
                                {t('settingsView.security.auditLog')}
                            </p>
                            {recentAuditEntries.length > 0 ? (
                                <ul className="space-y-1 text-xs text-slate-500">
                                    {recentAuditEntries.map((entry) => (
                                        <li key={`${entry.timestamp}-${entry.endpoint}`}>
                                            {new Date(entry.timestamp).toLocaleTimeString()} ·{' '}
                                            {entry.endpoint}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    {t('settingsView.security.auditLogEmpty')}
                                </p>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    aiRateLimiter.clearAuditLog()
                                    setAuditLogRevision((value) => value + 1)
                                }}
                            >
                                {t('settingsView.security.clearAuditLog')}
                            </Button>
                        </div>
                    </div>
                    <CostTrackingSection />
                </div>
            </FormSection>
        </Card>
    )
}
