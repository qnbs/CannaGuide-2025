import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { View } from '@/types';
import { useTranslations } from './hooks/useTranslations';
import { Header } from './components/navigation/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { OnboardingModal } from './components/common/OnboardingModal';
import { CommandPalette } from './components/common/CommandPalette';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePwaInstall } from './hooks/usePwaInstall';
import { strainService } from '@/services/strainService';
import { TTSControls } from './components/common/TTSControls';
import { ttsService } from './services/ttsService';
import { useDocumentEffects } from './hooks/useDocumentEffects';
import { AiLoadingIndicator } from './components/common/AiLoadingIndicator';
import { CannabisLeafIcon } from './components/icons/CannabisLeafIcon';
import { i18nInstance } from './i18n';
import { LogActionModalContainer } from './components/views/plants/LogActionModalContainer';
import { DeepDiveModalContainer } from './components/views/plants/deepDive/DeepDiveModalContainer';
import { SkeletonLoader } from './components/common/SkeletonLoader';
import { useIsSimulationCatchingUp } from './hooks/useSimulationBridge';
import { runDataMigrations } from './services/migrationService';
import { useAppDispatch, useAppSelector } from './stores/store';
import { selectActiveView, selectIsCommandPaletteOpen, selectSettings, selectNotifications } from './stores/selectors';
import { setAppReady, setIsCommandPaletteOpen, addNotification, removeNotification } from './stores/slices/uiSlice';
import { initializeSimulation } from './stores/slices/simulationSlice';
import { simulationLoop } from './services/simulationLoop';
import { setSetting } from './stores/slices/settingsSlice';
import { ToastContainer } from './components/common/Toast';
import { AiDiagnosticsModalContainer } from './components/views/plants/AiDiagnosticsModalContainer';

// --- Lazy Loaded Views ---
const StrainsView = lazy(() => import('./components/views/StrainsView').then(module => ({ default: module.StrainsView })));
const PlantsView = lazy(() => import('./components/views/PlantsView').then(module => ({ default: module.PlantsView })));
const EquipmentView = lazy(() => import('./components/views/EquipmentView').then(module => ({ default: module.EquipmentView })));
const KnowledgeView = lazy(() => import('./components/views/KnowledgeView').then(module => ({ default: module.KnowledgeView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(module => ({ default: module.SettingsView })));
const HelpView = lazy(() => import('./components/views/HelpView').then(module => ({ default: module.HelpView })));

const LoadingGate: React.FC = () => {
    const { t } = useTranslations();
    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans items-center justify-center" role="status" aria-live="polite">
            <CannabisLeafIcon className="w-24 h-24 text-primary-500 animate-pulse" />
            <p className="mt-4 text-lg font-semibold text-slate-400">
                {t('common.preparingGuide')}
            </p>
        </div>
    );
};

const ToastManager: React.FC = () => {
    return <ToastContainer />;
};

const SimulationStatusOverlay: React.FC = () => {
    const { t } = useTranslations();
    const isCatchingUp = useIsSimulationCatchingUp();
    
    if (!isCatchingUp) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[200] flex items-center justify-center backdrop-blur-sm">
            <AiLoadingIndicator loadingMessage={t('plantsView.syncProgress')} />
        </div>
    );
};

const AppContent: React.FC = () => {
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
    const activeView = useAppSelector(selectActiveView);
    const isCommandPaletteOpen = useAppSelector(selectIsCommandPaletteOpen);
    const onboardingCompleted = settings.onboardingCompleted;
    
    const mainContentRef = useRef<HTMLElement | null>(null);
    
    const { t } = useTranslations();
    const isOffline = useOnlineStatus();
    const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall();

    useDocumentEffects(settings);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo(0, 0);
        }
    }, [activeView]);

    useEffect(() => {
        if (isOffline) {
            dispatch(addNotification({ message: t('common.offlineWarning'), type: 'info' }));
        }
    }, [isOffline, dispatch, t]);

    const handleOnboardingClose = () => {
        dispatch(setSetting({ path: 'onboardingCompleted', value: true }));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                dispatch(setIsCommandPaletteOpen(!isCommandPaletteOpen));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, dispatch]);
    
    const OfflineBanner = () => {
        if (!isOffline) return null;
        return <div className="offline-banner">{t('common.offlineWarning')}</div>;
    };

    const renderView = () => {
        switch (activeView) {
            case View.Strains: return <StrainsView />;
            case View.Plants: return <PlantsView />;
            case View.Equipment: return <EquipmentView />;
            case View.Knowledge: return <KnowledgeView />;
            case View.Settings: return <SettingsView deferredPrompt={deferredPrompt} onInstallClick={handleInstallClick} />;
            case View.Help: return <HelpView />;
            default: return <PlantsView />;
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-300 font-sans">
            <SimulationStatusOverlay />
            {!onboardingCompleted && <OnboardingModal onClose={handleOnboardingClose} />}
            <CommandPalette 
                isOpen={isCommandPaletteOpen}
                onClose={() => dispatch(setIsCommandPaletteOpen(false))}
            />
            <LogActionModalContainer />
            <DeepDiveModalContainer />
            <AiDiagnosticsModalContainer />
            <Header 
                onCommandPaletteOpen={() => dispatch(setIsCommandPaletteOpen(true))}
                deferredPrompt={deferredPrompt}
                isInstalled={isInstalled}
                onInstallClick={handleInstallClick}
            />
            <OfflineBanner />
            <main ref={mainContentRef} className="flex-grow overflow-y-auto p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                     <Suspense fallback={<SkeletonLoader variant="list" count={5} />}>
                        {renderView()}
                    </Suspense>
                </div>
            </main>
             <TTSControls />
            <BottomNav />
        </div>
    );
};

export const App: React.FC = () => {
    const dispatch = useAppDispatch();
    const isAppReady = useAppSelector(state => state.ui.isAppReady);
    const settings = useAppSelector(selectSettings);
    const language = settings.language;

    useEffect(() => {
        const initializeApp = async () => {
            dispatch(setAppReady(false));
            await strainService.init();
            
            // Pass the entire settings object for initialization
            dispatch(initializeSimulation(settings));
            
            runDataMigrations(); 
            simulationLoop.initialize();
            dispatch(setAppReady(true));
        };
        initializeApp();
    }, [dispatch]);
    
    useEffect(() => {
        ttsService.init();

        if (language && i18nInstance.language !== language) {
            i18nInstance.changeLanguage(language).catch(console.error);
        }
    }, [language]);
    
    if (!isAppReady) {
        return <LoadingGate />;
    }

    return (
        <>
            <AppContent />
            <ToastManager />
        </>
    );
};