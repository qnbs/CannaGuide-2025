import React from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { AiMode } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { FormSection } from '@/components/ui/form'
import { Card } from '@/components/common/Card'
import { localAiPreloadService } from '@/services/local-ai'

export const AiModeCard: React.FC = () => {
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
                        <p className="text-xs text-muted">
                            {t('settingsView.aiMode.imageGenCloudOnly')}
                        </p>
                    )}
                    {currentMode === 'eco' && (
                        <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-md p-3">
                            {t('settingsView.aiMode.ecoAutoDetected')}
                        </p>
                    )}
                    {currentMode === 'eco' && (
                        <p className="text-xs text-muted">
                            {t('settingsView.aiMode.imageGenCloudOnly')}
                        </p>
                    )}
                </div>
            </FormSection>
        </Card>
    )
}
