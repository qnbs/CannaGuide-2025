import type { AppStore } from '@/stores/store'
import { i18nPromise } from '@/i18n'
import { registerRecoveryListeners } from './recovery'
import { renderError, renderOtherTabNotice } from './render'
import { claimWriterRole, waitForWriterRole } from './writerOwnership'
import { hydrateApplicationStores } from './store'
import { setupPersistedStateSync, type FlushPersistedState } from './persistence'
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

const moveLegacySecrets = async (store: AppStore): Promise<boolean> => {
    try {
        return await migrateLegacySecrets(store)
    } catch (migrationError) {
        console.error('[Secrets] Legacy key migration failed, retrying next start:', migrationError)
        return false
    }
}

const startCrdtLayer = async (store: AppStore): Promise<void> => {
    try {
        await initializeCrdtLayer(store)
    } catch (crdtError) {
        console.error('[CRDT] Initialization failed, continuing without sync:', crdtError)
    }
}

// A moved key is gone from Redux but still in the stored snapshot and its
// startup backup: rewrite both now rather than at the next state change or
// start (#711 review).
const saveAfterSecretsMoved = async (flushPersistedState: FlushPersistedState): Promise<void> => {
    if (!(await flushPersistedState())) return
    try {
        await replaceBackupWithSavedSnapshot()
    } catch (backupError) {
        console.error('[Secrets] Could not refresh the startup backup:', backupError)
    }
}

const showStartupError = (error: unknown): void => {
    console.error('Failed to initialize the application:', error)
    renderError(
        error instanceof Error ? error : new Error('An unknown error occurred during startup.'),
    )
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
        const secretsMoved = await moveLegacySecrets(hydratedStore)
        await startCrdtLayer(hydratedStore)

        const flushPersistedState = setupPersistedStateSync(hydratedStore)
        if (secretsMoved) await saveAfterSecretsMoved(flushPersistedState)
        await runPostHydrationServices(hydratedStore, flushPersistedState)
    } catch (error) {
        showStartupError(error)
    }
}
