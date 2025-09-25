import React, { useState, useEffect, useRef } from 'react';
import { View } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { ToastContainer } from '@/components/common/Toast';
import { Header } from '@/components/navigation/Header';
import { BottomNav } from '@/components/navigation/BottomNav';
import { StrainsView } from '@/components/views/StrainsView';
import { PlantsView } from '@/components/views/plants/PlantsView';
import { EquipmentView } from '@/components/views/EquipmentView';
import { KnowledgeView } from '@/components/views/KnowledgeView';
import { SettingsView } from '@/components/views/SettingsView';
import { HelpView } from '@/components/views/HelpView';
import { OnboardingModal } from '@/components/common/OnboardingModal';
import { CommandPalette } from '@/components/common/CommandPalette';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { strainService } from '@/services/strainService';
import { selectActiveView, selectIsCommandPaletteOpen, selectNotifications, selectSettings } from '@/stores/selectors';
import { TTSControls } from '@/components/common/TTSControls';
import { ttsService } from '@/services/ttsService';
import { useDocumentEffects } from '@/hooks/useDocumentEffects';
import { SimulationManager } from '@/components/common/SimulationManager';

const ToastManager: React.FC = () => {
    const notifications = useAppStore(selectNotifications);
    const removeNotification = useAppStore(state => state.removeNotification);
    return <ToastContainer notifications={notifications} onClose={removeNotification} />;
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

    // Centralize all document-level side effects into a custom hook for cleanliness.
    useDocumentEffects(settings);

    // Scroll to top on view change
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo(0, 0);
        }
    }, [activeView]);

    useEffect(() => {
        const requestPersistence = async () => {
            if (navigator.storage && navigator.storage.persist) {
                const isPersisted = await navigator.storage.persisted();
                if (!isPersisted) {
                    await navigator.storage.persist();
                }
            }
        };
        requestPersistence();
    }, []);
    
    useEffect(() => {
        if (t) {
            strainService.init(t, settings.language);
            useAppStore.getState().init(t);
        }
    }, [t, settings.language]);

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
            {isOnboardingOpen && <OnboardingModal onClose={handleOnboardingClose} />}
            <SimulationManager />
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
            <main ref={mainContentRef} className="flex-grow overflow-y-auto p-4 sm:p-6">
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
    // Initialize services that need access to the store
    useEffect(() => {
        // The service needs the store to dispatch actions on speech events.
        // This initialization connects the service to the store instance.
        ttsService; // This ensures the singleton instance is created and `onvoiceschanged` is set up.
    }, []);

    return (
        <>
            <AppContent />
            <ToastManager />
        </>
    );
};
