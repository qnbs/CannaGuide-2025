import React, { useState, useEffect, useRef } from 'react';
// FIX: Changed import paths to be relative
import { View } from './types';
import { useAppStore } from './stores/useAppStore';
import { useTranslations } from './hooks/useTranslations';
import { ToastContainer } from './components/common/Toast';
import { Header } from './components/navigation/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { StrainsView } from './components/views/StrainsView';
import { PlantsView } from './components/views/PlantsView';
import { EquipmentView } from './components/views/EquipmentView';
import { KnowledgeView } from './components/views/KnowledgeView';
import { SettingsView } from './components/views/SettingsView';
import { HelpView } from './components/views/HelpView';
import { OnboardingModal } from './components/common/OnboardingModal';
import { CommandPalette } from './components/common/CommandPalette';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePwaInstall } from './hooks/usePwaInstall';
import { strainService } from './services/strainService';
import { selectActiveView, selectIsCommandPaletteOpen, selectNotifications, selectSettings } from './stores/selectors';
import { TTSControls } from './components/common/TTSControls';
import { ttsService } from './services/ttsService';
import { useDocumentEffects } from './hooks/useDocumentEffects';
import { AiLoadingIndicator } from './components/common/AiLoadingIndicator';
import { CannabisLeafIcon } from './components/icons/CannabisLeafIcon';
import { simulationManager } from './services/SimulationManager';
import { i18nInstance } from './i18n';

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
    const notifications = useAppStore(selectNotifications);
    const removeNotification = useAppStore(state => state.removeNotification);
    return <ToastContainer notifications={notifications} onClose={removeNotification} />;
};

const SimulationStatusOverlay: React.FC = () => {
    const { t } = useTranslations();
    const isCatchingUp = useAppStore(state => state.isCatchingUp);
    
    if (!isCatchingUp) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[200] flex items-center justify-center backdrop-blur-sm">
            <AiLoadingIndicator loadingMessage={t('plantsView.syncProgress')} />
        </div>
    );
};

const AppContent: React.FC = () => {
    const settings = useAppStore(selectSettings);
    const activeView = useAppStore(selectActiveView);
    const isCommandPaletteOpen = useAppStore(selectIsCommandPaletteOpen);
    const mainContentRef = useRef<HTMLElement | null>(null);
    
    const { setSetting, setIsCommandPaletteOpen, addNotification } = useAppStore(state => ({
        setSetting: state.setSetting,
        setIsCommandPaletteOpen: state.setIsCommandPaletteOpen,
        addNotification: state.addNotification,
    }));
    
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(!settings.onboardingCompleted);
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
            addNotification(t('common.offlineWarning'), 'info');
        }
    }, [isOffline, addNotification, t]);

    const handleOnboardingClose = () => {
        setSetting('onboardingCompleted', true);
        setIsOnboardingOpen(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(!isCommandPaletteOpen);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);
    
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
        <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans">
            <SimulationStatusOverlay />
            {isOnboardingOpen && <OnboardingModal onClose={handleOnboardingClose} />}
            <CommandPalette 
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
            />
            <Header 
                onCommandPaletteOpen={() => setIsCommandPaletteOpen(true)}
                deferredPrompt={deferredPrompt}
                isInstalled={isInstalled}
                onInstallClick={handleInstallClick}
            />
            <OfflineBanner />
            <main ref={mainContentRef} className="flex-grow overflow-y-auto p-4 sm:p-6 pb-24">
                <div className="max-w-7xl mx-auto">
                    {renderView()}
                </div>
            </main>
             <TTSControls />
            <BottomNav />
        </div>
    );
};

export const App: React.FC = () => {
    const { isAppReady, setAppReady } = useAppStore(state => ({
        isAppReady: state.isAppReady,
        setAppReady: state.setAppReady,
    }));
    
    useEffect(() => {
        const initializeApp = async () => {
            setAppReady(false);
            await strainService.init();
            await simulationManager.initialize();
            setAppReady(true);
        };
        initializeApp();
    }, [setAppReady]);

    useEffect(() => {
        // Initialize TTS service
        ttsService.init();

        // Subscribe to simulation setting changes
        const unsubscribeSim = useAppStore.subscribe(
            state => state.settings.simulationSettings,
            () => simulationManager.update()
        );

        // Subscribe to language changes
        const unsubscribeLang = useAppStore.subscribe(
            state => state.settings.language,
            (lang) => {
                if (lang && i18nInstance.language !== lang) {
                    i18nInstance.changeLanguage(lang);
                }
            }
        );

        // Perform an initial language sync after the store has been hydrated.
        const hydratedLanguage = useAppStore.getState().settings.language;
        if (i18nInstance.language !== hydratedLanguage) {
            i18nInstance.changeLanguage(hydratedLanguage);
        }

        return () => {
            unsubscribeSim();
            unsubscribeLang();
        };
    }, []);
    
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
