import type { AppStore } from '@/stores/store'

/** WorkerBus pool, telemetry, and eco-mode hooks — after Redux hydration. */
export const initializeWorkerInfrastructure = async (hydratedStore: AppStore): Promise<void> => {
    const { initWorkerStateSync } = await import('@/services/workerStateSyncService')
    const { initWorkerTelemetry } = await import('@/services/workerTelemetryService')
    initWorkerStateSync()
    initWorkerTelemetry(hydratedStore.dispatch)

    const { workerPool, registerEcoProbe } = await import('@/services/workerPool')
    const { registerAllWorkerFactories } = await import('@/services/workerFactories')
    registerAllWorkerFactories()
    const { workerBus } = await import('@/services/workerBus')
    workerBus.setWorkerPool(workerPool)

    const { isEcoMode } = await import('@/services/local-ai')
    registerEcoProbe(() => isEcoMode())

    const { registerEcoCallbacks } = await import('@/services/local-ai')
    const { getT } = await import('@/i18n')
    const { getUISnapshot } = await import('@/stores/useUIStore')
    registerEcoCallbacks({
        onBatteryGating: (level: number) => {
            const t = getT()
            getUISnapshot().addNotification({
                message: t('settingsView.offlineAi.batteryGatingToast', {
                    level: String(level),
                }),
                type: 'info',
            })
        },
        onEcoAutoActivated: () => {
            const t = getT()
            getUISnapshot().addNotification({
                message: t('settingsView.offlineAi.ecoAutoActivatedToast'),
                type: 'info',
            })
        },
        onEcoAutoDeactivated: () => {
            const t = getT()
            getUISnapshot().addNotification({
                message: t('settingsView.offlineAi.ecoAutoDeactivatedToast'),
                type: 'info',
            })
        },
    })
    workerPool.setOnMemoryPressureHook((level, heapPercent) => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('settingsView.offlineAi.oomPressureToast', {
                level,
                percent: String(heapPercent),
            }),
            type: level === 'critical' ? 'error' : 'info',
        })
    })
}
