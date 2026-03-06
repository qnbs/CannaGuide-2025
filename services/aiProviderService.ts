// ---------------------------------------------------------------------------
// AI Provider Abstraction – Multi-Model BYOK Switch
// ---------------------------------------------------------------------------
// Supports Gemini (native), OpenAI-compatible (xAI/Grok), and Anthropic (Claude).
// Provider selection + per-provider API keys are persisted in localStorage.
// ---------------------------------------------------------------------------

import { indexedDBStorage } from '@/stores/indexedDBStorage'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiProvider = 'gemini' | 'openai' | 'xai' | 'anthropic'

export interface AiProviderConfig {
    id: AiProvider
    label: string
    keyPattern: RegExp
    placeholder: string
    keyStorageKey: string
    getKeyUrl: string
    models: { text: string; json: string; image?: string; deepDive?: string }
}

// ---------------------------------------------------------------------------
// Provider Configurations
// ---------------------------------------------------------------------------

const PROVIDER_CONFIGS: Record<AiProvider, AiProviderConfig> = {
    gemini: {
        id: 'gemini',
        label: 'Google Gemini',
        keyPattern: /^AIza[0-9A-Za-z_-]{20,}$/,
        placeholder: 'AIza...',
        keyStorageKey: 'geminiApiKey',
        getKeyUrl: 'https://ai.studio.google.com/app/apikey',
        models: {
            text: 'gemini-2.5-flash',
            json: 'gemini-2.5-flash',
            image: 'gemini-2.0-flash-preview-image-generation',
            deepDive: 'gemini-2.5-pro',
        },
    },
    openai: {
        id: 'openai',
        label: 'OpenAI',
        keyPattern: /^sk-[A-Za-z0-9_-]{20,}$/,
        placeholder: 'sk-...',
        keyStorageKey: 'openaiApiKey',
        getKeyUrl: 'https://platform.openai.com/api-keys',
        models: {
            text: 'gpt-4o-mini',
            json: 'gpt-4o-mini',
            deepDive: 'gpt-4o',
        },
    },
    xai: {
        id: 'xai',
        label: 'xAI (Grok)',
        keyPattern: /^xai-[A-Za-z0-9_-]{20,}$/,
        placeholder: 'xai-...',
        keyStorageKey: 'xaiApiKey',
        getKeyUrl: 'https://console.x.ai/',
        models: {
            text: 'grok-3-mini-fast',
            json: 'grok-3-mini-fast',
            deepDive: 'grok-3',
        },
    },
    anthropic: {
        id: 'anthropic',
        label: 'Anthropic (Claude)',
        keyPattern: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
        placeholder: 'sk-ant-...',
        keyStorageKey: 'anthropicApiKey',
        getKeyUrl: 'https://console.anthropic.com/settings/keys',
        models: {
            text: 'claude-sonnet-4-20250514',
            json: 'claude-sonnet-4-20250514',
            deepDive: 'claude-sonnet-4-20250514',
        },
    },
}

// ---------------------------------------------------------------------------
// Provider Selection (persisted in localStorage)
// ---------------------------------------------------------------------------

const ACTIVE_PROVIDER_KEY = 'cg.ai.activeProvider'

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
// Per-provider key management (encryption reuses apiKeyService pattern)
// ---------------------------------------------------------------------------

const CRYPTO_KEY_STORAGE = 'cg.ai.provider.crypto'

const bytesToBase64 = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes))

const base64ToBytes = (value: string): Uint8Array => {
    const binary = atob(value)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const storedRaw = localStorage.getItem(CRYPTO_KEY_STORAGE)
    if (storedRaw) {
        const raw = base64ToBytes(storedRaw)
        return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    }
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    const exported = await crypto.subtle.exportKey('raw', key)
    localStorage.setItem(CRYPTO_KEY_STORAGE, bytesToBase64(new Uint8Array(exported)))
    return key
}

async function encryptKey(apiKey: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await getOrCreateEncryptionKey()
    const encoded = new TextEncoder().encode(apiKey)
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
    return JSON.stringify({ v: 1, iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)) })
}

async function decryptKey(payload: string): Promise<string> {
    const parsed = JSON.parse(payload) as { v: number; iv: string; data: string }
    if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.data) return payload
    const key = await getOrCreateEncryptionKey()
    const iv = base64ToBytes(parsed.iv)
    const encrypted = base64ToBytes(parsed.data)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, encrypted.buffer as ArrayBuffer)
    return new TextDecoder().decode(decrypted)
}

async function getProviderApiKey(provider: AiProvider): Promise<string | null> {
    const config = PROVIDER_CONFIGS[provider]
    const raw = await indexedDBStorage.getItem(config.keyStorageKey)
    if (!raw || typeof raw !== 'string') return null
    let resolved = raw
    if (raw.trim().startsWith('{')) {
        try { resolved = await decryptKey(raw) } catch { return null }
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
    const encrypted = await encryptKey(trimmed)
    await indexedDBStorage.setItem(config.keyStorageKey, encrypted)
}

async function clearProviderApiKey(provider: AiProvider): Promise<void> {
    const config = PROVIDER_CONFIGS[provider]
    await indexedDBStorage.removeItem(config.keyStorageKey)
}

async function getMaskedProviderApiKey(provider: AiProvider): Promise<string | null> {
    const key = await getProviderApiKey(provider)
    if (!key) return null
    const prefix = key.slice(0, 6)
    const suffix = key.slice(-4)
    return `${prefix}••••••••••••${suffix}`
}

function isValidProviderKeyFormat(provider: AiProvider, apiKey: string): boolean {
    return PROVIDER_CONFIGS[provider].keyPattern.test(apiKey.trim())
}

// ---------------------------------------------------------------------------
// OpenAI-compatible API call (for xAI/Grok and OpenAI)
// ---------------------------------------------------------------------------

interface OpenAiMessage { role: 'system' | 'user'; content: string }

interface OpenAiChatResponse {
    choices: Array<{
        message: { content: string }
    }>
}

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
        const errorText = await response.text().catch(() => '')
        if (response.status === 429) throw new Error('ai.error.rateLimited:60')
        throw new Error(`API error ${response.status}: ${errorText.slice(0, 200)}`)
    }

    const data = await response.json() as OpenAiChatResponse
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
        const errorText = await response.text().catch(() => '')
        if (response.status === 429) throw new Error('ai.error.rateLimited:60')
        throw new Error(`API error ${response.status}: ${errorText.slice(0, 200)}`)
    }

    const data = await response.json() as AnthropicResponse
    const text = data.content?.find(c => c.type === 'text')?.text
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

    switch (provider) {
        case 'openai':
            return callOpenAiCompatible(
                'https://api.openai.com/v1',
                apiKey, model,
                [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                jsonMode, maxTokens,
            )
        case 'xai':
            return callOpenAiCompatible(
                'https://api.x.ai/v1',
                apiKey, model,
                [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                jsonMode, maxTokens,
            )
        case 'anthropic':
            return callAnthropic(apiKey, model, systemPrompt, userPrompt, maxTokens)
        default:
            throw new Error('ai.error.generic')
    }
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
    getMaskedProviderApiKey,
    isValidProviderKeyFormat,

    // Text generation for non-Gemini providers
    generateTextWithProvider,
}
