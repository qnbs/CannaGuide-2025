import React, { useState, useEffect } from 'react';
import { View } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { ToastContainer } from '@/components/common/Toast';
import { Header } from '@/components/navigation/Header';
import { BottomNav } from '@/components/navigation/BottomNav';
import { StrainsView } from '@/components/views/StrainsView';
import { PlantsView } from '@/components/views/plants/PlantsView';
import { EquipmentView } from '@/components/views/EquipmentView';
import { KnowledgeView } from '@/components/views/knowledge/KnowledgeView';
import { SettingsView } from '@/components/views/SettingsView';
import { HelpView } from '@/components/views/HelpView';
import { OnboardingModal } from '@/components/common/OnboardingModal';
import { CommandPalette } from '@/components/common/CommandPalette';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { strainService } from '@/services/strainService';
import { selectActiveView, selectIsCommandPaletteOpen, selectNotifications, selectSettings } from '@/stores/selectors';

const ToastManager: React.FC = () => {
    const notifications = useAppStore(selectNotifications);
    const removeNotification = useAppStore(state => state.removeNotification);
    return <ToastContainer notifications={notifications} onClose={removeNotification} />;
};

const AppContent: React.FC = () => {
    const settings = useAppStore(selectSettings);
    const activeView = useAppStore(selectActiveView);
    const isCommandPaletteOpen = useAppStore(selectIsCommandPaletteOpen);
    
    const { setSetting, setIsCommandPaletteOpen, addNotification, advanceSimulation } = useAppStore(state => ({
        setSetting: state.setSetting,
        setIsCommandPaletteOpen: state.setIsCommandPaletteOpen,
        addNotification: state.addNotification,
        advanceSimulation: state.advanceSimulation,
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

    // Time-based simulation logic
    useEffect(() => {
        // Run once on load to catch up
        advanceSimulation();

        if (settings.simulationSettings.autoAdvance) {
            const speedInMinutes = { '1x': 5, '2x': 2.5, '5x': 1, '10x': 0.5, '20x': 0.25 }[settings.simulationSettings.speed] || 5;
            const intervalId = setInterval(() => {
                advanceSimulation();
            }, speedInMinutes * 60 * 1000); // Check based on simulation speed
            return () => clearInterval(intervalId);
        }
    }, [settings.simulationSettings.autoAdvance, settings.simulationSettings.speed, advanceSimulation]);
    
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
    useAppStore();
    return (
        <>
            <AppContent />
            <ToastManager />
        </>
    );
};
