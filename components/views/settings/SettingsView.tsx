import React, { memo, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Language, LightType, PotType, Theme, VentilationPower, View, AiMode } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/common/Card'
import { SettingsSubNav } from './SettingsSubNav'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { apiKeyService } from '@/services/apiKeyService'
import { aiProviderService, type AiProvider } from '@/services/aiProviderService'
import { aiRateLimiter } from '@/services/aiRateLimiter'
import { localAiPreloadService } from '../../../services/localAiPreloadService'
import { detectOnnxBackend, setForceWasm } from '../../../services/localAIModelLoader'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

const AboutTab = lazy(() => import('./AboutTab'))
const StrainsSettingsTab = lazy(() => import('./StrainsSettingsTab'))
const VoiceSettingsTab = lazy(() => import('./VoiceSettingsTab'))
const DataManagementTab = lazy(() => import('./DataManagementTab'))

const timeOptions = [
    { value: '12', label: '12/12' },
    { value: '18', label: '18/6' },
    { value: '24', label: '24/0' },
]

const SettingsRow: React.FC<{
    label: string
    description?: string
    children: React.ReactNode
}> = ({ label, description, children }) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b border-slate-700/50 pb-4 last:border-b-0 last:pb-0 last:mb-0">
        <div className="min-w-0">
            <h4 className="font-semibold text-slate-100">{label}</h4>
            {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        <div className="w-full flex-shrink-0 sm:w-auto sm:max-w-xs">{children}</div>
    </div>
)

const SettingsSelect: React.FC<{
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
}> = ({ value, options, onChange }) => (
    <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                    {option.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
)

const GeminiSecurityCard: React.FC = () => {
    const { t } = useTranslation()
    const [apiKeyInput, setApiKeyInput] = useState('')
    const [hasStoredKey, setHasStoredKey] = useState(false)
    const [maskedStoredKey, setMaskedStoredKey] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [isBusy, setIsBusy] = useState(false)
    const [auditLogRevision, setAuditLogRevision] = useState(0)
    const [activeProvider, setActiveProvider] = useState<AiProvider>(
        aiProviderService.getActiveProviderId(),
    )
    const providers = useMemo(() => aiProviderService.getAllProviders(), [])
    const todayUsage = aiRateLimiter.getTodayUsage()
    const recentAuditEntries = useMemo(() => {
        void auditLogRevision // revision counter — triggers re-computation
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
            setStatusMessage(t('settingsView.security.loadError'))
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
                    setStatusMessage(t('settingsView.security.loadError'))
                }
            }
        }

        load()
        return () => {
            isMounted = false
        }
    }, [t, activeProvider])

    const handleProviderChange = (providerId: string) => {
        const newProvider = providerId as AiProvider
        setActiveProvider(newProvider)
        aiProviderService.setActiveProviderId(newProvider)
        setApiKeyInput('')
        setStatusMessage(null)
        loadKeyStatus(newProvider)
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
                setStatusMessage(t('settingsView.security.invalid'))
                return
            }
        } else {
            if (!aiProviderService.isValidProviderKeyFormat(activeProvider, trimmed)) {
                setStatusMessage(t('settingsView.security.invalid'))
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
            setStatusMessage(t('settingsView.security.saved'))
        } catch (error) {
            setStatusMessage(getErrorMessage(error, 'settingsView.security.saveError'))
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
                    setStatusMessage(t('settingsView.security.testSuccessUnsaved'))
                } else {
                    await apiKeyService.validateStoredApiKey()
                    setStatusMessage(t('settingsView.security.testSuccessStored'))
                }
            } else {
                // For non-Gemini providers, just validate format
                const keyToTest =
                    candidate.length > 0
                        ? candidate
                        : await aiProviderService.getProviderApiKey(activeProvider)
                if (!keyToTest) {
                    setStatusMessage(t('ai.error.missingApiKey'))
                } else if (aiProviderService.isValidProviderKeyFormat(activeProvider, keyToTest)) {
                    setStatusMessage(
                        candidate.length > 0
                            ? t('settingsView.security.testSuccessUnsaved')
                            : t('settingsView.security.testSuccessStored'),
                    )
                } else {
                    setStatusMessage(t('settingsView.security.invalid'))
                }
            }
        } catch (error) {
            setStatusMessage(getErrorMessage(error, 'settingsView.security.testError'))
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
            setStatusMessage(t('settingsView.security.cleared'))
        } catch (error) {
            setStatusMessage(getErrorMessage(error, 'settingsView.security.clearError'))
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
                            <p className="text-red-300">{t('settingsView.security.rotationDue')}</p>
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
                    {statusMessage && <p className="text-sm text-slate-300">{statusMessage}</p>}
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
    const localStatus = localAiPreloadService.getStatus()
    const isLocalReady = localStatus.state === 'ready'

    const handleModeChange = (mode: string) => {
        dispatch(setSetting({ path: 'aiMode', value: mode as AiMode }))
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
    const [status, setStatus] = useState(() => localAiPreloadService.getStatus())
    const [progress, setProgress] = useState<{
        loaded: number
        total: number
        label: string
    } | null>(null)
    const [preloadDurationMs, setPreloadDurationMs] = useState<number | null>(null)
    const supportsWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator
    const onnxBackend = detectOnnxBackend()

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

    const handleModelChange = (value: string) => {
        dispatch(setSetting({ path: 'localAi.preferredTextModel', value }))
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
        <Card>
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
                        {status.readyAt && (
                            <p>
                                {t('settingsView.offlineAi.readyAt', {
                                    value: new Date(status.readyAt).toLocaleString(),
                                })}
                            </p>
                        )}
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
                            <label className="text-sm text-slate-200 block mb-1">
                                {t('settingsView.offlineAi.preferredModel')}
                            </label>
                            <Select
                                value={localAiSettings.preferredTextModel}
                                onValueChange={handleModelChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">
                                        {t('settingsView.offlineAi.modelAuto')}
                                    </SelectItem>
                                    <SelectItem value="qwen2.5">
                                        {t('settingsView.offlineAi.modelQwen25')}
                                    </SelectItem>
                                    <SelectItem value="qwen3">
                                        {t('settingsView.offlineAi.modelQwen3')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
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

const AiSettingsTab: React.FC = () => (
    <div className="space-y-6">
        <AiModeCard />
        <GeminiSecurityCard />
        <LocalAiOfflineCard />
    </div>
)

const GeneralSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const general = settings.general

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path: `general.${path}`, value }))
    }

    const colorblindModeOptions = [
        { value: 'none', label: t('settingsView.general.colorblindModes.none') },
        { value: 'protanopia', label: t('settingsView.general.colorblindModes.protanopia') },
        { value: 'deuteranopia', label: t('settingsView.general.colorblindModes.deuteranopia') },
        { value: 'tritanopia', label: t('settingsView.general.colorblindModes.tritanopia') },
    ]

    const themeOptions = [
        'midnight',
        'forest',
        'purpleHaze',
        'desertSky',
        'roseQuartz',
        'rainbowKush',
        'ogKushGreen',
        'runtzRainbow',
        'lemonSkunk',
    ].map((key) => ({ value: key, label: t(`settingsView.general.themes.${key}`) }))

    return (
        <div className="space-y-6">
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
                                onChange={(value) =>
                                    handleSetSetting('language', value as Language)
                                }
                                options={[
                                    { value: 'en', label: t('settingsView.languages.en') },
                                    { value: 'de', label: t('settingsView.languages.de') },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.theme')}>
                            <SettingsSelect
                                value={general.theme}
                                onChange={(value) => handleSetSetting('theme', value as Theme)}
                                options={themeOptions}
                            />
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
                                onChange={(value) => handleSetSetting('defaultView', value as View)}
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

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path: `notifications.${path}`, value }))
    }

    return (
        <div className="space-y-6">
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
                                onChange={(value) => handleSetSetting('enabled', value)}
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
                                onChange={(event) =>
                                    handleSetSetting('journalNotes.watering', event.target.value)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.defaults.feedingNoteLabel')}>
                            <Input
                                value={defaults.journalNotes.feeding}
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

const SettingsViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('plants')

    const viewIcons = useMemo(
        () => ({
            general: <PhosphorIcons.GearSix className="w-16 h-16 mx-auto text-primary-400" />,
            ai: <PhosphorIcons.Brain className="w-16 h-16 mx-auto text-violet-400" />,
            tts: <PhosphorIcons.SpeakerHigh className="w-16 h-16 mx-auto text-accent-400" />,
            strains: <PhosphorIcons.Leafy className="w-16 h-16 mx-auto text-green-400" />,
            plants: <PhosphorIcons.Plant className="w-16 h-16 mx-auto text-green-400" />,
            notifications: <PhosphorIcons.Bell className="w-16 h-16 mx-auto text-amber-400" />,
            defaults: <PhosphorIcons.ListChecks className="w-16 h-16 mx-auto text-cyan-400" />,
            privacy: <PhosphorIcons.ShieldCheck className="w-16 h-16 mx-auto text-emerald-400" />,
            data: <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-orange-400" />,
            about: <PhosphorIcons.Info className="w-16 h-16 mx-auto text-cyan-400" />,
        }),
        [],
    )

    const viewTitles = useMemo(
        () => ({
            general: t('settingsView.categories.general'),
            ai: t('settingsView.categories.ai'),
            tts: t('settingsView.categories.tts'),
            strains: t('settingsView.categories.strains'),
            plants: t('settingsView.categories.plants'),
            notifications: t('settingsView.categories.notifications'),
            defaults: t('settingsView.categories.defaults'),
            privacy: t('settingsView.categories.privacy'),
            data: t('settingsView.categories.data'),
            about: t('settingsView.categories.about'),
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
            case 'notifications':
                return <NotificationsSettingsTab />
            case 'defaults':
                return <DefaultsSettingsTab />
            case 'privacy':
                return <PrivacySettingsTab />
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
            default:
                return null
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6 animate-fade-in">
                {viewIcons[activeTab as keyof typeof viewIcons]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">
                    {viewTitles[activeTab as keyof typeof viewTitles]}
                </h2>
            </div>

            <SettingsSubNav activeTab={activeTab} onTabChange={setActiveTab} />

            <section className="animate-fade-in">{renderContent()}</section>
        </div>
    )
}

export const SettingsView = memo(SettingsViewComponent)
export default SettingsView
