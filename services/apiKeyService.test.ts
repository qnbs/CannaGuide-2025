import { describe, it, expect, vi } from 'vitest'
import { apiKeyService } from '@/services/apiKeyService'

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
    },
}))

vi.mock('@/services/cryptoService', () => ({
    encrypt: vi.fn().mockResolvedValue('{"v":1,"iv":"a","data":"b"}'),
    decrypt: vi.fn().mockResolvedValue(''),
    isEncryptedPayload: vi.fn().mockReturnValue(false),
}))

describe('apiKeyService', () => {
    it('exposes key metadata after saving', async () => {
        localStorage.clear()
        await apiKeyService.setApiKey('AIzaSyB1234567890abcdefghij')

        const metadata = apiKeyService.getApiKeyMetadata()
        expect(metadata).not.toBeNull()
        expect(metadata?.updatedAt).toBeTypeOf('number')
    })

    describe('isValidApiKeyFormat', () => {
        it('accepts valid API key format starting with AIza', () => {
            expect(apiKeyService.isValidApiKeyFormat('AIzaSyB1234567890abcdefghij')).toBe(true)
        })

        it('rejects keys not starting with AIza', () => {
            expect(apiKeyService.isValidApiKeyFormat('sk-1234567890abcdefghijklmn')).toBe(false)
        })

        it('rejects empty string', () => {
            expect(apiKeyService.isValidApiKeyFormat('')).toBe(false)
        })

        it('rejects too-short keys', () => {
            expect(apiKeyService.isValidApiKeyFormat('AIza')).toBe(false)
        })

        it('trims whitespace before validation', () => {
            expect(apiKeyService.isValidApiKeyFormat('  AIzaSyB1234567890abcdefghij  ')).toBe(true)
        })

        it('rejects keys with invalid characters', () => {
            expect(apiKeyService.isValidApiKeyFormat('AIza!@#$%^&*()+=<>')).toBe(false)
        })
    })
})
