import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateLegacySecrets, replaceBackupWithSavedSnapshot } from './secrets'
import { mountHydratedApp } from './mountHydratedApp'
import { renderError, renderOtherTabNotice, renderStaleTabNotice } from './render'
import { hydrateApplicationStores } from './store'
import { disableSentry } from '@/services/sentryService'
import { setStaleSnapshotHandler } from '@/stores/snapshotRevision'
import { setupPersistedStateSync } from './persistence'
import { applyLocalOnlyPrivacy } from './localOnlyPrivacy'
import { runPostHydrationServices } from './postHydration'
import { registerRecoveryListeners } from './recovery'
import {
    claimWriterRole,
    releaseWriterRole,
    waitForWriterRole,
    watchForCacheRestore,
    type WriterRole,
} from './writerOwnership'
import { stopPersistenceForOwnershipLoss } from './persistenceCoordinator'

const flush = vi.fn().mockResolvedValue(true)
const order: string[] = []

vi.mock('@/i18n', () => ({ i18nPromise: Promise.resolve() }))
vi.mock('./recovery', () => ({ registerRecoveryListeners: vi.fn() }))
vi.mock('./render', () => ({
    renderError: vi.fn(),
    renderOtherTabNotice: vi.fn(),
    renderStaleTabNotice: vi.fn(),
}))
vi.mock('./writerOwnership', () => ({
    claimWriterRole: vi.fn((): Promise<WriterRole> => Promise.resolve('writer')),
    waitForWriterRole: vi.fn(),
    releaseWriterRole: vi.fn(() => {
        order.push('release')
    }),
    watchForCacheRestore: vi.fn(() => vi.fn()),
}))
vi.mock('./persistenceCoordinator', () => ({
    stopPersistenceForOwnershipLoss: vi.fn(() => {
        order.push('stop')
        return Promise.resolve()
    }),
}))
vi.mock('./store', () => ({ hydrateApplicationStores: vi.fn(async () => ({ hydratedStore: {} })) }))
vi.mock('./crdt', () => ({ initializeCrdtLayer: vi.fn() }))
vi.mock('./postHydration', () => ({
    runPostHydrationServices: vi.fn(() => {
        order.push('services')
    }),
}))
vi.mock('@/stores/snapshotRevision', () => ({ setStaleSnapshotHandler: vi.fn() }))
vi.mock('@/services/sentryService', () => ({ disableSentry: vi.fn() }))
vi.mock('./localOnlyPrivacy', () => ({
    applyLocalOnlyPrivacy: vi.fn(() => Promise.resolve()),
}))
vi.mock('./secrets', () => ({
    migrateLegacySecrets: vi.fn(),
    replaceBackupWithSavedSnapshot: vi.fn(async () => {
        order.push('backup')
    }),
}))
vi.mock('./persistence', () => ({
    setupPersistedStateSync: vi.fn(() => {
        order.push('sync')
        return () => {
            order.push('flush')
            return flush()
        }
    }),
}))

describe('mountHydratedApp legacy key migration (#654, #711 review)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        order.length = 0
    })

    it('rewrites the stored snapshot and its backup at once after moving a key', async () => {
        vi.mocked(migrateLegacySecrets).mockResolvedValue(true)
        await mountHydratedApp()
        expect(order).toEqual(['sync', 'flush', 'backup', 'services'])
    })

    it('keeps the backup when the rewrite could not be saved', async () => {
        vi.mocked(migrateLegacySecrets).mockResolvedValue(true)
        flush.mockResolvedValueOnce(false)
        await mountHydratedApp()
        expect(order).toEqual(['sync', 'flush', 'services'])
    })

    it('a failing backup refresh does not stop the start', async () => {
        vi.mocked(migrateLegacySecrets).mockResolvedValue(true)
        vi.mocked(replaceBackupWithSavedSnapshot).mockRejectedValueOnce(new Error('quota'))
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        await mountHydratedApp()
        expect(order).toEqual(['sync', 'flush', 'services'])
    })

    it('does not force a save when nothing was moved', async () => {
        vi.mocked(migrateLegacySecrets).mockResolvedValue(false)
        await mountHydratedApp()
        expect(order).toEqual(['sync', 'services'])
    })

    it('a failing migration does not stop the start and forces no save', async () => {
        vi.mocked(migrateLegacySecrets).mockRejectedValue(new Error('crypto unavailable'))
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        await mountHydratedApp()
        expect(order).toEqual(['sync', 'services'])
    })
})

describe('mountHydratedApp in a tab that is not the writer (GH #669)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        order.length = 0
    })

    it('shows the notice and starts no store, recovery handler or save', async () => {
        vi.mocked(claimWriterRole).mockResolvedValueOnce('reader')

        await mountHydratedApp()

        expect(renderOtherTabNotice).toHaveBeenCalledOnce()
        expect(hydrateApplicationStores).not.toHaveBeenCalled()
        expect(registerRecoveryListeners).not.toHaveBeenCalled()
        expect(order).toEqual([])
    })

    it('reloads the reader once the writer has closed', async () => {
        vi.mocked(claimWriterRole).mockResolvedValueOnce('reader')
        const reload = vi.fn()
        vi.stubGlobal('location', { reload })

        await mountHydratedApp()
        const reloadReader = vi.mocked(renderOtherTabNotice).mock.calls[0]?.[0]
        const onAvailable = vi.mocked(waitForWriterRole).mock.calls[0]?.[0]
        reloadReader?.()
        onAvailable?.()

        expect(reload).toHaveBeenCalledTimes(2)
        vi.unstubAllGlobals()
    })

    it.each(['writer', 'unsupported'] as const)('starts normally as %s', async (role) => {
        vi.mocked(claimWriterRole).mockResolvedValueOnce(role)
        vi.mocked(migrateLegacySecrets).mockResolvedValue(false)

        await mountHydratedApp()

        expect(renderOtherTabNotice).not.toHaveBeenCalled()
        expect(order).toEqual(['sync', 'services'])
    })

    it('gives the writer role up when the start fails, so other tabs are not blocked', async () => {
        vi.mocked(hydrateApplicationStores).mockRejectedValueOnce(new Error('hydration failed'))
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await mountHydratedApp()

        expect(releaseWriterRole).toHaveBeenCalledOnce()
        expect(renderError).toHaveBeenCalledOnce()
    })

    it('stops saving before it hands the role on, so a stale tab cannot overwrite the next', async () => {
        vi.mocked(hydrateApplicationStores).mockRejectedValueOnce(new Error('hydration failed'))
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await mountHydratedApp()

        expect(order).toEqual(['stop', 'release'])
    })

    it('stops watching for a cache restore once the start has failed', async () => {
        const stopWatching = vi.fn()
        vi.mocked(watchForCacheRestore).mockReturnValueOnce(stopWatching)
        vi.mocked(hydrateApplicationStores).mockRejectedValueOnce(new Error('hydration failed'))
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await mountHydratedApp()

        expect(stopWatching).toHaveBeenCalledOnce()
    })

    it('starts over when a writer tab is restored from the back/forward cache', async () => {
        const reload = vi.fn()
        vi.stubGlobal('location', { reload })
        vi.mocked(migrateLegacySecrets).mockResolvedValue(false)

        await mountHydratedApp()
        const onRestore = vi.mocked(watchForCacheRestore).mock.calls[0]?.[0]
        onRestore?.()

        expect(stopPersistenceForOwnershipLoss).toHaveBeenCalledOnce()
        expect(reload).toHaveBeenCalledOnce()
        vi.unstubAllGlobals()
    })

    it.each(['reader', 'unsupported'] as const)(
        'does not watch for a cache restore as %s',
        async (role) => {
            vi.mocked(claimWriterRole).mockResolvedValueOnce(role)

            await mountHydratedApp()

            expect(watchForCacheRestore).not.toHaveBeenCalled()
        },
    )

    it('stops saving, gives the role up and asks for a reload when a save is refused as stale', async () => {
        const reload = vi.fn()
        vi.stubGlobal('location', { reload })
        vi.mocked(migrateLegacySecrets).mockResolvedValue(false)
        await mountHydratedApp()
        const onStale = vi.mocked(setupPersistedStateSync).mock.calls[0]?.[1]
        order.length = 0

        onStale?.()
        onStale?.()

        expect(order).toEqual(['stop', 'release'])
        expect(renderStaleTabNotice).toHaveBeenCalledOnce()
        vi.mocked(renderStaleTabNotice).mock.calls[0]?.[0]()
        expect(reload).toHaveBeenCalledOnce()
        vi.unstubAllGlobals()
    })

    it('starts no services on a page whose save was refused as stale', async () => {
        vi.stubGlobal('location', { reload: vi.fn() })
        vi.mocked(migrateLegacySecrets).mockResolvedValue(true)
        vi.mocked(setupPersistedStateSync).mockImplementationOnce((_store, onStale) => () => {
            onStale?.()
            return Promise.resolve(false)
        })

        await mountHydratedApp()

        expect(renderStaleTabNotice).toHaveBeenCalledOnce()
        expect(runPostHydrationServices).not.toHaveBeenCalled()
        // The privacy setting still reaches Sentry on the stale page.
        expect(applyLocalOnlyPrivacy).toHaveBeenCalledOnce()
        vi.unstubAllGlobals()
    })

    it('starts the services again on the next start after a stale one', async () => {
        vi.mocked(migrateLegacySecrets).mockResolvedValue(false)

        await mountHydratedApp()

        expect(runPostHydrationServices).toHaveBeenCalledOnce()
        expect(applyLocalOnlyPrivacy).not.toHaveBeenCalled()
    })

    it('registers the stale handler for writes that have no caller to handle them', async () => {
        vi.stubGlobal('location', { reload: vi.fn() })
        vi.mocked(migrateLegacySecrets).mockResolvedValue(false)
        await mountHydratedApp()
        const handler = vi.mocked(setStaleSnapshotHandler).mock.calls[0]?.[0]
        order.length = 0

        handler?.()

        expect(order).toEqual(['stop', 'release'])
        expect(renderStaleTabNotice).toHaveBeenCalledOnce()
        // The stale page may hold older settings than another tab: no error reports.
        expect(disableSentry).toHaveBeenCalledOnce()
        vi.unstubAllGlobals()
    })
})
