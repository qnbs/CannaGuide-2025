import React, { memo, useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Card } from '@/components/common/Card'
import { SettingsSubNav } from './SettingsSubNav'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { SearchBar } from '@/components/common/SearchBar'

const AboutTab = lazy(() => import('./AboutTab'))
const AiSettingsTab = lazy(() => import('./AiSettingsTab'))
const GeneralSettingsTab = lazy(() => import('./GeneralSettingsTab'))
const PlantsSettingsTab = lazy(() => import('./PlantsSettingsTab'))
const NotificationsSettingsTab = lazy(() => import('./NotificationsSettingsTab'))
const DefaultsSettingsTab = lazy(() => import('./DefaultsSettingsTab'))
const PrivacySettingsTab = lazy(() => import('./PrivacySettingsTab'))
const StrainsSettingsTab = lazy(() => import('./StrainsSettingsTab'))
const VoiceSettingsTab = lazy(() => import('./VoiceSettingsTab'))
const DataManagementTab = lazy(() => import('./DataManagementTab'))
const IotSettingsTab = lazy(() => import('./IotSettingsTab'))
const GrowManagerTab = lazy(() => import('./GrowManagerTab'))
const WorkerTelemetryTab = import.meta.env.DEV ? lazy(() => import('./WorkerTelemetryTab')) : null

const TabFallback = () => (
    <Card>
        <SkeletonLoader count={3} />
    </Card>
)

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
                return (
                    <Suspense fallback={<TabFallback />}>
                        <GeneralSettingsTab />
                    </Suspense>
                )
            case 'ai':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <AiSettingsTab />
                    </Suspense>
                )
            case 'tts':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <VoiceSettingsTab />
                    </Suspense>
                )
            case 'strains':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <StrainsSettingsTab />
                    </Suspense>
                )
            case 'plants':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <PlantsSettingsTab />
                    </Suspense>
                )
            case 'grows':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <GrowManagerTab />
                    </Suspense>
                )
            case 'notifications':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <NotificationsSettingsTab />
                    </Suspense>
                )
            case 'defaults':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <DefaultsSettingsTab />
                    </Suspense>
                )
            case 'privacy':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <PrivacySettingsTab />
                    </Suspense>
                )
            case 'iot':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <IotSettingsTab />
                    </Suspense>
                )
            case 'data':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <DataManagementTab />
                    </Suspense>
                )
            case 'about':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <AboutTab />
                    </Suspense>
                )
            case 'workerTelemetry':
                return WorkerTelemetryTab ? (
                    <Suspense fallback={<TabFallback />}>
                        <WorkerTelemetryTab />
                    </Suspense>
                ) : null
            default:
                return null
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-4 animate-fade-in">
                {viewIcons[activeTab]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">
                    {viewTitles[activeTab]}
                </h2>
            </div>

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
