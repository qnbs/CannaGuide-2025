
import React, { useEffect, useRef, lazy, Suspense, useCallback } from 'react'
import { View, AppSettings } from '@/types'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/navigation/Header'
import { BottomNav } from '@/components/navigation/BottomNav'
import { OnboardingModal } from '@/components/common/OnboardingModal'
import { CommandPalette } from '@/components/common/CommandPalette'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { strainService } from '@/services/strainService'
import { TTSControls } from '@/components/common/TTSControls'
import { ttsService } from '@/services/ttsService'
import { useDocumentEffects } from '@/hooks/useDocumentEffects'
import { CannabisLeafIcon } from '@/components/icons/CannabisLeafIcon'
import { LogActionModalContainer } from '@/components/views/plants/LogActionModalContainer'
import { DeepDiveModalContainer } from '@/hooks/DeepDiveModalContainer'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { useAppDispatch, useAppSelector, RootState } from '@/stores/store'
import {
  selectActiveView,
  selectIsCommandPaletteOpen,
  selectSettings,
  selectNavigation,
} from '@/stores/selectors'
import {
  setAppReady,
  setIsCommandPaletteOpen,
  addNotification,
  setActiveView,
} from '@/stores/slices/uiSlice'
import { initializeSimulation } from '@/stores/slices/simulationSlice'
import { toggleSetting } from '@/stores/slices/settingsSlice'
import { cacheViewState } from '@/stores/slices/navigationSlice'
import { ToastContainer } from '@/components/common/Toast'
import { AiDiagnosticsModalContainer } from '@/components/views/plants/AiDiagnosticsModalContainer'
import { SaveSetupModalContainer } from '@/components/views/equipment/SaveSetupModalContainer'

// --- Lazy Loaded Views ---
const StrainsView = lazy(() =>
  import('@/components/views/StrainsView').then((module) => ({
    default: module.StrainsView,
  }))
)
const PlantsView = lazy(() =>
  import('@/components/views/PlantsView').then((module) => ({
    default: module.PlantsView,
  }))
)
const EquipmentView = lazy(() =>
  import('@/components/views/equipment/EquipmentView').then((module) => ({
    default: module.EquipmentView,
  }))
)
const KnowledgeView = lazy(() =>
  import('@/components/views/knowledge/KnowledgeView').then((module) => ({
    default: module.KnowledgeView,
  }))
)
const SettingsView = lazy(() =>
  import('@/components/views/settings/SettingsView')
)
const HelpView = lazy(() =>
  import('@/components/views/HelpView')
)

const LoadingGate: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div
      className='flex flex-col h-screen bg-slate-900 text-slate-300 font-sans items-center justify-center'
      role='status'
      aria-live='polite'
    >
      <CannabisLeafIcon className='w-24 h-24 text-primary-500 animate-pulse' />
      <p className='mt-4 text-lg font-semibold text-slate-400'>
        {t('common.preparingGuide')}
      </p>
    </div>
  )
}

const ToastManager: React.FC = () => {
  return <ToastContainer />
}

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings);
  const activeView = useAppSelector(selectActiveView)
  const onboardingCompleted = settings.onboardingCompleted
  const isCommandPaletteOpen = useAppSelector(selectIsCommandPaletteOpen)
  const navigationState = useAppSelector(selectNavigation)

  const mainContentRef = useRef<HTMLElement | null>(null)

  const { t } = useTranslation()
  const isOffline = useOnlineStatus()
  const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall()

  useDocumentEffects(settings)
  
  // This effect handles both caching and restoring scroll positions for a seamless UX.
  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    // 1. Restore scroll position for the new view
    const cachedState = navigationState.viewStates[activeView];
    mainEl.scrollTop = cachedState?.scrollY || 0;

    // 2. Set up a debounced scroll listener to cache the new position as the user scrolls
    const handleScroll = () => {
        dispatch(cacheViewState({
            view: activeView,
            state: { ...cachedState, scrollY: mainEl.scrollTop }
        }));
    };
    
    let timeoutId: number;
    const debouncedHandleScroll = () => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(handleScroll, 150);
    };

    mainEl.addEventListener('scroll', debouncedHandleScroll);

    // 3. Cleanup listener on view change
    return () => {
        mainEl.removeEventListener('scroll', debouncedHandleScroll);
        clearTimeout(timeoutId);
    };
  }, [activeView, dispatch, navigationState.viewStates]);


  useEffect(() => {
    if (isOffline) {
      dispatch(
        addNotification({ message: t('common.offlineWarning'), type: 'info' })
      )
    }
  }, [isOffline, dispatch, t])

  const handleOnboardingClose = () => {
    dispatch(toggleSetting({ path: 'onboardingCompleted' }))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        dispatch(setIsCommandPaletteOpen(!isCommandPaletteOpen))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCommandPaletteOpen, dispatch])

  const OfflineBanner = () => {
    if (!isOffline) return null
    return <div className='offline-banner'>{t('common.offlineWarning')}</div>
  }

  const renderView = () => {
    switch (activeView) {
      case View.Strains:
        return <StrainsView />
      case View.Plants:
        return <PlantsView />
      case View.Equipment:
        return <EquipmentView />
      case View.Knowledge:
        return <KnowledgeView />
      case View.Settings:
        return <SettingsView />
      case View.Help:
        return <HelpView />
      default:
        return <PlantsView />
    }
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-300 font-sans'>
      {!onboardingCompleted && <OnboardingModal onClose={handleOnboardingClose} />}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => dispatch(setIsCommandPaletteOpen(false))}
      />
      <LogActionModalContainer />
      <DeepDiveModalContainer />
      <AiDiagnosticsModalContainer />
      <SaveSetupModalContainer />
      <Header
        onCommandPaletteOpen={() => dispatch(setIsCommandPaletteOpen(true))}
        deferredPrompt={deferredPrompt}
        isInstalled={isInstalled}
        onInstallClick={handleInstallClick}
      />
      <OfflineBanner />
      <main
        ref={mainContentRef}
        className='flex-grow overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6'
      >
        <div className='max-w-7xl mx-auto'>
          <Suspense fallback={<SkeletonLoader variant='list' count={5} />}>
            {renderView()}
          </Suspense>
        </div>
      </main>
      <TTSControls />
      <BottomNav />
    </div>
  )
}

export const App: React.FC = () => {
  const dispatch = useAppDispatch()
  const isAppReady = useAppSelector((state: RootState) => state.ui.isAppReady);

  useEffect(() => {
    const initializeApp = async () => {
        // Hydration and migration are now handled by `createAppStore`.
        // This effect initializes services that depend on a hydrated store.
        await strainService.init()
        
        // This thunk will "catch up" the simulation from the last saved state.
        dispatch(initializeSimulation());
        
        ttsService.init()

        // Handle deep linking from PWA shortcuts
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        if (viewParam && Object.values(View).includes(viewParam as View)) {
            dispatch(setActiveView(viewParam as View));
        }

        // Signal that the app is fully ready to be displayed.
        dispatch(setAppReady(true))
    }
    initializeApp()
  }, [dispatch])

  if (!isAppReady) {
    return <LoadingGate />
  }

  return (
    <>
      <AppContent />
      <ToastManager />
    </>
  )
}
