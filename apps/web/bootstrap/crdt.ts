import type { AppStore } from '@/stores/store'

export const initializeCrdtLayer = async (hydratedStore: AppStore): Promise<void> => {
    const { crdtService } = await import('@/services/crdtService')
    await crdtService.initialize()
    const { registerCrdtListeners, initCrdtSyncBridge, destroyCrdtSyncBridge } =
        await import('@/services/crdtSyncBridge')
    const { startAppListening } = await import('@/stores/listenerMiddleware')
    registerCrdtListeners(startAppListening)
    initCrdtSyncBridge(hydratedStore)

    window.addEventListener(
        'pagehide',
        () => {
            destroyCrdtSyncBridge()
            crdtService.destroy()
        },
        { once: true },
    )
}
