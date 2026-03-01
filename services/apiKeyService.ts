import { GEMINI_API_KEY_STORAGE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'

export const apiKeyService = {
    async getApiKey(): Promise<string | null> {
        const key = await indexedDBStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)
        if (!key || typeof key !== 'string') {
            return null
        }

        const trimmed = key.trim()
        return trimmed.length > 0 ? trimmed : null
    },

    async setApiKey(apiKey: string): Promise<void> {
        await indexedDBStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey.trim())
    },

    async clearApiKey(): Promise<void> {
        await indexedDBStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY)
    },
}
