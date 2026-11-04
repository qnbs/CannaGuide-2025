import { describe, it, expect, vi } from 'vitest'
import { apiKeyService } from '@/services/apiKeyService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'

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

    it('invalidates api keys that are older than 90 days', async () => {
        localStorage.clear()
        localStorage.setItem(
            'cg.gemini.apiKey.meta.v1',
            JSON.stringify({ updatedAt: Date.now() - 91 * 24 * 60 * 60 * 1000 }),
        )
        vi.mocked(indexedDBStorage.getItem).mockResolvedValueOnce('AIzaSyB1234567890abcdefghij')

        await expect(apiKeyService.getApiKey()).resolves.toBeNull()
        expect(vi.mocked(indexedDBStorage.removeItem)).toHaveBeenCalled()
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

describe('apiKeyService key test in Local-Only Mode', () => {
    it('sends no Gemini request and says why', async () => {
        const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
        const generateContent = vi.fn()
        const GoogleGenAI = vi.fn(() => ({ models: { generateContent } }))
        vi.doMock('@google/genai', () => ({ GoogleGenAI }))
        setLocalOnlyMode(true)
        try {
            await expect(
                apiKeyService.validateApiKey('AIzaSyB1234567890abcdefghijklmnopqrstu'),
            ).rejects.toThrow('settingsView.security.testBlockedLocalOnly')
            expect(GoogleGenAI).not.toHaveBeenCalled()
            expect(generateContent).not.toHaveBeenCalled()
        } finally {
            setLocalOnlyMode(false)
            vi.doUnmock('@google/genai')
        }
    })

    it('sends no request when the mode is switched on while the SDK loads', async () => {
        const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
        const generateContent = vi.fn()
        const GoogleGenAI = vi.fn(() => ({ models: { generateContent } }))
        vi.doMock('@google/genai', () => {
            // The module body runs during the import: switch the mode on there.
            setLocalOnlyMode(true)
            return { GoogleGenAI }
        })
        try {
            await expect(
                apiKeyService.validateApiKey('AIzaSyB1234567890abcdefghijklmnopqrstu'),
            ).rejects.toThrow('settingsView.security.testBlockedLocalOnly')
            expect(generateContent).not.toHaveBeenCalled()
        } finally {
            setLocalOnlyMode(false)
            vi.doUnmock('@google/genai')
        }
    })
})
