import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSecretKeyStore } from '@/services/secretKeyStore'

// Synthetic canaries, never real keys (#709).
const TTS_CANARY = 'sk_canary_0000000000000000000000000000'
const PV_CANARY = 'pv_canary_0000000000000000000000000000'
const idb = new Map<string, string>()

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: vi.fn(async (key: string) => idb.get(key) ?? null),
        setItem: vi.fn(async (key: string, value: string) => void idb.set(key, value)),
        removeItem: vi.fn(async (key: string) => void idb.delete(key)),
    },
}))

vi.mock('@/services/cryptoService', () => ({
    encrypt: vi.fn(async (plain: string) => `enc:${[...plain].reverse().join('')}`),
    decrypt: vi.fn(async (payload: string) => [...payload.slice(4)].reverse().join('')),
    isEncryptedPayload: vi.fn((value: string) => value.startsWith('enc:')),
    ensureEncrypted: vi.fn(async (value: string) => ({
        payload: `enc:${[...value].reverse().join('')}`,
        migrated: true,
    })),
}))

describe('createSecretKeyStore (#709)', () => {
    beforeEach(() => {
        idb.clear()
        vi.clearAllMocks()
    })

    it('keeps two credentials in separate encrypted entries', async () => {
        const tts = createSecretKeyStore('test-tts-key')
        const porcupine = createSecretKeyStore('test-porcupine-key')
        await tts.setApiKey(TTS_CANARY)
        await porcupine.setApiKey(PV_CANARY)
        await expect(tts.getApiKey()).resolves.toBe(TTS_CANARY)
        await expect(porcupine.getApiKey()).resolves.toBe(PV_CANARY)
        expect(idb.get('test-porcupine-key')).not.toContain(PV_CANARY)
        await porcupine.clearApiKey()
        await expect(tts.getApiKey()).resolves.toBe(TTS_CANARY)
        await expect(porcupine.hasApiKey()).resolves.toBe(false)
    })

    it('tracks a pending legacy migration per credential', async () => {
        const tts = createSecretKeyStore('test-tts-key')
        const porcupine = createSecretKeyStore('test-porcupine-key')
        const { indexedDBStorage } = await import('@/stores/indexedDBStorage')
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(new Error('quota'))
        await expect(porcupine.migrateLegacyKey(PV_CANARY)).resolves.toBe(false)
        expect(porcupine.isLegacyKeyPending()).toBe(true)
        expect(tts.isLegacyKeyPending()).toBe(false)
    })

    it('tells subscribers about a save, a removal and a moved key', async () => {
        const store = createSecretKeyStore('test-porcupine-key')
        const listener = vi.fn()
        const unsubscribe = store.subscribe(listener)
        await store.setApiKey(PV_CANARY)
        await store.clearApiKey()
        await store.migrateLegacyKey(PV_CANARY)
        expect(listener).toHaveBeenCalledTimes(3)
        await store.migrateLegacyKey(null)
        expect(listener).toHaveBeenCalledTimes(3)
        unsubscribe()
        await store.setApiKey(PV_CANARY)
        expect(listener).toHaveBeenCalledTimes(3)
    })

    it('a failed write does not notify and does not block later operations', async () => {
        const store = createSecretKeyStore('test-porcupine-key')
        const listener = vi.fn()
        store.subscribe(listener)
        const { indexedDBStorage } = await import('@/stores/indexedDBStorage')
        vi.mocked(indexedDBStorage.setItem).mockRejectedValueOnce(new Error('quota'))
        await expect(store.setApiKey(PV_CANARY)).rejects.toThrow('quota')
        expect(listener).not.toHaveBeenCalled()
        await store.setApiKey(PV_CANARY)
        await expect(store.getApiKey()).resolves.toBe(PV_CANARY)
    })
})
