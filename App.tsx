import React, { useState, useEffect } from 'react';
import { View, Plant } from './types';
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

  useEffect(() => {
    try {
      localStorage.setItem('cannabis-grow-guide-plants', JSON.stringify(plants));
    } catch (error) {
      console.error("Failed to save plants to localStorage", error);
    }
  }, [plants]);

  const handleOnboardingComplete = () => {
    setSetting('onboardingCompleted', true);
  };

  const renderView = () => {
    switch (activeView) {
      case View.Strains:
        return <StrainsView plants={plants} setPlants={setPlants} setActiveView={setActiveView} />;
      case View.Plants:
        return <PlantsView plants={plants} setPlants={setPlants} setActiveView={setActiveView} />;
      case View.Equipment:
        return <EquipmentView />;
      case View.Knowledge:
        return <KnowledgeView />;
      case View.Help:
        return <HelpView />;
      case View.Settings:
        return <SettingsView setPlants={setPlants} />;
      default:
        return <PlantsView plants={plants} setPlants={setPlants} setActiveView={setActiveView} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100`}>
      {!settings.onboardingCompleted && <OnboardingModal onClose={handleOnboardingComplete} />}
      
      <header 
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-300"
        >
        <div className={`max-w-7xl mx-auto flex items-center justify-between p-3`}>
            <div className="flex items-center">
                <PhosphorIcons.Cannabis className="w-8 h-8 mr-2 text-primary-500" />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                Grow<span className="font-light">Guide</span>
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveView(View.Help)} 
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                  aria-label={t('nav.help')}
                >
                    <PhosphorIcons.Question className="w-6 h-6" />
                </button>
                 <button 
                  onClick={() => setActiveView(View.Settings)} 
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
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