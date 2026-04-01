// ---------------------------------------------------------------------------
// AI Provider Data-Transmission Consent Service (GDPR Art. 6/7)
// ---------------------------------------------------------------------------
// Tracks per-provider user consent before plant data is sent to external APIs.
// Consent is stored in localStorage and must be granted before the first
// API call to each provider.
// ---------------------------------------------------------------------------

import type { AiProvider } from '@cannaguide/ai-core'

const CONSENT_PREFIX = 'cg.ai.consent.'

/** DPA (Data Processing Agreement) links per provider. */
const PROVIDER_DPA_LINKS: Partial<Record<AiProvider, string>> = {
    gemini: 'https://cloud.google.com/terms/data-processing-addendum',
    openai: 'https://openai.com/policies/data-processing-addendum',
    anthropic: 'https://www.anthropic.com/policies/privacy',
    xai: 'https://x.ai/legal/privacy-policy',
}

/** Human-readable provider display names. */
const PROVIDER_DISPLAY_NAMES: Record<AiProvider, string> = {
    gemini: 'Google Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic Claude',
    xai: 'xAI Grok',
}

function consentKey(provider: AiProvider): string {
    return `${CONSENT_PREFIX}${provider}`
}

function hasProviderConsent(provider: AiProvider): boolean {
    try {
        return localStorage.getItem(consentKey(provider)) === 'granted'
    } catch {
        return false
    }
}

function grantProviderConsent(provider: AiProvider): void {
    try {
        localStorage.setItem(consentKey(provider), 'granted')
    } catch {
        // Best-effort.
    }
}

function revokeProviderConsent(provider: AiProvider): void {
    try {
        localStorage.removeItem(consentKey(provider))
    } catch {
        // Best-effort.
    }
}

function revokeAllConsents(): void {
    const providers: AiProvider[] = ['gemini', 'openai', 'anthropic', 'xai']
    for (const provider of providers) {
        revokeProviderConsent(provider)
    }
}

function getDpaLink(provider: AiProvider): string | undefined {
    return PROVIDER_DPA_LINKS[provider]
}

function getDisplayName(provider: AiProvider): string {
    return PROVIDER_DISPLAY_NAMES[provider]
}

export const aiConsentService = {
    hasProviderConsent,
    grantProviderConsent,
    revokeProviderConsent,
    revokeAllConsents,
    getDpaLink,
    getDisplayName,
}
