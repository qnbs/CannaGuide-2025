import { GEMINI_API_KEY_STORAGE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'

const GEMINI_API_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{20,}$/

const normalizeApiKey = (apiKey: string): string => apiKey.trim()

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

        const trimmed = normalizeApiKey(key)
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

        await indexedDBStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, normalized)
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
    },
}
