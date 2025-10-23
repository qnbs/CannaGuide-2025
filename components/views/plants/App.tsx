import React, { useEffect, useRef, lazy, Suspense, useState } from 'react'
import { View, AppSettings } from '@/types'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/navigation/Header'
import { BottomNav } from '@/components/navigation/BottomNav'
import { SideNav } from '@/components/navigation/SideNav'
import { OnboardingModal } from '@/components/common/OnboardingModal'
import { CommandPalette } from '@/components/common/CommandPalette'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { TTSControls } from '@/components/common/TTSControls'
import { useDocumentEffects } from '@/hooks/useDocumentEffects'
import { CannabisLeafIcon } from '@/components/icons/CannabisLeafIcon'
import { LogActionModalContainer } from '@/components/views/plants/LogActionModalContainer'
import { DeepDiveModalContainer } from '@/hooks/DeepDiveModalContainer'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { useAppDispatch, useAppSelector, RootState } from '@/stores/store'
import {
    selectActiveView,
    selectIsCommandPaletteOpen,
    selectSettings,
    selectIsAppReady,
    selectOnboardingStep,
    selectNewGrowFlow,
} from '@/stores/selectors'
import {
    setIsCommandPaletteOpen,
    addNotification,
    setActiveView,
    cancelNewGrow,
    confirmSetupAndShowConfirmation,
} from '@/stores/slices/uiSlice'
import { setSetting } from '@/stores/slices/settingsSlice'
import { ToastContainer } from '@/components/common/Toast'
import { AiDiagnosticsModalContainer } from '@/components/views/plants/AiDiagnosticsModalContainer'
import { SaveSetupModalContainer } from '@/components/views/equipment/SaveSetupModalContainer'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { GrowSetupModal } from '@/components/views/plants/GrowSetupModal'
import { GrowConfirmationModal } from '@/components/views/plants/GrowConfirmationModal'

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
const KnowledgeView = lazy(() => import('@/components/views/KnowledgeView'))
const SettingsView = lazy(() => import('@/components/views/settings/SettingsView'))
const HelpView = lazy(() => import('@/components/views/HelpView'))

const LoadingGate: React.FC = () => {
    const { t } = useTranslation()
    return (
        <div
            className="flex flex-col h-screen bg-[rgb(var(--color-bg-primary))] text-slate-300 font-sans items-center justify-center"
            role="status"
            aria-live="polite"
        >
            <CannabisLeafIcon className="w-24 h-24 text-primary-500 animate-pulse" />
            <p className="mt-4 text-lg font-semibold text-slate-400">{t('common.preparingGuide')}</p>
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

    const activeView = useAppSelector(selectActiveView)
    const isCommandPaletteOpen = useAppSelector(selectIsCommandPaletteOpen)
    const settings = useAppSelector(selectSettings)
    const isAppReady = useAppSelector(selectIsAppReady)
    const onboardingStep = useAppSelector(selectOnboardingStep)
    const newGrowFlow = useAppSelector(selectNewGrowFlow);

    const [showUpdateBanner, setShowUpdateBanner] = useState(false)
    const waitingWorkerRef = useRef<ServiceWorker | null>(null)

    useDocumentEffects(settings)

    useEffect(() => {
        const handleSwUpdate = (event: Event) => {
            const registration = (event as CustomEvent).detail;
            if (registration && registration.waiting) {
                waitingWorkerRef.current = registration.waiting;
                setShowUpdateBanner(true);
            }
        };

        window.addEventListener('swUpdate', handleSwUpdate);

        return () => window.removeEventListener('swUpdate', handleSwUpdate);
    }, []);

    const handleUpdate = () => {
        if (waitingWorkerRef.current) {
            // Add a listener for when the new service worker has taken control.
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
            // Send a message to the waiting service worker to trigger `skipWaiting()`.
            waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
        }
    };

    useEffect(() => {
        if (isOffline) {
            dispatch(
                addNotification({
                    message: t('common.offlineWarning'),
                    type: 'info',
                }),
            )
        }
    }, [isOffline, dispatch, t])

    const renderContent = () => {
        switch (activeView) {
            case View.Strains:
                return <StrainsView />
            case View.Plants:
                return <PlantsView />
            case View.Equipment:
                return <EquipmentView />
            case View.Knowledge:
                return <KnowledgeView />
            case View.Settings:
                return <SettingsView />
            case View.Help:
                return <HelpView />
            default:
                return <PlantsView />
        }
    }

    if (!isAppReady) {
        return <LoadingGate />
    }

    if (!settings.onboardingCompleted && onboardingStep < 5) {
        return <OnboardingModal onClose={() => dispatch(setSetting({ path: 'onboardingCompleted', value: true }))} />
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[rgb(var(--color-bg-primary))] text-slate-300 font-sans">
            <SideNav />
            <div className="flex flex-col flex-grow overflow-hidden">
                <Header
                    onCommandPaletteOpen={() => dispatch(setIsCommandPaletteOpen(true))}
                    deferredPrompt={deferredPrompt}
                    isInstalled={isInstalled}
                    onInstallClick={handleInstallClick}
                />
                <main
                    className="flex-grow overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6"
                >
                    {/* FIX: Wrap the Suspense component in an ErrorBoundary to catch errors in lazy-loaded components. */}
                    <ErrorBoundary>
                        <Suspense fallback={<SkeletonLoader count={5} />}>{renderContent()}</Suspense>
                    </ErrorBoundary>
                </main>
                <BottomNav />
            </div>

            {/* Global Modals & Overlays */}
            {showUpdateBanner && (
                <div className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-[250] w-full max-w-md animate-slide-in-up">
                    <div className="glass-pane p-3 rounded-lg flex items-center justify-between gap-4 mx-4">
                        <p className="text-sm font-semibold text-slate-200">Eine neue Version ist verfügbar!</p>
                        <Button size="sm" onClick={handleUpdate} glow>Aktualisieren</Button>
                    </div>
                </div>
            )}
            <ToastManager />
            <TTSControls />
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => dispatch(setIsCommandPaletteOpen(false))}
            />
            {newGrowFlow.status === 'configuringSetup' && newGrowFlow.strain && (
                <GrowSetupModal
                    strain={newGrowFlow.strain}
                    onClose={() => dispatch(cancelNewGrow())}
                    onConfirm={(setup) => dispatch(confirmSetupAndShowConfirmation(setup))}
                />
            )}
            {newGrowFlow.status === 'confirming' && (
                <GrowConfirmationModal />
            )}
            <LogActionModalContainer />
            <DeepDiveModalContainer />
            <AiDiagnosticsModalContainer />
            <SaveSetupModalContainer />
        </div>
    )
}