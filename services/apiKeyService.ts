import { GEMINI_API_KEY_STORAGE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { encrypt, decrypt, isEncryptedPayload } from '@/services/cryptoService'

const GEMINI_API_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{20,}$/
const GEMINI_API_KEY_METADATA_KEY = 'cg.gemini.apiKey.meta.v1'
const KEY_ROTATION_WINDOW_MS = 90 * 24 * 60 * 60 * 1000

interface ApiKeyMetadata {
    updatedAt: number
}

const isRotationDue = (metadata: ApiKeyMetadata | null): boolean => {
    if (!metadata) return false
    return Date.now() - metadata.updatedAt >= KEY_ROTATION_WINDOW_MS
}

const normalizeApiKey = (apiKey: string): string => apiKey.trim()

const loadMetadata = (): ApiKeyMetadata | null => {
    try {
        const raw = localStorage.getItem(GEMINI_API_KEY_METADATA_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as ApiKeyMetadata
        if (!parsed || typeof parsed.updatedAt !== 'number') return null
        return parsed
    } catch {
        return null
    }
}

const saveMetadata = (metadata: ApiKeyMetadata): void => {
    try {
        localStorage.setItem(GEMINI_API_KEY_METADATA_KEY, JSON.stringify(metadata))
    } catch {
        // Best-effort only.
    }
}

export const apiKeyService = {
    isValidApiKeyFormat(apiKey: string): boolean {
        const normalized = normalizeApiKey(apiKey)
        return GEMINI_API_KEY_PATTERN.test(normalized)
    },

    async getApiKey(): Promise<string | null> {
        const key = await indexedDBStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)
        if (!key || typeof key !== 'string') {
            return null
        }

        const metadata = loadMetadata()
        if (isRotationDue(metadata)) {
            await this.clearApiKey()
            return null
        }

        let resolved = key
        if (isEncryptedPayload(key)) {
            try {
                resolved = await decrypt(key)
            } catch {
                return null
            }
        }

        const trimmed = normalizeApiKey(resolved)
        return trimmed.length > 0 ? trimmed : null
    },

    async getMaskedApiKey(): Promise<string | null> {
        const key = await this.getApiKey()
        if (!key) {
            return null
        }

        const prefix = key.slice(0, 6)
        const suffix = key.slice(-4)
        return `${prefix}••••••••••••${suffix}`
    },

    async setApiKey(apiKey: string): Promise<void> {
        const normalized = normalizeApiKey(apiKey)
        if (!this.isValidApiKeyFormat(normalized)) {
            throw new Error('settingsView.security.invalid')
        }

        const encryptedPayload = await encrypt(normalized)
        await indexedDBStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, encryptedPayload)
        saveMetadata({ updatedAt: Date.now() })
    },

    async validateApiKey(apiKey: string): Promise<void> {
        const normalized = normalizeApiKey(apiKey)
        if (!this.isValidApiKeyFormat(normalized)) {
            throw new Error('settingsView.security.invalid')
        }

        try {
            const { GoogleGenAI } = await import('@google/genai')
            const ai = new GoogleGenAI({ apiKey: normalized })
            await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Healthcheck: reply with OK only.',
            })
        } catch {
            throw new Error('settingsView.security.testError')
        }
    },

    async validateStoredApiKey(): Promise<void> {
        const key = await this.getApiKey()
        if (!key) {
            throw new Error('ai.error.missingApiKey')
        }

        await this.validateApiKey(key)
    },

    async clearApiKey(): Promise<void> {
        await indexedDBStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY)
        try {
            localStorage.removeItem(GEMINI_API_KEY_METADATA_KEY)
        } catch {
            // Ignore cleanup failures.
        }
    },

    getApiKeyMetadata(): ApiKeyMetadata | null {
        return loadMetadata()
    },

    isApiKeyRotationDue(): boolean {
        return isRotationDue(loadMetadata())
    },
}
