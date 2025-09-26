const CACHE_NAME = 'pwa-cache-v1.2.0'; // Updated version to force cache refresh

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
