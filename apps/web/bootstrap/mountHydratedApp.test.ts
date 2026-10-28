import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateLegacySecrets, replaceBackupWithSavedSnapshot } from './secrets'
import { mountHydratedApp } from './mountHydratedApp'

const flush = vi.fn().mockResolvedValue(true)
const order: string[] = []

vi.mock('@/i18n', () => ({ i18nPromise: Promise.resolve() }))
vi.mock('./recovery', () => ({ registerRecoveryListeners: vi.fn() }))
vi.mock('./render', () => ({ renderError: vi.fn() }))
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
