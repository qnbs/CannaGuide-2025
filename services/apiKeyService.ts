import { GEMINI_API_KEY_STORAGE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'

const GEMINI_API_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{20,}$/
const GEMINI_API_KEY_CRYPTO_KEY_STORAGE = 'cg.gemini_api_key.crypto'

const normalizeApiKey = (apiKey: string): string => apiKey.trim()

const bytesToBase64 = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes))

const base64ToBytes = (value: string): Uint8Array => {
    const binary = atob(value)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

const getOrCreateEncryptionKey = async (): Promise<CryptoKey> => {
    const storedRaw = localStorage.getItem(GEMINI_API_KEY_CRYPTO_KEY_STORAGE)

    if (storedRaw) {
        const raw = base64ToBytes(storedRaw)
        return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    }

    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    const exported = await crypto.subtle.exportKey('raw', key)
    localStorage.setItem(GEMINI_API_KEY_CRYPTO_KEY_STORAGE, bytesToBase64(new Uint8Array(exported)))
    return key
}

const encryptApiKey = async (apiKey: string): Promise<string> => {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await getOrCreateEncryptionKey()
    const encoded = new TextEncoder().encode(apiKey)

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
    return JSON.stringify({ v: 1, iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)) })
}

const decryptApiKey = async (payload: string): Promise<string> => {
    const parsed = JSON.parse(payload) as { v: number; iv: string; data: string }
    if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.data) {
        return payload
    }

    const key = await getOrCreateEncryptionKey()
    const iv = base64ToBytes(parsed.iv)
    const encrypted = base64ToBytes(parsed.data)

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
    return new TextDecoder().decode(decrypted)
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

        let resolved = key
        if (key.trim().startsWith('{')) {
            try {
                resolved = await decryptApiKey(key)
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

        const encryptedPayload = await encryptApiKey(normalized)
        await indexedDBStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, encryptedPayload)
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
