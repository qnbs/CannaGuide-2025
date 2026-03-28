// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
    generateSyncEncryptionKey,
    encryptSyncPayload,
    decryptSyncPayload,
    isEncryptedSyncPayload,
} from '@/services/syncEncryptionService'

describe('syncEncryptionService', () => {
    describe('generateSyncEncryptionKey', () => {
        it('generates a Base64-encoded key', async () => {
            const key = await generateSyncEncryptionKey()
            expect(key).toBeTypeOf('string')
            expect(key.length).toBeGreaterThan(20)
            // Should be valid base64
            expect(() => atob(key)).not.toThrow()
        })

        it('generates unique keys on each call', async () => {
            const key1 = await generateSyncEncryptionKey()
            const key2 = await generateSyncEncryptionKey()
            expect(key1).not.toEqual(key2)
        })
    })

    describe('encrypt/decrypt roundtrip', () => {
        it('encrypts and decrypts a simple string', async () => {
            const key = await generateSyncEncryptionKey()
            const plaintext = 'Hello CannaGuide'
            const encrypted = await encryptSyncPayload(plaintext, key)
            const decrypted = await decryptSyncPayload(encrypted, key)
            expect(decrypted).toBe(plaintext)
        })

        it('encrypts and decrypts JSON data', async () => {
            const key = await generateSyncEncryptionKey()
            const data = JSON.stringify({ plants: [{ name: 'OG Kush', stage: 'veg' }] })
            const encrypted = await encryptSyncPayload(data, key)
            const decrypted = await decryptSyncPayload(encrypted, key)
            expect(decrypted).toBe(data)
        })

        it('encrypts and decrypts unicode content', async () => {
            const key = await generateSyncEncryptionKey()
            const plaintext = 'Züchtung 🌿 Anbau'
            const encrypted = await encryptSyncPayload(plaintext, key)
            const decrypted = await decryptSyncPayload(encrypted, key)
            expect(decrypted).toBe(plaintext)
        })

        it('produces different ciphertext for same plaintext (random IV)', async () => {
            const key = await generateSyncEncryptionKey()
            const plaintext = 'same input'
            const enc1 = await encryptSyncPayload(plaintext, key)
            const enc2 = await encryptSyncPayload(plaintext, key)
            expect(enc1).not.toEqual(enc2)
        })

        it('fails to decrypt with wrong key', async () => {
            const key1 = await generateSyncEncryptionKey()
            const key2 = await generateSyncEncryptionKey()
            const encrypted = await encryptSyncPayload('secret', key1)
            await expect(decryptSyncPayload(encrypted, key2)).rejects.toThrow()
        })
    })

    describe('isEncryptedSyncPayload', () => {
        it('detects v2 encrypted payload', async () => {
            const key = await generateSyncEncryptionKey()
            const encrypted = await encryptSyncPayload('data', key)
            expect(isEncryptedSyncPayload(encrypted)).toBe(true)
        })

        it('returns false for plain text', () => {
            expect(isEncryptedSyncPayload('just a string')).toBe(false)
        })

        it('returns false for v1 payloads', () => {
            expect(isEncryptedSyncPayload('{"v":1,"iv":"a","data":"b"}')).toBe(false)
        })

        it('returns false for invalid JSON', () => {
            expect(isEncryptedSyncPayload('not json {')).toBe(false)
        })
    })
})
