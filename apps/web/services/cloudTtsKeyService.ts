import { CLOUD_TTS_API_KEY_STORAGE_KEY } from '@/constants'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { encrypt, decrypt, isEncryptedPayload, ensureEncrypted } from '@/services/cryptoService'

/**
 * The ElevenLabs (Cloud TTS) API key, stored like the BYOK AI keys: AES-GCM
 * encrypted in its own IndexedDB entry, outside the Redux settings that are
 * persisted as one snapshot and exported to JSON / ZIP / GDPR files (#654).
 * The encryption key lives in the same browser profile, so this protects the
 * snapshot and every export, not a compromised profile.
 */

// A failed migration keeps the legacy plaintext in the settings snapshot
// until the next start retries it -- dropping it would lose the credential.
let legacyKeyPending = false

export const cloudTtsKeyService = {
    async getApiKey(): Promise<string | null> {
        const stored = await indexedDBStorage.getItem(CLOUD_TTS_API_KEY_STORAGE_KEY)
        if (!stored || typeof stored !== 'string') return null

        let resolved = stored
        if (isEncryptedPayload(stored)) {
            try {
                resolved = await decrypt(stored)
            } catch {
                return null
            }
            // decrypt() returns its input when AES-GCM authentication fails
            // (missing or rotated encryption key): that is no key, not a key.
            if (resolved === stored) return null
        } else {
            try {
                const { payload, migrated } = await ensureEncrypted(stored)
                if (migrated) await indexedDBStorage.setItem(CLOUD_TTS_API_KEY_STORAGE_KEY, payload)
            } catch {
                // Best effort; the plain value still works for this call.
            }
        }
        const trimmed = resolved.trim()
        return trimmed.length > 0 ? trimmed : null
    },

    async hasApiKey(): Promise<boolean> {
        return (await this.getApiKey()) !== null
    },

    /** Stores the key encrypted; an empty value removes it. */
    async setApiKey(apiKey: string): Promise<void> {
        const trimmed = apiKey.trim()
        if (!trimmed) {
            await this.clearApiKey()
            return
        }
        await indexedDBStorage.setItem(CLOUD_TTS_API_KEY_STORAGE_KEY, await encrypt(trimmed))
    },

    async clearApiKey(): Promise<void> {
        await indexedDBStorage.removeItem(CLOUD_TTS_API_KEY_STORAGE_KEY)
    },

    /**
     * Moves a key that older versions kept in plain text in the settings into
     * the encrypted store. Preserve first: returns true only when the
     * encrypted copy reads back identical (or there was nothing to move), so
     * the caller may then drop the plaintext from the settings.
     */
    async migrateLegacyKey(legacy: unknown): Promise<boolean> {
        if (typeof legacy !== 'string' || legacy.trim() === '') {
            legacyKeyPending = false
            return true
        }
        try {
            await this.setApiKey(legacy)
            const readBack = await this.getApiKey()
            legacyKeyPending = readBack !== legacy.trim()
        } catch {
            legacyKeyPending = true
        }
        return !legacyKeyPending
    },

    /** Whether a legacy plaintext key still waits for a successful migration. */
    isLegacyKeyPending(): boolean {
        return legacyKeyPending
    },

    /**
     * The user saved or removed a key explicitly: a legacy key still waiting
     * in the settings is obsolete and must not overwrite that choice at the
     * next start (#711 review).
     */
    resolveLegacyKey(): void {
        legacyKeyPending = false
    },
}
