import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { encrypt, decrypt, isEncryptedPayload, ensureEncrypted } from '@/services/cryptoService'

/**
 * One credential stored like the BYOK AI keys: AES-GCM encrypted in its own
 * IndexedDB entry, outside the Redux settings that are persisted as one
 * snapshot and exported to JSON / ZIP / GDPR files (#654, #709). The
 * encryption key lives in the same browser profile, so this protects the
 * snapshot and every export, not a compromised profile.
 */
export interface SecretKeyStore {
    getApiKey(): Promise<string | null>
    hasApiKey(): Promise<boolean>
    /** Stores the key encrypted; an empty value removes it. */
    setApiKey(apiKey: string): Promise<void>
    clearApiKey(): Promise<void>
    /**
     * Moves a key that older versions kept in plain text in the settings into
     * the encrypted store. Preserve first: returns true only when the written
     * entry is ciphertext that decrypts to the same key (or there was nothing
     * to move), so the caller may then drop the plaintext from the settings.
     */
    migrateLegacyKey(legacy: unknown): Promise<boolean>
    /** Whether a legacy plaintext key still waits for a successful migration. */
    isLegacyKeyPending(): boolean
    /**
     * The user saved or removed a key explicitly: a legacy key still waiting
     * in the settings is obsolete and must not overwrite that choice at the
     * next start (#711 review).
     */
    resolveLegacyKey(): void
    /** Called after the stored key changed (save, removal, migration). */
    subscribe(listener: () => void): () => void
}

export const createSecretKeyStore = (storageKey: string): SecretKeyStore => {
    // A failed migration keeps the legacy plaintext in the settings snapshot
    // until the next start retries it -- dropping it would lose the credential.
    let legacyKeyPending = false
    const listeners = new Set<() => void>()

    // Every read and write runs in order: a read that re-encrypts a plain
    // entry must not write the old key after a concurrent save or removal
    // (#711 review, #709).
    let tail: Promise<unknown> = Promise.resolve()
    const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
        const result = tail.then(operation, operation)
        tail = result.catch(() => undefined)
        return result
    }

    const notify = (): void => {
        for (const listener of listeners) listener()
    }

    const read = async (): Promise<string | null> => {
        const stored = await indexedDBStorage.getItem(storageKey)
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
                if (migrated) await indexedDBStorage.setItem(storageKey, payload)
            } catch {
                // Best effort; the plain value still works for this call.
            }
        }
        const trimmed = resolved.trim()
        return trimmed.length > 0 ? trimmed : null
    }

    const write = async (apiKey: string): Promise<void> => {
        const trimmed = apiKey.trim()
        if (!trimmed) {
            await indexedDBStorage.removeItem(storageKey)
            return
        }
        await indexedDBStorage.setItem(storageKey, await encrypt(trimmed))
    }

    const migrate = async (legacy: unknown): Promise<boolean> => {
        if (typeof legacy !== 'string' || legacy.trim() === '') {
            legacyKeyPending = false
            return true
        }
        try {
            // A readable encrypted entry wins: this version wrote it --
            // migrated or saved explicitly -- so it is never older than the
            // legacy value, which can only come from a stale snapshot by then.
            const existing = await indexedDBStorage.getItem(storageKey)
            if (
                typeof existing === 'string' &&
                isEncryptedPayload(existing) &&
                (await read()) !== null
            ) {
                legacyKeyPending = false
                return true
            }
            await write(legacy)
            // Verify the entry really is ciphertext and decrypts to the key.
            const written = await indexedDBStorage.getItem(storageKey)
            const readBack =
                typeof written === 'string' && isEncryptedPayload(written) ? await read() : null
            legacyKeyPending = readBack !== legacy.trim()
        } catch {
            legacyKeyPending = true
        }
        return !legacyKeyPending
    }

    return {
        getApiKey: () => serialize(read),
        async hasApiKey() {
            return (await serialize(read)) !== null
        },
        async setApiKey(apiKey) {
            await serialize(() => write(apiKey))
            notify()
        },
        async clearApiKey() {
            await serialize(async () => {
                await indexedDBStorage.removeItem(storageKey)
            })
            notify()
        },
        async migrateLegacyKey(legacy) {
            const moved = await serialize(() => migrate(legacy))
            if (moved && typeof legacy === 'string' && legacy.trim() !== '') notify()
            return moved
        },
        isLegacyKeyPending: () => legacyKeyPending,
        resolveLegacyKey() {
            legacyKeyPending = false
        },
        subscribe(listener) {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
    }
}
