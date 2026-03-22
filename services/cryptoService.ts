// ---------------------------------------------------------------------------
// Consolidated AES-256-GCM Encryption Service (Web Crypto API)
// ---------------------------------------------------------------------------
// Single source of truth for all API key encryption/decryption.
// Uses a single non-exportable AES-256-GCM key persisted in IndexedDB.
// ---------------------------------------------------------------------------

const CRYPTO_KEY_STORAGE = 'cg.crypto.key.v1'
const SECURE_DB_NAME = 'CannaGuideSecureDB'
const SECURE_DB_VERSION = 1
const SECURE_STORE = 'crypto_keys'
const SECURE_KEY_ID = 'api-key-encryption'

let secureDb: IDBDatabase | null = null
let secureDbPromise: Promise<IDBDatabase> | null = null

const toIndexedDbError = (error: DOMException | null, fallbackMessage: string): Error =>
    error ?? new Error(fallbackMessage)

const bytesToBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes))

const base64ToBytes = (value: string): Uint8Array => {
    const binary = atob(value)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

interface EncryptedPayload {
    v: number
    iv: string
    data: string
}

const parseEncryptedPayload = (payload: string): EncryptedPayload | null => {
    try {
        const parsed = JSON.parse(payload) as Partial<EncryptedPayload>
        if (
            parsed &&
            parsed.v === 1 &&
            typeof parsed.iv === 'string' &&
            typeof parsed.data === 'string' &&
            parsed.iv.length > 0 &&
            parsed.data.length > 0
        ) {
            return {
                v: 1,
                iv: parsed.iv,
                data: parsed.data,
            }
        }
    } catch {
        return null
    }

    return null
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const persisted = await getPersistedEncryptionKey()
    if (persisted) {
        return persisted
    }

    const migrated = await migrateLegacyEncryptionKey()
    if (migrated) {
        return migrated
    }

    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
        'encrypt',
        'decrypt',
    ])
    await persistEncryptionKey(key)
    return key
}

function openSecureDb(): Promise<IDBDatabase> {
    if (secureDb) return Promise.resolve(secureDb)
    if (secureDbPromise) return secureDbPromise

    secureDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(SECURE_DB_NAME, SECURE_DB_VERSION)

        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(SECURE_STORE)) {
                db.createObjectStore(SECURE_STORE)
            }
        }

        request.onsuccess = () => {
            secureDb = request.result
            secureDb.onclose = () => {
                secureDb = null
                secureDbPromise = null
            }
            secureDb.onversionchange = () => {
                secureDb?.close()
                secureDb = null
                secureDbPromise = null
            }
            resolve(secureDb)
        }

        request.onerror = () => {
            secureDbPromise = null
            reject(
                toIndexedDbError(request.error, '[cryptoService] Failed to open secure database.'),
            )
        }
    })

    return secureDbPromise
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () =>
            reject(toIndexedDbError(request.error, '[cryptoService] IndexedDB request failed.'))
    })
}

async function getPersistedEncryptionKey(): Promise<CryptoKey | null> {
    const db = await openSecureDb()
    const transaction = db.transaction(SECURE_STORE, 'readonly')
    const store = transaction.objectStore(SECURE_STORE)
    const result = await requestToPromise(store.get(SECURE_KEY_ID))
    return result instanceof CryptoKey ? result : null
}

async function persistEncryptionKey(key: CryptoKey): Promise<void> {
    const db = await openSecureDb()
    const transaction = db.transaction(SECURE_STORE, 'readwrite')
    const store = transaction.objectStore(SECURE_STORE)
    await requestToPromise(store.put(key, SECURE_KEY_ID))
}

async function migrateLegacyEncryptionKey(): Promise<CryptoKey | null> {
    let storedRaw: string | null = null

    try {
        storedRaw = localStorage.getItem(CRYPTO_KEY_STORAGE)
    } catch {
        return null
    }

    if (!storedRaw) {
        return null
    }

    try {
        const raw = base64ToBytes(storedRaw)
        const importedKey = await crypto.subtle.importKey(
            'raw',
            raw.buffer as ArrayBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt'],
        )
        await persistEncryptionKey(importedKey)

        try {
            localStorage.removeItem(CRYPTO_KEY_STORAGE)
        } catch {
            // Ignore cleanup failures after successful migration.
        }

        return importedKey
    } catch (error) {
        console.debug(
            '[cryptoService] Legacy key migration failed, ignoring legacy payload.',
            error,
        )
        try {
            localStorage.removeItem(CRYPTO_KEY_STORAGE)
        } catch {
            // Ignore cleanup failures.
        }
        return null
    }
}

export async function encrypt(plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await getOrCreateEncryptionKey()
    const encoded = new TextEncoder().encode(plaintext)
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
    return JSON.stringify({
        v: 1,
        iv: bytesToBase64(iv),
        data: bytesToBase64(new Uint8Array(encrypted)),
    })
}

export async function decrypt(payload: string): Promise<string> {
    const parsed = parseEncryptedPayload(payload)
    if (!parsed) return payload

    const key = await getOrCreateEncryptionKey()
    try {
        const iv = base64ToBytes(parsed.iv)
        const encrypted = base64ToBytes(parsed.data)
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
            key,
            encrypted.buffer as ArrayBuffer,
        )
        return new TextDecoder().decode(decrypted)
    } catch {
        return payload
    }
}

/** Check if a string looks like an encrypted payload (starts with `{`) */
export function isEncryptedPayload(value: string): boolean {
    return value.trim().startsWith('{')
}

/**
 * If the value is not already encrypted, encrypt it and return the encrypted
 * payload together with a migration flag.  Callers can use the flag to
 * persist the encrypted value back to IndexedDB (best-effort migration).
 */
export async function ensureEncrypted(
    value: string,
): Promise<{ payload: string; migrated: boolean }> {
    if (isEncryptedPayload(value)) {
        return { payload: value, migrated: false }
    }
    const encrypted = await encrypt(value)
    return { payload: encrypted, migrated: true }
}
