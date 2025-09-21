import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Plant, Command, PlantStage, Theme } from './types';
import { BottomNav } from './components/navigation/BottomNav';
import { StrainsView } from './components/views/StrainsView';
import { PlantsView } from './components/views/PlantsView';
import { EquipmentView } from './components/views/EquipmentView';
import { KnowledgeView } from './components/views/KnowledgeView';
import { HelpView } from './components/views/HelpView';
import { SettingsView } from './components/views/SettingsView';
import { SettingsProvider } from './context/SettingsContext';
import { useSettings } from './hooks/useSettings';
import { PhosphorIcons } from './components/icons/PhosphorIcons';
import { NotificationProvider } from './context/NotificationContext';
import { OnboardingModal } from './components/common/OnboardingModal';
import { LanguageProvider } from './context/LanguageContext';
import { useTranslations } from './hooks/useTranslations';
import { CommandPalette } from './components/common/CommandPalette';
import { ActionModalsContainer, ModalState } from './components/common/ActionModalsContainer';
import { dbService } from './services/dbService';
import { usePlantAdvisorArchive } from './hooks/usePlantAdvisorArchive';
import { Button } from './components/common/Button';
import { PlantProvider, usePlants } from './context/PlantContext';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { CannabisLeafIcon } from './components/icons/CannabisLeafIcon';

const AppContent: React.FC = () => {
  const { settings, setSetting } = useSettings();
  const [activeView, setActiveView] = useState<View>(settings.defaultView);
  const { t } = useTranslations();
  const mainRef = useRef<HTMLElement>(null);
  
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  
  const { deferredPrompt, handleInstallClick } = usePwaInstall();
  const isOffline = useOnlineStatus();

  const {
    plants,
    addJournalEntry,
    waterAllPlants,
    advanceDay,
    updatePlantState,
  } = usePlants();

  const selectedPlant = useMemo(() => plants.find(p => p?.id === selectedPlantId), [plants, selectedPlantId]);
  
  const { 
      archive: plantAdvisorArchive, 
      addAdvisorResponse, 
      updateAdvisorResponse, 
      deleteAdvisorResponse 
  } = usePlantAdvisorArchive();

  const viewTitles: Record<View, string> = useMemo(() => ({
    [View.Strains]: t('strainsView.title'),
    [View.Plants]: t('plantsView.title'),
    [View.Equipment]: t('equipmentView.title'),
    [View.Knowledge]: t('knowledgeView.title'),
    [View.Help]: t('helpView.title'),
    [View.Settings]: t('settingsView.title'),
  }), [t]);

  const currentTitle = viewTitles[activeView];
  
  useEffect(() => {
    const baseTitle = 'CannaGuide 2025';
    if (selectedPlant) {
      document.title = `${selectedPlant.name} - ${baseTitle}`;
    } else {
      document.title = `${currentTitle} - ${baseTitle}`;
    }
  }, [currentTitle, selectedPlant]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view && Object.values(View).includes(view as View)) {
        setActiveView(view as View);
    } else {
        setActiveView(settings.defaultView);
    }
    
    dbService.initDB();
    updatePlantState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePlantState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let intervalId: number | undefined;
    if (settings.simulationSettings.autoAdvance) {
      intervalId = window.setInterval(() => {
        updatePlantState();
      }, 5 * 60 * 1000); // every 5 minutes
    }
    return () => window.clearInterval(intervalId);
  }, [settings.simulationSettings.autoAdvance, updatePlantState]);

  useEffect(() => {
      if (mainRef.current) {
          mainRef.current.scrollTo(0, 0);
      }
  }, [activeView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCommandPaletteOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const handleOnboardingComplete = () => {
    setSetting('onboardingCompleted', true);
  };

  const commands: Command[] = useMemo(() => {
    const exec = (fn: () => void) => () => {
        fn();
        setIsCommandPaletteOpen(false);
    };

    const navCommands: Command[] = [
        { id: 'nav-strains', title: t('nav.strains'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Leafy />, action: exec(() => setActiveView(View.Strains)), keywords: 'database library sorten datenbank bibliothek', shortcut: ['G', 'S'] },
        { id: 'nav-plants', title: t('nav.plants'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Plant />, action: exec(() => setActiveView(View.Plants)), keywords: 'dashboard growbox pflanzen anbau', shortcut: ['G', 'P'] },
        { id: 'nav-equipment', title: t('nav.equipment'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Wrench />, action: exec(() => setActiveView(View.Equipment)), keywords: 'gear tools calculator rechner ausrüstung werkzeuge', shortcut: ['G', 'E'] },
        { id: 'nav-knowledge', title: t('nav.knowledge'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.BookOpenText />, action: exec(() => setActiveView(View.Knowledge)), keywords: 'guide learn wissen anleitung lernen', shortcut: ['G', 'K'] },
        { id: 'nav-settings', title: t('nav.settings'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Gear />, action: exec(() => setActiveView(View.Settings)), keywords: 'setup options einstellungen optionen', shortcut: ['G', 'T'] },
        { id: 'nav-help', title: t('nav.help'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Question />, action: exec(() => setActiveView(View.Help)), keywords: 'faq about hilfe über', shortcut: ['?'] },
    ];

    const actionCommands: Command[] = [
         { id: 'action-water-all', title: t('plantsView.summary.waterAll'), subtitle: t('commandPalette.actions'), icon: <PhosphorIcons.Drop />, action: exec(() => waterAllPlants()), keywords: 'gießen alle' },
         { id: 'action-next-day', title: t('plantsView.summary.simulateNextDay'), subtitle: t('commandPalette.actions'), icon: <PhosphorIcons.ArrowClockwise />, action: exec(() => advanceDay()), keywords: 'simulate next day vorspulen nächster tag simulieren' },
    ];

    const plantCommands: Command[] = plants
        .filter((p): p is Plant => p !== null && p.stage !== PlantStage.Finished)
        .flatMap(plant => [
            { id: `inspect-${plant.id}`, title: `${t('commandPalette.inspect')}: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.MagnifyingGlass/>, action: exec(() => { setActiveView(View.Plants); setSelectedPlantId(plant.id); }), keywords: `details ${plant.name} ansehen prüfen` },
            { id: `water-${plant.id}`, title: `${t('commandPalette.water')}: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.Drop/>, action: exec(() => setModalState({ plantId: plant.id, type: 'watering' })), keywords: `gießen ${plant.name}` },
            { id: `feed-${plant.id}`, title: `${t('commandPalette.feed')}: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.TestTube/>, action: exec(() => setModalState({ plantId: plant.id, type: 'feeding' })), keywords: `düngen ${plant.name}` },
        ]);
    
    const settingsCommands: Command[] = [
        { 
            id: 'toggle-language', 
            title: t('commandPalette.toggleLanguage', { lang: settings.language === 'en' ? 'Deutsch' : 'English' }), 
            subtitle: t('commandPalette.settings'), 
            icon: <PhosphorIcons.Globe />, 
            action: exec(() => {
                const newLang = settings.language === 'en' ? 'de' : 'en';
                setSetting('language', newLang);
            }), 
            keywords: 'sprache language translate übersetzen' 
        },
        { 
            id: 'toggle-theme', 
            title: t('commandPalette.toggleTheme'), 
            subtitle: t('commandPalette.settings'), 
            icon: <PhosphorIcons.PaintBrush />, 
            action: exec(() => {
                const themes: Theme[] = ['midnight', 'forest', 'purple-haze', 'desert-sky', 'rose-quartz'];
                const currentThemeIndex = themes.indexOf(settings.theme);
                const nextTheme = themes[(currentThemeIndex + 1) % themes.length];
                setSetting('theme', nextTheme);
            }), 
            keywords: 'design farbe color theme' 
        },
    ];

    return [...navCommands, ...actionCommands, ...plantCommands, ...settingsCommands];
  }, [t, plants, waterAllPlants, advanceDay, setActiveView, setSelectedPlantId, setModalState, settings.language, settings.theme, setSetting]);
  
  return (
    <div className="app font-sans bg-slate-900 text-slate-100 flex flex-col h-screen overflow-hidden">
        <div id="toast-container" className="fixed top-4 right-4 z-[1000] space-y-2 w-full max-w-xs"></div>
        {!settings.onboardingCompleted && <OnboardingModal onClose={handleOnboardingComplete} />}
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />
        
        <header className="flex-shrink-0 glass-pane p-2 z-20">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex justify-start">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setActiveView(View.Plants)}
                                className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-lg p-1 -m-1 transition-opacity hover:opacity-80"
                                aria-label={t('nav.plants')}
                            >
                            <CannabisLeafIcon className="w-8 h-8 text-primary-400" />
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-wider font-display hidden sm:block ml-2">
                                <span className="text-primary-400">Canna</span>Guide
                                <span className="text-xs font-light text-slate-400 align-top ml-1.5">2025</span>
                            </h1>
                            </button>
                            <h2 className="text-xl font-bold font-display text-primary-400 whitespace-nowrap sm:hidden">
                                {selectedPlant ? selectedPlant.name : currentTitle}
                            </h2>
                        </div>
                    </div>
        
                    <div className="flex-shrink-0 hidden sm:block">
                        <h2 className="text-2xl font-bold font-display text-primary-400 text-center whitespace-nowrap">
                            {selectedPlant ? selectedPlant.name : currentTitle}
                        </h2>
                    </div>
                    
                    <div className="flex-1 flex justify-end">
                        <div className="flex items-center gap-2">
                            {isOffline && <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs flex items-center gap-1"><PhosphorIcons.WarningCircle /> {t('common.offlineWarning')}</div>}
                            {deferredPrompt && <Button size="sm" onClick={handleInstallClick} className="px-1.5 py-0.5 sm:px-2 sm:py-1">{t('common.installPwa')}</Button>}
                            <Button size="sm" variant="secondary" onClick={() => setIsCommandPaletteOpen(true)} aria-label={t('commandPalette.open')}><PhosphorIcons.CommandLine className="w-5 h-5"/></Button>
                            <Button size="sm" variant="secondary" onClick={() => setActiveView(View.Help)} aria-label={t('nav.help')}><PhosphorIcons.Question className="w-5 h-5"/></Button>
                            <Button size="sm" variant="secondary" onClick={() => setActiveView(View.Settings)} aria-label={t('nav.settings')}><PhosphorIcons.Gear className="w-5 h-5"/></Button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        
        <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto w-full">
                {activeView === View.Strains && <StrainsView setActiveView={setActiveView} />}
                {activeView === View.Plants && <PlantsView setActiveView={setActiveView} selectedPlantId={selectedPlantId} setSelectedPlantId={setSelectedPlantId} setModalState={setModalState} advisorArchive={plantAdvisorArchive} addAdvisorResponse={addAdvisorResponse} updateAdvisorResponse={updateAdvisorResponse} deleteAdvisorResponse={deleteAdvisorResponse} />}
                {activeView === View.Equipment && <EquipmentView />}
                {activeView === View.Knowledge && <KnowledgeView />}
                {activeView === View.Help && <HelpView />}
                {activeView === View.Settings && <SettingsView />}
            </div>
        </main>

        <BottomNav activeView={activeView} setActiveView={setActiveView} />
        
        <ActionModalsContainer
            modalState={modalState}
            setModalState={setModalState}
            onAddJournalEntry={addJournalEntry}
        />
    </div>
  );
};

export const App = () => {
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