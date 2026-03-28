import { describe, it, expect, beforeEach, vi } from 'vitest'

const loadService = async () => (await import('./consentService')).consentService

describe('consentService', () => {
    beforeEach(() => {
        vi.resetModules()
        localStorage.clear()
        document.cookie
            .split(';')
            .map((entry) => entry.split('=')[0]?.trim())
            .filter(Boolean)
            .forEach((name) => {
                document.cookie = `${name}=; Max-Age=0; Path=/`
            })
    })

    it('returns false when no consent exists', async () => {
        const consentService = await loadService()
        expect(consentService.hasConsent()).toBe(false)
    })

    it('grants consent via cookie and reports true', async () => {
        const consentService = await loadService()

        consentService.grantConsent()

        expect(consentService.hasConsent()).toBe(true)
        expect(document.cookie.includes('cg.gdpr.consent.v2=1')).toBe(true)
    })

    it('migrates legacy localStorage consent to cookie', async () => {
        localStorage.setItem('cg.gdpr.consent.v1', '1')
        const consentService = await loadService()

        const hasConsent = consentService.hasConsent()

        expect(hasConsent).toBe(true)
        expect(document.cookie.includes('cg.gdpr.consent.v2=1')).toBe(true)
        expect(localStorage.getItem('cg.gdpr.consent.v1')).toBeNull()
    })

    it('revokes consent and cleans legacy storage key', async () => {
        localStorage.setItem('cg.gdpr.consent.v1', '1')
        const consentService = await loadService()

        consentService.grantConsent()
        consentService.revokeConsent()

        expect(consentService.hasConsent()).toBe(false)
        expect(localStorage.getItem('cg.gdpr.consent.v1')).toBeNull()
    })
})
