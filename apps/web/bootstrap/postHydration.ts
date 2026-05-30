import type { AppStore, RootState } from '@/stores/store'
import type { Plant } from '@/types'
import type { SupportedLocale } from '@/i18n'
import { i18nInstance, loadLocale } from '@/i18n'
import { getUISnapshot } from '@/stores/useUIStore'
import { strainService } from '@/services/strainService'
import { initializeSimulation } from '@/stores/slices/simulationSlice'
import { ttsService } from '@/services/ttsService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'

export const runPostHydrationServices = async (hydratedStore: AppStore): Promise<void> => {
    await strainService.init()
    hydratedStore.dispatch(initializeSimulation())
    ttsService.init()

    const { setAiMode } = await import('@/services/aiService')
    setAiMode(hydratedStore.getState().settings.settings.aiMode ?? 'hybrid')

    const persistedLlmModel =
        (hydratedStore.getState() as RootState).settings.settings.localAi?.selectedLlmModelId ??
        'auto'
    if (persistedLlmModel !== 'auto') {
        const { setPreferredModelOverride } = await import('@/services/local-ai')
        setPreferredModelOverride(persistedLlmModel)
    }

    const persistedLang = (hydratedStore.getState() as RootState).settings.settings.general
        ?.language as SupportedLocale | undefined
    if (persistedLang && i18nInstance.language !== persistedLang) {
        if (!i18nInstance.hasResourceBundle(persistedLang, 'translation')) {
            const translations = await loadLocale(persistedLang)
            i18nInstance.addResourceBundle(persistedLang, 'translation', translations)
        }
        await i18nInstance.changeLanguage(persistedLang)
    }

    const { mqttClientService } = await import('@/services/mqttClientService')
    mqttClientService.init(hydratedStore)

    const { useIotStore } = await import('@/stores/useIotStore')
    await useIotStore.getState().loadPersistedPassword()

    const { initializeWorkerInfrastructure } = await import('./workers')
    await initializeWorkerInfrastructure(hydratedStore)

    const { proactiveCoachService } = await import('@/services/proactiveCoachService')
    proactiveCoachService.init(hydratedStore)

    const { requestNotificationPermission } = await import('@/services/nativeBridgeService')
    void requestNotificationPermission()

    const { localAiPreloadService } = await import('@/services/local-ai')
    localAiPreloadService.scheduleIdlePreload()

    const { startBackgroundPrecomputation } = await import('@/services/local-ai')
    const plantEntities = (hydratedStore.getState() as RootState).simulation.plants.entities
    const allPlants = Object.values(plantEntities).filter((p): p is Plant => p !== undefined)
    startBackgroundPrecomputation(allPlants)

    if (navigator.storage?.persist) {
        navigator.storage
            .persist()
            .then((granted) => {
                console.debug('[Storage] Persistent storage:', granted ? 'granted' : 'denied')
            })
            .catch(() => {
                // Non-fatal
            })
    }

    const { platform } = await import('@/services/platformService')
    if (platform.isTauri) {
        try {
            const { listen } = await import('@tauri-apps/api/event')
            await listen('tauri://before-quit', async () => {
                try {
                    await indexedDBStorage.setItem(
                        REDUX_STATE_KEY,
                        JSON.stringify(hydratedStore.getState()),
                    )
                } catch (err) {
                    console.debug('[Tauri] before-quit flush failed:', err)
                }
            })
        } catch (err) {
            console.debug('[Tauri] before-quit listener setup failed:', err)
        }
    }

    getUISnapshot().setAppReady(true)
    document.body.setAttribute('data-app-ready', 'true')
}
