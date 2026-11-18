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

/**
 * Desktop (Tauri) only: the quit handshake, the save used by quit and update install,
 * the Local-Only stop for a running update download, and the startup update check.
 */
const setUpDesktopLifecycle = async (
    hydratedStore: AppStore,
    flushPersistedState?: FlushPersistedState,
): Promise<void> => {
    const { platform } = await import('@/services/platformService')
    if (!platform.isTauri) return
    const [lifecycle, { isLocalOnlyMode, onLocalOnlyModeChange }] = await Promise.all([
        import('@/services/desktopLifecycleService'),
        import('@/services/localOnlyModeService'),
    ])
    // Quit and install save again while changes keep arriving, with different rules for
    // a store that never settles: a quit accepts the last save (its fallback ends the
    // app anyway), an install refuses rather than restart over an unsaved edit.
    // Only the state a save writes counts: a runtime-only slice changing must not
    // read as "unsettled" (CodeAnt on #878).
    const { persistedSnapshotInputs, sameSnapshotInputs } =
        await import('@/services/persistedSnapshotFormat')
    const getState = (): readonly unknown[] =>
        persistedSnapshotInputs(hydratedStore.getState() as RootState)
    const isSame = sameSnapshotInputs
    const quitFlush = flushPersistedState
        ? lifecycle.flushUntilStable(flushPersistedState, getState, { isSame })
        : undefined
    lifecycle.registerPersistFlush(
        flushPersistedState
            ? lifecycle.flushUntilStable(flushPersistedState, getState, {
                  maxRounds: 5,
                  whenUnsettled: 'refuse',
                  isSame,
              })
            : undefined,
    )
    try {
        const { listen } = await import('@tauri-apps/api/event')
        // The app holds every user quit until this confirms that the save has
        // finished (src-tauri/src/lib.rs request_quit), not a fixed delay.
        await listen('tauri://before-quit', () =>
            lifecycle.flushThenConfirmQuit(quitFlush).catch((err: unknown) => {
                console.debug('[Tauri] quit confirmation failed:', err)
            }),
        )
        // Right before an install ends the process, update.rs asks for one more save,
        // so an edit made while the install ran is not lost to the restart.
        await listen(lifecycle.SAVE_BEFORE_RESTART_EVENT, () =>
            lifecycle.flushThenConfirmFinalSave(quitFlush).catch((err: unknown) => {
                console.debug('[Tauri] final save confirmation failed:', err)
            }),
        )
    } catch (err) {
        console.debug('[Tauri] before-quit listener setup failed:', err)
    }
    // update.rs mirrors Local-Only: it refuses checks and downloads while the mode is
    // on, and turning it on stops a running download, not only the next one.
    const syncNative = (enabled: boolean): void => {
        lifecycle.syncNativeLocalOnly(enabled).catch((err: unknown) => {
            console.debug('[Tauri] Local-Only sync to the updater failed:', err)
        })
    }
    syncNative(isLocalOnlyMode())
    onLocalOnlyModeChange(syncNative)
    const { getT } = await import('@/i18n')
    lifecycle.scheduleStartupUpdateCheck({
        updater: lifecycle.desktopUpdater,
        isDesktop: () => platform.isTauri,
        isLocalOnly: isLocalOnlyMode,
        isOnline: () => navigator.onLine,
        onAvailable: (info) => {
            getUISnapshot().addNotification({
                message: getT()('settingsView.about.update.notification', {
                    version: info.version,
                }),
                type: 'info',
            })
        },
    })
}

export const runPostHydrationServices = async (
    hydratedStore: AppStore,
    flushPersistedState?: FlushPersistedState,
    onLocaleReady?: () => void | Promise<void>,
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

    // Before any slower startup work: every desktop quit waits for this listener's
    // confirmation, so it has to exist as soon as there is state to save.
    await setUpDesktopLifecycle(hydratedStore, flushPersistedState)

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

    await onLocaleReady?.()

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

    const { registerOfflineActionReplayListener } =
        await import('@/services/offlineActionReplayService')
    registerOfflineActionReplayListener(hydratedStore, flushPersistedState)
}
