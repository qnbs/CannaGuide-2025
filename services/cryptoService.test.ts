import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { indexedDB } from 'fake-indexeddb'

const SECURE_DB_NAME = 'CannaGuideSecureDB'
const LEGACY_KEY_STORAGE = 'cg.crypto.key.v1'

const deleteCryptoDb = async (): Promise<void> => {
    await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(SECURE_DB_NAME)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
        request.onblocked = () => resolve()
    })
}

const createLegacyKeyPayload = (): string => {
    const keyBytes = new Uint8Array(32)
    keyBytes.forEach((_, index) => {
        keyBytes[index] = index + 1
    })
    return btoa(String.fromCharCode(...keyBytes))
}

const loadCryptoService = async () => import('./cryptoService')

describe('cryptoService', () => {
    beforeEach(async () => {
        localStorage.clear()
        vi.resetModules()
        await deleteCryptoDb()
    })

    afterEach(async () => {
        localStorage.clear()
        await deleteCryptoDb()
    })

    it('encrypts and decrypts a payload roundtrip', async () => {
        const cryptoService = await loadCryptoService()

        const encrypted = await cryptoService.encrypt('top-secret')
        expect(cryptoService.isEncryptedPayload(encrypted)).toBe(true)

        const decrypted = await cryptoService.decrypt(encrypted)
        expect(decrypted).toBe('top-secret')
    })

    it('returns unchanged input when payload is not encrypted JSON', async () => {
        const cryptoService = await loadCryptoService()

        await expect(cryptoService.decrypt('plain-text-value')).resolves.toBe('plain-text-value')
        await expect(cryptoService.decrypt('{"v":2,"iv":"a","data":"b"}')).resolves.toBe(
            '{"v":2,"iv":"a","data":"b"}',
        )
    })

    it('ensureEncrypted sets migration flag only once', async () => {
        const cryptoService = await loadCryptoService()

        const first = await cryptoService.ensureEncrypted('api-key')
        expect(first.migrated).toBe(true)
        expect(cryptoService.isEncryptedPayload(first.payload)).toBe(true)

        const second = await cryptoService.ensureEncrypted(first.payload)
        expect(second.migrated).toBe(false)
        expect(second.payload).toBe(first.payload)
    })

    it('migrates legacy localStorage key and removes it', async () => {
        localStorage.setItem(LEGACY_KEY_STORAGE, createLegacyKeyPayload())
        const cryptoService = await loadCryptoService()

        const encrypted = await cryptoService.encrypt('legacy-secret')
        const decrypted = await cryptoService.decrypt(encrypted)

        expect(localStorage.getItem(LEGACY_KEY_STORAGE)).toBeNull()
        expect(decrypted).toBe('legacy-secret')
    })
})
