import type { AppStore, RootState } from '@/stores/store'
import type { Plant } from '@/types'
import type { SupportedLocale } from '@/i18n'
import { changeAppLanguage, isSupportedLocale } from '@/i18n'
import { getUISnapshot } from '@/stores/useUIStore'
import { strainService } from '@/services/strainService'
import { initializeSimulation } from '@/stores/slices/simulationSlice'
import { ttsService } from '@/services/ttsService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'
import { Sentry } from '@/services/sentryService'

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
    if (persistedLang && isSupportedLocale(persistedLang)) {
        try {
            await changeAppLanguage(persistedLang)
        } catch (err) {
            Sentry.captureException(err, {
                extra: { context: 'postHydration:changeAppLanguage', lang: persistedLang },
            })
        }
    }

    const [
        { mqttClientService },
        { useIotStore },
        { proactiveCoachService },
        { requestNotificationPermission },
        { localAiPreloadService, startBackgroundPrecomputation },
    ] = await Promise.all([
        import('@/services/mqttClientService'),
        import('@/stores/useIotStore'),
        import('@/services/proactiveCoachService'),
        import('@/services/nativeBridgeService'),
        import('@/services/local-ai'),
    ])

    void mqttClientService.init(hydratedStore)

    try {
        await useIotStore.getState().loadPersistedPassword()
    } catch (err) {
        Sentry.captureException(err, { extra: { context: 'postHydration:loadPersistedPassword' } })
    }

    const { initializeWorkerInfrastructure } = await import('./workers')
    await initializeWorkerInfrastructure(hydratedStore)

    proactiveCoachService.init(hydratedStore)
    void requestNotificationPermission()

    localAiPreloadService.scheduleIdlePreload()

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

    const { registerOfflineActionReplayListener } = await import(
        '@/services/offlineActionReplayService'
    )
    registerOfflineActionReplayListener(hydratedStore)

    getUISnapshot().setAppReady(true)
    document.body.setAttribute('data-app-ready', 'true')
}
