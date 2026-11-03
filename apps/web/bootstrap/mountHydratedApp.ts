import type { AppStore } from '@/stores/store'
import { i18nPromise } from '@/i18n'
import { registerRecoveryListeners } from './recovery'
import { renderError, renderOtherTabNotice } from './render'
import { stopPersistenceForOwnershipLoss } from './persistenceCoordinator'
import {
    claimWriterRole,
    releaseWriterRole,
    waitForWriterRole,
    watchForCacheRestore,
} from './writerOwnership'
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

let stopWatchingCacheRestore: (() => void) | undefined

/** A page restored from the back/forward cache may have lost the writer lock: start over. */
const leaveRestoredPage = (): void => {
    // Stopping is synchronous; the promise only reports that a started write is done.
    stopPersistenceForOwnershipLoss().catch(() => undefined)
    globalThis.location.reload()
}

/** @returns whether this tab may go on to start the app. */
const takeWriterRole = async (): Promise<boolean> => {
    const role = await claimWriterRole()
    if (role === 'reader') {
        await i18nPromise
        showOtherTabNotice()
        return false
    }
    if (role === 'writer') stopWatchingCacheRestore = watchForCacheRestore(leaveRestoredPage)
    return true
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

// Stop saving before the role is handed on: a failure after the save was set up
// leaves its subscription and timers running, and they would overwrite the next
// writer's edits with this tab's stale state.
const showStartupError = async (error: unknown): Promise<void> => {
    console.error('Failed to initialize the application:', error)
    // The error page keeps its safe-recovery button if it comes back from the cache.
    stopWatchingCacheRestore?.()
    await stopPersistenceForOwnershipLoss()
    releaseWriterRole()
    renderError(
        error instanceof Error ? error : new Error('An unknown error occurred during startup.'),
    )
}

export const mountHydratedApp = async (): Promise<void> => {
    try {
        if (!(await takeWriterRole())) return

        registerRecoveryListeners()

        await i18nPromise

        const { hydratedStore } = await hydrateApplicationStores()
        const secretsMoved = await moveLegacySecrets(hydratedStore)
        await startCrdtLayer(hydratedStore)

        const flushPersistedState = setupPersistedStateSync(hydratedStore)
        if (secretsMoved) await saveAfterSecretsMoved(flushPersistedState)
        await runPostHydrationServices(hydratedStore, flushPersistedState)
    } catch (error) {
        await showStartupError(error)
    }
}
