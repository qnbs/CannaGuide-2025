
# CannaGuide 2025 - Source Code Documentation (Part 7: Assets & Config)

This document contains the source code and configuration for the application's static assets, Progressive Web App (PWA) manifest, and Service Worker.

---

## 1. Project Metadata

### `/metadata.json`

**Purpose:** Provides metadata for the AI Studio environment, including the app's name, description, and permissions required (like camera access).

```json
{
  "name": "CannaGuide 2025 - Cannabis Grow Guide with Gemini",
  "description": "Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore over 480 strains, get AI equipment advice, and master your grow with an interactive guide.",
  "prompt": "",
  "requestFramePermissions": [
    "camera"
  ]
}
```

---

## 2. PWA Configuration

### `/manifest.json`

**Purpose:** The Web App Manifest file for the PWA. It defines how the app should appear when installed on a user's device, including its name, icons, start URL, and display mode.

```json
{
  "name": "Cannabis Grow Guide with Gemini",
  "short_name": "CannaGuide 2025",
  "id": "/?source=pwa",
  "start_url": ".",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "description": "Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore 300+ strains, get AI equipment advice, and master your grow with an interactive guide.",
  "icons": [
    {
      "src": "icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### `/sw.js`

**Purpose:** The Service Worker script. This is the core of the PWA's offline functionality. It intercepts network requests and serves cached assets when the user is offline, following a "cache-first, then network" strategy. It also manages cache versions to ensure users get the latest updates on new deployments.

```javascript
const CACHE_VERSION = 'v1.2.1'; // Increase this version on each new deployment
const CACHE_NAME = `cannaguide-cache-${CACHE_VERSION}`;

// App Shell: The minimal resources needed for the app to start.
const APP_SHELL_URLS = [
  '.',
  'index.html',
  'index.tsx',
  'App.tsx',
  'manifest.json',
  'metadata.json',
  'types.ts',
  'constants.ts',
  'README.md',
  // Hooks
  'hooks/useAvailableVoices.ts',
  'hooks/useCommandPalette.ts',
  'hooks/useDocumentEffects.ts',
  'hooks/useFocusTrap.ts',
  'hooks/useForm.ts',
  'hooks/useOnlineStatus.ts',
  'hooks/useOutsideClick.ts',
  'hooks/usePwaInstall.ts',
  'hooks/useStrainFilters.ts',
  'hooks/useTranslations.ts',
  // Services
  'services/commandService.ts',
  'services/dbService.ts',
  'services/exportService.ts',
  'services/geminiService.ts',
  'services/plantSimulationService.ts',
  'services/storageService.ts',
  'services/strainService.ts',
  'services/ttsService.ts',
  // Stores
  'stores/useAppStore.ts',
  'stores/selectors.ts',
  'stores/slices/aiSlice.ts',
  'stores/slices/archivesSlice.ts',
  'stores/slices/favoritesSlice.ts',
  'stores/slices/knowledgeSlice.ts',
  'stores/slices/notesSlice.ts',
  'stores/slices/plantSlice.ts',
  'stores/slices/savedItemsSlice.ts',
  'stores/slices/settingsSlice.ts',
  'stores/slices/strainsViewSlice.ts',
  'stores/slices/ttsSlice.ts',
  'stores/slices/uiSlice.ts',
  'stores/slices/userStrainsSlice.ts',
  // Components
  'components/common/AiLoadingIndicator.tsx',
  'components/common/AttributeDisplay.tsx',
  'components/common/Button.tsx',
  'components/common/CameraModal.tsx',
  'components/common/Card.tsx',
  'components/common/CommandPalette.tsx',
  'components/common/DataExportModal.tsx',
  'components/common/Drawer.tsx',
  'components/common/EditResponseModal.tsx',
  'components/common/InfoSection.tsx',
  'components/common/Modal.tsx',
  'components/common/OnboardingModal.tsx',
  'components/common/RangeSlider.tsx',
  'components/common/SimulationManager.tsx',
  'components/common/SkeletonLoader.tsx',
  'components/common/Speakable.tsx',
  'components/common/TTSControls.tsx',
  'components/common/Tabs.tsx',
  'components/common/Toast.tsx',
  'components/icons/CannabisLeafIcon.tsx',
  'components/icons/PaymentIcons.tsx',
  'components/icons/PhosphorIcons.tsx',
  'components/icons/StrainTypeIcons.tsx',
  'components/navigation/BottomNav.tsx',
  'components/navigation/Header.tsx',
  'components/views/EquipmentView.tsx',
  'components/views/HelpView.tsx',
  'components/views/KnowledgeView.tsx',
  'components/views/SettingsView.tsx',
  'components/views/StrainsView.tsx',
  'components/views/equipment/Calculators.tsx',
  'components/views/equipment/GrowShopsView.tsx',
  'components/views/equipment/SavedSetupsView.tsx',
  'components/views/equipment/SetupConfigurator.tsx',
  'components/views/equipment/SetupResults.tsx',
  'components/views/equipment/calculators/common.tsx',
  'components/views/equipment/calculators/ConverterCalculator.tsx',
  'components/views/equipment/calculators/CostCalculator.tsx',
  'components/views/equipment/calculators/LightCalculator.tsx',
  'components/views/equipment/calculators/NutrientCalculator.tsx',
  'components/views/equipment/calculators/VentilationCalculator.tsx',
  'components/views/equipment/calculators/YieldCalculator.tsx',
  'components/views/equipment/setupConfigurations.ts',
  'components/views/knowledge/AiMentor.tsx',
  'components/views/knowledge/GuideTab.tsx',
  'components/views/knowledge/MentorArchiveTab.tsx',
  'components/views/plants/ActionToolbar.tsx',
  'components/views/plants/AiDiagnostics.tsx',
  'components/views/plants/DashboardSummary.tsx',
  'components/views/plants/DetailedPlantView.tsx',
  'components/views/plants/GlobalAdvisorArchiveView.tsx',
  'components/views/plants/GrowSetupModal.tsx',
  'components/views/plants/HistoryChart.tsx',
  'components/views/plants/InlineStrainSelector.tsx',
  'components/views/plants/LogActionModal.tsx',
  'components/views/plants/PlantLifecycleTimeline.tsx',
  'components/views/plants/PlantSlot.tsx',
  'components/views/plants/PlantVisual.tsx',
  'components/views/plants/PlantVisualizer.tsx',
  'components/views/plants/PlantsView.tsx',
  'components/views/plants/TasksAndWarnings.tsx',
  'components/views/plants/TipOfTheDay.tsx',
  'components/views/plants/VPDGauge.tsx',
  'components/views/plants/VitalBar.tsx',
  'components/views/plants/detailedPlantViewTabs/AiTab.tsx',
  'components/views/plants/detailedPlantViewTabs/JournalTab.tsx',
  'components/views/plants/detailedPlantViewTabs/OverviewTab.tsx',
  'components/views/plants/detailedPlantViewTabs/PhotosTab.tsx',
  'components/views/plants/detailedPlantViewTabs/PostHarvestTab.tsx',
  'components/views/plants/detailedPlantViewTabs/TasksTab.tsx',
  'components/views/strains/AddStrainModal.tsx',
  'components/views/strains/BulkActionsBar.tsx',
  'components/views/strains/ExportsManagerView.tsx',
  'components/views/strains/FilterDrawer.tsx',
  'components/views/strains/StrainAiTips.tsx',
  'components/views/strains/StrainDetailView.tsx',
  'components/views/strains/StrainGrid.tsx',
  'components/views/strains/StrainGridItem.tsx',
  'components/views/strains/StrainList.tsx',
  'components/views/strains/StrainListItem.tsx',
  'components/views/strains/StrainTipsView.tsx',
  'components/views/strains/StrainToolbar.tsx',
  'components/views/strains/constants.ts',
  // Locales
  'locales/index.ts',
  'locales/de.ts',
  'locales/en.ts',
  'locales/de/index.ts',
  'locales/en/index.ts',
  'locales/de/common.ts',
  'locales/en/common.ts',
  'locales/de/commandPalette.ts',
  'locales/en/commandPalette.ts',
  'locales/de/equipment.ts',
  'locales/en/equipment.ts',
  'locales/de/help.ts',
  'locales/en/help.ts',
  'locales/de/knowledge.ts',
  'locales/en/knowledge.ts',
  'locales/de/onboarding.ts',
  'locales/en/onboarding.ts',
  'locales/de/plants.ts',
  'locales/en/plants.ts',
  'locales/de/settings.ts',
  'locales/en/settings.ts',
  'locales/de/strains.ts',
  'locales/en/strains.ts',
  'locales/de/strainsData.ts',
  'locales/en/strainsData.ts',
];

// Third-party resources to cache
const THIRD_PARTY_URLS = [
  'https://cdn.tailwindcss.com?plugins=typography',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1',
  'https://aistudiocdn.com/@google/genai@^1.19.0',
  'https://aistudiocdn.com/jspdf@^2.5.1',
  'https://aistudiocdn.com/jspdf-autotable@^3.8.2',
];

const urlsToCache = [...APP_SHELL_URLS, ...THIRD_PARTY_URLS];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to open cache or pre-cache:', error);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Exclude strain data JSON and API calls from being cached by the service worker.
  // Strain data is handled by IndexedDB, and API calls should not be cached.
  if (event.request.url.includes('/data/strains/') || event.request.url.includes('googleapis.com')) {
    return; 
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        
        if (networkResponse && networkResponse.status === 200) {
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.error('[Service Worker] Fetch failed; returning offline fallback if available.', error);
        if (event.request.mode === 'navigate') {
            const indexPage = await cache.match('index.html');
            if (indexPage) return indexPage;
        }
      }
    })
  );
});
```

---

## 3. App Assets

### `/icon.svg`

**Purpose:** The main application icon used for the PWA, favicon, and Apple touch icon. It's an SVG for scalability and high-resolution displays.

```svg
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='rgb(15, 23, 42)' d='M50,0 C10,0 0,10 0,50 C0,90 10,100 50,100 C90,100 100,90 100,50 C100,10 90,0 50,0 Z'/><g transform='scale(3.5) translate(4, 4)' stroke-width='0.5' fill='none' stroke='rgb(226, 232, 240)'><defs><linearGradient id='cannaGuideLeafGradient' x1='0%' y1='0%' x2='0%' y2='100%'><stop offset='0%' stop-color='rgb(74, 222, 128)'/><stop offset='100%' stop-color='rgb(16, 185, 129)'/></linearGradient></defs><path stroke-linecap='round' stroke-linejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'/><g transform='translate(5.2, 5.2) scale(0.6)'><path fill='url(%23cannaGuideLeafGradient)' stroke='none' d='M20.21,12.79a.78.78,0,0,0,0-1.11,5.27,5.27,0,0,1-3.79-3.79.78.78,0,0,0-1.11,0L12,11.16,8.69,7.89a.78.78,0,0,0-1.11,0A5.27,5.27,0,0,1,3.79,11.68a.78.78,0,0,0,0,1.11L7.06,16a.79.79,0,0,0,1.11,0,3.15,3.15,0,0,0,4.46,0,.79.79,0,0,0,1.11,0Z'/><path fill='url(%23cannaGuideLeafGradient)' stroke='none' d='M16.94,16a.79.79,0,0,0,1.11,0L21.42,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L18.05,13.2A5.28,5.28,0,0,1,16.94,16Z'/><path fill='url(%23cannaGuideLeafGradient)' stroke='none' d='M12,21.9a.79.79,0,0,0,.55-.22l3.27-3.27a.78.78,0,0,0-1.11-1.11L12,20,9.29,17.31a.78.78,0,0,0-1.11,1.11L11.45,21.68A.79.79,0,0,0,12,21.9Z'/><path fill='url(%23cannaGuideLeafGradient)' stroke='none' d='M2.58,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L.1,12.21a.78.78,0,0,0,0,1.11.77.77,0,0,0,.55.22.79.79,0,0,0,.56-.22l1.37-1.37A5.28,5.28,0,0,1,2.58,12Z'/></g></g></svg>
```

### `/README.md`

**Purpose:** Provides a comprehensive guide to the application for users and developers, covering its features, architecture, and how to get started. It's written in both English and German.

```markdown
# 🌿 CannaGuide 2025 (English)

**The Definitive AI-Powered Cannabis Cultivation Companion**

CannaGuide 2025 is your definitive AI-powered digital co-pilot for the entire cannabis cultivation lifecycle...

---

*... (Full content of README.md) ...*
```
