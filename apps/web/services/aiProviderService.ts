// ---------------------------------------------------------------------------
// AI Provider Abstraction -- Multi-Model BYOK Switch
// ---------------------------------------------------------------------------
// Supports Gemini (native), OpenAI-compatible (xAI/Grok), and Anthropic (Claude).
// Provider selection + per-provider API keys are persisted in localStorage.
// ---------------------------------------------------------------------------

import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { encrypt, decrypt, isEncryptedPayload, ensureEncrypted } from '@/services/cryptoService'
import {
    PROVIDER_CONFIGS,
    isKeyRotationDue,
    isValidProviderKeyFormat as coreIsValidKeyFormat,
} from '@cannaguide/ai-core'
import type { AiProvider, AiProviderConfig, AiProviderKeyMetadata } from '@cannaguide/ai-core'

// Re-export types for existing local consumers
export type { AiProvider, AiProviderConfig, AiProviderKeyMetadata }

// ---------------------------------------------------------------------------
// Provider Selection (persisted in localStorage)
// ---------------------------------------------------------------------------

const ACTIVE_PROVIDER_KEY = 'cg.ai.activeProvider'

const getProviderMetadataKey = (provider: AiProvider): string =>
    `cg.ai.provider.${provider}.meta.v1`

const loadProviderMetadata = (provider: AiProvider): AiProviderKeyMetadata | null => {
    try {
        const raw = localStorage.getItem(getProviderMetadataKey(provider))
        if (!raw) return null
        const parsed = JSON.parse(raw) as AiProviderKeyMetadata
        if (!parsed || typeof parsed.updatedAt !== 'number') return null
        return parsed
    } catch {
        return null
    }
}

const saveProviderMetadata = (provider: AiProvider, metadata: AiProviderKeyMetadata): void => {
    try {
        localStorage.setItem(getProviderMetadataKey(provider), JSON.stringify(metadata))
    } catch {
        // Best-effort only.
    }
}

function getActiveProviderId(): AiProvider {
    const stored = localStorage.getItem(ACTIVE_PROVIDER_KEY)
    if (stored && stored in PROVIDER_CONFIGS) {
        return stored as AiProvider
    }
    return 'gemini'
}

function setActiveProviderId(provider: AiProvider): void {
    localStorage.setItem(ACTIVE_PROVIDER_KEY, provider)
}

function getActiveProviderConfig(): AiProviderConfig {
    return PROVIDER_CONFIGS[getActiveProviderId()]
}

function getAllProviders(): AiProviderConfig[] {
    return Object.values(PROVIDER_CONFIGS)
}

// ---------------------------------------------------------------------------
// Per-provider key management (encryption via shared cryptoService)
// ---------------------------------------------------------------------------

async function getProviderApiKey(provider: AiProvider): Promise<string | null> {
    const config = PROVIDER_CONFIGS[provider]
    const raw = await indexedDBStorage.getItem(config.keyStorageKey)
    if (!raw || typeof raw !== 'string') return null

    const metadata = loadProviderMetadata(provider)
    if (isKeyRotationDue(metadata)) {
        await clearProviderApiKey(provider)
        return null
    }

    let resolved = raw
    if (isEncryptedPayload(raw)) {
        try {
            resolved = await decrypt(raw)
        } catch {
            return null
        }
    } else {
        // Auto-migrate unencrypted key to AES-256-GCM
        try {
            const { payload, migrated } = await ensureEncrypted(raw)
            if (migrated) {
                await indexedDBStorage.setItem(config.keyStorageKey, payload)
            }
        } catch {
            // Migration is best-effort; the plain key still works this call.
        }
    }
    const trimmed = resolved.trim()
    return trimmed.length > 0 ? trimmed : null
}

async function setProviderApiKey(provider: AiProvider, apiKey: string): Promise<void> {
    const config = PROVIDER_CONFIGS[provider]
    const trimmed = apiKey.trim()
    if (!config.keyPattern.test(trimmed)) {
        throw new Error('settingsView.security.invalid')
    }
    const encrypted = await encrypt(trimmed)
    await indexedDBStorage.setItem(config.keyStorageKey, encrypted)
    saveProviderMetadata(provider, { updatedAt: Date.now() })
}

async function clearProviderApiKey(provider: AiProvider): Promise<void> {
    const config = PROVIDER_CONFIGS[provider]
    await indexedDBStorage.removeItem(config.keyStorageKey)
    try {
        localStorage.removeItem(getProviderMetadataKey(provider))
    } catch {
        // Ignore cleanup failures.
    }
}

async function clearAllProviderApiKeys(): Promise<void> {
    await Promise.all(
        Object.keys(PROVIDER_CONFIGS).map((provider) =>
            clearProviderApiKey(provider as AiProvider),
        ),
    )
}

async function getMaskedProviderApiKey(provider: AiProvider): Promise<string | null> {
    const key = await getProviderApiKey(provider)
    if (!key) return null
    const prefix = key.slice(0, 6)
    const suffix = key.slice(-4)
    return `${prefix}••••••••••••${suffix}`
}

function isValidProviderKeyFormat(provider: AiProvider, apiKey: string): boolean {
    return coreIsValidKeyFormat(provider, apiKey)
}

function getProviderKeyMetadata(provider: AiProvider): AiProviderKeyMetadata | null {
    return loadProviderMetadata(provider)
}

function isProviderKeyRotationDue(provider: AiProvider): boolean {
    return isKeyRotationDue(loadProviderMetadata(provider))
}

// ---------------------------------------------------------------------------
// OpenAI-compatible API call (for xAI/Grok and OpenAI)
// ---------------------------------------------------------------------------

interface OpenAiMessage {
    role: 'system' | 'user'
    content: string
}

interface OpenAiChatResponse {
    choices: Array<{
        message: { content: string }
    }>
}

const OPENAI_COMPAT_BASE_URLS: Partial<Record<AiProvider, string>> = {
    openai: 'https://api.openai.com/v1',
    xai: 'https://api.x.ai/v1',
}

const buildProviderMessages = (systemPrompt: string, userPrompt: string): OpenAiMessage[] => [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
]

async function callOpenAiCompatible(
    baseUrl: string,
    apiKey: string,
    model: string,
    messages: OpenAiMessage[],
    jsonMode: boolean,
    maxTokens: number,
): Promise<string> {
    const body: Record<string, unknown> = {
        model,
        messages,
        max_tokens: maxTokens,
    }
    if (jsonMode) {
        body.response_format = { type: 'json_object' }
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        await response.text().catch(() => '')
        if (response.status === 429) throw new Error('ai.error.rateLimited:60')
        throw new Error(`API error ${response.status}`)
    }

    const data = (await response.json()) as OpenAiChatResponse
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('ai.error.generic')
    return text
}

// ---------------------------------------------------------------------------
// Anthropic Messages API call
// ---------------------------------------------------------------------------

interface AnthropicResponse {
    content: Array<{ type: string; text?: string }>
}

async function callAnthropic(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userContent: string,
    maxTokens: number,
): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: userContent }],
        }),
    })

    if (!response.ok) {
        await response.text().catch(() => '')
        if (response.status === 429) throw new Error('ai.error.rateLimited:60')
        throw new Error(`API error ${response.status}`)
    }

    const data = (await response.json()) as AnthropicResponse
    const text = data.content?.find((c) => c.type === 'text')?.text
    if (!text) throw new Error('ai.error.generic')
    return text
}

// ---------------------------------------------------------------------------
// Unified text generation for non-Gemini providers
// ---------------------------------------------------------------------------

async function generateTextWithProvider(
    provider: AiProvider,
    systemPrompt: string,
    userPrompt: string,
    jsonMode: boolean,
    maxTokens: number,
): Promise<string> {
    const apiKey = await getProviderApiKey(provider)
    if (!apiKey) throw new Error('ai.error.missingApiKey')

    const config = PROVIDER_CONFIGS[provider]
    const model = jsonMode ? config.models.json : config.models.text

    if (provider === 'anthropic') {
        return callAnthropic(apiKey, model, systemPrompt, userPrompt, maxTokens)
    }

    const baseUrl = OPENAI_COMPAT_BASE_URLS[provider]
    if (!baseUrl) {
        throw new Error('ai.error.generic')
    }

    return callOpenAiCompatible(
        baseUrl,
        apiKey,
        model,
        buildProviderMessages(systemPrompt, userPrompt),
        jsonMode,
        maxTokens,
    )
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const aiProviderService = {
    // Provider selection
    getActiveProviderId,
    setActiveProviderId,
    getActiveProviderConfig,
    getAllProviders,
    getProviderConfig: (id: AiProvider) => PROVIDER_CONFIGS[id],

    // Key management
    getProviderApiKey,
    setProviderApiKey,
    clearProviderApiKey,
    clearAllProviderApiKeys,
    getMaskedProviderApiKey,
    isValidProviderKeyFormat,
    getProviderKeyMetadata,
    isProviderKeyRotationDue,

    // Text generation for non-Gemini providers
    generateTextWithProvider,
}
