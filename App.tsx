
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Plant, Command, PlantStage } from './types';
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
import { usePlantManager } from './hooks/usePlantManager';
import { CommandPalette } from './components/common/CommandPalette';
import { ActionModalsContainer, ModalState } from './components/common/ActionModalsContainer';
import { dbService } from './services/dbService';


const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Plants);
  const { settings, setSetting } = useSettings();
  const { t } = useTranslations();
  const mainRef = useRef<HTMLElement>(null);
  
  const [plants, setPlants] = useState<(Plant | null)[]>(() => {
    try {
      const savedPlants = localStorage.getItem('cannabis-grow-guide-plants');
      if (savedPlants) {
        const parsedPlants = JSON.parse(savedPlants);
        const validPlants = Array.isArray(parsedPlants) ? parsedPlants : [];
        return Array.from({ length: 3 }, (_, i) => validPlants[i] || null);
      }
    } catch (error) {
      console.error("Failed to parse plants from localStorage", error);
    }
    return [null, null, null];
  });
  
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  const { 
    plants: managedPlants, 
    addJournalEntry, 
    completeTask, 
    waterAllPlants,
    advanceDay,
    updatePlantState,
  } = usePlantManager(plants, setPlants);

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
    dbService.initDB(); // Initialize IndexedDB when the app loads
  }, []);
  
  useEffect(() => {
      if (mainRef.current) {
          mainRef.current.scrollTo(0, 0);
      }
  }, [activeView]);

  useEffect(() => {
    try {
      localStorage.setItem('cannabis-grow-guide-plants', JSON.stringify(managedPlants));
    } catch (error) {
      console.error("Failed to save plants to localStorage", error);
    }
  }, [managedPlants]);

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
        { id: 'nav-strains', title: t('nav.strains'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Leafy />, action: exec(() => setActiveView(View.Strains)), keywords: 'database library sorten datenbank' },
        { id: 'nav-plants', title: t('nav.plants'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Plant />, action: exec(() => setActiveView(View.Plants)), keywords: 'dashboard growbox pflanzen' },
        { id: 'nav-equipment', title: t('nav.equipment'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Wrench />, action: exec(() => setActiveView(View.Equipment)), keywords: 'gear tools calculator rechner' },
        { id: 'nav-knowledge', title: t('nav.knowledge'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.BookOpenText />, action: exec(() => setActiveView(View.Knowledge)), keywords: 'guide learn wissen anleitung' },
        { id: 'nav-settings', title: t('nav.settings'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Gear />, action: exec(() => setActiveView(View.Settings)), keywords: 'setup options einstellungen' },
        { id: 'nav-help', title: t('nav.help'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Question />, action: exec(() => setActiveView(View.Help)), keywords: 'faq about hilfe' },
    ];

    const actionCommands: Command[] = [
         { id: 'action-water-all', title: t('plantsView.summary.waterAll'), subtitle: t('commandPalette.actions'), icon: <PhosphorIcons.Drop />, action: exec(() => waterAllPlants()), keywords: 'gießen' },
         { id: 'action-next-day', title: 'Simulate Next Day', subtitle: t('commandPalette.actions'), icon: <PhosphorIcons.ArrowClockwise />, action: exec(() => advanceDay()), keywords: 'simulate next day vorspulen' },
    ];

    const plantCommands: Command[] = managedPlants
        .filter((p): p is Plant => p !== null && p.stage !== PlantStage.Finished)
        .flatMap(plant => [
            { id: `inspect-${plant.id}`, title: `Inspect: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.MagnifyingGlass/>, action: exec(() => { setActiveView(View.Plants); setSelectedPlantId(plant.id); }), keywords: `details ${plant.name}` },
            { id: `water-${plant.id}`, title: `Water: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.Drop/>, action: exec(() => setModalState({ plantId: plant.id, type: 'watering' })), keywords: `gießen ${plant.name}` },
            { id: `feed-${plant.id}`, title: `Feed: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.TestTube/>, action: exec(() => setModalState({ plantId: plant.id, type: 'feeding' })), keywords: `düngen ${plant.name}` },
        ]);

    return [...navCommands, ...actionCommands, ...plantCommands];
  }, [managedPlants, t, setActiveView, waterAllPlants, setSelectedPlantId, setModalState, advanceDay]);

  const renderView = () => {
    switch (activeView) {
      case View.Strains:
        return <StrainsView plants={managedPlants} setPlants={setPlants} setActiveView={setActiveView} />;
      case View.Plants:
        return <PlantsView
                  plants={managedPlants} 
                  setPlants={setPlants} 
                  setActiveView={setActiveView} 
                  selectedPlantId={selectedPlantId}
                  setSelectedPlantId={setSelectedPlantId}
                  setModalState={setModalState}
                  completeTask={completeTask}
                  advanceDay={advanceDay}
                  updatePlantState={updatePlantState}
               />;
      case View.Equipment:
        return <EquipmentView />;
      case View.Knowledge:
        return <KnowledgeView />;
      case View.Help:
        return <HelpView />;
      case View.Settings:
        return <SettingsView setPlants={setPlants} />;
      default:
        return <PlantsView
                  plants={managedPlants} 
                  setPlants={setPlants} 
                  setActiveView={setActiveView} 
                  selectedPlantId={selectedPlantId}
                  setSelectedPlantId={setSelectedPlantId}
                  setModalState={setModalState}
                  completeTask={completeTask}
                  advanceDay={advanceDay}
                  updatePlantState={updatePlantState}
               />;
    }
  };

  return (
    <div className={`h-screen grid grid-rows-[auto_1fr_auto] font-sans text-slate-200`}>
      {!settings.onboardingCompleted && <OnboardingModal onClose={handleOnboardingComplete} />}
      
      <header className="glass-pane sticky top-0 z-30">
        <div className={`max-w-7xl mx-auto flex items-center justify-between px-3 py-1.5`}>
            <div className="flex-1 flex justify-start">
                <div className="flex items-center">
                    <PhosphorIcons.Cannabis className="w-8 h-8 mr-2 text-primary-400" />
                    <h1 className="text-2xl font-bold text-slate-100 tracking-wider font-display">
                    <span className="text-primary-400">Canna</span>Guide <span className="text-xs font-light text-primary-500/80">2025</span>
                    </h1>
                </div>
            </div>
            
            <div className="flex-1 flex justify-center">
                <h2 className="text-xl font-semibold text-slate-300 whitespace-nowrap hidden sm:block">
                    {currentTitle}
                </h2>
            </div>
            
            <div className="flex-1 flex justify-end">
                <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="p-2 text-slate-400 hover:bg-slate-700 hover:text-primary-300 rounded-full transition-colors"
                      aria-label="Open Command Palette"
                    >
                        <PhosphorIcons.CommandLine className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setActiveView(View.Help)} 
                      className="p-2 text-slate-400 hover:bg-slate-700 hover:text-primary-300 rounded-full transition-colors"
                      aria-label={t('nav.help')}
                    >
                        <PhosphorIcons.Question className="w-6 h-6" />
                    </button>
                     <button 
                      onClick={() => setActiveView(View.Settings)} 
                      className="p-2 text-slate-400 hover:bg-slate-700 hover:text-primary-300 rounded-full transition-colors"
                      aria-label={t('nav.settings')}
                     >
                        <PhosphorIcons.Gear className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
      </header>

      <main ref={mainRef} className={`min-h-0 p-4 md:p-6 w-full max-w-7xl mx-auto overflow-auto ${activeView === View.Strains || activeView === View.Plants ? 'flex flex-col' : ''}`}>
        {renderView()}
      </main>

      <nav>
        <BottomNav activeView={activeView} setActiveView={setActiveView} />
      </nav>

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />
      
      <ActionModalsContainer 
        modalState={modalState}
        setModalState={setModalState}
        onAddJournalEntry={addJournalEntry}
      />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </LanguageProvider>
    </SettingsProvider>
  )
}

export default App;
