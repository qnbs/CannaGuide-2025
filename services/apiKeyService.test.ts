import { describe, it, expect } from 'vitest'
import { apiKeyService } from '@/services/apiKeyService'

describe('apiKeyService', () => {
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
