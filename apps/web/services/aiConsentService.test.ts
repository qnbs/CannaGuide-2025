import { describe, expect, it, beforeEach } from 'vitest'
import { aiConsentService } from './aiConsentService'

describe('aiConsentService', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    describe('hasProviderConsent', () => {
        it('returns false when no consent stored', () => {
            expect(aiConsentService.hasProviderConsent('gemini')).toBe(false)
        })

        it('returns true after consent granted', () => {
            aiConsentService.grantProviderConsent('gemini')
            expect(aiConsentService.hasProviderConsent('gemini')).toBe(true)
        })

        it('returns false for different provider', () => {
            aiConsentService.grantProviderConsent('gemini')
            expect(aiConsentService.hasProviderConsent('openai')).toBe(false)
        })
    })

    describe('grantProviderConsent', () => {
        it('stores consent in localStorage', () => {
            aiConsentService.grantProviderConsent('openai')
            expect(localStorage.getItem('cg.ai.consent.openai')).toBe('granted')
        })

        it('works for all providers', () => {
            aiConsentService.grantProviderConsent('gemini')
            aiConsentService.grantProviderConsent('anthropic')
            aiConsentService.grantProviderConsent('xai')
            expect(aiConsentService.hasProviderConsent('gemini')).toBe(true)
            expect(aiConsentService.hasProviderConsent('anthropic')).toBe(true)
            expect(aiConsentService.hasProviderConsent('xai')).toBe(true)
        })
    })

    describe('revokeProviderConsent', () => {
        it('removes consent for a provider', () => {
            aiConsentService.grantProviderConsent('gemini')
            expect(aiConsentService.hasProviderConsent('gemini')).toBe(true)
            aiConsentService.revokeProviderConsent('gemini')
            expect(aiConsentService.hasProviderConsent('gemini')).toBe(false)
        })

        it('does not affect other providers', () => {
            aiConsentService.grantProviderConsent('gemini')
            aiConsentService.grantProviderConsent('openai')
            aiConsentService.revokeProviderConsent('gemini')
            expect(aiConsentService.hasProviderConsent('openai')).toBe(true)
        })
    })

    describe('revokeAllConsents', () => {
        it('revokes consent for all providers', () => {
            aiConsentService.grantProviderConsent('gemini')
            aiConsentService.grantProviderConsent('openai')
            aiConsentService.grantProviderConsent('anthropic')
            aiConsentService.grantProviderConsent('xai')
            aiConsentService.revokeAllConsents()
            expect(aiConsentService.hasProviderConsent('gemini')).toBe(false)
            expect(aiConsentService.hasProviderConsent('openai')).toBe(false)
            expect(aiConsentService.hasProviderConsent('anthropic')).toBe(false)
            expect(aiConsentService.hasProviderConsent('xai')).toBe(false)
        })
    })

    describe('getDpaLink', () => {
        it('returns DPA link for gemini', () => {
            expect(aiConsentService.getDpaLink('gemini')).toContain('google.com')
        })

        it('returns DPA link for openai', () => {
            expect(aiConsentService.getDpaLink('openai')).toContain('openai.com')
        })

        it('returns DPA link for anthropic', () => {
            expect(aiConsentService.getDpaLink('anthropic')).toContain('anthropic.com')
        })

        it('returns DPA link for xai', () => {
            expect(aiConsentService.getDpaLink('xai')).toContain('x.ai')
        })
    })

    describe('getDisplayName', () => {
        it('returns display names', () => {
            expect(aiConsentService.getDisplayName('gemini')).toBe('Google Gemini')
            expect(aiConsentService.getDisplayName('openai')).toBe('OpenAI')
            expect(aiConsentService.getDisplayName('anthropic')).toBe('Anthropic Claude')
            expect(aiConsentService.getDisplayName('xai')).toBe('xAI Grok')
        })
    })
})
