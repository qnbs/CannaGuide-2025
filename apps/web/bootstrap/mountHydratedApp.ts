import { i18nPromise } from '@/i18n'
import { registerRecoveryListeners } from './recovery'
import { renderError } from './render'
import { hydrateApplicationStores } from './store'
import { setupPersistedStateSync } from './persistence'
import { initializeCrdtLayer } from './crdt'
import { runPostHydrationServices } from './postHydration'

export const mountHydratedApp = async (): Promise<void> => {
    try {
        registerRecoveryListeners()

        await i18nPromise

        const { hydratedStore } = await hydrateApplicationStores()

        try {
            await initializeCrdtLayer(hydratedStore)
        } catch (crdtError) {
            console.error('[CRDT] Initialization failed, continuing without sync:', crdtError)
        }

        const flushPersistedState = setupPersistedStateSync(hydratedStore)
        await runPostHydrationServices(hydratedStore, flushPersistedState)
    } catch (error) {
        console.error('Failed to initialize the application:', error)
        if (error instanceof Error) {
            renderError(error)
        } else {
            renderError(new Error('An unknown error occurred during startup.'))
        }
    }
}
