import { i18nPromise } from '@/i18n'
import { registerRecoveryListeners } from './recovery'
import { renderError, renderOtherTabNotice } from './render'
import { claimWriterRole, waitForWriterRole } from './writerOwnership'
import { hydrateApplicationStores } from './store'
import { setupPersistedStateSync } from './persistence'
import { initializeCrdtLayer } from './crdt'
import { runPostHydrationServices } from './postHydration'
import { migrateLegacySecrets, replaceBackupWithSavedSnapshot } from './secrets'

/**
 * A reader tab never starts the store, so nothing in it can save: it shows why
 * and reloads itself once the writer tab has closed.
 */
const showOtherTabNotice = (): void => {
    const reload = () => globalThis.location.reload()
    renderOtherTabNotice(reload)
    waitForWriterRole(reload)
}

export const mountHydratedApp = async (): Promise<void> => {
    try {
        if ((await claimWriterRole()) === 'reader') {
            await i18nPromise
            showOtherTabNotice()
            return
        }

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
        // A moved key is gone from Redux but still in the stored snapshot and
        // its startup backup: rewrite both now rather than at the next state
        // change or start (#711 review).
        if (secretsMoved && (await flushPersistedState())) {
            try {
                await replaceBackupWithSavedSnapshot()
            } catch (backupError) {
                console.error('[Secrets] Could not refresh the startup backup:', backupError)
            }
        }
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
