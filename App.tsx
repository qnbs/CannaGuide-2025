import React, { useState, useEffect, useMemo } from 'react';
// Fix: import PlantStage to use in plantCommands filter
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


const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Plants);
  const { settings, setSetting } = useSettings();
  const { t } = useTranslations();
  
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

  const { addJournalEntry, completeTask, waterAllPlants } = usePlantManager(plants, setPlants);

  useEffect(() => {
    try {
      localStorage.setItem('cannabis-grow-guide-plants', JSON.stringify(plants));
    } catch (error) {
      console.error("Failed to save plants to localStorage", error);
    }
  }, [plants]);

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
         { id: 'action-toggle-theme', title: `Theme: ${settings.theme === 'dark' ? t('settingsView.themes.light') : t('settingsView.themes.dark')}`, subtitle: t('commandPalette.actions'), icon: <PhosphorIcons.Sun />, action: exec(() => setSetting('theme', settings.theme === 'dark' ? 'light' : 'dark')), keywords: 'dark mode light mode theme farbschema' },
         { id: 'action-water-all', title: t('plantsView.summary.waterAll'), subtitle: t('commandPalette.actions'), icon: <PhosphorIcons.Drop />, action: exec(() => waterAllPlants()), keywords: 'gießen' },
    ];

    const plantCommands: Command[] = plants
        // Fix: Corrected the type mismatch by comparing p.stage with PlantStage.Finished instead of View.Strains. This filters out finished plants from the command palette.
        .filter((p): p is Plant => p !== null && p.stage !== PlantStage.Finished)
        .flatMap(plant => [
            { id: `inspect-${plant.id}`, title: `Inspect: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.MagnifyingGlass/>, action: exec(() => { setActiveView(View.Plants); setSelectedPlantId(plant.id); }), keywords: `details ${plant.name}` },
            { id: `water-${plant.id}`, title: `Water: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.Drop/>, action: exec(() => setModalState({ plantId: plant.id, type: 'watering' })), keywords: `gießen ${plant.name}` },
            { id: `feed-${plant.id}`, title: `Feed: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.TestTube/>, action: exec(() => setModalState({ plantId: plant.id, type: 'feeding' })), keywords: `düngen ${plant.name}` },
        ]);

    return [...navCommands, ...actionCommands, ...plantCommands];
  }, [plants, settings.theme, t, setActiveView, setSetting, waterAllPlants, setSelectedPlantId, setModalState]);

  const renderView = () => {
    switch (activeView) {
      case View.Strains:
        return <StrainsView plants={plants} setPlants={setPlants} setActiveView={setActiveView} />;
      case View.Plants:
        return <PlantsView
                  plants={plants} 
                  setPlants={setPlants} 
                  setActiveView={setActiveView} 
                  selectedPlantId={selectedPlantId}
                  setSelectedPlantId={setSelectedPlantId}
                  setModalState={setModalState}
                  completeTask={completeTask}
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
                  plants={plants} 
                  setPlants={setPlants} 
                  setActiveView={setActiveView} 
                  selectedPlantId={selectedPlantId}
                  setSelectedPlantId={setSelectedPlantId}
                  setModalState={setModalState}
                  completeTask={completeTask}
               />;
    }
  };

  return (
    <div className={`min-h-screen font-sans text-slate-900 dark:text-slate-100`}>
      {!settings.onboardingCompleted && <OnboardingModal onClose={handleOnboardingComplete} />}
      
      <header 
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-300"
        >
        <div className={`max-w-7xl mx-auto flex items-center justify-between p-3`}>
            <div className="flex items-center">
                <PhosphorIcons.Cannabis className="w-8 h-8 mr-2 text-primary-500" />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                Grow<span className="font-light">Guide</span>
                </h1>
            </div>
            <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full"
                  aria-label="Open Command Palette"
                >
                    <PhosphorIcons.CommandLine className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveView(View.Help)} 
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full"
                  aria-label={t('nav.help')}
                >
                    <PhosphorIcons.Question className="w-6 h-6" />
                </button>
                 <button 
                  onClick={() => setActiveView(View.Settings)} 
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full"
                  aria-label={t('nav.settings')}
                 >
                    <PhosphorIcons.Gear className="w-6 h-6" />
                </button>
            </div>
        </div>
      </header>

      <main className={`p-4 md:p-6 pb-24 max-w-7xl mx-auto`}>
        {renderView()}
      </main>

      <BottomNav activeView={activeView} setActiveView={setActiveView} />

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