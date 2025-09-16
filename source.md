# Cannabis Grow Guide 2025 - Source Code Documentation

This document provides a comprehensive overview of the entire source code for the "Cannabis Grow Guide 2025" application. The code is organized into logical sections for clarity and maintainability.

## Directory Structure

```
.
├── App.css
├── App.tsx
├── README.md
├── components/
│   ├── common/
│   ├── icons/
│   ├── navigation/
│   └── views/
├── constants.ts
├── context/
├── data/
│   └── strains/
├── hooks/
├── index.html
├── index.tsx
├── locales/
│   ├── de/
│   └── en/
├── metadata.json
├── services/
└── types.ts
```

---

## Part 1: Core Application Files

This section contains the core files that set up and run the application.

### `index.html`

The main HTML file that serves as the entry point for the web application. It includes metadata, font imports, Tailwind CSS configuration, and the root div for the React app.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cannabis Grow Guide 2025</title>
    <meta name="description" content="An interactive guide to help you manage your cannabis cultivation journey, from seed to harvest. Track your plants, learn about strains, and get expert tips on equipment and techniques." />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Cannabis Grow Guide 2025" />
    <meta property="og:description" content="An interactive guide to help you manage your cannabis cultivation journey, from seed to harvest. Track your plants, learn about strains, and get expert tips on equipment and techniques." />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Cannabis Grow Guide 2025" />
    <meta name="twitter:description" content="An interactive guide to help you manage your cannabis cultivation journey, from seed to harvest. Track your plants, learn about strains, and get expert tips on equipment and techniques." />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@500;700&family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/App.css">
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <style>
      :root, :root.dark.theme-midnight {
        color-scheme: dark;
        --color-bg-primary: 15 23 42; /* slate-900 */
        --color-bg-component: 30 41 59; /* slate-800 */
        --color-border: 51 65 85; /* slate-700 */
        --color-primary-50: 239 246 255; --color-primary-100: 219 234 254; --color-primary-200: 191 219 254; --color-primary-300: 147 197 253; --color-primary-400: 96 165 250; --color-primary-500: 59 130 246; --color-primary-600: 37 99 235; --color-primary-700: 29 78 216; --color-primary-800: 30 64 175; --color-primary-900: 30 58 138; --color-primary-950: 23 37 84;
        --color-accent-50: 236 254 255; --color-accent-100: 207 250 254; --color-accent-200: 165 243 252; --color-accent-300: 103 232 249; --color-accent-400: 34 211 238; --color-accent-500: 6 182 212; --color-accent-600: 8 145 178; --color-accent-700: 14 116 144; --color-accent-800: 21 94 117; --color-accent-900: 24 78 99; --color-accent-950: 8 46 60;
        --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23;
        --color-text-on-accent: 23 37 84; /* primary-950 */
      }
      :root.dark.theme-forest {
        color-scheme: dark;
        --color-bg-primary: 20 31 25; /* Dark Green */
        --color-bg-component: 28 44 35; /* Darker Green */
        --color-border: 41 61 49; /* Even Darker Green */
        --color-primary-50: 240 253 244; --color-primary-100: 220 252 231; --color-primary-200: 187 247 208; --color-primary-300: 134 239 172; --color-primary-400: 74 222 128; --color-primary-500: 34 197 94; --color-primary-600: 22 163 74; --color-primary-700: 21 128 61; --color-primary-800: 22 101 52; --color-primary-900: 20 83 45; --color-primary-950: 5 46 22;
        --color-accent-50: 236 252 241; --color-accent-100: 209 250 229; --color-accent-200: 167 243 208; --color-accent-300: 110 231 183; --color-accent-400: 52 211 153; --color-accent-500: 16 185 129; --color-accent-600: 5 150 105; --color-accent-700: 4 120 87; --color-accent-800: 6 95 70; --color-accent-900: 6 78 59; --color-accent-950: 3 44 34;
        --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23;
        --color-text-on-accent: 5 46 22;
      }
      :root.dark.theme-purple-haze {
        color-scheme: dark;
        --color-bg-primary: 28 25 45; /* Dark Purple */
        --color-bg-component: 40 37 68; /* Darker Purple */
        --color-border: 55 51 86; /* Even Darker Purple */
        --color-primary-50: 245 243 255; --color-primary-100: 238 234 254; --color-primary-200: 224 218 255; --color-primary-300: 198 189 255; --color-primary-400: 163 148 255; --color-primary-500: 128 109 251; --color-primary-600: 110 87 248; --color-primary-700: 93 68 227; --color-primary-800: 77 54 186; --color-primary-900: 64 45 153; --color-primary-950: 37 26 89;
        --color-accent-50: 252 246 255; --color-accent-100: 247 236 255; --color-accent-200: 239 219 255; --color-accent-300: 227 194 255; --color-accent-400: 210 159 255; --color-accent-500: 192 121 255; --color-accent-600: 173 83 248; --color-accent-700: 149 57 222; --color-accent-800: 122 46 179; --color-accent-900: 100 39 146; --color-accent-950: 67 19 98;
        --color-neutral-50: 248 250 252; --color-neutral-100: 241 245 249; --color-neutral-200: 226 232 240; --color-neutral-300: 203 213 225; --color-neutral-400: 148 163 184; --color-neutral-500: 100 116 139; --color-neutral-600: 71 85 105; --color-neutral-700: 51 65 85; --color-neutral-800: 30 41 59; --color-neutral-900: 15 23 42; --color-neutral-950: 2 6 23;
        --color-text-on-accent: 255 255 255;
      }
    </style>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              primary: { 50: 'rgb(var(--color-primary-50) / <alpha-value>)', 100: 'rgb(var(--color-primary-100) / <alpha-value>)', 200: 'rgb(var(--color-primary-200) / <alpha-value>)', 300: 'rgb(var(--color-primary-300) / <alpha-value>)', 400: 'rgb(var(--color-primary-400) / <alpha-value>)', 500: 'rgb(var(--color-primary-500) / <alpha-value>)', 600: 'rgb(var(--color-primary-600) / <alpha-value>)', 700: 'rgb(var(--color-primary-700) / <alpha-value>)', 800: 'rgb(var(--color-primary-800) / <alpha-value>)', 900: 'rgb(var(--color-primary-900) / <alpha-value>)', 950: 'rgb(var(--color-primary-950) / <alpha-value>)' },
              accent: { 50: 'rgb(var(--color-accent-50) / <alpha-value>)', 100: 'rgb(var(--color-accent-100) / <alpha-value>)', 200: 'rgb(var(--color-accent-200) / <alpha-value>)', 300: 'rgb(var(--color-accent-300) / <alpha-value>)', 400: 'rgb(var(--color-accent-400) / <alpha-value>)', 500: 'rgb(var(--color-accent-500) / <alpha-value>)', 600: 'rgb(var(--color-accent-600) / <alpha-value>)', 700: 'rgb(var(--color-accent-700) / <alpha-value>)', 800: 'rgb(var(--color-accent-800) / <alpha-value>)', 900: 'rgb(var(--color-accent-900) / <alpha-value>)', 950: 'rgb(var(--color-accent-950) / <alpha-value>)' },
              slate: { 50: 'rgb(var(--color-neutral-50) / <alpha-value>)', 100: 'rgb(var(--color-neutral-100) / <alpha-value>)', 200: 'rgb(var(--color-neutral-200) / <alpha-value>)', 300: 'rgb(var(--color-neutral-300) / <alpha-value>)', 400: 'rgb(var(--color-neutral-400) / <alpha-value>)', 500: 'rgb(var(--color-neutral-500) / <alpha-value>)', 600: 'rgb(var(--color-neutral-600) / <alpha-value>)', 700: 'rgb(var(--color-neutral-700) / <alpha-value>)', 800: 'rgb(var(--color-neutral-800) / <alpha-value>)', 900: 'rgb(var(--color-neutral-900) / <alpha-value>)', 950: 'rgb(var(--color-neutral-950) / <alpha-value>)' },
              'on-accent': 'rgb(var(--color-text-on-accent) / <alpha-value>)',
            },
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              display: ['Lexend', 'sans-serif'],
              mono: ['IBM Plex Mono', 'monospace'],
            }
          }
        },
      }
    </script>
    <script>
      // Immediately apply theme to prevent FOUC.
      (function() {
        try {
          const settings = JSON.parse(localStorage.getItem('cannabis-grow-guide-settings'));
          const theme = settings?.theme || 'midnight';
          document.documentElement.className = `dark theme-${theme}`;
        } catch (e) {
          document.documentElement.className = 'dark theme-midnight';
        }
      })();
    </script>
  <script type="importmap">
{
  "imports": {
    "react/": "https://esm.sh/react@^19.1.1/",
    "react": "https://esm.sh/react@^19.1.1",
    "react-dom/": "https://esm.sh/react-dom@^19.1.1/",
    "react-dom": "https://esm.sh/react-dom@^19.1.1",
    "jspdf": "https://esm.sh/jspdf@2.5.1",
    "jspdf-autotable": "https://esm.sh/jspdf-autotable@3.8.2",
    "@google/genai": "https://esm.sh/@google/genai"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
    <div id="toast-container"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

### `index.tsx`

The React application's entry point, responsible for rendering the root `App` component into the DOM.

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `App.tsx`

The main application component. It manages the global state, including the active view and plant data. It also handles routing between different views and sets up context providers.

```typescript
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
import { usePlantAdvisorArchive } from './hooks/usePlantAdvisorArchive';


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
    updatePlantState,
    addJournalEntry, 
    completeTask, 
    waterAllPlants,
    advanceDay,
  } = usePlantManager(plants, setPlants);
  
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
    dbService.initDB(); // Initialize IndexedDB when the app loads
    
    // Initial sync on app load
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
  }, [updatePlantState]);

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
        { id: 'nav-strains', title: t('nav.strains'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Leafy />, action: exec(() => setActiveView(View.Strains)), keywords: 'database library sorten datenbank bibliothek' },
        { id: 'nav-plants', title: t('nav.plants'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Plant />, action: exec(() => setActiveView(View.Plants)), keywords: 'dashboard growbox pflanzen anbau' },
        { id: 'nav-equipment', title: t('nav.equipment'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Wrench />, action: exec(() => setActiveView(View.Equipment)), keywords: 'gear tools calculator rechner ausrüstung werkzeuge' },
        { id: 'nav-knowledge', title: t('nav.knowledge'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.BookOpenText />, action: exec(() => setActiveView(View.Knowledge)), keywords: 'guide learn wissen anleitung lernen' },
        { id: 'nav-settings', title: t('nav.settings'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Gear />, action: exec(() => setActiveView(View.Settings)), keywords: 'setup options einstellungen optionen' },
        { id: 'nav-help', title: t('nav.help'), subtitle: t('commandPalette.navigation'), icon: <PhosphorIcons.Question />, action: exec(() => setActiveView(View.Help)), keywords: 'faq about hilfe über' },
    ];

    const actionCommands: Command[] = [
         { id: 'action-water-all', title: t('plantsView.summary.waterAll'), subtitle: t('commandPalette.actions'), icon: <PhosphorIcons.Drop />, action: exec(() => waterAllPlants()), keywords: 'gießen alle' },
         { id: 'action-next-day', title: t('plantsView.summary.simulateNextDay'), subtitle: t('commandPalette.actions'), icon: <PhosphorIcons.ArrowClockwise />, action: exec(() => advanceDay()), keywords: 'simulate next day vorspulen nächster tag simulieren' },
    ];

    const plantCommands: Command[] = managedPlants
        .filter((p): p is Plant => p !== null && p.stage !== PlantStage.Finished)
        .flatMap(plant => [
            { id: `inspect-${plant.id}`, title: `${t('commandPalette.inspect')}: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.MagnifyingGlass/>, action: exec(() => { setActiveView(View.Plants); setSelectedPlantId(plant.id); }), keywords: `details ${plant.name} ansehen prüfen` },
            { id: `water-${plant.id}`, title: `${t('commandPalette.water')}: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.Drop/>, action: exec(() => setModalState({ plantId: plant.id, type: 'watering' })), keywords: `gießen ${plant.name}` },
            { id: `feed-${plant.id}`, title: `${t('commandPalette.feed')}: ${plant.name}`, subtitle: t('commandPalette.plants'), icon: <PhosphorIcons.TestTube/>, action: exec(() => setModalState({ plantId: plant.id, type: 'feeding' })), keywords: `düngen ${plant.name} füttern` },
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
                  onWaterAll={waterAllPlants}
                  advisorArchive={plantAdvisorArchive}
                  addAdvisorResponse={addAdvisorResponse}
                  updateAdvisorResponse={updateAdvisorResponse}
                  deleteAdvisorResponse={deleteAdvisorResponse}
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
                  onWaterAll={waterAllPlants}
                  advisorArchive={plantAdvisorArchive}
                  addAdvisorResponse={addAdvisorResponse}
                  updateAdvisorResponse={updateAdvisorResponse}
                  deleteAdvisorResponse={deleteAdvisorResponse}
               />;
    }
  };

  return (
    <div className={`h-screen grid grid-rows-[auto_1fr_auto] font-sans`}>
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
                      aria-label={t('commandPalette.open')}
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
```

### `metadata.json`

Configuration file for the application, including name, description, and permissions.

```json
{
  "name": "Cannabis Grow Guide 2025",
  "description": "An interactive guide to help you manage your cannabis cultivation journey, from seed to harvest. Track your plants, learn about strains, and get expert tips on equipment and techniques.",
  "prompt": "",
  "requestFramePermissions": []
}
```

### `App.css`

Global CSS file for custom styles, animations, and component-specific styling that complements Tailwind CSS.

```css
body {
  background-color: rgb(var(--color-bg-primary));
  color: rgb(var(--color-neutral-300));
}

.glass-pane {
  background-color: rgba(var(--color-bg-component), 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--color-border), 0.5);
}

#toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.toast {
  background-color: rgba(var(--color-bg-component), 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--color-border), 0.5);
  transition: all 0.3s ease-in-out;
}

.toast-entering {
  opacity: 0;
  transform: translateX(100%);
}
.toast-entered {
  opacity: 1;
  transform: translateX(0);
}
.toast-exiting {
  opacity: 0;
  transform: scale(0.9);
}

.skeleton-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}

@keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
}

/* For Favorite Button Glow */
.favorite-btn-glow {
    transition: color 0.3s ease;
}
.favorite-btn-glow.is-favorite {
    color: rgb(var(--color-primary-400));
    animation: favorite-glow 1.5s ease-in-out;
}

@keyframes favorite-glow {
  0% { text-shadow: 0 0 5px rgba(var(--color-primary-400), 0); }
  50% { text-shadow: 0 0 20px rgba(var(--color-primary-400), 0.8); }
  100% { text-shadow: 0 0 5px rgba(var(--color-primary-400), 0); }
}

/* Range Slider Styles */
.range-slider-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  background: transparent;
  cursor: pointer;
  position: absolute;
  pointer-events: none;
}

.range-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background-color: var(--thumb-color, #3b82f6);
  border-radius: 50%;
  border: 2px solid rgb(var(--color-bg-component));
  pointer-events: auto;
  transition: transform 0.2s ease, background-color 0.2s ease;
  transform: scale(var(--thumb-scale, 1));
}

.range-slider-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background-color: var(--thumb-color, #3b82f6);
  border-radius: 50%;
  border: 2px solid rgb(var(--color-bg-component));
  pointer-events: auto;
  transition: transform 0.2s ease, background-color 0.2s ease;
  transform: scale(var(--thumb-scale, 1));
}

.history-chart-grid line,
.history-chart-grid path {
  stroke: rgb(var(--color-border));
}
.history-chart-labels {
  fill: rgb(var(--color-neutral-400));
  font-size: 8px;
  font-family: 'Inter', sans-serif;
}
```

---

*For detailed source code of components, hooks, services, and other files, please refer to the subsequent source documentation files:*
*   **[source1.md](./source1.md):** All React Components
*   **[source2.md](./source2.md):** App Logic (Hooks, Services, Contexts, Types)
*   **[source3.md](./source3.md):** Localization Data
*   **[source4.md](./source4.md):** Strain Data
*   **[README.md](./README.md):** Project README
