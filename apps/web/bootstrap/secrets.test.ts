import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { migrateLegacySecrets, replaceBackupWithSavedSnapshot } from './secrets'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'

vi.mock('@/services/cloudTtsKeyService', () => ({
    cloudTtsKeyService: { migrateLegacyKey: vi.fn() },
}))

const idb = new Map<string, string>()
vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: vi.fn(async (key: string) => idb.get(key) ?? null),
        setItem: vi.fn(async (key: string, value: string) => void idb.set(key, value)),
    },
}))

const storeWith = (cloudTtsApiKey: string | null) => {
    const dispatch = vi.fn()
    const store = {
        getState: () => ({ settings: { settings: { tts: { cloudTtsApiKey } } } }),
        dispatch,
    } as unknown as AppStore
    return { store, dispatch }
}

describe('migrateLegacySecrets (#654)', () => {
    beforeEach(() => vi.clearAllMocks())

    it('clears the plaintext from settings once the encrypted copy is verified', async () => {
        vi.mocked(cloudTtsKeyService.migrateLegacyKey).mockResolvedValue(true)
        const { store, dispatch } = storeWith(CANARY)
        await expect(migrateLegacySecrets(store)).resolves.toBe(true)
        expect(cloudTtsKeyService.migrateLegacyKey).toHaveBeenCalledWith(CANARY)
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'tts.cloudTtsApiKey', value: null }),
        )
    })

    it('leaves the settings untouched when the migration fails', async () => {
        vi.mocked(cloudTtsKeyService.migrateLegacyKey).mockResolvedValue(false)
        const { store, dispatch } = storeWith(CANARY)
        await expect(migrateLegacySecrets(store)).resolves.toBe(false)
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('does nothing without a legacy key', async () => {
        const { store, dispatch } = storeWith(null)
        await expect(migrateLegacySecrets(store)).resolves.toBe(false)
        expect(cloudTtsKeyService.migrateLegacyKey).not.toHaveBeenCalled()
        expect(dispatch).not.toHaveBeenCalled()
    })
})

describe('replaceBackupWithSavedSnapshot (#711 review)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        idb.clear()
    })

    it('replaces the startup backup that still holds the plaintext key', async () => {
        idb.set('cannaguide-redux-storage', '{"settings":{"tts":{"cloudTtsApiKey":null}}}')
        idb.set(
            'cannaguide-redux-storage-backup',
            `{"settings":{"tts":{"cloudTtsApiKey":"${CANARY}"}}}`,
        )
        await replaceBackupWithSavedSnapshot()
        expect(idb.get('cannaguide-redux-storage-backup')).not.toContain(CANARY)
        expect(idb.get('cannaguide-redux-storage-backup')).toBe(idb.get('cannaguide-redux-storage'))
    })

    it('redacts a snapshot another tab wrote with the key since', async () => {
        idb.set(
            'cannaguide-redux-storage',
            `{"settings":{"settings":{"tts":{"cloudTtsApiKey":"${CANARY}"}}}}`,
        )
        await replaceBackupWithSavedSnapshot()
        expect(idb.get('cannaguide-redux-storage-backup')).not.toContain(CANARY)
    })

    it('keeps the backup when there is no saved snapshot to replace it with', async () => {
        idb.set('cannaguide-redux-storage-backup', 'previous')
        await replaceBackupWithSavedSnapshot()
        expect(idb.get('cannaguide-redux-storage-backup')).toBe('previous')
        expect(indexedDBStorage.setItem).not.toHaveBeenCalled()
    })
})
