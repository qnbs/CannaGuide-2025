import { createAppStore, createAppStoreSync } from '@/stores/store'
import { i18nPromise } from '@/i18n'
import { registerRecoveryListeners, triggerSafeRecovery } from './recovery'
import { renderAppWithStore, renderError } from './render'
import { setupPersistedStateSync } from './persistence'
import { initializeCrdtLayer } from './crdt'
import { runPostHydrationServices } from './postHydration'

export const mountHydratedApp = async (): Promise<void> => {
    try {
        registerRecoveryListeners()

        await i18nPromise

        const shellStore = createAppStoreSync()
        renderAppWithStore(shellStore)

        const hydratedStore = await createAppStore()
        renderAppWithStore(hydratedStore)

        try {
            await initializeCrdtLayer(hydratedStore)
        } catch (crdtError) {
            console.error('[CRDT] Initialization failed, continuing without sync:', crdtError)
        }

        setupPersistedStateSync(hydratedStore)
        await runPostHydrationServices(hydratedStore)
    } catch (error) {
        console.error('Failed to initialize the application:', error)
        const recovered = await triggerSafeRecovery('boot-initialization-failure', error)
        if (recovered) {
            return
        }
        if (error instanceof Error) {
            renderError(error)
        } else {
            renderError(new Error('An unknown error occurred during startup.'))
        }
    }
}
