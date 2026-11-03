import type { AppStore } from '@/stores/store'
import {
    isRevisionChecked,
    setStaleSnapshotHandler,
    setUncheckedWritePermit,
    UnverifiedSnapshotError,
} from '@/stores/snapshotRevision'
import { i18nPromise } from '@/i18n'
import { disableSentry } from '@/services/sentryService'
import { registerRecoveryListeners } from './recovery'
import {
    renderError,
    renderOtherTabNotice,
    renderStaleTabNotice,
    renderUnverifiedTabNotice,
} from './render'
import { stopPersistenceForOwnershipLoss } from './persistenceCoordinator'
import {
    claimWriterRole,
    holdsWriterRole,
    releaseWriterRole,
    waitForWriterRole,
    watchForCacheRestore,
} from './writerOwnership'
import { hydrateApplicationStores } from './store'
import { setupPersistedStateSync, type FlushPersistedState } from './persistence'
import { initializeCrdtLayer } from './crdt'
import { applyLocalOnlyPrivacy } from './localOnlyPrivacy'
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
    // The browser may already have dropped the lock; drop the hold too, so the
    // page no longer counts as the writer (holdsWriterRole) until the reload.
    releaseWriterRole()
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

let staleSnapshotHandled = false

/**
 * Stop saving, give the role up so the next page can take it, and show
 * `renderNotice` with a reload instead of data that may not be the saved one.
 */
const stopAsStale = (renderNotice: (reload: () => void) => void): void => {
    if (staleSnapshotHandled) return
    staleSnapshotHandled = true
    // The settings this page holds may be older than the ones another tab saved
    // (local-only mode may have been switched on there), and the page is only a
    // notice until the reload: no error reports from it.
    disableSentry()
    stopWatchingCacheRestore?.()
    stopPersistenceForOwnershipLoss().catch(() => undefined)
    releaseWriterRole()
    renderNotice(() => globalThis.location.reload())
}

/** A save was refused because another tab saved newer data: this page is out of date. */
const handleStaleSnapshot = (): void => stopAsStale(renderStaleTabNotice)

/** A save was refused, or would be, because this page cannot check for other tabs' saves. */
const handleUnverifiedSnapshot = (): void => stopAsStale(renderUnverifiedTabNotice)

const handleRefusedSave = (refusal: Error): void => {
    if (refusal instanceof UnverifiedSnapshotError) handleUnverifiedSnapshot()
    else handleStaleSnapshot()
}

/**
 * A page that could not read or store the revision has no check against other
 * tabs' saves; only the writer lock can stand in for it. Without that lock (no
 * Web Locks, or the request failed) the page stops here, before the first edit,
 * rather than at its first save, which would lose that edit. (GH #669)
 * @returns whether the page may go on.
 */
const mayStartSaving = (): boolean => {
    if (isRevisionChecked() || holdsWriterRole()) return true
    handleUnverifiedSnapshot()
    return false
}

// A page that was refused as stale is only a notice now: no service starts on it,
// except the privacy setting, which also has to reach Sentry.
const runServicesUnlessStale = async (
    store: AppStore,
    flushPersistedState: FlushPersistedState,
): Promise<void> => {
    if (staleSnapshotHandled) {
        await applyLocalOnlyPrivacy(store)
        return
    }
    await runPostHydrationServices(store, flushPersistedState)
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
    staleSnapshotHandled = false
    setStaleSnapshotHandler(handleStaleSnapshot)
    setUncheckedWritePermit(holdsWriterRole)
    try {
        if (!(await takeWriterRole())) return

        registerRecoveryListeners()

        await i18nPromise

        const { hydratedStore } = await hydrateApplicationStores()
        if (!mayStartSaving()) return
        const secretsMoved = await moveLegacySecrets(hydratedStore)
        await startCrdtLayer(hydratedStore)

        const flushPersistedState = setupPersistedStateSync(hydratedStore, handleRefusedSave)
        if (secretsMoved) await saveAfterSecretsMoved(flushPersistedState)
        await runServicesUnlessStale(hydratedStore, flushPersistedState)
    } catch (error) {
        await showStartupError(error)
    }
}
