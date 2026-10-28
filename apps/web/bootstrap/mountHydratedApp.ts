import { i18nPromise } from '@/i18n'
import { registerRecoveryListeners } from './recovery'
import { renderError } from './render'
import { hydrateApplicationStores } from './store'
import { setupPersistedStateSync } from './persistence'
import { initializeCrdtLayer } from './crdt'
import { runPostHydrationServices } from './postHydration'
import { migrateLegacySecrets } from './secrets'

export const mountHydratedApp = async (): Promise<void> => {
    try {
        registerRecoveryListeners()

        await i18nPromise

        const { hydratedStore } = await hydrateApplicationStores()

        let secretsMoved = false
        try {
            secretsMoved = await migrateLegacySecrets(hydratedStore)
        } catch (migrationError) {
            console.error(
                '[Secrets] Legacy key migration failed, retrying next start:',
                migrationError,
            )
        }

        try {
            await initializeCrdtLayer(hydratedStore)
        } catch (crdtError) {
            console.error('[CRDT] Initialization failed, continuing without sync:', crdtError)
        }

        const flushPersistedState = setupPersistedStateSync(hydratedStore)
        // A moved key is gone from Redux but still in the stored snapshot:
        // rewrite it now rather than at the next state change (#711 review).
        if (secretsMoved) await flushPersistedState()
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
