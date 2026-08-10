import type { AppStore, RootState } from '@/stores/store'
import type { Plant } from '@/types'
import type { SupportedLocale } from '@/i18n'
import { changeAppLanguage, isSupportedLocale } from '@/i18n'
import { getUISnapshot } from '@/stores/useUIStore'
import { strainService } from '@/services/strainService'
import { initializeSimulation } from '@/stores/slices/simulationSlice'
import { ttsService } from '@/services/ttsService'
import { Sentry } from '@/services/sentryService'
import type { FlushPersistedState } from './persistence'

export const runPostHydrationServices = async (
    hydratedStore: AppStore,
    flushPersistedState?: FlushPersistedState,
): Promise<void> => {
    // FIRST, before any service that can reach the network.
    //
    // localOnlyModeService keeps its state in a module variable initialised to
    // false, and its only writer is the `setSetting` listener in
    // listenerMiddleware. Hydration replays persisted state into the store but
    // dispatches no `privacy.localOnlyMode` action, so nothing ever told the
    // service. After every reload the flag read false while the user's setting
    // said true -- and isLocalOnlyMode() is exactly what cansativaService,
    // communityShareService, dailyStrainsService and the Sentry enable/disable
    // branch consult before going out. A privacy setting the user had switched on
    // was therefore inert for the whole session, until they happened to toggle it
    // again. No attacker required; the setting simply was not restored.
    const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
    const localOnly =
        (hydratedStore.getState() as RootState).settings.settings.privacy?.localOnlyMode === true
    setLocalOnlyMode(localOnly)
    if (localOnly) {
        // Mirrors syncLocalOnlyMode() in listenerMiddleware: the flag alone does
        // not stop Sentry, which is initialised before hydration runs.
        const { disableSentry } = await import('@/services/sentryService')
        disableSentry()
    }

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

    // Shell is interactive once core store + i18n are ready; background services may still init.
    getUISnapshot().setAppReady(true)
    document.body.setAttribute('data-app-ready', 'true')

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

    // Opt-in only. This used to run unconditionally on every boot and fetch the
    // `standard` tier -- nine ONNX models, hundreds of MB from the HuggingFace
    // CDN -- with no setting, no consent and no metered-network check. Users who
    // want offline AI enable it in Settings, or preload once from the Local AI card.
    if ((hydratedStore.getState() as RootState).settings.settings.localAi?.autoPreloadOnStartup) {
        localAiPreloadService.scheduleIdlePreload()
    }

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
                    await flushPersistedState?.()
                } catch (err) {
                    console.debug('[Tauri] before-quit flush failed:', err)
                }
            })
        } catch (err) {
            console.debug('[Tauri] before-quit listener setup failed:', err)
        }
    }

    const { registerOfflineActionReplayListener } =
        await import('@/services/offlineActionReplayService')
    registerOfflineActionReplayListener(hydratedStore)
}
