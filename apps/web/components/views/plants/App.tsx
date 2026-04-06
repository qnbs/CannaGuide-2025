import React, { useEffect, useRef, lazy, Suspense, useState, useCallback } from 'react'
import { View } from '@/types'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ReloadPrompt } from '@/components/common/ReloadPrompt'
import { Header } from '@/components/navigation/Header'
import { BottomNav } from '@/components/navigation/BottomNav'
import { SideNav } from '@/components/navigation/SideNav'
import { OnboardingModal } from '@/components/common/OnboardingModal'
import { CommandPalette } from '@/components/common/CommandPalette'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { useBadgeApi } from '@/hooks/useBadgeApi'
import { TTSControls } from '@/components/common/TTSControls'
import { useDocumentEffects } from '@/hooks/useDocumentEffects'
import { CannabisLeafIcon } from '@/components/icons/CannabisLeafIcon'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { useUIStore } from '@/stores/useUIStore'
import { setSetting } from '@/stores/slices/settingsSlice'
import { clearArchives } from '@/stores/slices/archivesSlice'
import { ToastContainer } from '@/components/common/Toast'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/ui/input'
import { AgeGateModal, useAgeGate } from '@/components/common/AgeGateModal'
import { GeoLegalBanner, useGeoLegalBanner } from '@/components/common/GeoLegalBanner'
import { PrivacyPolicyModal } from '@/components/common/PrivacyPolicyModal'
import { PwaInstallBanner } from '@/components/common/PwaInstallBanner'
import { OfflineIndicator } from '@/components/common/OfflineIndicator'
import { DevTelemetryPanel } from '@/components/common/DevTelemetryPanel'
import { WebLlmPreloadBanner } from '@/components/common/WebLlmPreloadBanner'

const CLEAR_AI_HISTORY_ON_EXIT_KEY = 'cg.ai.clear-on-exit.pending'

const PinLockScreen: React.FC<{
    onUnlock: (pin: string) => boolean
}> = ({ onUnlock }) => {
    const { t } = useTranslation()
    const [pin, setPin] = useState('')
    const [hasError, setHasError] = useState(false)

    const handleUnlock = () => {
        const wasUnlocked = onUnlock(pin)
        setHasError(!wasUnlocked)
        if (!wasUnlocked) {
            setPin('')
        }
    }

    return (
        <div className="flex h-screen items-center justify-center bg-[rgb(var(--color-bg-primary))] p-6 text-slate-200">
            <div className="glass-pane w-full max-w-md rounded-2xl p-6 space-y-5">
                <div className="text-center space-y-2">
                    <PhosphorIcons.ShieldCheck className="mx-auto h-14 w-14 text-primary-400" />
                    <h2 className="text-2xl font-bold font-display text-slate-100">
                        {t('settingsView.privacy.unlockTitle')}
                    </h2>
                    <p className="text-sm text-slate-400">{t('settingsView.privacy.unlockDesc')}</p>
                </div>
                <Input
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={4}
                    value={pin}
                    onChange={(event) => {
                        setPin(event.target.value.replaceAll(/\D/g, '').slice(0, 4))
                        if (hasError) {
                            setHasError(false)
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            handleUnlock()
                        }
                    }}
                    placeholder="••••"
                    className="text-center text-xl tracking-[0.4em]"
                    aria-label={t('settingsView.privacy.requirePin')}
                />
                {hasError && (
                    <p className="text-sm text-red-300">{t('settingsView.privacy.unlockFailed')}</p>
                )}
                <Button onClick={handleUnlock} className="w-full justify-center" glow>
                    {t('settingsView.privacy.unlockButton')}
                </Button>
            </div>
        </div>
    )
}

// --- Lazy Loaded Views ---
const StrainsView = lazy(() =>
    import('@/components/views/strains/StrainsView').then((module) => ({
        default: module.StrainsView,
    })),
)
const PlantsView = lazy(() =>
    import('@/components/views/PlantsView').then((module) => ({
        default: module.PlantsView,
    })),
)
const EquipmentView = lazy(() =>
    import('@/components/views/equipment/EquipmentView').then((module) => ({
        default: module.EquipmentView,
    })),
)
const KnowledgeView = lazy(() =>
    import('@/components/views/KnowledgeView').then((m) => ({ default: m.KnowledgeView })),
)
const SettingsView = lazy(() => import('@/components/views/settings/SettingsView'))
const HelpView = lazy(() => import('@/components/views/HelpView'))
const browserWindow = typeof window === 'undefined' ? null : window

// --- Lazy Loaded Modals (not needed on initial render) ---
const GrowSetupModal = lazy(() =>
    import('@/components/common/GrowSetupModal').then((m) => ({ default: m.GrowSetupModal })),
)
const GrowConfirmationModal = lazy(() =>
    import('@/components/views/plants/GrowConfirmationModal').then((m) => ({
        default: m.GrowConfirmationModal,
    })),
)
const LogActionModalContainer = lazy(() =>
    import('@/components/views/plants/LogActionModalContainer').then((m) => ({
        default: m.LogActionModalContainer,
    })),
)
const DeepDiveModalContainer = lazy(() =>
    import('@/hooks/DeepDiveModalContainer').then((m) => ({ default: m.DeepDiveModalContainer })),
)
const AiDiagnosticsModalContainer = lazy(() =>
    import('@/components/views/plants/AiDiagnosticsModalContainer').then((m) => ({
        default: m.AiDiagnosticsModalContainer,
    })),
)
const SaveSetupModalContainer = lazy(() =>
    import('@/components/views/equipment/SaveSetupModalContainer').then((m) => ({
        default: m.SaveSetupModalContainer,
    })),
)

const LoadingGate: React.FC = () => {
    const { t } = useTranslation()
    return (
        <div
            className="flex flex-col h-screen bg-[rgb(var(--color-bg-primary))] text-slate-300 font-sans items-center justify-center"
            role="status"
            aria-live="polite"
        >
            <CannabisLeafIcon className="w-24 h-24 text-primary-500 animate-pulse" />
            <p className="mt-4 text-lg font-semibold text-slate-400">
                {t('common.preparingGuide')}
            </p>
        </div>
    )
}

const ToastManager: React.FC = () => {
    return <ToastContainer />
}

export const App: React.FC = () => {
    const dispatch = useAppDispatch()
    const { t } = useTranslation()
    const isOffline = useOnlineStatus()
    const { deferredPrompt, isInstalled, handleInstallClick } = usePwaInstall()
    useBadgeApi()

    // Legal gates
    const { isVerified: isAgeVerified, verify: verifyAge } = useAgeGate()
    const { showBanner: showGeoLegal, dismiss: dismissGeoLegal } = useGeoLegalBanner()
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)

    const activeView = useUIStore((s) => s.activeView)
    const isCommandPaletteOpen = useUIStore((s) => s.isCommandPaletteOpen)
    const settings = useAppSelector(selectSettings)
    const isAppReady = useUIStore((s) => s.isAppReady)
    const onboardingStep = useUIStore((s) => s.onboardingStep)
    const newGrowFlow = useUIStore((s) => s.newGrowFlow)
    const [isPinUnlocked, setIsPinUnlocked] = useState(
        () => !settings.privacy.requirePinOnLaunch || !settings.privacy.pin,
    )

    const [showUpdateBanner, setShowUpdateBanner] = useState(false)
    const waitingWorkerRef = useRef<ServiceWorker | null>(null)
    const isApplyingUpdateRef = useRef(false)

    useDocumentEffects(settings, activeView)

    useEffect(() => {
        if (!settings.privacy.requirePinOnLaunch || !settings.privacy.pin) {
            setIsPinUnlocked(true)
        }
    }, [settings.privacy.pin, settings.privacy.requirePinOnLaunch])

    useEffect(() => {
        if (localStorage.getItem(CLEAR_AI_HISTORY_ON_EXIT_KEY) === '1') {
            localStorage.removeItem(CLEAR_AI_HISTORY_ON_EXIT_KEY)
            dispatch(clearArchives())
        }
    }, [dispatch])

    useEffect(() => {
        const handleExitPrivacy = () => {
            if (settings.privacy.clearAiHistoryOnExit) {
                localStorage.setItem(CLEAR_AI_HISTORY_ON_EXIT_KEY, '1')
            } else {
                localStorage.removeItem(CLEAR_AI_HISTORY_ON_EXIT_KEY)
            }
        }

        browserWindow?.addEventListener('pagehide', handleExitPrivacy)
        document.addEventListener('visibilitychange', handleExitPrivacy)

        return () => {
            browserWindow?.removeEventListener('pagehide', handleExitPrivacy)
            document.removeEventListener('visibilitychange', handleExitPrivacy)
        }
    }, [settings.privacy.clearAiHistoryOnExit])

    const handleUnlockWithPin = useCallback(
        (pin: string) => {
            if (pin === settings.privacy.pin) {
                setIsPinUnlocked(true)
                return true
            }

            return false
        },
        [settings.privacy.pin],
    )

    const handleUpdate = useCallback(() => {
        if (!waitingWorkerRef.current || isApplyingUpdateRef.current) {
            return
        }

        isApplyingUpdateRef.current = true

        navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => {
                browserWindow?.location.reload()
            },
            { once: true },
        )

        navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
        waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' })
    }, [])

    useEffect(() => {
        const handleSwUpdate = (event: Event) => {
            const registration = (event as CustomEvent).detail
            if (registration?.waiting) {
                waitingWorkerRef.current = registration.waiting
                setShowUpdateBanner(true)
                globalThis.setTimeout(() => {
                    handleUpdate()
                }, 1200)
            }
        }

        browserWindow?.addEventListener('swUpdate', handleSwUpdate)

        return () => browserWindow?.removeEventListener('swUpdate', handleSwUpdate)
    }, [handleUpdate])

    useEffect(() => {
        if (isOffline) {
            useUIStore.getState().addNotification({
                message: t('common.offlineWarning'),
                type: 'info',
            })
        }
    }, [isOffline, t])

    // Scroll to top when view changes
    useEffect(() => {
        const mainEl = document.getElementById('main-content')
        if (mainEl) {
            mainEl.scrollTop = 0
        }
    }, [activeView])

    const renderContent = () => {
        switch (activeView) {
            case View.Strains:
                return (
                    <ErrorBoundary>
                        <StrainsView />
                    </ErrorBoundary>
                )
            case View.Plants:
                return (
                    <ErrorBoundary>
                        <PlantsView />
                    </ErrorBoundary>
                )
            case View.Equipment:
                return (
                    <ErrorBoundary>
                        <EquipmentView />
                    </ErrorBoundary>
                )
            case View.Knowledge:
                return (
                    <ErrorBoundary>
                        <KnowledgeView />
                    </ErrorBoundary>
                )
            case View.Settings:
                return (
                    <ErrorBoundary>
                        <SettingsView />
                    </ErrorBoundary>
                )
            case View.Help:
                return (
                    <ErrorBoundary>
                        <HelpView />
                    </ErrorBoundary>
                )
            default:
                return (
                    <ErrorBoundary>
                        <PlantsView />
                    </ErrorBoundary>
                )
        }
    }

    if (!isAppReady) {
        return <LoadingGate />
    }

    // Legal gate: Age verification (KCanG §1 – 18+)
    if (!isAgeVerified) {
        return <AgeGateModal onVerified={verifyAge} />
    }

    if (settings.privacy.requirePinOnLaunch && settings.privacy.pin && !isPinUnlocked) {
        return <PinLockScreen onUnlock={handleUnlockWithPin} />
    }

    if (!settings.onboardingCompleted && onboardingStep < 8) {
        return (
            <OnboardingModal
                onClose={() => dispatch(setSetting({ path: 'onboardingCompleted', value: true }))}
            />
        )
    }

    return (
        <div className="app-shell flex h-screen flex-col font-sans text-slate-300 md:flex-row">
            <div className="app-shell__orb app-shell__orb--primary" aria-hidden="true" />
            <div className="app-shell__orb app-shell__orb--accent" aria-hidden="true" />
            <div className="app-shell__orb app-shell__orb--secondary" aria-hidden="true" />
            <a href="#main-content" className="skip-link">
                {t('common.accessibility.skipToMain')}
            </a>
            <SideNav />
            <div className="relative flex min-h-0 flex-grow flex-col overflow-hidden">
                <Header
                    onCommandPaletteOpen={() => useUIStore.getState().setIsCommandPaletteOpen(true)}
                    deferredPrompt={deferredPrompt}
                    isInstalled={isInstalled}
                    onInstallClick={handleInstallClick}
                />
                <main
                    id="main-content"
                    aria-label={t('common.accessibility.mainContent')}
                    className="relative flex-grow min-h-0 overflow-y-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-2 scroll-pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-8 sm:pt-3 sm:scroll-pb-8 lg:px-8"
                >
                    <ErrorBoundary>
                        <div className="mx-auto w-full max-w-7xl">
                            <Suspense fallback={<SkeletonLoader count={5} />}>
                                {renderContent()}
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                </main>
                <BottomNav />
            </div>

            {/* Global Modals & Overlays */}
            {showUpdateBanner && (
                <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] sm:bottom-4 left-1/2 -translate-x-1/2 z-[250] w-full max-w-md animate-slide-in-up">
                    <div className="glass-pane p-3 rounded-lg flex items-center justify-between gap-4 mx-4">
                        <p className="text-sm font-semibold text-slate-200">
                            {t('common.pwa.updateAvailable')}
                        </p>
                        <Button size="sm" onClick={handleUpdate} glow>
                            {t('common.pwa.update')}
                        </Button>
                    </div>
                </div>
            )}
            <ToastManager />
            <DevTelemetryPanel />
            <TTSControls />
            <OfflineIndicator />
            <WebLlmPreloadBanner />
            <PwaInstallBanner
                deferredPrompt={deferredPrompt}
                isInstalled={isInstalled}
                onInstallClick={handleInstallClick}
            />
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => useUIStore.getState().setIsCommandPaletteOpen(false)}
            />
            {newGrowFlow.status === 'configuringSetup' && newGrowFlow.strain && (
                <Suspense fallback={null}>
                    <GrowSetupModal
                        strain={newGrowFlow.strain}
                        onClose={() => useUIStore.getState().cancelNewGrow()}
                        onConfirm={(setup) =>
                            useUIStore.getState().confirmSetupAndShowConfirmation(setup)
                        }
                    />
                </Suspense>
            )}
            {newGrowFlow.status === 'confirming' && (
                <Suspense fallback={null}>
                    <GrowConfirmationModal />
                </Suspense>
            )}
            <Suspense fallback={null}>
                <LogActionModalContainer />
                <DeepDiveModalContainer />
                <AiDiagnosticsModalContainer />
                <SaveSetupModalContainer />
            </Suspense>
            {showGeoLegal && <GeoLegalBanner onDismiss={dismissGeoLegal} />}
            <ReloadPrompt />
            <PrivacyPolicyModal
                isOpen={showPrivacyPolicy}
                onClose={() => setShowPrivacyPolicy(false)}
            />
        </div>
    )
}
