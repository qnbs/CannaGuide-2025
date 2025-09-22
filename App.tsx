import React, { useState, useEffect } from 'react';
import { View, Notification } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { ToastContainer } from '@/components/common/Toast';
import { Header } from '@/components/navigation/Header';
import { BottomNav } from '@/components/navigation/BottomNav';
import { StrainsView } from '@/components/views/StrainsView';
import { PlantsView } from '@/components/views/PlantsView';
import { EquipmentView } from '@/components/views/EquipmentView';
import { KnowledgeView } from '@/components/views/KnowledgeView';
import { SettingsView } from '@/components/views/SettingsView';
import { HelpView } from '@/components/views/HelpView';
import { OnboardingModal } from '@/components/common/OnboardingModal';
import { CommandPalette } from '@/components/common/CommandPalette';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { strainService } from '@/services/strainService';

// This component subscribes to the notifications state and renders the toast container.
const ToastManager: React.FC = () => {
    const notifications = useAppStore(state => state.notifications);
    const removeNotification = useAppStore(state => state.removeNotification);
    return <ToastContainer notifications={notifications} onClose={removeNotification} />;
};

const AppContent: React.FC = () => {
    const {
        settings,
        setSetting,
        activeView,
        setActiveView,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        addNotification
    } = useAppStore(state => ({
        settings: state.settings,
        setSetting: state.setSetting,
        activeView: state.activeView,
        setActiveView: state.setActiveView,
        isCommandPaletteOpen: state.isCommandPaletteOpen,
        setIsCommandPaletteOpen: state.setIsCommandPaletteOpen,
        addNotification: state.addNotification,
    }));
    
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(!settings.onboardingCompleted);
    const { t } = useTranslations();
    const isOffline = useOnlineStatus();
    const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall();

    useEffect(() => {
        const root = window.document.documentElement;
        root.className = '';
        root.classList.add('dark', `theme-${settings.theme}`);
        if (settings.accessibility.dyslexiaFont) root.classList.add('dyslexia-font');
        if (settings.accessibility.reducedMotion) root.classList.add('reduced-motion');
        if (settings.uiDensity === 'compact') root.classList.add('ui-density-compact');
        root.style.fontSize = settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px';
        root.lang = settings.language;
    }, [settings.theme, settings.fontSize, settings.language, settings.accessibility, settings.uiDensity]);

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
            strainService.init(t);
            // Initialize the Zustand store with the translation function
            useAppStore.getState().init(t);
        }
    }, [t]);

    useEffect(() => {
        let notificationId: number | null = null;
        if (isOffline) {
            // Using a simple notification system that might not have IDs
            addNotification(t('common.offlineWarning'), 'info');
        }
        return () => {
            // Cleanup logic if needed when component unmounts or status changes
        };
    }, [isOffline, addNotification, t]);

    const handleOnboardingClose = () => {
        setSetting('onboardingCompleted', true);
        setIsOnboardingOpen(false);
    };
    
    const { commands } = useCommandPalette();

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
        return (
            <div className="offline-banner">
                {t('common.offlineWarning')}
            </div>
        );
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
            <CommandPalette 
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                commands={commands}
            />

            <Header 
                onCommandPaletteOpen={() => setIsCommandPaletteOpen(true)}
                deferredPrompt={deferredPrompt}
                isInstalled={isInstalled}
                onInstallClick={handleInstallClick}
            />
            
            <OfflineBanner />

            <main className="flex-grow overflow-y-auto p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    {renderView()}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export const App: React.FC = () => {
    // Initialize the Zustand store which loads from localStorage
    useAppStore();
    
    return (
        <>
            <AppContent />
            <ToastManager />
        </>
    );
};