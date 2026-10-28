import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CLOUD_TTS_API_KEY_STORAGE_KEY } from '@/constants'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { encrypt, decrypt } from '@/services/cryptoService'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'
const store = new Map<string, string>()

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: vi.fn(async (key: string) => store.get(key) ?? null),
        setItem: vi.fn(async (key: string, value: string) => void store.set(key, value)),
        removeItem: vi.fn(async (key: string) => void store.delete(key)),
    },
}))

// Reversible stand-in for AES-GCM: the payload must not contain the key.
vi.mock('@/services/cryptoService', () => ({
    encrypt: vi.fn(async (plain: string) => `enc:${[...plain].reverse().join('')}`),
    decrypt: vi.fn(async (payload: string) => [...payload.slice(4)].reverse().join('')),
    isEncryptedPayload: vi.fn((value: string) => value.startsWith('enc:')),
    ensureEncrypted: vi.fn(async (value: string) => ({
        payload: `enc:${[...value].reverse().join('')}`,
        migrated: true,
    })),
}))

describe('cloudTtsKeyService', () => {
    beforeEach(() => {
        store.clear()
        vi.clearAllMocks()
    })

    it('stores the key encrypted and reads it back', async () => {
        await cloudTtsKeyService.setApiKey(`  ${CANARY}  `)
        const raw = store.get(CLOUD_TTS_API_KEY_STORAGE_KEY)
        expect(raw).toBeDefined()
        expect(raw).not.toContain(CANARY)
        expect(vi.mocked(encrypt)).toHaveBeenCalledWith(CANARY)
        await expect(cloudTtsKeyService.getApiKey()).resolves.toBe(CANARY)
        await expect(cloudTtsKeyService.hasApiKey()).resolves.toBe(true)
    })

    it('an empty value removes the key', async () => {
        await cloudTtsKeyService.setApiKey(CANARY)
        await cloudTtsKeyService.setApiKey('   ')
        expect(store.has(CLOUD_TTS_API_KEY_STORAGE_KEY)).toBe(false)
        await expect(cloudTtsKeyService.hasApiKey()).resolves.toBe(false)
    })

    it('re-encrypts a plain value found in the store', async () => {
        store.set(CLOUD_TTS_API_KEY_STORAGE_KEY, CANARY)
        await expect(cloudTtsKeyService.getApiKey()).resolves.toBe(CANARY)
        expect(store.get(CLOUD_TTS_API_KEY_STORAGE_KEY)).not.toContain(CANARY)
    })

    it('a payload that cannot be decrypted reads as no key (#711 review)', async () => {
        store.set(CLOUD_TTS_API_KEY_STORAGE_KEY, 'enc:broken')
        // The real decrypt() returns its input when authentication fails.
        vi.mocked(decrypt).mockImplementationOnce(async (payload: string) => payload)
        await expect(cloudTtsKeyService.getApiKey()).resolves.toBeNull()
        vi.mocked(decrypt).mockImplementationOnce(async (payload: string) => payload)
        await expect(cloudTtsKeyService.hasApiKey()).resolves.toBe(false)
    })

    it('an unavailable encryption key reads as no key', async () => {
        store.set(CLOUD_TTS_API_KEY_STORAGE_KEY, 'enc:broken')
        vi.mocked(decrypt).mockRejectedValueOnce(new Error('key store unavailable'))
        await expect(cloudTtsKeyService.getApiKey()).resolves.toBeNull()
    })

    describe('migrateLegacyKey', () => {
        it('moves a legacy plaintext key and allows clearing it from settings', async () => {
            await expect(cloudTtsKeyService.migrateLegacyKey(CANARY)).resolves.toBe(true)
            await expect(cloudTtsKeyService.getApiKey()).resolves.toBe(CANARY)
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(false)
        })

        it('keeps the legacy key when the encrypted copy cannot be stored (preserve first)', async () => {
            vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(new Error('quota'))
            await expect(cloudTtsKeyService.migrateLegacyKey(CANARY)).resolves.toBe(false)
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(true)
            // The next start succeeds and releases it.
            await expect(cloudTtsKeyService.migrateLegacyKey(CANARY)).resolves.toBe(true)
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(false)
        })

        it('keeps the legacy key when the read-back does not match', async () => {
            vi.mocked(decrypt).mockResolvedValueOnce('something-else')
            await expect(cloudTtsKeyService.migrateLegacyKey(CANARY)).resolves.toBe(false)
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(true)
            await cloudTtsKeyService.migrateLegacyKey(null)
        })

        it('an explicit save retires a pending legacy key (#711 review)', async () => {
            vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(new Error('quota'))
            await cloudTtsKeyService.migrateLegacyKey(CANARY)
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(true)
            cloudTtsKeyService.resolveLegacyKey()
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(false)
        })

        it('a key stored since keeps precedence over a stale legacy value (#711 review)', async () => {
            await cloudTtsKeyService.setApiKey('sk_canary_replacement_0000000000000000')
            await expect(cloudTtsKeyService.migrateLegacyKey(CANARY)).resolves.toBe(true)
            await expect(cloudTtsKeyService.getApiKey()).resolves.toBe(
                'sk_canary_replacement_0000000000000000',
            )
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(false)
        })

        it('a plain value in the key store does not count as a migrated key (#711 review)', async () => {
            store.set(CLOUD_TTS_API_KEY_STORAGE_KEY, 'plain-unverified')
            vi.mocked(indexedDBStorage.setItem).mockRejectedValue(new Error('quota'))
            await expect(cloudTtsKeyService.migrateLegacyKey(CANARY)).resolves.toBe(false)
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(true)
            vi.mocked(indexedDBStorage.setItem).mockImplementation(
                async (key: string, value: string) => void store.set(key, value),
            )
            await expect(cloudTtsKeyService.migrateLegacyKey(CANARY)).resolves.toBe(true)
            await expect(cloudTtsKeyService.getApiKey()).resolves.toBe(CANARY)
            expect(store.get(CLOUD_TTS_API_KEY_STORAGE_KEY)).not.toContain(CANARY)
        })

        it('keeps the legacy key when the written entry is not ciphertext', async () => {
            vi.mocked(encrypt).mockResolvedValueOnce(CANARY)
            await expect(cloudTtsKeyService.migrateLegacyKey(CANARY)).resolves.toBe(false)
            expect(cloudTtsKeyService.isLegacyKeyPending()).toBe(true)
            await cloudTtsKeyService.migrateLegacyKey(null)
        })

        it('has nothing to move for null or blank values', async () => {
            await expect(cloudTtsKeyService.migrateLegacyKey(null)).resolves.toBe(true)
            await expect(cloudTtsKeyService.migrateLegacyKey('  ')).resolves.toBe(true)
            expect(vi.mocked(indexedDBStorage.setItem)).not.toHaveBeenCalled()
        })
    })
})
