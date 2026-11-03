import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateLegacySecrets, replaceBackupWithSavedSnapshot } from './secrets'
import { mountHydratedApp } from './mountHydratedApp'
import { renderOtherTabNotice } from './render'
import { hydrateApplicationStores } from './store'
import { registerRecoveryListeners } from './recovery'
import { claimWriterRole, waitForWriterRole, type WriterRole } from './writerOwnership'

const flush = vi.fn().mockResolvedValue(true)
const order: string[] = []

vi.mock('@/i18n', () => ({ i18nPromise: Promise.resolve() }))
vi.mock('./recovery', () => ({ registerRecoveryListeners: vi.fn() }))
vi.mock('./render', () => ({ renderError: vi.fn(), renderOtherTabNotice: vi.fn() }))
vi.mock('./writerOwnership', () => ({
    claimWriterRole: vi.fn((): Promise<WriterRole> => Promise.resolve('writer')),
    waitForWriterRole: vi.fn(),
}))
vi.mock('./store', () => ({ hydrateApplicationStores: vi.fn(async () => ({ hydratedStore: {} })) }))
vi.mock('./crdt', () => ({ initializeCrdtLayer: vi.fn() }))
vi.mock('./postHydration', () => ({
    runPostHydrationServices: vi.fn(() => {
        order.push('services')
    }),
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
})
