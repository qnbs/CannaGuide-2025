import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { porcupineKeyService } from '@/services/porcupineKeyService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { migrateLegacySecrets, replaceBackupWithSavedSnapshot } from './secrets'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'

vi.mock('@/services/cloudTtsKeyService', () => ({
    cloudTtsKeyService: { migrateLegacyKey: vi.fn(), isLegacyKeyPending: vi.fn(() => false) },
}))
vi.mock('@/services/porcupineKeyService', () => ({
    porcupineKeyService: { migrateLegacyKey: vi.fn(), isLegacyKeyPending: vi.fn(() => false) },
}))
const PORCUPINE_CANARY = 'pv_canary_0000000000000000000000000000'

const idb = new Map<string, string>()
vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: vi.fn(async (key: string) => idb.get(key) ?? null),
        setItem: vi.fn(async (key: string, value: string) => void idb.set(key, value)),
    },
}))

const storeWith = (cloudTtsApiKey: string | null, porcupineAccessKey: string | null = null) => {
    const dispatch = vi.fn()
    const store = {
        getState: () => ({
            settings: {
                settings: { tts: { cloudTtsApiKey }, voiceControl: { porcupineAccessKey } },
            },
        }),
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

    it('moves the Porcupine access key as well (#709)', async () => {
        vi.mocked(porcupineKeyService.migrateLegacyKey).mockResolvedValue(true)
        const { store, dispatch } = storeWith(null, PORCUPINE_CANARY)
        await expect(migrateLegacySecrets(store)).resolves.toBe(true)
        expect(porcupineKeyService.migrateLegacyKey).toHaveBeenCalledWith(PORCUPINE_CANARY)
        expect(cloudTtsKeyService.migrateLegacyKey).not.toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'voiceControl.porcupineAccessKey', value: null }),
        )
    })

    it('clears only the key whose migration succeeded (#709)', async () => {
        vi.mocked(cloudTtsKeyService.migrateLegacyKey).mockResolvedValue(false)
        vi.mocked(porcupineKeyService.migrateLegacyKey).mockResolvedValue(true)
        const { store, dispatch } = storeWith(CANARY, PORCUPINE_CANARY)
        await expect(migrateLegacySecrets(store)).resolves.toBe(true)
        expect(dispatch).toHaveBeenCalledTimes(1)
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'voiceControl.porcupineAccessKey', value: null }),
        )
    })

    it('does nothing without a legacy key', async () => {
        const { store, dispatch } = storeWith(null)
        await expect(migrateLegacySecrets(store)).resolves.toBe(false)
        expect(cloudTtsKeyService.migrateLegacyKey).not.toHaveBeenCalled()
        expect(porcupineKeyService.migrateLegacyKey).not.toHaveBeenCalled()
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

    it('keeps a key whose migration is still pending when the other one moved (#744 review)', async () => {
        vi.mocked(cloudTtsKeyService.isLegacyKeyPending).mockReturnValueOnce(true)
        idb.set(
            'cannaguide-redux-storage',
            JSON.stringify({
                settings: {
                    settings: {
                        tts: { cloudTtsApiKey: CANARY },
                        voiceControl: { porcupineAccessKey: PORCUPINE_CANARY },
                    },
                },
            }),
        )
        await replaceBackupWithSavedSnapshot()
        expect(idb.get('cannaguide-redux-storage-backup')).toContain(CANARY)
        expect(idb.get('cannaguide-redux-storage-backup')).not.toContain(PORCUPINE_CANARY)
    })

    it('keeps the backup when there is no saved snapshot to replace it with', async () => {
        idb.set('cannaguide-redux-storage-backup', 'previous')
        await replaceBackupWithSavedSnapshot()
        expect(idb.get('cannaguide-redux-storage-backup')).toBe('previous')
        expect(indexedDBStorage.setItem).not.toHaveBeenCalled()
    })
})
