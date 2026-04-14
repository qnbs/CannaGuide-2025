import React, { memo, useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { LightType, PotType, VentilationPower, View, AiMode } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting, setLlmModel } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/common/Card'
import { SettingsSubNav } from './SettingsSubNav'
import { SettingsRow, SettingsSelect } from './SettingsShared'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { cn } from '@/lib/utils'
import { apiKeyService } from '@/services/apiKeyService'
import { aiProviderService, type AiProvider } from '@/services/aiProviderService'
import { aiRateLimiter } from '@/services/aiRateLimiter'
import { localAiPreloadService } from '@/services/local-ai'
import { detectOnnxBackend, setForceWasm } from '@/services/local-ai'
import { getGpuTier } from '@/services/local-ai'
import { LlmModelSelector } from './LlmModelSelector'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { useBatteryStatus } from '@/hooks/useBatteryStatus'
import { SearchBar } from '@/components/common/SearchBar'

const AboutTab = lazy(() => import('./AboutTab'))
const StrainsSettingsTab = lazy(() => import('./StrainsSettingsTab'))
const VoiceSettingsTab = lazy(() => import('./VoiceSettingsTab'))
const DataManagementTab = lazy(() => import('./DataManagementTab'))
const IotSettingsTab = lazy(() => import('./IotSettingsTab'))
const GrowManagerTab = lazy(() => import('./GrowManagerTab'))
const WorkerTelemetryTab = import.meta.env.DEV ? lazy(() => import('./WorkerTelemetryTab')) : null

const BatteryEcoStatusBadge: React.FC = memo(() => {
    const { t } = useTranslation()
    const battery = useBatteryStatus()

    return (
        <div className="flex flex-wrap gap-2 text-xs">
            {battery.level != null && (
                <span
                    className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                        battery.level <= 15
                            ? 'bg-red-900/40 text-red-300'
                            : battery.level <= 25
                              ? 'bg-amber-900/40 text-amber-300'
                              : 'bg-slate-700/60 text-slate-300',
                    )}
                >
                    <PhosphorIcons.Lightning className="w-3 h-3" />
                    {t('settingsView.offlineAi.batteryStatusLabel')}: {battery.level}%
                    {battery.charging ? ' (+)' : ''}
                </span>
            )}
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                    battery.ecoActive
                        ? 'bg-amber-900/40 text-amber-300'
                        : 'bg-green-900/40 text-green-300',
                )}
            >
                {battery.ecoActive
                    ? t('settingsView.offlineAi.ecoStatusActive')
                    : t('settingsView.offlineAi.ecoStatusInactive')}
            </span>
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                    battery.gpuGated
                        ? 'bg-red-900/40 text-red-300'
                        : 'bg-green-900/40 text-green-300',
                )}
            >
                {battery.gpuGated
                    ? t('settingsView.offlineAi.gpuStatusGated')
                    : t('settingsView.offlineAi.gpuStatusAvailable')}
            </span>
        </div>
    )
})
BatteryEcoStatusBadge.displayName = 'BatteryEcoStatusBadge'

const timeOptions = [
    { value: '12', label: '12/12' },
    { value: '18', label: '18/6' },
    { value: '24', label: '24/0' },
]

const CostTrackingSection: React.FC = () => {
    const { t } = useTranslation()
    const [budgetInput, setBudgetInput] = useState('')
    const budget = aiRateLimiter.getMonthlyBudget()
    const budgetPercent = aiRateLimiter.getBudgetUsagePercent()
    const todayCost = aiRateLimiter.getTodayUsage()
    const history = aiRateLimiter.getUsageHistory(7)

    const maxTokens = Math.max(...history.map((d) => d.totalTokens), 1)

    const handleSetBudget = () => {
        const val = parseInt(budgetInput, 10)
        if (!Number.isNaN(val) && val >= 0) {
            aiRateLimiter.setMonthlyBudgetLimit(val)
            setBudgetInput('')
        }
    }

    return (
        <div className="border-t border-slate-700/50 pt-3 mt-3 space-y-3">
            <p className="text-xs font-semibold text-slate-400">
                {t('settingsView.costTracking.title')}
            </p>
            <p className="text-xs text-slate-600">{t('settingsView.costTracking.disclaimer')}</p>
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-2 text-center">
                    <p className="text-lg font-bold text-slate-200">
                        {todayCost.totalTokens.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                        {t('settingsView.costTracking.tokensToday')}
                    </p>
                </div>
                <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-2 text-center">
                    <p className="text-lg font-bold text-slate-200">
                        ${todayCost.estimatedCostUsd.toFixed(4)}
                    </p>
                    <p className="text-xs text-slate-500">
                        {t('settingsView.costTracking.costToday')}
                    </p>
                </div>
            </div>
            {history.length > 0 && (
                <div>
                    <p className="text-xs text-slate-500 mb-1">
                        {t('settingsView.costTracking.last7Days')}
                    </p>
                    <div className="flex items-end gap-1 h-8">
                        {history.map((day) => (
                            <div
                                key={day.date}
                                className="flex-1 bg-primary-500/60 rounded-t"
                                style={{
                                    height: `${Math.max(4, (day.totalTokens / maxTokens) * 100)}%`,
                                }}
                                title={`${day.date}: ${day.totalTokens.toLocaleString()} tokens`}
                            />
                        ))}
                    </div>
                </div>
            )}
            <div className="space-y-2">
                <p className="text-xs text-slate-500">
                    {t('settingsView.costTracking.monthlyBudget')}:{' '}
                    {budget.limit > 0
                        ? `${budget.spent.toLocaleString()} / ${budget.limit.toLocaleString()} tokens`
                        : t('settingsView.costTracking.unlimited')}
                </p>
                {budgetPercent !== null && (
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className={cn(
                                'h-2 rounded-full transition-all',
                                budgetPercent >= 90
                                    ? 'bg-red-500'
                                    : budgetPercent >= 70
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500',
                            )}
                            style={{ width: `${Math.min(100, budgetPercent)}%` }}
                        />
                    </div>
                )}
                <div className="flex gap-2">
                    <Input
                        type="number"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        placeholder={t('settingsView.costTracking.budgetPlaceholder')}
                        className="flex-1"
                        min={0}
                    />
                    <Button variant="secondary" size="sm" onClick={handleSetBudget}>
                        {t('settingsView.costTracking.setBudget')}
                    </Button>
                </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => aiRateLimiter.clearCostHistory()}>
                {t('settingsView.costTracking.resetHistory')}
            </Button>
        </div>
    )
}

const GeminiSecurityCard: React.FC = () => {
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

const AiModeCard: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const currentMode: AiMode = settings.aiMode ?? 'hybrid'

    let isLocalReady = false
    try {
        const localStatus = localAiPreloadService.getStatus()
        isLocalReady = localStatus.state === 'ready'
    } catch {
        // Graceful degradation when local AI services are unavailable
    }

    const handleModeChange = (mode: string) => {
        dispatch(setSetting({ path: 'aiMode', value: mode }))
    }

    const modeOptions: Array<{
        value: AiMode
        label: string
        desc: string
        icon: React.ReactNode
    }> = [
        {
            value: 'cloud',
            label: t('settingsView.aiMode.cloud'),
            desc: t('settingsView.aiMode.cloudDesc'),
            icon: <PhosphorIcons.CloudArrowUp className="w-6 h-6" />,
        },
        {
            value: 'local',
            label: t('settingsView.aiMode.local'),
            desc: t('settingsView.aiMode.localDesc'),
            icon: <PhosphorIcons.Brain className="w-6 h-6" />,
        },
        {
            value: 'hybrid',
            label: t('settingsView.aiMode.hybrid'),
            desc: t('settingsView.aiMode.hybridDesc'),
            icon: <PhosphorIcons.Lightning className="w-6 h-6" />,
        },
        {
            value: 'eco',
            label: t('settingsView.aiMode.eco'),
            desc: t('settingsView.aiMode.ecoDesc'),
            icon: <PhosphorIcons.Leafy className="w-6 h-6" />,
        },
    ]

    return (
        <Card>
            <FormSection
                title={t('settingsView.aiMode.title')}
                icon={<PhosphorIcons.Brain />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <p className="text-sm text-slate-400">{t('settingsView.aiMode.description')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {modeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleModeChange(option.value)}
                                className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all duration-200 text-left ${
                                    currentMode === option.value
                                        ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-400 shadow-lg'
                                        : 'border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800'
                                }`}
                            >
                                <div
                                    className={`${
                                        currentMode === option.value
                                            ? 'text-primary-400'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    {option.icon}
                                </div>
                                <span
                                    className={`text-sm font-bold ${
                                        currentMode === option.value
                                            ? 'text-primary-300'
                                            : 'text-slate-200'
                                    }`}
                                >
                                    {option.label}
                                </span>
                                <p className="text-xs text-slate-400 text-center">{option.desc}</p>
                                {currentMode === option.value && (
                                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary-400 animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>
                    {currentMode === 'local' && !isLocalReady && (
                        <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
                            {t('settingsView.aiMode.localNotReady')}
                        </p>
                    )}
                    {currentMode === 'local' && isLocalReady && (
                        <p className="text-sm text-green-300 bg-green-500/10 border border-green-500/30 rounded-md p-3">
                            {t('settingsView.aiMode.localReady')}
                        </p>
                    )}
                    {currentMode === 'local' && (
                        <p className="text-xs text-slate-500">
                            {t('settingsView.aiMode.imageGenCloudOnly')}
                        </p>
                    )}
                    {currentMode === 'eco' && (
                        <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-md p-3">
                            {t('settingsView.aiMode.ecoAutoDetected')}
                        </p>
                    )}
                    {currentMode === 'eco' && (
                        <p className="text-xs text-slate-500">
                            {t('settingsView.aiMode.imageGenCloudOnly')}
                        </p>
                    )}
                </div>
            </FormSection>
        </Card>
    )
}

const LocalAiOfflineCard: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const isOffline = useOnlineStatus()
    const [isBusy, setIsBusy] = useState(false)
    const [status, setStatus] = useState(() => {
        try {
            return localAiPreloadService.getStatus()
        } catch {
            return {
                state: 'idle' as const,
                textModelReady: false,
                visionModelReady: false,
                embeddingModelReady: false,
                sentimentModelReady: false,
                summarizationModelReady: false,
                zeroShotTextModelReady: false,
                languageDetectionReady: false,
                imageSimilarityReady: false,
                webLlmReady: false,
                persistentStorageGranted: null,
                readyAt: null,
                details: null,
            }
        }
    })
    const [progress, setProgress] = useState<{
        loaded: number
        total: number
        label: string
    } | null>(null)
    const [preloadDurationMs, setPreloadDurationMs] = useState<number | null>(null)
    const [healthStatus, setHealthStatus] = useState<string | null>(null)
    const [deviceClass, setDeviceClass] = useState<string | null>(null)
    const supportsWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator
    let onnxBackend: string = 'wasm'
    try {
        onnxBackend = detectOnnxBackend()
    } catch {
        // Graceful degradation
    }

    useEffect(() => {
        let cancelled = false
        const loadHealth = async () => {
            try {
                const { quickHealthCheck, classifyDevice } = await import('@/services/local-ai')
                if (cancelled) return
                const check = quickHealthCheck()
                setHealthStatus(check.status)
                setDeviceClass(classifyDevice())
            } catch (error) {
                console.debug('[Settings] Health check failed', error)
                setHealthStatus('unknown')
            }
        }
        void loadHealth()
        return () => {
            cancelled = true
        }
    }, [status])

    const safeGpuTier = (() => {
        try {
            return getGpuTier()
        } catch {
            return 'none' as const
        }
    })()

    const localAiSettings = settings.localAi ?? {
        forceWasm: false,
        preferredTextModel: 'auto' as const,
    }

    const handlePreload = async () => {
        setIsBusy(true)
        setProgress(null)
        const startTime = performance.now()
        try {
            const nextStatus = await localAiPreloadService.preloadOfflineModels(
                (loaded, total, label) => setProgress({ loaded, total, label }),
            )
            setPreloadDurationMs(performance.now() - startTime)
            setStatus(nextStatus)
        } finally {
            setIsBusy(false)
            setProgress(null)
        }
    }

    const handleForceWasmToggle = () => {
        const next = !localAiSettings.forceWasm
        setForceWasm(next)
        dispatch(setSetting({ path: 'localAi.forceWasm', value: next }))
    }

    const handleModelChange = (modelId: string) => {
        dispatch(setLlmModel(modelId))
        import('@/services/local-ai').then(({ setPreferredModelOverride }) => {
            setPreferredModelOverride(modelId === 'auto' ? null : modelId)
        })
    }

    const statusLabel = (() => {
        switch (status.state) {
            case 'ready':
                return t('settingsView.offlineAi.ready')
            case 'partial':
                return t('settingsView.offlineAi.partial')
            case 'preloading':
                return t('settingsView.offlineAi.preloading')
            case 'error':
                return t('settingsView.offlineAi.error')
            default:
                return t('settingsView.offlineAi.idle')
        }
    })()

    return (
        <Card data-testid="local-ai-offline-cache-section">
            <FormSection
                title={t('settingsView.offlineAi.title')}
                icon={<PhosphorIcons.DownloadSimple />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <p className="text-sm text-slate-400">
                        {t('settingsView.offlineAi.description')}
                    </p>
                    <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3 text-sm text-slate-300 space-y-1">
                        <p>{statusLabel}</p>
                        {healthStatus && (
                            <p>
                                {t('settingsView.offlineAi.healthStatus', { value: healthStatus })}
                            </p>
                        )}
                        {deviceClass && (
                            <p>{t('settingsView.offlineAi.deviceClass', { value: deviceClass })}</p>
                        )}
                        <p>
                            {t('settingsView.offlineAi.cacheState', {
                                value: status.details ?? 'n/a',
                            })}
                        </p>
                        <p>
                            {t('settingsView.offlineAi.persistentStorage', {
                                value:
                                    status.persistentStorageGranted === null
                                        ? t('settingsView.offlineAi.unknown')
                                        : status.persistentStorageGranted
                                          ? t('settingsView.offlineAi.yes')
                                          : t('settingsView.offlineAi.no'),
                            })}
                        </p>
                        <p>
                            {supportsWebGpu
                                ? t('settingsView.offlineAi.webGpuSupported')
                                : t('settingsView.offlineAi.webGpuUnavailable')}
                        </p>
                        <p>{t('settingsView.offlineAi.onnxBackend', { value: onnxBackend })}</p>
                        <p>
                            {status.webLlmReady
                                ? t('settingsView.offlineAi.webLlmReady')
                                : t('settingsView.offlineAi.webLlmFallback')}
                        </p>
                        {status.languageDetectionReady && (
                            <p>{t('settingsView.offlineAi.langDetectionReady')}</p>
                        )}
                        {status.imageSimilarityReady && (
                            <p>{t('settingsView.offlineAi.imgSimilarityReady')}</p>
                        )}
                        {status.readyAt && (
                            <p>
                                {t('settingsView.offlineAi.readyAt', {
                                    value: new Date(status.readyAt).toLocaleString(),
                                })}
                            </p>
                        )}
                        <p className="text-xs text-slate-500 pt-1">
                            {t('settingsView.offlineAi.modelsLoaded', {
                                loaded: [
                                    status.textModelReady,
                                    status.visionModelReady,
                                    status.embeddingModelReady,
                                    status.sentimentModelReady,
                                    status.summarizationModelReady,
                                    status.zeroShotTextModelReady,
                                    status.languageDetectionReady,
                                    status.imageSimilarityReady,
                                ].filter(Boolean).length,
                                total: 8,
                            })}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handlePreload} disabled={isBusy || isOffline}>
                            {isBusy
                                ? t('settingsView.offlineAi.preloading')
                                : t('settingsView.offlineAi.preload')}
                        </Button>
                    </div>
                    {isBusy && progress && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{progress.label}</span>
                                <span>
                                    {progress.loaded}/{progress.total}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-700">
                                <div
                                    className="h-2 rounded-full bg-primary-500 transition-all duration-300"
                                    style={{
                                        width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    {isOffline && (
                        <p className="text-xs text-amber-300">
                            {t('settingsView.offlineAi.offlineHint')}
                        </p>
                    )}
                    <div className="space-y-3 border-t border-slate-700/60 pt-3">
                        <BatteryEcoStatusBadge />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-200">
                                    {t('settingsView.offlineAi.forceWasm')}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {t('settingsView.offlineAi.forceWasmHint')}
                                </p>
                            </div>
                            <Switch
                                checked={localAiSettings.forceWasm}
                                onChange={handleForceWasmToggle}
                            />
                        </div>
                        <div>
                            <LlmModelSelector
                                selectedModelId={localAiSettings.selectedLlmModelId ?? 'auto'}
                                onSelect={handleModelChange}
                                gpuTier={safeGpuTier}
                            />
                        </div>
                        <div className="text-xs text-slate-400">
                            {preloadDurationMs != null ? (
                                <p>
                                    {t('settingsView.offlineAi.benchPreloadTime', {
                                        value: (preloadDurationMs / 1000).toFixed(1),
                                    })}
                                </p>
                            ) : (
                                <p>{t('settingsView.offlineAi.benchNotAvailable')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </FormSection>
        </Card>
    )
}

const LocalAiFeaturesCard: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const localAi = settings.localAi ?? {}
    const [telemetry, setTelemetry] = useState<{
        totalInferences: number
        avgLatency: number
        avgSpeed: number
        cacheHitRate: number
        successRate: number
        peakSpeed: number
    } | null>(null)
    const [cacheCount, setCacheCount] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false
        const loadTelemetry = async () => {
            try {
                const { getSnapshot } = await import('@/services/local-ai')
                if (cancelled) return
                const snap = getSnapshot()
                setTelemetry({
                    totalInferences: snap.totalInferences,
                    avgLatency: snap.averageLatencyMs,
                    avgSpeed: snap.averageTokensPerSecond,
                    cacheHitRate: snap.cacheHitRate * 100,
                    successRate: snap.successRate * 100,
                    peakSpeed: snap.peakTokensPerSecond,
                })
            } catch {
                // Non-critical
            }
        }
        const loadCacheCount = async () => {
            try {
                const { getCacheSize } = await import('@/services/local-ai')
                if (cancelled) return
                setCacheCount(await getCacheSize())
            } catch {
                // Non-critical
            }
        }
        void loadTelemetry()
        void loadCacheCount()
        return () => {
            cancelled = true
        }
    }, [])

    const handleToggle = (path: string, value: boolean) => {
        dispatch(setSetting({ path: `localAi.${path}`, value }))
    }

    const handleClearCache = async () => {
        try {
            const { clearPersistentCache } = await import('@/services/local-ai')
            await clearPersistentCache()
            setCacheCount(0)
        } catch {
            // Non-critical
        }
    }

    return (
        <>
            <Card>
                <FormSection
                    title={t('settingsView.offlineAi.modelStatusTitle')}
                    icon={<PhosphorIcons.Lightning />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableSemanticRag')}
                            description={t('settingsView.offlineAi.enableSemanticRagHint')}
                        >
                            <Switch
                                checked={localAi.enableSemanticRag ?? true}
                                onChange={(val) => handleToggle('enableSemanticRag', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableSentiment')}
                            description={t('settingsView.offlineAi.enableSentimentHint')}
                        >
                            <Switch
                                checked={localAi.enableSentimentAnalysis ?? true}
                                onChange={(val) => handleToggle('enableSentimentAnalysis', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableSummarization')}
                            description={t('settingsView.offlineAi.enableSummarizationHint')}
                        >
                            <Switch
                                checked={localAi.enableSummarization ?? true}
                                onChange={(val) => handleToggle('enableSummarization', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableQueryClassification')}
                            description={t('settingsView.offlineAi.enableQueryClassificationHint')}
                        >
                            <Switch
                                checked={localAi.enableQueryClassification ?? true}
                                onChange={(val) => handleToggle('enableQueryClassification', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.ecoMode')}
                            description={t('settingsView.offlineAi.ecoModeHint')}
                        >
                            <Switch
                                checked={localAi.ecoMode ?? false}
                                onChange={(val) => handleToggle('ecoMode', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.ecoModeForced')}
                            description={t('settingsView.offlineAi.ecoModeForcedHint')}
                        >
                            <Switch
                                checked={localAi.ecoModeForced ?? false}
                                onChange={(val) => handleToggle('ecoModeForced', val)}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.offlineAi.enablePersistentCache')}
                    icon={<PhosphorIcons.Database />}
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow
                            label={t('settingsView.offlineAi.enablePersistentCache')}
                            description={t('settingsView.offlineAi.enablePersistentCacheHint')}
                        >
                            <Switch
                                checked={localAi.enablePersistentCache ?? true}
                                onChange={(val) => handleToggle('enablePersistentCache', val)}
                            />
                        </SettingsRow>
                        {cacheCount != null && (
                            <div className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg p-3">
                                <span className="text-slate-300">
                                    {t('settingsView.offlineAi.persistentCacheSize', {
                                        value: cacheCount,
                                    })}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleClearCache}
                                    disabled={cacheCount === 0}
                                >
                                    {t('settingsView.offlineAi.clearPersistentCache')}
                                </Button>
                            </div>
                        )}
                        <SettingsRow
                            label={t('settingsView.offlineAi.maxCacheSize')}
                            description={t('settingsView.offlineAi.maxCacheSizeHint')}
                        >
                            <RangeSlider
                                singleValue
                                value={localAi.maxInferenceCacheSize ?? 256}
                                onChange={(v) =>
                                    dispatch(
                                        setSetting({
                                            path: 'localAi.maxInferenceCacheSize',
                                            value: v,
                                        }),
                                    )
                                }
                                min={64}
                                max={1024}
                                step={64}
                                label=""
                                unit=""
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.inferenceTimeout')}
                            description={t('settingsView.offlineAi.inferenceTimeoutHint')}
                        >
                            <RangeSlider
                                singleValue
                                value={(localAi.inferenceTimeoutMs ?? 60000) / 1000}
                                onChange={(v) =>
                                    dispatch(
                                        setSetting({
                                            path: 'localAi.inferenceTimeoutMs',
                                            value: v * 1000,
                                        }),
                                    )
                                }
                                min={10}
                                max={180}
                                step={5}
                                label=""
                                unit="s"
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.offlineAi.enableTelemetry')}
                    icon={<PhosphorIcons.ChartLineUp />}
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableTelemetry')}
                            description={t('settingsView.offlineAi.enableTelemetryHint')}
                        >
                            <Switch
                                checked={localAi.enableTelemetry ?? true}
                                onChange={(val) => handleToggle('enableTelemetry', val)}
                            />
                        </SettingsRow>
                        {telemetry && localAi.enableTelemetry !== false && (
                            <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3 text-sm text-slate-300 space-y-1">
                                <p>
                                    {t('settingsView.offlineAi.telemetryInferences', {
                                        value: telemetry.totalInferences,
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetryAvgLatency', {
                                        value: telemetry.avgLatency.toFixed(0),
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetryAvgSpeed', {
                                        value: telemetry.avgSpeed.toFixed(1),
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetryPeakSpeed', {
                                        value: telemetry.peakSpeed.toFixed(1),
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetryCacheHitRate', {
                                        value: telemetry.cacheHitRate.toFixed(1),
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetrySuccessRate', {
                                        value: telemetry.successRate.toFixed(1),
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </FormSection>
            </Card>
        </>
    )
}
LocalAiFeaturesCard.displayName = 'LocalAiFeaturesCard'

const AiSettingsTab: React.FC = () => {
    const [hasError, setHasError] = useState(false)
    const { t } = useTranslation()

    if (hasError) {
        return (
            <Card>
                <div className="text-center py-8 space-y-3">
                    <PhosphorIcons.Warning className="w-10 h-10 mx-auto text-amber-400" />
                    <p className="text-sm text-slate-300">{t('common.errorBoundary.subtitle')}</p>
                    <Button variant="secondary" onClick={() => setHasError(false)}>
                        {t('common.errorBoundary.retryButton')}
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <AiModeCard />
            <GeminiSecurityCard />
            <LocalAiOfflineCard />
            <LocalAiFeaturesCard />
        </div>
    )
}

const THEME_SWATCHES: Record<string, string[]> = {
    midnight: ['#0f172a', '#3b82f6', '#60a5fa'],
    forest: ['#14532d', '#22c55e', '#86efac'],
    purpleHaze: ['#2e1065', '#a855f7', '#c084fc'],
    desertSky: ['#431407', '#f97316', '#fdba74'],
    roseQuartz: ['#4c0519', '#f43f5e', '#fda4af'],
    rainbowKush: ['#1e1b4b', '#8b5cf6', '#f472b6'],
    ogKushGreen: ['#052e16', '#16a34a', '#4ade80'],
    runtzRainbow: ['#312e81', '#ec4899', '#a78bfa'],
    lemonSkunk: ['#422006', '#eab308', '#fde047'],
}

const GeneralSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const general = settings.general
    const { deferredPrompt, isInstalled, handleInstallClick } = usePwaInstall()

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path: `general.${path}`, value }))
    }

    const colorblindModeOptions = [
        { value: 'none', label: t('settingsView.general.colorblindModes.none') },
        { value: 'protanopia', label: t('settingsView.general.colorblindModes.protanopia') },
        { value: 'deuteranopia', label: t('settingsView.general.colorblindModes.deuteranopia') },
        { value: 'tritanopia', label: t('settingsView.general.colorblindModes.tritanopia') },
    ]

    const themeEntries = [
        'midnight',
        'forest',
        'purpleHaze',
        'desertSky',
        'roseQuartz',
        'rainbowKush',
        'ogKushGreen',
        'runtzRainbow',
        'lemonSkunk',
    ]

    return (
        <div className="space-y-6">
            {/* PWA Status Card */}
            <Card className="border border-primary-500/30 bg-primary-900/10">
                <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-full bg-primary-500/20 p-3">
                        <PhosphorIcons.DownloadSimple className="h-6 w-6 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-primary-300">
                            {t('settingsView.general.installApp')}
                        </h3>
                        {isInstalled ? (
                            <p className="text-sm text-green-400 mt-1 font-semibold">
                                {t('settingsView.pwa.installed')}
                            </p>
                        ) : deferredPrompt ? (
                            <>
                                <p className="text-sm text-slate-300 mt-1">
                                    {t('settingsView.general.installAppDesc')}
                                </p>
                                <Button onClick={handleInstallClick} className="mt-3">
                                    <PhosphorIcons.DownloadSimple className="mr-2" />
                                    {t('settingsView.pwa.installNow')}
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400 mt-1">
                                {t('settingsView.pwa.notAvailable')}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.categories.lookAndFeel')}
                    icon={<PhosphorIcons.Cube />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.general.language')}>
                            <SettingsSelect
                                value={general.language}
                                onChange={(value) => handleSetSetting('language', value)}
                                options={[
                                    { value: 'en', label: t('settingsView.languages.en') },
                                    { value: 'de', label: t('settingsView.languages.de') },
                                    { value: 'es', label: t('settingsView.languages.es') },
                                    { value: 'fr', label: t('settingsView.languages.fr') },
                                    { value: 'nl', label: t('settingsView.languages.nl') },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.theme')}>
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {themeEntries.map((key) => {
                                        const swatches = THEME_SWATCHES[key]
                                        const isActive = general.theme === key
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleSetSetting('theme', key)}
                                                className={`relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all duration-200 ${
                                                    isActive
                                                        ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-400 scale-[1.03]'
                                                        : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                                                }`}
                                                aria-label={t(`settingsView.general.themes.${key}`)}
                                                aria-pressed={isActive}
                                            >
                                                <div className="flex gap-0.5">
                                                    {swatches?.map((color) => (
                                                        <div
                                                            key={color}
                                                            className="w-4 h-4 rounded-full border border-white/10"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-300 leading-tight text-center">
                                                    {t(`settingsView.general.themes.${key}`)}
                                                </span>
                                                {isActive && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-400 border border-slate-900" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.fontSize')}>
                            <SegmentedControl
                                value={[general.fontSize]}
                                onToggle={(val) => handleSetSetting('fontSize', val)}
                                options={[
                                    { value: 'sm', label: t('settingsView.general.fontSizes.sm') },
                                    {
                                        value: 'base',
                                        label: t('settingsView.general.fontSizes.base'),
                                    },
                                    { value: 'lg', label: t('settingsView.general.fontSizes.lg') },
                                ]}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection
                    title={t('settingsView.categories.interactivity')}
                    icon={<PhosphorIcons.GameController />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.general.uiDensity')}>
                            <SegmentedControl
                                value={[general.uiDensity]}
                                onToggle={(val) => handleSetSetting('uiDensity', val)}
                                options={[
                                    {
                                        value: 'comfortable',
                                        label: t('settingsView.general.uiDensities.comfortable'),
                                    },
                                    {
                                        value: 'compact',
                                        label: t('settingsView.general.uiDensities.compact'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.defaultView')}>
                            <SettingsSelect
                                value={general.defaultView}
                                onChange={(value) => handleSetSetting('defaultView', value)}
                                options={[
                                    { value: View.Plants, label: t('nav.plants') },
                                    { value: View.Strains, label: t('nav.strains') },
                                    { value: View.Equipment, label: t('nav.equipment') },
                                    { value: View.Knowledge, label: t('nav.knowledge') },
                                ]}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection
                    title={t('settingsView.categories.accessibility')}
                    icon={<PhosphorIcons.Person />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.general.dyslexiaFont')}
                            description={t('settingsView.general.dyslexiaFontDesc')}
                        >
                            <Switch
                                checked={general.dyslexiaFont}
                                onChange={(val) => handleSetSetting('dyslexiaFont', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.general.reducedMotion')}
                            description={t('settingsView.general.reducedMotionDesc')}
                        >
                            <Switch
                                checked={general.reducedMotion}
                                onChange={(val) => handleSetSetting('reducedMotion', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.general.highContrastMode')}
                            description={t('settingsView.general.highContrastModeDesc')}
                        >
                            <Switch
                                checked={general.highContrastMode}
                                onChange={(val) => handleSetSetting('highContrastMode', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.general.colorblindMode')}
                            description={t('settingsView.general.colorblindModeDesc')}
                        >
                            <SettingsSelect
                                value={general.colorblindMode}
                                onChange={(value) => handleSetSetting('colorblindMode', value)}
                                options={
                                    colorblindModeOptions as { value: string; label: string }[]
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}

const PlantsSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const simSettings = settings.simulation
    const plantViewSettings = settings.plantsView

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path, value }))
    }

    return (
        <div className="space-y-6">
            <Card>
                <FormSection
                    title={t('settingsView.plants.realtimeEngine')}
                    icon={<PhosphorIcons.ArrowClockwise />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <div className="rounded-xl border border-primary-500/20 bg-primary-500/10 p-4 text-sm text-slate-300">
                            <p className="font-semibold text-primary-300">
                                {t('settingsView.plants.realtimeSimulation')}
                            </p>
                            <p className="mt-1 text-slate-300">
                                {t('settingsView.plants.realtimeSimulationDesc')}
                            </p>
                        </div>
                        <SettingsRow
                            label={t('settingsView.plants.simulationProfile')}
                            description={t('settingsView.plants.simulationProfileDesc')}
                        >
                            <SegmentedControl
                                value={[simSettings.simulationProfile]}
                                onToggle={(val) =>
                                    handleSetSetting('simulation.simulationProfile', val)
                                }
                                options={[
                                    {
                                        value: 'beginner',
                                        label: t('settingsView.plants.simulationProfiles.beginner'),
                                    },
                                    {
                                        value: 'intermediate',
                                        label: t(
                                            'settingsView.plants.simulationProfiles.intermediate',
                                        ),
                                    },
                                    {
                                        value: 'expert',
                                        label: t('settingsView.plants.simulationProfiles.expert'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.showArchived')}
                            description={t('settingsView.plants.showArchivedDesc')}
                        >
                            <Switch
                                checked={plantViewSettings.showArchived}
                                onChange={(val) => handleSetSetting('plantsView.showArchived', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.autoGenerateTasks')}
                            description={t('settingsView.plants.autoGenerateTasksDesc')}
                        >
                            <Switch
                                checked={plantViewSettings.autoGenerateTasks}
                                onChange={(val) =>
                                    handleSetSetting('plantsView.autoGenerateTasks', val)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.plants.behavior')}
                    icon={<PhosphorIcons.GameController />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.plants.pestPressure')}
                            description={t('settingsView.plants.pestPressureDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.pestPressure}
                                onChange={(v) => handleSetSetting('simulation.pestPressure', v)}
                                min={0}
                                max={1}
                                step={0.05}
                                label=""
                                unit=""
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.nutrientSensitivity')}
                            description={t('settingsView.plants.nutrientSensitivityDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.nutrientSensitivity}
                                onChange={(v) =>
                                    handleSetSetting('simulation.nutrientSensitivity', v)
                                }
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                label=""
                                unit="x"
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.environmentalStability')}
                            description={t('settingsView.plants.environmentalStabilityDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.environmentalStability}
                                onChange={(v) =>
                                    handleSetSetting('simulation.environmentalStability', v)
                                }
                                min={0.5}
                                max={1}
                                step={0.05}
                                label=""
                                unit=""
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.plants.calibration')}
                    icon={<PhosphorIcons.Globe />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.plants.altitudeM')}
                            description={t('settingsView.plants.altitudeMDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.altitudeM}
                                onChange={(v) => handleSetSetting('simulation.altitudeM', v)}
                                min={0}
                                max={3000}
                                step={50}
                                label=""
                                unit="m"
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.leafTemperatureOffset')}
                            description={t('settingsView.plants.leafTemperatureOffsetDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.leafTemperatureOffset}
                                onChange={(v) =>
                                    handleSetSetting('simulation.leafTemperatureOffset', v)
                                }
                                min={-5}
                                max={5}
                                step={0.5}
                                label=""
                                unit="°C"
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            {simSettings.simulationProfile === 'expert' && (
                <Card>
                    <FormSection
                        title={t('settingsView.plants.physics')}
                        icon={<PhosphorIcons.Flask />}
                        defaultOpen
                    >
                        <div className="sm:col-span-2 space-y-6">
                            <SettingsRow
                                label={t('settingsView.plants.lightExtinctionCoefficient')}
                                description={t(
                                    'settingsView.plants.lightExtinctionCoefficientDesc',
                                )}
                            >
                                <RangeSlider
                                    singleValue
                                    value={simSettings.lightExtinctionCoefficient}
                                    onChange={(v) =>
                                        handleSetSetting('simulation.lightExtinctionCoefficient', v)
                                    }
                                    min={0.4}
                                    max={1.0}
                                    step={0.05}
                                    label=""
                                    unit="k"
                                />
                            </SettingsRow>
                            <SettingsRow
                                label={t('settingsView.plants.nutrientConversionEfficiency')}
                                description={t(
                                    'settingsView.plants.nutrientConversionEfficiencyDesc',
                                )}
                            >
                                <RangeSlider
                                    singleValue
                                    value={simSettings.nutrientConversionEfficiency}
                                    onChange={(v) =>
                                        handleSetSetting(
                                            'simulation.nutrientConversionEfficiency',
                                            v,
                                        )
                                    }
                                    min={0.2}
                                    max={0.8}
                                    step={0.05}
                                    label=""
                                    unit=""
                                />
                            </SettingsRow>
                            <SettingsRow
                                label={t('settingsView.plants.stomataSensitivity')}
                                description={t('settingsView.plants.stomataSensitivityDesc')}
                            >
                                <RangeSlider
                                    singleValue
                                    value={simSettings.stomataSensitivity}
                                    onChange={(v) =>
                                        handleSetSetting('simulation.stomataSensitivity', v)
                                    }
                                    min={0.5}
                                    max={1.5}
                                    step={0.05}
                                    label=""
                                    unit="x"
                                />
                            </SettingsRow>
                        </div>
                    </FormSection>
                </Card>
            )}

            <Card>
                <FormSection
                    title={t('settingsView.plants.autoJournaling')}
                    icon={<PhosphorIcons.BookBookmark />}
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow label={t('settingsView.plants.logStageChanges')}>
                            <Switch
                                checked={simSettings.autoJournaling.logStageChanges}
                                onChange={(val) =>
                                    handleSetSetting(
                                        'simulation.autoJournaling.logStageChanges',
                                        val,
                                    )
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.plants.logProblems')}>
                            <Switch
                                checked={simSettings.autoJournaling.logProblems}
                                onChange={(val) =>
                                    handleSetSetting('simulation.autoJournaling.logProblems', val)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.plants.logTasks')}>
                            <Switch
                                checked={simSettings.autoJournaling.logTasks}
                                onChange={(val) =>
                                    handleSetSetting('simulation.autoJournaling.logTasks', val)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}

const NotificationsSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const notifications = useAppSelector(selectSettings).notifications

    const [browserPermission, setBrowserPermission] = useState<string>(() =>
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    )

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path: `notifications.${path}`, value }))
    }

    const handleEnableToggle = async (value: boolean) => {
        handleSetSetting('enabled', value)
        if (value && browserPermission === 'default') {
            try {
                const { requestNotificationPermission } =
                    await import('@/services/nativeBridgeService')
                const granted = await requestNotificationPermission()
                setBrowserPermission(granted ? 'granted' : 'denied')
            } catch {
                // Best-effort
            }
        }
    }

    const browserBlocked = browserPermission === 'denied'
    const browserUnsupported = browserPermission === 'unsupported'

    return (
        <div className="space-y-6">
            {browserBlocked && (
                <div className="rounded-lg bg-amber-900/30 border border-amber-700/50 p-3 text-sm text-amber-300">
                    {t('settingsView.notifications.browserBlocked')}
                </div>
            )}
            {browserUnsupported && (
                <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-400">
                    {t('settingsView.notifications.browserUnsupported')}
                </div>
            )}
            <Card>
                <FormSection
                    title={t('settingsView.notifications.title')}
                    icon={<PhosphorIcons.Bell />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.notifications.enableAll')}
                            description={t('settingsView.notifications.enableAllDesc')}
                        >
                            <Switch
                                checked={notifications.enabled}
                                onChange={(value) => void handleEnableToggle(value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.problemDetected')}>
                            <Switch
                                checked={notifications.problemDetected}
                                onChange={(value) => handleSetSetting('problemDetected', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.lowWaterWarning')}>
                            <Switch
                                checked={notifications.lowWaterWarning}
                                onChange={(value) => handleSetSetting('lowWaterWarning', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.phDriftWarning')}>
                            <Switch
                                checked={notifications.phDriftWarning}
                                onChange={(value) => handleSetSetting('phDriftWarning', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.harvestReady')}>
                            <Switch
                                checked={notifications.harvestReady}
                                onChange={(value) => handleSetSetting('harvestReady', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.newTask')}>
                            <Switch
                                checked={notifications.newTask}
                                onChange={(value) => handleSetSetting('newTask', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.stageChange')}>
                            <Switch
                                checked={notifications.stageChange}
                                onChange={(value) => handleSetSetting('stageChange', value)}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.notifications.quietHours')}
                    icon={<PhosphorIcons.BellSimple />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.notifications.enableQuietHours')}
                            description={t('settingsView.notifications.quietHoursDesc')}
                        >
                            <Switch
                                checked={notifications.quietHours.enabled}
                                onChange={(value) => handleSetSetting('quietHours.enabled', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.quietHoursStart')}>
                            <Input
                                type="time"
                                value={notifications.quietHours.start}
                                onChange={(event) =>
                                    handleSetSetting('quietHours.start', event.target.value)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.quietHoursEnd')}>
                            <Input
                                type="time"
                                value={notifications.quietHours.end}
                                onChange={(event) =>
                                    handleSetSetting('quietHours.end', event.target.value)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}

const DefaultsSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const defaults = useAppSelector(selectSettings).defaults

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path: `defaults.${path}`, value }))
    }

    return (
        <div className="space-y-6">
            <Card>
                <FormSection
                    title={t('settingsView.defaults.growSetup')}
                    icon={<PhosphorIcons.Plant />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('plantsView.setupModal.lightingTitle')}>
                            <SegmentedControl
                                value={[defaults.growSetup.lightType]}
                                onToggle={(value) =>
                                    handleSetSetting('growSetup.lightType', value as LightType)
                                }
                                options={[
                                    {
                                        value: 'LED',
                                        label: t('plantsView.setupModal.lightTypes.led'),
                                    },
                                    {
                                        value: 'HPS',
                                        label: t('plantsView.setupModal.lightTypes.hps'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.wattage')}>
                            <RangeSlider
                                singleValue
                                value={defaults.growSetup.lightWattage}
                                onChange={(value) =>
                                    handleSetSetting('growSetup.lightWattage', value)
                                }
                                min={50}
                                max={1000}
                                step={10}
                                label=""
                                unit="W"
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.lightCycle')}>
                            <SegmentedControl
                                value={[String(defaults.growSetup.lightHours)]}
                                onToggle={(value) =>
                                    handleSetSetting('growSetup.lightHours', Number(value))
                                }
                                options={timeOptions}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.exhaustFanPower')}>
                            <SegmentedControl
                                value={[defaults.growSetup.ventilation]}
                                onToggle={(value) =>
                                    handleSetSetting(
                                        'growSetup.ventilation',
                                        value as VentilationPower,
                                    )
                                }
                                options={[
                                    {
                                        value: 'low',
                                        label: t('plantsView.setupModal.ventilationLevels.low'),
                                    },
                                    {
                                        value: 'medium',
                                        label: t('plantsView.setupModal.ventilationLevels.medium'),
                                    },
                                    {
                                        value: 'high',
                                        label: t('plantsView.setupModal.ventilationLevels.high'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.circulationFan')}>
                            <Switch
                                checked={defaults.growSetup.hasCirculationFan}
                                onChange={(value) =>
                                    handleSetSetting('growSetup.hasCirculationFan', value)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.potSize')}>
                            <RangeSlider
                                singleValue
                                value={defaults.growSetup.potSize}
                                onChange={(value) => handleSetSetting('growSetup.potSize', value)}
                                min={3}
                                max={50}
                                step={1}
                                label=""
                                unit="L"
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.potType')}>
                            <SegmentedControl
                                value={[defaults.growSetup.potType]}
                                onToggle={(value) =>
                                    handleSetSetting('growSetup.potType', value as PotType)
                                }
                                options={[
                                    {
                                        value: 'Plastic',
                                        label: t('plantsView.setupModal.potTypes.plastic'),
                                    },
                                    {
                                        value: 'Fabric',
                                        label: t('plantsView.setupModal.potTypes.fabric'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.medium')}>
                            <SegmentedControl
                                value={[defaults.growSetup.medium]}
                                onToggle={(value) => handleSetSetting('growSetup.medium', value)}
                                options={[
                                    { value: 'Soil', label: t('plantsView.mediums.Soil') },
                                    { value: 'Coco', label: t('plantsView.mediums.Coco') },
                                    { value: 'Hydro', label: t('plantsView.mediums.Hydro') },
                                ]}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.defaults.journalNotesTitle')}
                    icon={<PhosphorIcons.PencilSimple />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.defaults.wateringNoteLabel')}>
                            <Input
                                value={defaults.journalNotes.watering}
                                placeholder={t('plantsView.actionModals.defaultNotes.watering')}
                                onChange={(event) =>
                                    handleSetSetting('journalNotes.watering', event.target.value)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.defaults.feedingNoteLabel')}>
                            <Input
                                value={defaults.journalNotes.feeding}
                                placeholder={t('plantsView.actionModals.defaultNotes.feeding')}
                                onChange={(event) =>
                                    handleSetSetting('journalNotes.feeding', event.target.value)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}

const PrivacySettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const privacy = useAppSelector(selectSettings).privacy
    const [pinDraft, setPinDraft] = useState(privacy.pin ?? '')

    useEffect(() => {
        setPinDraft(privacy.pin ?? '')
    }, [privacy.pin])

    const normalizedPin = pinDraft.replace(/\D/g, '').slice(0, 4)
    const canSavePin = normalizedPin.length === 4 && normalizedPin !== (privacy.pin ?? '')

    return (
        <div className="space-y-6">
            <Card>
                <FormSection
                    title={t('settingsView.privacy.title')}
                    icon={<PhosphorIcons.ShieldCheck />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.privacy.localOnlyMode')}
                            description={t('settingsView.privacy.localOnlyModeDesc')}
                        >
                            <Switch
                                checked={privacy.localOnlyMode}
                                onChange={(value) =>
                                    dispatch(setSetting({ path: 'privacy.localOnlyMode', value }))
                                }
                            />
                        </SettingsRow>
                        {privacy.localOnlyMode && (
                            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-900/10 p-3 text-sm text-amber-300">
                                <PhosphorIcons.Warning className="h-4 w-4 shrink-0" />
                                {t('settingsView.privacy.localOnlyModeActive')}
                            </div>
                        )}
                        <SettingsRow
                            label={t('settingsView.privacy.requirePin')}
                            description={t('settingsView.privacy.requirePinDesc')}
                        >
                            <Switch
                                checked={privacy.requirePinOnLaunch}
                                onChange={(value) =>
                                    dispatch(
                                        setSetting({ path: 'privacy.requirePinOnLaunch', value }),
                                    )
                                }
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.privacy.setPin')}
                            description={t('settingsView.privacy.setPinDesc')}
                        >
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    autoComplete="new-password"
                                    maxLength={4}
                                    value={pinDraft}
                                    onChange={(event) =>
                                        setPinDraft(
                                            event.target.value.replace(/\D/g, '').slice(0, 4),
                                        )
                                    }
                                    placeholder={t('settingsView.privacy.pinPlaceholder')}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            dispatch(
                                                setSetting({
                                                    path: 'privacy.pin',
                                                    value: normalizedPin,
                                                }),
                                            )
                                        }
                                        disabled={!canSavePin}
                                    >
                                        {t('settingsView.privacy.savePin')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            setPinDraft('')
                                            dispatch(
                                                setSetting({ path: 'privacy.pin', value: null }),
                                            )
                                        }}
                                        disabled={!privacy.pin}
                                    >
                                        {t('settingsView.privacy.clearPin')}
                                    </Button>
                                </div>
                            </div>
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.privacy.clearAiHistory')}
                            description={t('settingsView.privacy.clearAiHistoryDesc')}
                        >
                            <Switch
                                checked={privacy.clearAiHistoryOnExit}
                                onChange={(value) =>
                                    dispatch(
                                        setSetting({ path: 'privacy.clearAiHistoryOnExit', value }),
                                    )
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}

/** Quick-jump entries for the settings search bar. Each maps a search keyword to a tab + optional element ID. */
const SEARCH_ENTRIES: Array<{
    tab: string
    keywords: string[]
    labelKey: string
    targetId?: string
}> = [
    {
        tab: 'general',
        keywords: ['language', 'sprache', 'lang'],
        labelKey: 'settingsView.general.language',
    },
    {
        tab: 'general',
        keywords: ['theme', 'thema', 'color', 'farbe'],
        labelKey: 'settingsView.general.theme',
    },
    {
        tab: 'general',
        keywords: ['font', 'schrift', 'size', 'groesse'],
        labelKey: 'settingsView.general.fontSize',
    },
    {
        tab: 'general',
        keywords: ['dyslexia', 'legasthenie'],
        labelKey: 'settingsView.general.dyslexiaFont',
    },
    {
        tab: 'general',
        keywords: ['motion', 'animation', 'bewegung'],
        labelKey: 'settingsView.general.reducedMotion',
    },
    {
        tab: 'general',
        keywords: ['contrast', 'kontrast'],
        labelKey: 'settingsView.general.highContrastMode',
    },
    {
        tab: 'general',
        keywords: ['colorblind', 'farbenblind'],
        labelKey: 'settingsView.general.colorblindMode',
    },
    { tab: 'general', keywords: ['install', 'pwa'], labelKey: 'settingsView.general.installApp' },
    {
        tab: 'ai',
        keywords: ['api', 'key', 'gemini', 'openai', 'provider'],
        labelKey: 'settingsView.security.apiKey',
    },
    {
        tab: 'ai',
        keywords: ['local', 'offline', 'wasm', 'webgpu', 'model'],
        labelKey: 'settingsView.offlineAi.title',
    },
    {
        tab: 'ai',
        keywords: ['cloud', 'hybrid', 'eco', 'mode'],
        labelKey: 'settingsView.aiMode.title',
    },
    {
        tab: 'ai',
        keywords: ['telemetry', 'telemetrie', 'inference'],
        labelKey: 'settingsView.offlineAi.enableTelemetry',
    },
    {
        tab: 'ai',
        keywords: ['cache', 'rag', 'semantic'],
        labelKey: 'settingsView.offlineAi.enableSemanticRag',
    },
    {
        tab: 'tts',
        keywords: ['voice', 'stimme', 'speech', 'sprache', 'tts'],
        labelKey: 'settingsView.tts.ttsEnabled',
    },
    {
        tab: 'tts',
        keywords: ['hotword', 'command', 'microphone', 'mikrofon'],
        labelKey: 'settingsView.tts.voiceControlInput',
    },
    {
        tab: 'strains',
        keywords: ['sort', 'column', 'spalte', 'genealogy', 'strain'],
        labelKey: 'settingsView.strains.title',
    },
    {
        tab: 'plants',
        keywords: ['simulation', 'pest', 'nutrient', 'altitude', 'physics'],
        labelKey: 'settingsView.plants.title',
    },
    {
        tab: 'notifications',
        keywords: ['notification', 'benachrichtigung', 'alert', 'quiet'],
        labelKey: 'settingsView.notifications.title',
    },
    {
        tab: 'defaults',
        keywords: ['default', 'standard', 'grow', 'setup', 'journal'],
        labelKey: 'settingsView.defaults.growSetup',
    },
    {
        tab: 'privacy',
        keywords: ['pin', 'privacy', 'datenschutz', 'security', 'sicherheit'],
        labelKey: 'settingsView.privacy.title',
    },
    {
        tab: 'data',
        keywords: ['backup', 'export', 'import', 'reset', 'sync', 'storage', 'speicher'],
        labelKey: 'settingsView.data.title',
    },
    {
        tab: 'about',
        keywords: ['about', 'version', 'info', 'readme', 'license'],
        labelKey: 'settingsView.about.title',
    },
]

const SettingsViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('plants')
    const [searchQuery, setSearchQuery] = useState('')

    // Scroll to top on tab change
    useEffect(() => {
        const mainEl = document.getElementById('main-content')
        if (mainEl) {
            mainEl.scrollTop = 0
        }
    }, [activeTab])

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return []
        const q = searchQuery.toLowerCase()
        return SEARCH_ENTRIES.filter(
            (entry) =>
                entry.keywords.some((kw) => kw.includes(q)) ||
                t(entry.labelKey).toLowerCase().includes(q),
        )
    }, [searchQuery, t])

    const handleSearchSelect = useCallback((tab: string) => {
        setActiveTab(tab)
        setSearchQuery('')
    }, [])

    const viewIcons: Record<string, React.ReactNode> = useMemo(
        () => ({
            general: <PhosphorIcons.GearSix className="w-14 h-14 mx-auto text-primary-400" />,
            ai: <PhosphorIcons.Brain className="w-14 h-14 mx-auto text-violet-400" />,
            tts: <PhosphorIcons.SpeakerHigh className="w-14 h-14 mx-auto text-accent-400" />,
            strains: <PhosphorIcons.Leafy className="w-14 h-14 mx-auto text-green-400" />,
            plants: <PhosphorIcons.Plant className="w-14 h-14 mx-auto text-green-400" />,
            grows: <PhosphorIcons.TreeStructure className="w-14 h-14 mx-auto text-emerald-400" />,
            notifications: <PhosphorIcons.Bell className="w-14 h-14 mx-auto text-amber-400" />,
            defaults: <PhosphorIcons.ListChecks className="w-14 h-14 mx-auto text-cyan-400" />,
            privacy: <PhosphorIcons.ShieldCheck className="w-14 h-14 mx-auto text-emerald-400" />,
            iot: <PhosphorIcons.WifiHigh className="w-14 h-14 mx-auto text-sky-400" />,
            data: <PhosphorIcons.Archive className="w-14 h-14 mx-auto text-orange-400" />,
            about: <PhosphorIcons.Info className="w-14 h-14 mx-auto text-cyan-400" />,
            workerTelemetry: (
                <PhosphorIcons.ChartLineUp className="w-14 h-14 mx-auto text-indigo-400" />
            ),
        }),
        [],
    )

    const viewTitles: Record<string, string> = useMemo(
        () => ({
            general: t('settingsView.categories.general'),
            ai: t('settingsView.categories.ai'),
            tts: t('settingsView.categories.tts'),
            strains: t('settingsView.categories.strains'),
            plants: t('settingsView.categories.plants'),
            grows: t('settingsView.categories.grows'),
            notifications: t('settingsView.categories.notifications'),
            defaults: t('settingsView.categories.defaults'),
            privacy: t('settingsView.categories.privacy'),
            iot: t('settingsView.categories.iot', { defaultValue: 'Hardware & IoT' }),
            data: t('settingsView.categories.data'),
            about: t('settingsView.categories.about'),
            workerTelemetry: t('settingsView.categories.workerTelemetry', {
                defaultValue: 'Worker Telemetry',
            }),
        }),
        [t],
    )

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettingsTab />
            case 'ai':
                return <AiSettingsTab />
            case 'tts':
                return (
                    <Suspense
                        fallback={
                            <Card>
                                <SkeletonLoader count={3} />
                            </Card>
                        }
                    >
                        <VoiceSettingsTab />
                    </Suspense>
                )
            case 'strains':
                return (
                    <Suspense
                        fallback={
                            <Card>
                                <SkeletonLoader count={3} />
                            </Card>
                        }
                    >
                        <StrainsSettingsTab />
                    </Suspense>
                )
            case 'plants':
                return <PlantsSettingsTab />
            case 'grows':
                return (
                    <Suspense
                        fallback={
                            <Card>
                                <SkeletonLoader count={3} />
                            </Card>
                        }
                    >
                        <GrowManagerTab />
                    </Suspense>
                )
            case 'notifications':
                return <NotificationsSettingsTab />
            case 'defaults':
                return <DefaultsSettingsTab />
            case 'privacy':
                return <PrivacySettingsTab />
            case 'iot':
                return (
                    <Suspense
                        fallback={
                            <Card>
                                <SkeletonLoader count={3} />
                            </Card>
                        }
                    >
                        <IotSettingsTab />
                    </Suspense>
                )
            case 'data':
                return (
                    <Suspense
                        fallback={
                            <Card>
                                <SkeletonLoader count={3} />
                            </Card>
                        }
                    >
                        <DataManagementTab />
                    </Suspense>
                )
            case 'about':
                return (
                    <Suspense
                        fallback={
                            <Card>
                                <SkeletonLoader count={3} />
                            </Card>
                        }
                    >
                        <AboutTab />
                    </Suspense>
                )
            case 'workerTelemetry':
                return WorkerTelemetryTab ? (
                    <Suspense
                        fallback={
                            <Card>
                                <SkeletonLoader count={3} />
                            </Card>
                        }
                    >
                        <WorkerTelemetryTab />
                    </Suspense>
                ) : null
            default:
                return null
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with icon and title */}
            <div className="text-center mb-4 animate-fade-in">
                {viewIcons[activeTab]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">
                    {viewTitles[activeTab]}
                </h2>
            </div>

            {/* Global Settings Search */}
            <div className="relative">
                <SearchBar
                    placeholder={t('settingsView.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => setSearchQuery('')}
                />
                {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-slate-700 bg-slate-800 shadow-xl max-h-64 overflow-y-auto">
                        {searchResults.map((result) => (
                            <button
                                key={`${result.tab}-${result.labelKey}`}
                                type="button"
                                onClick={() => handleSearchSelect(result.tab)}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-700/60 transition-colors first:rounded-t-xl last:rounded-b-xl"
                            >
                                <span className="text-xs font-semibold text-primary-400 uppercase min-w-[60px]">
                                    {viewTitles[result.tab]}
                                </span>
                                <span className="text-sm text-slate-200">{t(result.labelKey)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <SettingsSubNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Panel */}
            <section
                role="tabpanel"
                id={`settings-panel-${activeTab}`}
                aria-labelledby={`settings-tab-${activeTab}`}
                className="animate-fade-in"
            >
                {renderContent()}
            </section>
        </div>
    )
}

export const SettingsView = memo(SettingsViewComponent)
SettingsView.displayName = 'SettingsView'
export default SettingsView
