
import React, { useState, useEffect } from 'react';
import { View } from './types';
import { useSettings } from './hooks/useSettings';
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { PlantProvider } from './context/PlantContext';
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
import { useCommandPalette } from './hooks/useCommandPalette';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useNotifications } from './context/NotificationContext';
import { useTranslations } from './hooks/useTranslations';
import { usePwaInstall } from './hooks/usePwaInstall';


const AppContent: React.FC = () => {
    const { settings, setSetting } = useSettings();
    const [activeView, setActiveView] = useState<View>(settings.defaultView);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(!settings.onboardingCompleted);
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const isOffline = useOnlineStatus();
    const { deferredPrompt, handleInstallClick } = usePwaInstall();

    useEffect(() => {
        if (isOffline) {
            addNotification(t('common.offlineWarning'), 'info');
        }
    }, [isOffline, addNotification, t]);

    const handleOnboardingClose = () => {
        setSetting('onboardingCompleted', true);
        setIsOnboardingOpen(false);
    };
    
    const { isCommandPaletteOpen, setIsCommandPaletteOpen, commands } = useCommandPalette({ setActiveView });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsCommandPaletteOpen]);
    
    // Add an offline banner
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
            case View.Strains:
                return <StrainsView setActiveView={setActiveView} />;
            case View.Plants:
                return <PlantsView setActiveView={setActiveView} />;
            case View.Equipment:
                return <EquipmentView />;
            case View.Knowledge:
                return <KnowledgeView />;
            case View.Settings:
                return <SettingsView />;
            case View.Help:
                 return <HelpView />;
            default:
                return <PlantsView setActiveView={setActiveView} />;
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
                activeView={activeView} 
                setActiveView={setActiveView} 
                onCommandPaletteOpen={() => setIsCommandPaletteOpen(true)}
                showInstallPrompt={!!deferredPrompt}
                onInstallClick={handleInstallClick}
            />
            
            <OfflineBanner />

            <main className="flex-grow overflow-y-auto p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    {renderView()}
                </div>
            </main>

            <BottomNav activeView={activeView} setActiveView={setActiveView} />
        </div>
    );
};


export const App: React.FC = () => {
    return (
        <SettingsProvider>
            <LanguageProvider>
                <NotificationProvider>
                    <PlantProvider>
                        <AppContent />
                    </PlantProvider>
                </NotificationProvider>
            </LanguageProvider>
        </SettingsProvider>
    );
};
