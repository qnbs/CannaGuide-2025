// ---------------------------------------------------------------------------
// AI Provider abstraction — defines the contract for multi-provider routing
// ---------------------------------------------------------------------------

/** Supported cloud AI providers. */
export type AiProvider = 'gemini' | 'openai' | 'xai' | 'anthropic'

/** Configuration for a single AI provider. */
export interface AiProviderConfig {
    id: AiProvider
    label: string
    keyPattern: RegExp
    placeholder: string
    keyStorageKey: string
    getKeyUrl: string
    models: {
        text: string
        json: string
        image?: string
        deepDive?: string
    }
    /** Estimated pricing per 1M tokens (USD). Optional -- omit if unknown. */
    pricing?: {
        inputPer1MTokens: number
        outputPer1MTokens: number
        /** ISO date when pricing was last verified. */
        updatedAt: string
    }
}

/** Metadata stored alongside an encrypted API key. */
export interface AiProviderKeyMetadata {
    updatedAt: number
}

// ---------------------------------------------------------------------------
// Provider Configurations — canonical source of truth for all consumers
// ---------------------------------------------------------------------------

export const PROVIDER_CONFIGS: Record<AiProvider, AiProviderConfig> = {
    gemini: {
        id: 'gemini',
        label: 'Google Gemini',
        keyPattern: /^AIza[0-9A-Za-z_-]{20,}$/,
        placeholder: 'AIza...',
        keyStorageKey: 'geminiApiKey',
        getKeyUrl: 'https://aistudio.google.com/app/apikey',
        models: {
            text: 'gemini-2.5-flash',
            json: 'gemini-2.5-flash',
            image: 'gemini-2.0-flash-preview-image-generation',
            deepDive: 'gemini-2.5-pro',
        },
        pricing: {
            inputPer1MTokens: 0.15,
            outputPer1MTokens: 0.6,
            updatedAt: '2025-06-01',
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
        pricing: {
            inputPer1MTokens: 0.15,
            outputPer1MTokens: 0.6,
            updatedAt: '2025-06-01',
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
        pricing: {
            inputPer1MTokens: 0.3,
            outputPer1MTokens: 0.5,
            updatedAt: '2025-06-01',
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
        pricing: {
            inputPer1MTokens: 3.0,
            outputPer1MTokens: 15.0,
            updatedAt: '2025-06-01',
        },
    },
}

// ---------------------------------------------------------------------------
// Key Validation Utilities
// ---------------------------------------------------------------------------

/** API key rotation window in milliseconds (90 days). */
export const KEY_ROTATION_WINDOW_MS = 90 * 24 * 60 * 60 * 1000

/** Check whether a key rotation is due based on metadata timestamp. */
export const isKeyRotationDue = (metadata: AiProviderKeyMetadata | null): boolean => {
    if (!metadata) return false
    return Date.now() - metadata.updatedAt >= KEY_ROTATION_WINDOW_MS
}

/** Validate an API key against a provider's expected format. */
export const isValidProviderKeyFormat = (provider: AiProvider, apiKey: string): boolean => {
    const config = PROVIDER_CONFIGS[provider]
    return config.keyPattern.test(apiKey.trim())
}
