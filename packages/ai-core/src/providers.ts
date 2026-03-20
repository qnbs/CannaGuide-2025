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
}

/** Metadata stored alongside an encrypted API key. */
export interface AiProviderKeyMetadata {
    updatedAt: number
}
